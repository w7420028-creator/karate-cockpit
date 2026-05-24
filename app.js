const PLAN_START = new Date("2026-05-25T00:00:00");
const STORAGE_KEY = "karate-cockpit-v1";

const JOINT_PREP = [
  "Ankle knee-to-wall rocks — 10/side",
  "Slow calf raises — 10 reps",
  "Spanish squat hold or wall sit — 30 sec",
  "90/90 hip switches — 8/side",
  "Hip flexor/couch stretch — 30 sec/side",
  "Bird dog — 6/side"
];

const CARDS = {
  0: {
    key: "sunday-review",
    shortDay: "SUN",
    label: "Sunday Review",
    command: "Three-minute review. No workout.",
    time: "3 min",
    full: ["0:00 — Weigh yourself or enter latest bodyweight", "0:30 — Set pain sliders: knees, Achilles, hips, lower back", "1:15 — Set energy 0–10", "1:45 — Write one best kumite feeling", "2:30 — Save review. Done."],
    minimum: ["Enter pain + energy", "Write one word for best feeling", "Save. Weight can wait."],
    painRule: "This decides next week: pain ≥4 = protect tissue, energy ≤4 = reduce extra work, good numbers = progress one variable only.",
    reason: "Sunday is the coaching control loop: check bodyweight trend, tissue status, recovery, and one positive technical signal."
  },
  1: {
    key: "monday-karate",
    shortDay: "MON",
    label: "Karate + Joint Prep",
    command: "Prime joints. Then karate.",
    time: "6 min + class",
    full: [...JOINT_PREP, "Karate class — keep speed technical, ego off"],
    minimum: ["6-min joint prep only", "If class is impossible: no make-up workout"],
    painRule: "Knee swelling = no jumping or hard pivots. Achilles stiffness >3 = no explosive entries.",
    reason: "Prep buys tissue tolerance before pivots, bounces, and kumite rhythm."
  },
  2: {
    key: "tuesday-recovery",
    shortDay: "TUE",
    label: "Recovery Engine",
    command: "Build engine. Keep it easy.",
    time: "30–45 min",
    full: ["Zone 2 cardio — brisk walk, bike, elliptical, or rower", "Mobility — 8–10 min", "Keep breathing nasal/conversational"],
    minimum: ["10-min walk after dinner", "1 min couch stretch/side", "15 calf raises"],
    painRule: "Pain 3 = cut pace and duration 50%. Pain 4+ = walk/mobility only.",
    reason: "Aerobic base improves repeat attacks without adding joint cost."
  },
  3: {
    key: "wednesday-strength",
    shortDay: "WED",
    label: "Strength / Tendon A",
    command: "Durability before danger.",
    time: "25–35 min",
    full: [
      "Warm-up — 2 min easy movement + ankle rocks + hip switches",
      "Goblet squat — 3 × 8, RPE 6–7",
      "Romanian deadlift — 3 × 8, controlled",
      "Split squat — 2–3 × 8/side",
      "Push-up — 3 comfortable sets, stop 2 reps before failure",
      "Chest-supported row or band row — 3 × 10",
      "Side plank — 2 × 30 sec/side",
      "Standing calf raise slow — 3 × 12",
      "Tibialis raise — 2 × 15–20"
    ],
    minimum: ["Split squat — 2 × 8/side", "Slow calf raise — 2 × 12", "Side plank — 2 × 30 sec/side", "Bird dog — 2 × 6/side"],
    painRule: "Pain 3 = reduce load/volume 50%. Pain 4+ = stop that pattern today.",
    reason: "Leg, hip, calf, and trunk capacity make kumite acceleration safer."
  },
  4: {
    key: "thursday-footwork",
    shortDay: "THU",
    label: "Footwork + Mobility",
    command: "Quiet feet. Clean timing.",
    time: "20–30 min",
    full: [
      "Kamae bounce relaxed — 4 × 45 sec",
      "Step-in / step-out — 5 × 8",
      "Kizami-zuki entry, no power — 5 × 5/side",
      "Retreat + gyaku-zuki counter — 5 × 5/side",
      "Attack → angle exit — 5 × 4/side",
      "Shadow kumite — 3 × 90 sec at 50–60%"
    ],
    minimum: ["2 min relaxed kamae bounce", "2 min kizami entry", "2 min retreat-counter"],
    painRule: "No maximal acceleration in Phase 1. Morning tendon stiffness = no plyos/sprints.",
    reason: "WKF danger returns through distance, entry timing, and clean exits first."
  },
  5: {
    key: "friday-karate",
    shortDay: "FRI",
    label: "Karate + Joint Prep",
    command: "Prepare. Train. Check pain.",
    time: "6 min + class",
    full: [...JOINT_PREP, "Karate class — sparring intensity capped by joint state"],
    minimum: ["6-min joint prep only", "If exhausted: attend lightly or skip without debt"],
    painRule: "Lower-back pain with rotation = reduce kicking, core/stability only. Achilles >3 = no explosive entries.",
    reason: "Second karate day consolidates timing without turning the week into a recovery trap."
  },
  6: {
    key: "saturday-optional",
    shortDay: "SAT",
    label: "Optional Stable-Week Work",
    command: "Optional only if stable.",
    time: "25–40 min",
    full: ["30–45 min Zone 2 OR easy strength technique", "Stop while you feel fresh"],
    minimum: ["Family walk"],
    painRule: "Skip if Achilles stiffness >3, knee swelling, bad sleep 2+ nights, or Friday karate was hard.",
    reason: "Saturday adds base only when the week is quiet. No heroic intensity."
  }
};

const DEFAULT_STATE = {
  readiness: "GREEN",
  pain: { knees: 0, achilles: 0, hips: 0, lowerBack: 0 },
  sparring: 0,
  weight: "",
  energy: 7,
  note: "",
  logs: []
};

const app = document.querySelector("#app");
let state = loadState();
let route = "today";
let toastTimer;
let sessionTimer;
let timerSeconds = 0;

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...DEFAULT_STATE, ...parsed, pain: { ...DEFAULT_STATE.pain, ...(parsed?.pain || {}) }, logs: parsed?.logs || [] };
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayDate() {
  return new Date();
}

function localDateKey(date = todayDate()) {
  const value = new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sameLocalDay(value, key = localDateKey()) {
  return localDateKey(new Date(value)) === key;
}

function todayLog(card = currentCard()) {
  return state.logs.find(log => log.card === card.key && sameLocalDay(log.date));
}

function isCompletedLog(log) {
  return ["DONE", "MINIMUM"].includes(log?.type);
}

function dayKey(date = todayDate()) {
  return date.getDay();
}

function weekNumber(date = todayDate()) {
  const start = new Date(PLAN_START);
  start.setHours(0, 0, 0, 0);
  const current = new Date(date);
  current.setHours(0, 0, 0, 0);
  const diff = current.getTime() - start.getTime();
  return Math.max(1, Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1);
}

function currentPhase(week = weekNumber()) {
  if (week <= 12) return "Phase 1 · Reactivation";
  return "Post Phase 1 · Reassess";
}

function currentCard() {
  return CARDS[dayKey()];
}

function maxPain(pain = state.pain) {
  return Math.max(...Object.values(pain).map(Number));
}

function readinessClass(value = state.readiness) {
  return value.toLowerCase();
}

function suggestedReadiness() {
  const pain = maxPain();
  if (state.readiness === "RED" || pain >= 4) return "RED";
  if (state.readiness === "YELLOW" || pain >= 3) return "YELLOW";
  return "GREEN";
}

function render() {
  const screen = route === "progress" ? renderProgress() : route === "plan" ? renderPlan() : renderToday();
  app.innerHTML = `${screen}${renderNav()}`;
  bindCommonEvents();
}

function renderTopbar(title, detail = "") {
  const readiness = suggestedReadiness();
  return `
    <header class="topbar">
      <div>
        <p class="eyebrow">Karate Cockpit</p>
        <h1>${title}</h1>
        ${detail ? `<p class="subtle">${detail}</p>` : ""}
      </div>
      <span class="pill ${readinessClass(readiness)}">${readiness}</span>
    </header>`;
}

function renderToday() {
  const card = currentCard();
  const week = weekNumber();
  const lastLog = state.logs[0];
  const todaysLog = todayLog(card);
  const completedToday = isCompletedLog(todaysLog);
  const skippedToday = todaysLog?.type === "SKIPPED";
  return `
    <main class="screen" data-screen="today">
      ${renderTopbar("Today", `${currentPhase(week)} · Week ${week}`)}
      <section class="hero">
        <div class="hero-meta">
          <span class="pill accent">${card.shortDay}</span>
          <span class="pill">${card.time}</span>
          <span class="pill">${card.label}</span>
        </div>
        <h2 class="command">${completedToday ? "Completed today." : skippedToday ? "Skipped today. No debt." : card.command}</h2>
        <p class="subtle">${completedToday ? "You can update today’s entry, but the app will not create duplicate Sunday reviews." : skippedToday ? "Continue with the next scheduled card. Update only if the situation changed." : card.reason}</p>
        ${todaysLog ? `<div class="today-status ${todaysLog.type.toLowerCase()}"><strong>${todaysLog.type}</strong><span>${formatLogLine(todaysLog)}</span></div>` : ""}
        <div class="actions wide">
          <button class="btn primary" data-start="full">${completedToday ? "Update entry" : "Start full"}</button>
          <button class="btn secondary" ${completedToday ? 'data-route="progress"' : 'data-start="minimum"'}>${completedToday ? "View analytics" : "Minimum"}</button>
        </div>
      </section>

      <section class="stack" style="margin-top:16px">
        ${lastLog ? `<div class="card compact"><span class="pill ${readinessClass(lastLog.readiness)}">Last: ${lastLog.type}</span><p class="subtle" style="margin:10px 0 0">${formatLogLine(lastLog)}</p></div>` : ""}
        <div class="card accent-card">
          <h2>Quick state</h2>
          ${renderReadinessControl()}
        </div>
        <div class="card">
          <h2>Full session</h2>
          ${renderList(card.full)}
        </div>
        <div class="card">
          <h2>Minimum version</h2>
          ${renderList(card.minimum)}
        </div>
        <div class="card">
          <h2>Pain rule</h2>
          <p class="subtle">${card.painRule}</p>
        </div>
        <div class="card">
          <h2>${card.key === "sunday-review" ? "Sunday Review" : "30-sec check-in"}</h2>
          ${renderReviewInputs(card)}
          <div class="actions" style="margin-top:14px">
            <div class="action-row">
              <button class="btn primary" data-log="DONE">${completedToday ? "Update done" : "Done"}</button>
              <button class="btn warning" data-log="MINIMUM">${completedToday ? "Update minimum" : "Minimum"}</button>
            </div>
            <button class="btn danger" data-log="SKIPPED">Skip — no debt</button>
          </div>
        </div>
      </section>
    </main>`;
}

function renderReadinessControl() {
  return `
    <div class="segmented" role="group" aria-label="Readiness">
      ${["GREEN", "YELLOW", "RED"].map(value => `<button class="btn ${value.toLowerCase()}" data-readiness="${value}" aria-pressed="${state.readiness === value}">${value}</button>`).join("")}
    </div>`;
}

function renderReviewInputs(card = currentCard()) {
  const isSunday = card.key === "sunday-review";
  return `
    <div class="input-grid">
      <label class="field-label" for="weight">Weight <span>${isSunday ? "current bodyweight in kg" : "optional"}</span></label>
      <input id="weight" inputmode="decimal" autocomplete="off" placeholder="94.0" value="${escapeHtml(state.weight || "")}" />
    </div>
    ${renderPainSliders()}
    <div class="slider-row energy-row">
      <label for="energy">Energy</label>
      <span class="value" id="value-energy">${state.energy ?? 7}</span>
      <input id="energy" type="range" min="0" max="10" step="1" value="${state.energy ?? 7}" />
    </div>
    <label class="eyebrow" for="note">${isSunday ? "Best kumite feeling" : "What felt sharp?"}</label>
    <textarea id="note" maxlength="140" placeholder="e.g. kizami timing">${escapeHtml(state.note || "")}</textarea>`;
}

function latestWeight() {
  const log = state.logs.find(log => log.weight);
  return log?.weight || state.weight || "";
}

function numericWeight(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function weightTrend(logs) {
  const points = logs
    .filter(log => numericWeight(log.weight) !== null)
    .map(log => ({ date: new Date(log.date), value: numericWeight(log.weight) }))
    .sort((a, b) => a.date - b.date);
  const latestPoint = points.length ? points[points.length - 1] : null;
  const latest = latestPoint?.value ?? numericWeight(state.weight);
  const recent = points.filter(point => Date.now() - point.date.getTime() <= 30 * 24 * 60 * 60 * 1000);
  const basis = recent.length >= 2 ? recent : points;
  const delta = basis.length >= 2 ? basis[basis.length - 1].value - basis[0].value : null;
  return {
    latest: latest === null || latest === undefined ? "" : latest.toFixed(1),
    delta: delta === null ? "—" : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)} kg`,
    count: points.length
  };
}

function averagePain(logs, limit = 7) {
  const sample = logs.filter(log => log.pain).slice(0, limit);
  if (!sample.length) return maxPain();
  return sample.reduce((sum, log) => sum + maxPain(log.pain), 0) / sample.length;
}

function averageEnergy(logs, limit = 7) {
  const values = logs.map(log => Number(log.energy)).filter(value => Number.isFinite(value) && value >= 0).slice(0, limit);
  if (!values.length) return Number.isFinite(Number(state.energy)) ? Number(state.energy) : null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function readinessStats(logs, days = 14) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const sample = logs.filter(log => new Date(log.date).getTime() >= cutoff);
  return sample.reduce((acc, log) => {
    const key = String(log.readiness || "").toLowerCase();
    if (key in acc) acc[key] += 1;
    return acc;
  }, { green: 0, yellow: 0, red: 0 });
}

function painDirection(logs) {
  const values = logs.filter(log => log.pain).slice(0, 8).map(log => maxPain(log.pain));
  if (values.length < 4) return "—";
  const recent = values.slice(0, Math.ceil(values.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(values.length / 2);
  const olderValues = values.slice(Math.ceil(values.length / 2));
  const older = olderValues.reduce((a, b) => a + b, 0) / olderValues.length;
  if (recent >= older + 1) return "up";
  if (recent <= older - 1) return "down";
  return "stable";
}

function coachDecision({ avgPain, avgEnergy, completed, readiness }) {
  if (readiness.red > 0 || avgPain >= 4) return { level: "red", text: "Protect tissue next. No plyos, no hard sparring, reduce load." };
  if ((avgEnergy !== null && avgEnergy <= 4) || avgPain >= 3 || readiness.yellow >= 2) return { level: "yellow", text: "Hold or reduce. Keep karate technical and choose minimum versions." };
  if (completed >= 3 && avgPain < 3 && (avgEnergy === null || avgEnergy >= 6)) return { level: "green", text: "Stable week. Progress one variable only — never volume, speed, and intensity together." };
  return { level: "yellow", text: "Not enough signal yet. Keep the plan easy and collect clean data." };
}


function renderPainSliders() {
  const labels = [
    ["knees", "Knees"],
    ["achilles", "Achilles"],
    ["hips", "Hips"],
    ["lowerBack", "Lower back"]
  ];
  return `<div class="slider-grid">${labels.map(([key, label]) => `
    <div class="slider-row">
      <label for="pain-${key}">${label}</label>
      <span class="value" id="value-${key}">${state.pain[key]}</span>
      <input id="pain-${key}" data-pain="${key}" type="range" min="0" max="10" step="1" value="${state.pain[key]}" />
    </div>`).join("")}</div>`;
}

function renderList(items) {
  return `<ol class="exercise-list">${items.map((item, index) => `<li data-index="${index + 1}"><span>${item}</span></li>`).join("")}</ol>`;
}

function renderProgress() {
  const logs = state.logs;
  const last14 = logs.filter(log => Date.now() - new Date(log.date).getTime() <= 14 * 24 * 60 * 60 * 1000);
  const completed = last14.filter(log => ["DONE", "MINIMUM"].includes(log.type)).length;
  const latestPain = logs[0]?.pain || state.pain;
  const avgPain = averagePain(logs, 7);
  const avgEnergy = averageEnergy(logs, 7);
  const weight = weightTrend(logs);
  const readiness = readinessStats(logs, 14);
  const decision = coachDecision({ avgPain, avgEnergy, completed, readiness });
  return `
    <main class="screen" data-screen="progress">
      ${renderTopbar("Analytics", "Local trends from your check-ins.")}
      <section class="card accent-card">
        <h2>Coach decision</h2>
        <p class="decision ${decision.level}">${decision.text}</p>
        <p class="subtle">Based on last 7–14 days. Data stays on this iPhone.</p>
      </section>
      <section class="card" style="margin-top:16px">
        <h2>Bodyweight</h2>
        <div class="readiness-strip">
          <div class="metric"><strong>${weight.latest || "—"}</strong><span>Latest kg</span></div>
          <div class="metric"><strong>${weight.delta}</strong><span>30d trend</span></div>
          <div class="metric"><strong>${weight.count}</strong><span>weigh-ins</span></div>
        </div>
        <p class="subtle" style="margin-top:10px">Target pace: slow drop, roughly 0.3–0.6 kg/week. Faster is not automatically better for kumite.</p>
      </section>
      <section class="card" style="margin-top:16px">
        <h2>Readiness + recovery</h2>
        <div class="readiness-strip">
          <div class="metric"><strong>${completed}</strong><span>Done/min 14d</span></div>
          <div class="metric"><strong>${avgEnergy === null ? "—" : avgEnergy.toFixed(1)}</strong><span>Avg energy</span></div>
          <div class="metric"><strong>${readiness.green}/${readiness.yellow}/${readiness.red}</strong><span>G/Y/R</span></div>
        </div>
      </section>
      <section class="card" style="margin-top:16px">
        <h2>Pain trend</h2>
        <div class="readiness-strip">
          <div class="metric"><strong>${avgPain.toFixed(1)}</strong><span>Avg max pain</span></div>
          <div class="metric"><strong>${latestPain.knees}</strong><span>Knees</span></div>
          <div class="metric"><strong>${latestPain.achilles}</strong><span>Achilles</span></div>
        </div>
        <div class="readiness-strip" style="margin-top:8px">
          <div class="metric"><strong>${latestPain.hips}</strong><span>Hips</span></div>
          <div class="metric"><strong>${latestPain.lowerBack}</strong><span>Lower back</span></div>
          <div class="metric"><strong>${painDirection(logs)}</strong><span>Direction</span></div>
        </div>
      </section>
      <section class="card" style="margin-top:16px">
        <h2>Recent metric logs</h2>
        <div class="timeline">
          ${logs.length ? logs.slice(0, 10).map(renderLogRow).join("") : `<p class="subtle">No logs yet. Start with today’s Sunday Review.</p>`}
        </div>
      </section>
    </main>`;
}

function renderLogRow(log) {
  const date = new Date(log.date);
  return `<div class="log-row">
    <div class="date">${date.toLocaleDateString(undefined, { weekday: "short", day: "2-digit" })}</div>
    <div><div class="kind">${log.type}</div><div class="pain">${formatMetricLog(log)}</div></div>
    <span class="pill ${readinessClass(log.readiness)}">${log.readiness}</span>
  </div>`;
}

function renderPlan() {
  return `
    <main class="screen" data-screen="plan">
      ${renderTopbar("Plan", `${currentPhase()} · Week ${weekNumber()}`)}
      <section class="card accent-card">
        <h2>Current focus</h2>
        <p class="subtle">Week 1–4: make training automatic, clean mechanics, add tiny volume only if joints are quiet, then deload and assess.</p>
      </section>
      <section class="card" style="margin-top:16px">
        <h2>Weekly rhythm</h2>
        <div class="week-grid">
          ${Object.values(CARDS).slice(1).concat(CARDS[0]).map(card => `<div class="day-row"><div class="day-badge">${card.shortDay}</div><div><strong>${card.label}</strong><p>${card.time} · Min: ${card.minimum[0]}</p></div></div>`).join("")}
        </div>
      </section>
      <section class="card" style="margin-top:16px">
        <h2>Pain rules</h2>
        ${renderList(["0–2/10: continue", "3/10: reduce speed/load/volume 50%", "4+/10: stop that category today", "Morning-after tendon stiffness: no plyos/sprints", "Knee swelling: no jumping, hard pivots, or sparring intensity", "Lower-back pain with rotation: reduce kicking volume, core/stability only"])}
      </section>
    </main>`;
}

function renderNav() {
  const items = [["today", "Today"], ["progress", "Progress"], ["plan", "Plan"]];
  return `<nav class="bottom-nav" aria-label="Primary">${items.map(([key, label]) => `<button class="nav-btn" data-route="${key}" aria-current="${route === key ? "page" : "false"}">${label}</button>`).join("")}</nav>`;
}

function bindCommonEvents() {
  document.querySelectorAll("[data-route]").forEach(button => button.addEventListener("click", () => {
    route = button.dataset.route;
    render();
  }));
  document.querySelectorAll("[data-readiness]").forEach(button => button.addEventListener("click", () => {
    state.readiness = button.dataset.readiness;
    saveState();
    render();
  }));
  document.querySelectorAll("[data-pain]").forEach(input => input.addEventListener("input", () => {
    const key = input.dataset.pain;
    state.pain[key] = Number(input.value);
    const value = document.querySelector(`#value-${key}`);
    if (value) value.textContent = input.value;
    saveState();
  }));
  const note = document.querySelector("#note");
  if (note) note.addEventListener("input", () => {
    state.note = note.value.trim();
    saveState();
  });
  const weight = document.querySelector("#weight");
  if (weight) weight.addEventListener("input", () => {
    state.weight = weight.value.trim();
    saveState();
  });
  const energy = document.querySelector("#energy");
  if (energy) energy.addEventListener("input", () => {
    state.energy = Number(energy.value);
    const value = document.querySelector("#value-energy");
    if (value) value.textContent = energy.value;
    saveState();
  });
  document.querySelectorAll("[data-log]").forEach(button => button.addEventListener("click", () => logSession(button.dataset.log)));
  document.querySelectorAll("[data-start]").forEach(button => button.addEventListener("click", () => openSession(button.dataset.start)));
}

function logSession(type) {
  const log = {
    id: globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
    date: new Date().toISOString(),
    card: currentCard().key,
    type,
    readiness: suggestedReadiness(),
    pain: { ...state.pain },
    sparring: Number(state.sparring || 0),
    weight: state.weight || "",
    energy: Number(state.energy || 0),
    note: state.note || ""
  };
  const todayKey = localDateKey();
  state.logs = state.logs.filter(existing => !(existing.card === log.card && sameLocalDay(existing.date, todayKey)));
  state.logs = [log, ...state.logs].slice(0, 180);
  if (type === "SKIPPED") state.readiness = state.readiness === "GREEN" ? "YELLOW" : state.readiness;
  state.note = "";
  saveState();
  render();
  showToast(type === "SKIPPED" ? "Skipped. No debt. Continue next card." : `${type} logged locally.`);
}

function openSession(kind) {
  const card = currentCard();
  if (card.key === "sunday-review") {
    openReviewSession();
    return;
  }
  const items = kind === "minimum" ? card.minimum : card.full;
  timerSeconds = kind === "minimum" ? Math.min(10 * 60, estimateSeconds(card, kind)) : estimateSeconds(card, kind);
  const overlay = document.createElement("div");
  overlay.className = "session-overlay";
  overlay.innerHTML = `
    <section class="session-panel" role="dialog" aria-modal="true" aria-label="Session mode">
      <div class="topbar" style="margin-bottom:8px">
        <div><p class="eyebrow">Session Mode</p><h2>${kind === "minimum" ? "Minimum" : "Full"}: ${card.label}</h2></div>
        <button class="btn ghost small" data-close-session>Close</button>
      </div>
      <p class="subtle">Pain abort: ${card.painRule}</p>
      <div class="timer" data-timer>${formatSeconds(timerSeconds)}</div>
      <div class="stack">
        ${items.map(item => `<label class="check-item"><input type="checkbox" /><span>${item}</span></label>`).join("")}
      </div>
      <div class="actions" style="margin-top:16px">
        <div class="action-row">
          <button class="btn primary" data-session-log="${kind === "minimum" ? "MINIMUM" : "DONE"}">${kind === "minimum" ? "Log minimum" : "Done"}</button>
          <button class="btn warning" data-session-log="MINIMUM">Minimum</button>
        </div>
        <button class="btn danger" data-session-log="SKIPPED">Stop / Skip</button>
      </div>
    </section>`;
  document.body.appendChild(overlay);
  overlay.querySelector("[data-close-session]").addEventListener("click", closeSession);
  overlay.querySelectorAll("[data-session-log]").forEach(button => button.addEventListener("click", () => {
    closeSession();
    logSession(button.dataset.sessionLog);
  }));
  overlay.querySelectorAll(".check-item input").forEach(box => box.addEventListener("change", () => box.closest(".check-item").classList.toggle("done", box.checked)));
  startTimer(overlay.querySelector("[data-timer]"));
}

function openReviewSession() {
  const card = currentCard();
  const existing = todayLog(card);
  const overlay = document.createElement("div");
  overlay.className = "session-overlay";
  overlay.innerHTML = `
    <section class="session-panel" role="dialog" aria-modal="true" aria-label="Sunday review">
      <div class="topbar" style="margin-bottom:8px">
        <div><p class="eyebrow">Sunday Review</p><h2>Four signals. No workout.</h2></div>
        <button class="btn ghost small" data-close-session>Close</button>
      </div>
      <p class="subtle">Do this: weigh or enter latest kg, set pain sliders, set energy, write one best kumite feeling, save. No workout.</p>
      <div class="card compact" style="margin-top:14px">
        ${renderReviewInputs(card)}
      </div>
      ${existing ? `<div class="today-status ${existing.type.toLowerCase()}" style="margin-top:14px"><strong>Already logged today</strong><span>${formatLogLine(existing)}</span></div>` : ""}
      <div class="actions" style="margin-top:16px">
        <button class="btn primary" data-session-log="DONE">${existing ? "Update review" : "Save review"}</button>
        <button class="btn warning" data-session-log="MINIMUM">${existing ? "Update minimum" : "Minimum"}</button>
        <button class="btn danger" data-session-log="SKIPPED">${existing ? "Mark skipped instead" : "Skip — no debt"}</button>
      </div>
    </section>`;
  document.body.appendChild(overlay);
  overlay.querySelector("[data-close-session]").addEventListener("click", closeSession);
  overlay.querySelectorAll("[data-pain]").forEach(input => input.addEventListener("input", () => {
    const key = input.dataset.pain;
    state.pain[key] = Number(input.value);
    const value = overlay.querySelector(`#value-${key}`);
    if (value) value.textContent = input.value;
    saveState();
  }));
  overlay.querySelector("#weight")?.addEventListener("input", event => { state.weight = event.target.value.trim(); saveState(); });
  overlay.querySelector("#energy")?.addEventListener("input", event => {
    state.energy = Number(event.target.value);
    const value = overlay.querySelector("#value-energy");
    if (value) value.textContent = event.target.value;
    saveState();
  });
  overlay.querySelector("#note")?.addEventListener("input", event => { state.note = event.target.value.trim(); saveState(); });
  overlay.querySelectorAll("[data-session-log]").forEach(button => button.addEventListener("click", () => {
    closeSession();
    logSession(button.dataset.sessionLog);
  }));
}

function closeSession() {
  clearInterval(sessionTimer);
  document.querySelector(".session-overlay")?.remove();
}

function estimateSeconds(card, kind) {
  if (kind === "minimum") {
    if (card.key.includes("footwork") || card.key.includes("karate")) return 6 * 60;
    if (card.key.includes("strength") || card.key.includes("recovery")) return 10 * 60;
    return 3 * 60;
  }
  if (card.key.includes("strength")) return 30 * 60;
  if (card.key.includes("footwork")) return 25 * 60;
  if (card.key.includes("recovery")) return 35 * 60;
  if (card.key.includes("karate")) return 6 * 60;
  return 3 * 60;
}

function startTimer(node) {
  clearInterval(sessionTimer);
  sessionTimer = setInterval(() => {
    timerSeconds = Math.max(0, timerSeconds - 1);
    node.textContent = formatSeconds(timerSeconds);
    if (timerSeconds === 0) clearInterval(sessionTimer);
  }, 1000);
}

function formatSeconds(seconds) {
  const min = Math.floor(seconds / 60).toString().padStart(2, "0");
  const sec = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
}

function formatPain(pain) {
  return `knees ${pain.knees} · Achilles ${pain.achilles} · hips ${pain.hips} · back ${pain.lowerBack}`;
}

function formatMetricLog(log) {
  const parts = [formatPain(log.pain)];
  if (log.weight) parts.push(`${log.weight} kg`);
  if (Number.isFinite(Number(log.energy))) parts.push(`energy ${log.energy}`);
  if (log.note) parts.push(log.note);
  return parts.join(" · ");
}

function formatLogLine(log) {
  const date = new Date(log.date);
  return `${date.toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" })} · ${log.readiness} · ${formatPain(log.pain)}`;
}

function showToast(message) {
  clearTimeout(toastTimer);
  document.querySelector(".toast")?.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  toastTimer = setTimeout(() => toast.remove(), 2300);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

if ("serviceWorker" in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").then(registration => registration.update()).catch(() => {});
  });
}

render();
