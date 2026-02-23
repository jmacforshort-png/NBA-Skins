const fs = require("fs");
const path = require("path");

const API_BASE = "https://api.balldontlie.io/v1";
const API_KEY = process.env.BALLDONTLIE_API_KEY;
const MIN_REQUEST_INTERVAL_MS = 13000; // Free tier is 5 req/min

if (!API_KEY) {
  console.error("Missing BALLDONTLIE_API_KEY");
  process.exit(1);
}

const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data.json");

const raw = fs.readFileSync(DATA_PATH, "utf8");
const data = JSON.parse(raw);

const seasonStart = data.seasonStart || "2025-10-21";
const today = new Date();
const endDate = today.toISOString().slice(0, 10);

const TEAM_ALIASES = {
  "LA Clippers": "Los Angeles Clippers",
  "Los Angeles Clippers": "LA Clippers",
  "LA Lakers": "Los Angeles Lakers",
  "Los Angeles Lakers": "Los Angeles Lakers",
};

function normalizeTeam(name) {
  return TEAM_ALIASES[name] || name;
}

function parsePick(pick) {
  if (typeof pick === "string") {
    const parts = pick.trim().split(" ");
    const wl = parts[parts.length - 1];
    const team = parts.slice(0, -1).join(" ");
    return { team: normalizeTeam(team), wl };
  }
  return { ...pick, team: normalizeTeam(pick.team) };
}

async function fetchJson(url) {
  await rateLimit();
  const res = await fetch(url, {
    headers: {
      Authorization: API_KEY,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    const error = new Error(`Request failed ${res.status}: ${text}`);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

async function fetchTeams() {
  const url = `${API_BASE}/teams`;
  const json = await fetchJson(url);
  return json.data || [];
}

let lastRequestAt = 0;
async function rateLimit() {
  const now = Date.now();
  const elapsed = now - lastRequestAt;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    await sleep(MIN_REQUEST_INTERVAL_MS - elapsed);
  }
  lastRequestAt = Date.now();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJsonWithRetry(url, attempts = 5) {
  let wait = 800;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fetchJson(url);
    } catch (error) {
      if (error.status !== 429 || i === attempts - 1) {
        throw error;
      }
      await sleep(wait);
      wait *= 2;
    }
  }
  throw new Error("Request failed after retries");
}

async function fetchGames(teamIds, startDate, endDate) {
  const all = [];
  let cursor = "";

  while (true) {
    const params = new URLSearchParams();
    params.set("start_date", startDate);
    params.set("end_date", endDate);
    params.set("per_page", "100");
    if (cursor) params.set("cursor", cursor);
    teamIds.forEach((id) => params.append("team_ids[]", String(id)));

    const url = `${API_BASE}/games?${params.toString()}`;
    const json = await fetchJsonWithRetry(url);
    const chunk = json.data || [];
    all.push(...chunk);

    const next = json.meta?.next_cursor;
    if (!next) break;
    cursor = next;
  }

  return all;
}

function isFinal(game) {
  const status = String(game.status || "").toLowerCase();
  return status.startsWith("final");
}

function getWeekDates(start, end) {
  const dates = [];
  const current = new Date(start);
  const endDateObj = new Date(end);

  while (current <= endDateObj) {
    dates.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 7);
  }

  if (dates[dates.length - 1] !== end) {
    dates.push(end);
  }

  return dates;
}

function updateTeamStats(stats, game) {
  const homeScore = game.home_team_score;
  const visitorScore = game.visitor_team_score;
  const homeId = game.home_team.id;
  const visitorId = game.visitor_team.id;

  if (!stats.has(homeId)) stats.set(homeId, { wins: 0, losses: 0 });
  if (!stats.has(visitorId)) stats.set(visitorId, { wins: 0, losses: 0 });

  if (homeScore > visitorScore) {
    stats.get(homeId).wins += 1;
    stats.get(visitorId).losses += 1;
  } else if (visitorScore > homeScore) {
    stats.get(visitorId).wins += 1;
    stats.get(homeId).losses += 1;
  }
}

function computeTotals(people, picksByPerson, teamIdByName, weekDates, games) {
  const seriesByPerson = new Map();
  people.forEach((person) => seriesByPerson.set(person.name, []));

  const stats = new Map();
  let gameIndex = 0;

  weekDates.forEach((date) => {
    while (gameIndex < games.length && games[gameIndex].date <= date) {
      updateTeamStats(stats, games[gameIndex]);
      gameIndex += 1;
    }

    people.forEach((person) => {
      const picks = picksByPerson.get(person.name) || [];
      let total = 0;
      picks.forEach((pick) => {
        const teamId = teamIdByName.get(pick.team);
        const record = stats.get(teamId) || { wins: 0, losses: 0 };
        total += pick.wl === "W" ? record.wins : record.losses;
      });
      seriesByPerson.get(person.name).push({ date, total });
    });
  });

  return seriesByPerson;
}

async function main() {
  const people = data.people || [];
  const picksByPerson = new Map();
  const teamNames = new Set();

  people.forEach((person) => {
    const picks = (person.picks || []).map(parsePick);
    picksByPerson.set(person.name, picks);
    picks.forEach((pick) => teamNames.add(pick.team));
  });

  const teams = await fetchTeams();
  const teamIdByName = new Map();
  teams.forEach((team) => {
    teamIdByName.set(team.full_name, team.id);
    teamIdByName.set(`${team.city} ${team.name}`, team.id);
  });

  // Add explicit aliases for known mismatches
  if (teamIdByName.has("LA Clippers")) {
    teamIdByName.set("Los Angeles Clippers", teamIdByName.get("LA Clippers"));
  }

  const missing = [];
  teamNames.forEach((team) => {
    if (!teamIdByName.has(team)) missing.push(team);
  });
  if (missing.length) {
    throw new Error(`Missing team ids for: ${missing.join(", ")}`);
  }

  const teamIds = Array.from(teamNames).map((name) => teamIdByName.get(name));
  const games = await fetchGames(teamIds, seasonStart, endDate);
  const finalGames = games.filter(isFinal).map((game) => ({
    ...game,
    date: String(game.date).slice(0, 10),
  }));

  finalGames.sort((a, b) => (a.date < b.date ? -1 : 1));

  const weekDates = getWeekDates(seasonStart, endDate);
  const seriesByPerson = computeTotals(
    people,
    picksByPerson,
    teamIdByName,
    weekDates,
    finalGames
  );

  const updatedPeople = people.map((person) => {
    const series = seriesByPerson.get(person.name) || [];
    const total = series.length ? series[series.length - 1].total : 0;
    return {
      ...person,
      total,
      series,
    };
  });

  const updated = {
    ...data,
    people: updatedPeople,
    seasonStart,
    asOf: endDate,
    generatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(DATA_PATH, JSON.stringify(updated, null, 2));
  console.log(`Updated data.json through ${endDate}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
