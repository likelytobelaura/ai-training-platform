/*
 * Stationhouse data.
 * Model roster is illustrative (informed by public Marin model releases:
 * Marin 8B, Marin 32B, Marin 67B-A2B, and the in-progress 535B-A23B hero run).
 * Pipeline issue data below is pulled verbatim (number/title/labels/url) from the
 * public open issues at https://github.com/marin-community/marin, filtered to
 * open issues that are actionable requests for work (bugs, tasks, experiments,
 * epics) and sorted by their repo labels into infrastructure / data / evals.
 */

const MODELS = [
  {
    id: "marin-8b",
    name: "Marin 8B",
    variant: "Base / Instruct",
    params: "8B",
    status: "Released",
    clickable: false,
  },
  {
    id: "marin-32b",
    name: "Marin 32B",
    variant: "Base (Retro)",
    params: "32B",
    status: "Released",
    clickable: false,
  },
  {
    id: "marin-67b-a2b",
    name: "Marin 67B-A2B",
    variant: "MoE",
    params: "67B / 2B active",
    status: "Released",
    clickable: false,
  },
  {
    id: "marin-535b-a23b",
    name: "Marin 535B-A23B",
    variant: "Hero Run · MoE",
    params: "535B / 23B active",
    status: "Training — In Progress",
    clickable: true,
  },
];

const PIPELINE = {
  "marin-535b-a23b": {
    title: "Marin 535B-A23B — Hero Run Pipeline",
    sub: "MoE hero run targeting ~18.75T tokens on GB200 NVL72 over roughly 3 months, " +
         "run fully in the open with a public scaling-ladder tracking report. Columns below are " +
         "the live backlog: open issues from the public repo asking for infrastructure, data, or " +
         "eval work in support of this run.",
    stats: [
      { label: "Total params", value: "535B" },
      { label: "Active params", value: "23B" },
      { label: "Token budget", value: "18.75T" },
      { label: "Hardware", value: "GB200 NVL72" },
    ],
    columns: [
      { key: "infra", label: "Infrastructure", sub: "Cluster, scheduling, training & serving infra open issues", data: window.__DATA_INFRA__, discord: window.__DISCORD_INFRA__ },
      { key: "data", label: "Data", sub: "Data curation, datakit, and dataset pipeline open issues", data: window.__DATA_DATA__, discord: window.__DISCORD_DATA__ },
      { key: "evals", label: "Evals", sub: "Marin evals wishlist — open eval requests & leaderboard work", data: window.__DATA_EVALS__, discord: window.__DISCORD_EVALS__ },
    ],
  },
};

function labelClass(l) {
  if (l === "bug") return "tag bug";
  if (l === "epic") return "tag epic";
  if (l === "p1") return "tag p1";
  return "tag";
}

function renderDropdown() {
  const menu = document.getElementById("projects-menu");
  menu.innerHTML = "";
  MODELS.forEach((m) => {
    const item = document.createElement("div");
    item.className = "dd-item" + (m.clickable ? " clickable" : "");
    item.innerHTML = `
      <div>
        <div class="dd-name">${m.name}</div>
        <div class="dd-meta">${m.variant} · ${m.params}</div>
      </div>
      <span class="dd-badge ${m.clickable ? "live" : ""}">${m.status}</span>
    `;
    if (m.clickable) {
      item.addEventListener("click", () => {
        closeDropdown();
        openPipeline(m.id);
      });
    }
    menu.appendChild(item);
  });
}

function renderModelGrid() {
  const grid = document.getElementById("model-grid");
  grid.innerHTML = "";
  MODELS.forEach((m) => {
    const card = document.createElement("div");
    card.className = "model-card" + (m.clickable ? " clickable" : "");
    card.innerHTML = `
      <div class="mc-name">${m.name}</div>
      <div class="mc-variant">${m.variant}</div>
      <div class="mc-params">${m.params}</div>
      <div class="mc-status">${m.status}</div>
      ${m.clickable ? '<div class="mc-cta">View pipeline &rarr;</div>' : ""}
    `;
    if (m.clickable) {
      card.addEventListener("click", () => openPipeline(m.id));
    }
    grid.appendChild(card);
  });
}

function renderCard(issue) {
  const a = document.createElement("a");
  a.className = "card";
  a.href = issue.url;
  a.target = "_blank";
  a.rel = "noopener";
  a.innerHTML = `
    <div class="card-top"><span>#${issue.number}</span><span>open</span></div>
    <div class="card-title">${issue.title}</div>
    <div class="card-labels">${issue.labels.map((l) => `<span class="${labelClass(l)}">${l}</span>`).join("")}</div>
  `;
  return a;
}

function renderDiscordCard(task) {
  // No outbound link and no author attribution here, by design: this lane surfaces
  // asks raised in Marin's members-only Discord, and that community is a different
  // privacy posture than the public GitHub issues in the lane above. Titles/excerpts
  // are paraphrased task summaries, not direct quotes.
  const div = document.createElement("div");
  div.className = "card card-discord";
  div.innerHTML = `
    <div class="card-top"><span>#${task.channel || "discord"}</span><span>${task.date}</span></div>
    <div class="card-title">${task.title}</div>
    <p class="card-excerpt">${task.excerpt}</p>
    <div class="card-labels"><span class="tag discord">internal Discord</span></div>
  `;
  return div;
}

function openPipeline(modelId) {
  const p = PIPELINE[modelId];
  if (!p) return;

  document.getElementById("view-home").classList.add("hidden");
  document.getElementById("view-pipeline").classList.remove("hidden");

  document.getElementById("pipeline-title").textContent = p.title;
  document.getElementById("pipeline-sub").textContent = p.sub;

  const statRow = document.getElementById("pipeline-stats");
  statRow.innerHTML = p.stats
    .map((s) => `<span class="stat">${s.label}: <b>${s.value}</b></span>`)
    .join("");

  const board = document.getElementById("board");
  board.innerHTML = "";
  p.columns.forEach((col) => {
    const colEl = document.createElement("div");
    colEl.className = "col";
    colEl.dataset.col = col.key;
    const discordItems = col.discord || [];
    colEl.innerHTML = `
      <div class="col-head"><h3>${col.label}</h3><span class="col-count">${col.data.length} open</span></div>
      <p class="col-sub">${col.sub}</p>
      <div class="lane-label">GitHub</div>
    `;
    col.data.forEach((issue) => colEl.appendChild(renderCard(issue)));

    const discordLabel = document.createElement("div");
    discordLabel.className = "lane-label lane-discord";
    discordLabel.innerHTML = `Discord <span class="col-count">last 7 days · ${discordItems.length}</span>`;
    colEl.appendChild(discordLabel);
    if (discordItems.length === 0) {
      const empty = document.createElement("p");
      empty.className = "col-sub";
      empty.textContent = "No open asks surfaced this week.";
      colEl.appendChild(empty);
    } else {
      discordItems.forEach((task) => colEl.appendChild(renderDiscordCard(task)));
    }

    board.appendChild(colEl);
  });

  window.scrollTo({ top: 0, behavior: "instant" });
}

function backHome() {
  document.getElementById("view-pipeline").classList.add("hidden");
  document.getElementById("view-home").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "instant" });
}

function toggleDropdown() {
  const menu = document.getElementById("projects-menu");
  const btn = document.getElementById("projects-btn");
  const open = menu.classList.toggle("open");
  btn.setAttribute("aria-expanded", String(open));
}
function closeDropdown() {
  document.getElementById("projects-menu").classList.remove("open");
  document.getElementById("projects-btn").setAttribute("aria-expanded", "false");
}

document.addEventListener("DOMContentLoaded", () => {
  renderDropdown();
  renderModelGrid();

  document.getElementById("projects-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    toggleDropdown();
  });
  document.addEventListener("click", (e) => {
    if (!document.getElementById("projects-dropdown").contains(e.target)) closeDropdown();
  });
  document.getElementById("back-btn").addEventListener("click", backHome);
});
