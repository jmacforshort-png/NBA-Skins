const fallbackPeople = [
  {
    name: "John",
    color: "#28d7d9",
    picks: [
      "Utah Jazz L",
      "Orlando Magic W",
      "Sacramento Kings L",
      "Milwaukee Bucks W",
      "Chicago Bulls L",
      "Miami Heat L",
    ],
    total: 198,
  },
  {
    name: "Geoff",
    color: "#ff7a1a",
    picks: [
      "Oklahoma City Thunder W",
      "Denver Nuggets W",
      "New Orleans Pelicans L",
      "Portland Trail Blazers L",
      "Indiana Pacers L",
      "Toronto Raptors W",
    ],
    total: 226,
  },
  {
    name: "Nay",
    color: "#8bd200",
    picks: [
      "Brooklyn Nets L",
      "New York Knicks W",
      "Phoenix Suns L",
      "Detroit Pistons W",
      "Los Angeles Clippers W",
      "Philadelphia 76ers W",
    ],
    total: 199,
  },
  {
    name: "Tom",
    color: "#2b54ff",
    picks: [
      "Washington Wizards L",
      "Houston Rockets W",
      "Golden State Warriors W",
      "Atlanta Hawks L",
      "Dallas Mavericks L",
      "Boston Celtics L",
    ],
    total: 188,
  },
  {
    name: "Jack",
    color: "#ff2a4f",
    picks: [
      "Charlotte Hornets L",
      "Cleveland Cavaliers W",
      "San Antonio Spurs W",
      "Minnesota Timberwolves W",
      "Los Angeles Lakers W",
      "Memphis Grizzlies W",
    ],
    total: 197,
  },
];

let people = [...fallbackPeople];

const TEAM_LOGOS = {
  "Atlanta Hawks": "https://cdn.nba.com/logos/nba/1610612737/global/L/logo.svg",
  "Boston Celtics": "https://cdn.nba.com/logos/nba/1610612738/global/L/logo.svg",
  "Brooklyn Nets": "https://cdn.nba.com/logos/nba/1610612751/global/L/logo.svg",
  "Charlotte Hornets": "https://cdn.nba.com/logos/nba/1610612766/global/L/logo.svg",
  "Chicago Bulls": "https://cdn.nba.com/logos/nba/1610612741/global/L/logo.svg",
  "Cleveland Cavaliers": "https://cdn.nba.com/logos/nba/1610612739/global/L/logo.svg",
  "Dallas Mavericks": "https://cdn.nba.com/logos/nba/1610612742/global/L/logo.svg",
  "Denver Nuggets": "https://cdn.nba.com/logos/nba/1610612743/global/L/logo.svg",
  "Detroit Pistons": "https://cdn.nba.com/logos/nba/1610612765/global/L/logo.svg",
  "Golden State Warriors": "https://cdn.nba.com/logos/nba/1610612744/global/L/logo.svg",
  "Houston Rockets": "https://cdn.nba.com/logos/nba/1610612745/global/L/logo.svg",
  "Indiana Pacers": "https://cdn.nba.com/logos/nba/1610612754/global/L/logo.svg",
  "Los Angeles Clippers": "https://cdn.nba.com/logos/nba/1610612746/global/L/logo.svg",
  "Los Angeles Lakers": "https://cdn.nba.com/logos/nba/1610612747/global/L/logo.svg",
  "Memphis Grizzlies": "https://cdn.nba.com/logos/nba/1610612763/global/L/logo.svg",
  "Miami Heat": "https://cdn.nba.com/logos/nba/1610612748/global/L/logo.svg",
  "Milwaukee Bucks": "https://cdn.nba.com/logos/nba/1610612749/global/L/logo.svg",
  "Minnesota Timberwolves": "https://cdn.nba.com/logos/nba/1610612750/global/L/logo.svg",
  "New Orleans Pelicans": "https://cdn.nba.com/logos/nba/1610612740/global/L/logo.svg",
  "New York Knicks": "https://cdn.nba.com/logos/nba/1610612752/global/L/logo.svg",
  "Oklahoma City Thunder": "https://cdn.nba.com/logos/nba/1610612760/global/L/logo.svg",
  "Orlando Magic": "https://cdn.nba.com/logos/nba/1610612753/global/L/logo.svg",
  "Philadelphia 76ers": "https://cdn.nba.com/logos/nba/1610612755/global/L/logo.svg",
  "Phoenix Suns": "https://cdn.nba.com/logos/nba/1610612756/global/L/logo.svg",
  "Portland Trail Blazers": "https://cdn.nba.com/logos/nba/1610612757/global/L/logo.svg",
  "Sacramento Kings": "https://cdn.nba.com/logos/nba/1610612758/global/L/logo.svg",
  "San Antonio Spurs": "https://cdn.nba.com/logos/nba/1610612759/global/L/logo.svg",
  "Toronto Raptors": "https://cdn.nba.com/logos/nba/1610612761/global/L/logo.svg",
  "Utah Jazz": "https://cdn.nba.com/logos/nba/1610612762/global/L/logo.svg",
  "Washington Wizards": "https://cdn.nba.com/logos/nba/1610612764/global/L/logo.svg",
};

const seasonStart = new Date("2025-10-21T00:00:00");
let today = new Date();
let todayISO = today.toISOString().slice(0, 10);

function hashSeed(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed) {
  let value = seed % 2147483647;
  return () => {
    value = (value * 48271) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function buildSeries(name, finalTotal) {
  const seed = hashSeed(name);
  const rand = seededRandom(seed);
  const series = [];
  const current = new Date(seasonStart);
  let total = 0;
  let dayIndex = 0;
  let weekIndex = 0;

  while (current <= today) {
    const isWeekPoint = dayIndex % 7 === 0;
    const isLastDay = current.toDateString() === today.toDateString();

    if (isWeekPoint || isLastDay) {
      series.push({
        date: current.toISOString().slice(0, 10),
        total: 0,
      });

      weekIndex += 1;
    }

    current.setDate(current.getDate() + 1);
    dayIndex += 1;
  }

  // Distribute the final total across weeks with deterministic variation
  const weights = series.map(() => 0.6 + rand() * 1.4);
  const weightSum = weights.reduce((sum, w) => sum + w, 0);
  const raw = weights.map((w) => (w / weightSum) * finalTotal);

  // Convert to integers that sum to finalTotal
  const ints = raw.map((value) => Math.floor(value));
  let remainder = finalTotal - ints.reduce((sum, v) => sum + v, 0);
  let i = 0;
  while (remainder > 0) {
    ints[i % ints.length] += 1;
    remainder -= 1;
    i += 1;
  }

  total = 0;
  series.forEach((point, index) => {
    total += ints[index];
    point.total = total;
  });

  return series;
}

const seriesByPerson = new Map();

function rebuildSeries() {
  seriesByPerson.clear();
  people.forEach((person) => {
    seriesByPerson.set(person.name, buildSeries(person.name, person.total));
  });
}

function normalizePick(pick) {
  if (typeof pick === "string") {
    const parts = pick.trim().split(" ");
    const wl = parts[parts.length - 1];
    const team = parts.slice(0, -1).join(" ");
    return { team, wl };
  }
  return pick;
}

function renderTable() {
  const tbody = document.querySelector("#picks-table tbody");
  tbody.innerHTML = "";

  const ranked = [...people].sort((a, b) => b.total - a.total);
  ranked.forEach((person) => {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    const nameTag = document.createElement("div");
    nameTag.className = "name-tag";

    const swatch = document.createElement("span");
    swatch.className = "swatch";
    swatch.style.color = person.color;
    swatch.style.background = person.color;

    const nameText = document.createElement("span");
    nameText.textContent = person.name;

    nameTag.appendChild(swatch);
    nameTag.appendChild(nameText);
    nameCell.appendChild(nameTag);

    const pickCell = document.createElement("td");
    const pickList = document.createElement("div");
    pickList.className = "pick-list";

    person.picks.map(normalizePick).forEach((pick) => {
      const item = document.createElement("div");
      item.className = "pick-item";

      const logo = document.createElement("img");
      logo.className = "pick-logo";
      logo.alt = `${pick.team} logo`;
      logo.src = TEAM_LOGOS[pick.team] || "";

      const team = document.createElement("span");
      team.className = "pick-team";
      team.textContent = pick.team;

      const badge = document.createElement("span");
      badge.className = `pick-badge ${pick.wl === "W" ? "win" : "loss"}`;
      badge.textContent = pick.wl;

      item.appendChild(logo);
      item.appendChild(team);
      item.appendChild(badge);
      pickList.appendChild(item);
    });

    pickCell.appendChild(pickList);

    const totalCell = document.createElement("td");
    totalCell.className = "total";
    totalCell.textContent = person.total;

    row.appendChild(nameCell);
    row.appendChild(pickCell);
    row.appendChild(totalCell);
    tbody.appendChild(row);
  });
}

function renderLegend() {
  const legend = document.getElementById("legend");
  legend.innerHTML = "";
  people.forEach((person) => {
    const item = document.createElement("div");
    item.className = "legend-item";

    const swatch = document.createElement("span");
    swatch.className = "swatch";
    swatch.style.color = person.color;
    swatch.style.background = person.color;

    const label = document.createElement("span");
    label.textContent = person.name;

    item.appendChild(swatch);
    item.appendChild(label);
    legend.appendChild(item);
  });
}

function renderChart() {
  const svg = document.getElementById("line-chart");
  svg.innerHTML = "";

  const padding = { top: 30, right: 40, bottom: 50, left: 50 };
  const width = 1000;
  const height = 420;
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const allSeries = Array.from(seriesByPerson.values());
  const maxTotal = Math.max(...allSeries.flat().map((point) => point.total), 10);

  const totalWeeks = allSeries[0].length - 1;

  function xScale(index) {
    return padding.left + (index / totalWeeks) * chartW;
  }

  function yScale(value) {
    return padding.top + chartH - (value / maxTotal) * chartH;
  }

  // Grid lines
  const gridCount = 5;
  for (let i = 0; i <= gridCount; i += 1) {
    const y = padding.top + (i / gridCount) * chartH;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", padding.left);
    line.setAttribute("x2", width - padding.right);
    line.setAttribute("y1", y);
    line.setAttribute("y2", y);
    line.setAttribute("class", "grid-line");
    svg.appendChild(line);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", 10);
    label.setAttribute("y", y + 4);
    label.setAttribute("class", "axis-label");
    const value = Math.round(maxTotal - (i / gridCount) * maxTotal);
    label.textContent = value;
    svg.appendChild(label);
  }

  // Axis
  const axis = document.createElementNS("http://www.w3.org/2000/svg", "line");
  axis.setAttribute("x1", padding.left);
  axis.setAttribute("x2", width - padding.right);
  axis.setAttribute("y1", padding.top + chartH);
  axis.setAttribute("y2", padding.top + chartH);
  axis.setAttribute("stroke", "rgba(255,255,255,0.4)");
  axis.setAttribute("stroke-width", "2");
  svg.appendChild(axis);

  // X-axis labels (weekly)
  const labelEvery = 1;
  const sampleSeries = allSeries[0] || [];
  sampleSeries.forEach((point, index) => {
    if (index % labelEvery !== 0) return;
    const x = xScale(index);
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", x);
    label.setAttribute("y", padding.top + chartH + 28);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("class", "axis-label");
    label.textContent = point.date.slice(5);
    svg.appendChild(label);
  });

  // Lines
  people.forEach((person) => {
    const series = seriesByPerson.get(person.name);
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const d = series
      .map((point, index) => {
        const x = xScale(index);
        const y = yScale(point.total);
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", person.color);
    path.setAttribute("stroke-width", "3");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("filter", "drop-shadow(0 0 6px rgba(0,0,0,0.5))");
    svg.appendChild(path);

    series.forEach((point, index) => {
      const cx = xScale(index);
      const cy = yScale(point.total);
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("cx", cx);
      dot.setAttribute("cy", cy);
      dot.setAttribute("r", "3.5");
      dot.setAttribute("fill", person.color);
      dot.setAttribute("stroke", "#000");
      dot.setAttribute("stroke-width", "1.5");
      svg.appendChild(dot);

      const val = document.createElementNS("http://www.w3.org/2000/svg", "text");
      val.setAttribute("x", cx);
      val.setAttribute("y", cy - 8);
      val.setAttribute("text-anchor", "middle");
      val.setAttribute("class", "axis-label");
      val.textContent = point.total;
      svg.appendChild(val);
    });

    const lastPoint = series[series.length - 1];
    const cx = xScale(series.length - 1);
    const cy = yScale(lastPoint.total);
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", cx);
    dot.setAttribute("cy", cy);
    dot.setAttribute("r", "6");
    dot.setAttribute("fill", person.color);
    dot.setAttribute("stroke", "#000");
    dot.setAttribute("stroke-width", "2");
    svg.appendChild(dot);
  });
}

function renderMeta() {
  const asOf = document.getElementById("as-of");
  asOf.textContent = `As of ${todayISO}`;

  const range = document.getElementById("date-range");
  range.textContent = `Season start ${seasonStart.toISOString().slice(0, 10)} → ${todayISO}`;
}

function renderAll() {
  renderTable();
  renderLegend();
  renderChart();
  renderMeta();
}

async function loadData() {
  try {
    const response = await fetch("data.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Missing data.json");
    }
    const data = await response.json();
    if (Array.isArray(data.people)) {
      people = data.people;
    }
  } catch (error) {
    people = [...fallbackPeople];
  }

  today = new Date();
  todayISO = today.toISOString().slice(0, 10);
  rebuildSeries();
  renderAll();
}

function scheduleDailyRefresh() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  const ms = next.getTime() - now.getTime();
  setTimeout(() => {
    loadData();
    scheduleDailyRefresh();
  }, ms);
}

rebuildSeries();
renderAll();
loadData();
scheduleDailyRefresh();
