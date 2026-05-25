const PLAN_START = new Date("2026-05-25T00:00:00");
const STORAGE_KEY = "karate-cockpit-v1";
const APP_URL = "https://w7420028-creator.github.io/karate-cockpit/";
const VAPID_PUBLIC_KEY = "BH2EnekLiapo_ZR4OcV2GxrTgGSzrlhKnRuYh_-cmfYWQCMBHomzrQynEAWwHGrCEwZvwh2ANmpI21mw4OA0Bqs";

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
  skipReason: { category: "", text: "" },
  logs: []
};

const DIAGRAM_PATHS = {
  ankle: '<path d="M23 20v18l14 6"/><path d="M21 38h20"/><circle cx="23" cy="16" r="4"/>',
  calf: '<circle cx="32" cy="13" r="4"/><path d="M32 18v18"/><path d="M24 31l8-13 8 13"/><path d="M28 36l-4 13"/><path d="M36 36l5 13"/><path d="M21 50h24"/><path d="M41 49l6-4"/>',
  squat: '<circle cx="32" cy="12" r="4"/><path d="M32 17v15"/><path d="M23 27l9 5 9-5"/><path d="M24 37h16"/><path d="M24 37l-7 9"/><path d="M40 37l7 9"/><path d="M15 47h13"/><path d="M36 47h13"/>',
  hip: '<circle cx="28" cy="15" r="4"/><path d="M28 20v14"/><path d="M18 36h18"/><path d="M18 36l-6 11"/><path d="M36 36l12 2"/><path d="M46 38l6 9"/><path d="M11 48h16"/><path d="M43 48h11"/>',
  stretch: '<circle cx="29" cy="12" r="4"/><path d="M29 17l2 17"/><path d="M20 26l11 8 12-7"/><path d="M31 34l-13 14"/><path d="M32 35l15 2"/><path d="M15 49h15"/><path d="M45 38v12"/>',
  birdDog: '<circle cx="24" cy="19" r="4"/><path d="M28 23h18"/><path d="M20 25l-7 10"/><path d="M34 25l-6 14"/><path d="M46 23l7-8"/><path d="M46 26l11 6"/><path d="M12 36h14"/>',
  karate: '<circle cx="30" cy="13" r="4"/><path d="M30 18v18"/><path d="M19 25l11 5 14-8"/><path d="M30 36l-11 13"/><path d="M31 36l14 9"/><path d="M16 50h13"/><path d="M42 46h10"/>',
  cardio: '<path d="M14 42c8-16 18-16 24 0"/><path d="M38 42c3-8 7-12 13-12"/><path d="M13 43h38"/><path d="M20 31l7 7 9-15 7 10"/><circle cx="16" cy="43" r="3"/><circle cx="50" cy="43" r="3"/>',
  walk: '<circle cx="30" cy="13" r="4"/><path d="M30 18l-4 15"/><path d="M26 28l-8 5"/><path d="M28 33l-10 17"/><path d="M29 33l14 5"/><path d="M42 38l5 11"/><path d="M15 50h12"/><path d="M43 50h10"/>',
  mobility: '<path d="M18 37c7-16 21-20 31-9"/><path d="M45 25h7v7"/><path d="M47 44c-8 10-23 9-30-1"/><path d="M20 46h-7v-7"/><circle cx="32" cy="36" r="4"/>',
  breath: '<path d="M32 14c-7 8-12 14-12 22a12 12 0 0 0 24 0c0-8-5-14-12-22Z"/><path d="M32 25v18"/><path d="M24 35h16"/>',
  hinge: '<circle cx="29" cy="13" r="4"/><path d="M29 18l13 14"/><path d="M17 32h25"/><path d="M28 29l-8 18"/><path d="M39 32l7 15"/><path d="M16 48h12"/><path d="M42 48h12"/>',
  pushup: '<circle cx="19" cy="31" r="4"/><path d="M23 31h25"/><path d="M29 35l-6 11"/><path d="M44 35l8 11"/><path d="M12 47h46"/>',
  row: '<circle cx="26" cy="15" r="4"/><path d="M26 20l-7 19"/><path d="M20 36h26"/><path d="M34 29l12 7"/><path d="M17 40h32"/><path d="M23 42l-5 8"/><path d="M42 42l7 8"/>',
  plank: '<circle cx="20" cy="26" r="4"/><path d="M24 27h28"/><path d="M31 30l-9 14"/><path d="M49 30l6 14"/><path d="M17 45h42"/>',
  tibialis: '<path d="M30 13v25"/><path d="M30 38l14 2"/><path d="M42 40l7-5"/><path d="M44 43l7 1"/><path d="M21 50h29"/><path d="M25 20h10"/>',
  stance: '<circle cx="32" cy="12" r="4"/><path d="M32 17v18"/><path d="M20 25l12 5 12-5"/><path d="M31 35l-12 13"/><path d="M33 35l13 13"/><path d="M15 49h14"/><path d="M42 49h14"/><path d="M13 35h7M44 35h7"/>',
  step: '<path d="M16 47h36"/><path d="M22 38l11-9 11 9"/><path d="M33 29v19"/><path d="M15 31h12"/><path d="M49 31H37"/><path d="M23 28l-7 3 7 3"/><path d="M41 28l7 3-7 3"/>',
  punch: '<circle cx="29" cy="13" r="4"/><path d="M29 18v17"/><path d="M18 25l11 5"/><path d="M30 26h21"/><path d="M29 35l-11 14"/><path d="M31 35l13 14"/><path d="M15 50h12"/><path d="M41 50h12"/>',
  counter: '<circle cx="33" cy="13" r="4"/><path d="M33 18v17"/><path d="M20 24l13 6"/><path d="M34 25h18"/><path d="M33 35l-13 14"/><path d="M34 35l11 14"/><path d="M13 37l-6-5 6-5"/><path d="M8 32h14"/>',
  angle: '<path d="M15 49h36"/><path d="M22 43l12-14 11 14"/><path d="M34 29v19"/><path d="M34 29l13-13"/><path d="M47 16h-9"/><path d="M47 16v9"/><circle cx="34" cy="22" r="3"/>',
  shadow: '<circle cx="24" cy="13" r="4"/><path d="M24 18v18"/><path d="M15 25l9 5 12-8"/><path d="M24 36l-10 13"/><path d="M26 36l12 10"/><path d="M39 17c7 5 9 15 4 23"/><path d="M44 40h-7v-7"/>'
};


const DEMO_LINKS = {
  ankle: { title: "Knee-to-wall", duration: "1:07", url: "https://www.youtube.com/watch?v=TErX68hudFA" },
  calf: { title: "Calf raise", duration: "1:48", url: "https://www.youtube.com/watch?v=CtyIVeJH6lI" },
  spanishSquat: { title: "Spanish squat", duration: "0:10", url: "https://www.youtube.com/watch?v=SZMidXQy7jY" },
  hipSwitch: { title: "90/90 hips", duration: "0:31", url: "https://www.youtube.com/watch?v=m51AZSXMvEA" },
  couchStretch: { title: "Couch stretch", duration: "0:53", url: "https://www.youtube.com/watch?v=Fg-lwNBzVV8" },
  birdDog: { title: "Bird dog", duration: "0:26", url: "https://www.youtube.com/watch?v=ZdAHe9_HeEw" },
  zone2: { title: "Zone 2", duration: "1:03", url: "https://www.youtube.com/watch?v=lyNKZwrTI48" },
  mobility: { title: "Mobility", duration: "5:46", url: "https://www.youtube.com/watch?v=G2ciDpFx1GM" },
  gobletSquat: { title: "Goblet squat", duration: "0:43", url: "https://www.youtube.com/watch?v=Xjo_fY9Hl9w" },
  rdl: { title: "RDL", duration: "0:42", url: "https://www.youtube.com/watch?v=7j-2w4-P14I" },
  splitSquat: { title: "Split squat", duration: "0:12", url: "https://www.youtube.com/watch?v=Wcmg-3iHwjQ" },
  pushup: { title: "Push-up", duration: "0:14", url: "https://www.youtube.com/watch?v=WDIpL0pjun0" },
  row: { title: "Band row", duration: "0:49", url: "https://www.youtube.com/watch?v=LSkyinhmA8k" },
  plank: { title: "Side plank", duration: "1:11", url: "https://www.youtube.com/watch?v=N_s9em1xTqU" },
  tibialis: { title: "Tibialis", duration: "0:42", url: "https://www.youtube.com/watch?v=OPEuhclsTUQ" },
  stance: { title: "Kamae bounce", duration: "1:32", url: "https://www.youtube.com/watch?v=AqT2tXfbpgg" },
  step: { title: "Footwork", duration: "0:37", url: "https://www.youtube.com/watch?v=c4FpG5P11gc" },
  punch: { title: "Kizami entry", duration: "1:51", url: "https://www.youtube.com/watch?v=RPHGhZVQdKY" },
  counter: { title: "Retreat counter", duration: "0:53", url: "https://www.youtube.com/watch?v=EKbQZ_C6v6c" },
  angle: { title: "Angle exit", duration: "1:59", url: "https://www.youtube.com/watch?v=2CSRZvbkxAI" },
  shadow: { title: "Shadow kumite", duration: "1:51", url: "https://www.youtube.com/watch?v=QY7pJkrGoL4" }
};

const app = document.querySelector("#app");
let state = loadState();
let route = "today";
let toastTimer;
let sessionTimer;
let timerSeconds = 0;
let pushExportJson = "";
let pushSetupCode = "";
let pushStatus = "";

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      ...DEFAULT_STATE,
      ...parsed,
      pain: { ...DEFAULT_STATE.pain, ...(parsed?.pain || {}) },
      skipReason: { ...DEFAULT_STATE.skipReason, ...(parsed?.skipReason || {}) },
      logs: parsed?.logs || []
    };
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
  const screen = route === "progress" ? renderProgress() : route === "insights" ? renderInsights() : route === "notifications" ? renderNotifications() : route === "plan" ? renderPlan() : renderToday();
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
        <p class="subtle">${completedToday ? "You can update today’s entry, but the app will not create duplicate logs for this card." : skippedToday ? "Continue with the next scheduled card. Update only if the situation changed." : card.reason}</p>
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
          ${renderList(card.full, card)}
        </div>
        <div class="card">
          <h2>Minimum version</h2>
          ${renderList(card.minimum, card)}
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

function renderReviewInputs(card = currentCard(), prefix = "") {
  const isSunday = card.key === "sunday-review";
  return `
    <div class="input-grid">
      <label class="field-label" for="${prefix}weight">Weight <span>${isSunday ? "current bodyweight in kg" : "optional"}</span></label>
      <input id="${prefix}weight" data-weight inputmode="decimal" autocomplete="off" placeholder="94.0" value="${escapeHtml(state.weight || "")}" />
    </div>
    ${renderPainSliders(prefix)}
    <div class="slider-row energy-row">
      <label for="${prefix}energy">Energy</label>
      <span class="value" id="${prefix}value-energy">${state.energy ?? 7}</span>
      <input id="${prefix}energy" data-energy type="range" min="0" max="10" step="1" value="${state.energy ?? 7}" />
    </div>
    <label class="eyebrow" for="${prefix}note">${isSunday ? "Best kumite feeling" : "What felt sharp?"}</label>
    <textarea id="${prefix}note" data-note maxlength="140" placeholder="e.g. kizami timing">${escapeHtml(state.note || "")}</textarea>
    ${renderSkipReasonInputs(prefix)}`;
}

function renderSkipReasonInputs(prefix = "") {
  const category = state.skipReason?.category || "";
  const text = state.skipReason?.text || "";
  const options = [
    ["", "No skip reason"],
    ["holiday", "Holiday"],
    ["rest", "Rest / recovery"],
    ["injury", "Injury / pain"],
    ["busy", "Busy / travel"],
    ["other", "Other"]
  ];
  return `
    <div class="skip-reason" aria-label="Optional skip reason">
      <label class="field-label" for="${prefix}skip-reason-category">Skip reason <span>only used for SKIPPED logs</span></label>
      <select id="${prefix}skip-reason-category" data-skip-reason-category>
        ${options.map(([value, label]) => `<option value="${value}" ${category === value ? "selected" : ""}>${label}</option>`).join("")}
      </select>
      <input id="${prefix}skip-reason-text" data-skip-reason-text type="text" maxlength="80" autocomplete="off" placeholder="Optional detail, e.g. Pentecost holiday" value="${escapeHtml(text)}" />
    </div>`;
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

function metricPoints(logs, selector) {
  return logs
    .map(log => ({ date: new Date(log.date), value: selector(log), log }))
    .filter(point => point.date.toString() !== "Invalid Date" && Number.isFinite(point.value))
    .sort((a, b) => a.date - b.date);
}

function exportPayload(logs = state.logs) {
  return {
    app: "karate-cockpit",
    version: 1,
    storageKey: STORAGE_KEY,
    exportedAt: new Date().toISOString(),
    logCount: logs.length,
    logs
  };
}

function exportLogsAsJson(logs = state.logs) {
  return JSON.stringify(exportPayload(logs), null, 2);
}

function csvEscape(value) {
  if (value === undefined || value === null) return "";
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function skipReasonCategory(log) {
  if (!log?.skipReason) return "";
  if (typeof log.skipReason === "string") return log.skipReason;
  return log.skipReason.category || "";
}

function skipReasonText(log) {
  if (!log?.skipReason || typeof log.skipReason === "string") return "";
  return log.skipReason.text || "";
}

function exportLogsAsCsv(logs = state.logs) {
  const columns = [
    "id", "date", "card", "type", "readiness", "pain_knees", "pain_achilles", "pain_hips", "pain_lower_back", "sparring", "weight", "energy", "note", "skip_reason_category", "skip_reason_text"
  ];
  const rows = logs.map(log => [
    log.id,
    log.date,
    log.card,
    log.type,
    log.readiness,
    log.pain?.knees,
    log.pain?.achilles,
    log.pain?.hips,
    log.pain?.lowerBack,
    log.sparring,
    log.weight,
    log.energy,
    log.note,
    skipReasonCategory(log),
    skipReasonText(log)
  ]);
  return [columns, ...rows].map(row => row.map(csvEscape).join(",")).join("\n");
}

function downloadTrainingData(format) {
  const isCsv = format === "csv";
  const content = isCsv ? exportLogsAsCsv() : exportLogsAsJson();
  const blob = new Blob([content], { type: isCsv ? "text/csv;charset=utf-8" : "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `karate-cockpit-logs-${localDateKey()}.${isCsv ? "csv" : "json"}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  showToast(`${isCsv ? "CSV" : "JSON"} export ready.`);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function chartBounds(points, fixedMin = null, fixedMax = null) {
  if (!points.length) return { min: fixedMin ?? 0, max: fixedMax ?? 10 };
  const values = points.map(point => point.value);
  let min = fixedMin ?? Math.min(...values);
  let max = fixedMax ?? Math.max(...values);
  if (min === max) {
    const padding = fixedMin === null && fixedMax === null ? 1 : 0.8;
    min -= padding;
    max += padding;
  }
  return { min, max };
}

function renderSparkChart({ title, subtitle, points, unit = "", tone = "accent", min = null, max = null }) {
  const chartWidth = 320;
  const chartHeight = 164;
  const padX = 24;
  const padTop = 24;
  const padBottom = 34;
  const plotWidth = chartWidth - padX * 2;
  const plotHeight = chartHeight - padTop - padBottom;
  const bounds = chartBounds(points, min, max);
  const scaleX = index => points.length <= 1 ? chartWidth / 2 : padX + (index / (points.length - 1)) * plotWidth;
  const scaleY = value => padTop + (1 - ((clamp(value, bounds.min, bounds.max) - bounds.min) / (bounds.max - bounds.min))) * plotHeight;
  const polyline = points.map((point, index) => `${scaleX(index).toFixed(1)},${scaleY(point.value).toFixed(1)}`).join(" ");
  const latestPoint = points.length ? points[points.length - 1] : null;
  const oldestPoint = points.length ? points[0] : null;
  const delta = points.length >= 2 ? latestPoint.value - oldestPoint.value : null;
  const latest = latestPoint ? `${latestPoint.value.toFixed(unit === "kg" ? 1 : 0)}${unit ? ` ${unit}` : ""}` : "—";
  const direction = delta === null ? "First marker" : `${delta >= 0 ? "+" : ""}${delta.toFixed(unit === "kg" ? 1 : 0)}${unit ? ` ${unit}` : ""}`;
  return `
    <article class="chart-card ${tone}" data-chart="${escapeHtml(title.toLowerCase().replace(/\s+/g, "-"))}">
      <div class="chart-head">
        <div><h2>${title}</h2><p class="subtle">${subtitle}</p></div>
        <div class="chart-stat"><strong>${latest}</strong><span>${direction}</span></div>
      </div>
      ${points.length ? `
        <svg class="trend-svg" viewBox="0 0 ${chartWidth} ${chartHeight}" role="img" aria-label="${escapeHtml(title)} trend chart with ${points.length} datapoint${points.length === 1 ? "" : "s"}">
          <path class="grid-line" d="M${padX} ${padTop}H${chartWidth - padX}M${padX} ${padTop + plotHeight / 2}H${chartWidth - padX}M${padX} ${padTop + plotHeight}H${chartWidth - padX}" />
          ${points.length > 1 ? `<polyline class="trend-line" points="${polyline}" />` : ""}
          ${points.map((point, index) => `<circle class="trend-dot" cx="${scaleX(index).toFixed(1)}" cy="${scaleY(point.value).toFixed(1)}" r="${points.length === 1 ? 7 : 5}" />`).join("")}
          ${points.length === 1 ? `<text class="first-marker" x="${chartWidth / 2}" y="${chartHeight - 10}" text-anchor="middle">first marker · keep logging</text>` : ""}
          <text class="axis-label" x="${padX}" y="${chartHeight - 10}">${formatChartDate(oldestPoint.date)}</text>
          ${points.length > 1 ? `<text class="axis-label" x="${chartWidth - padX}" y="${chartHeight - 10}" text-anchor="end">${formatChartDate(latestPoint.date)}</text>` : ""}
        </svg>` : `<div class="chart-empty"><strong>No datapoint yet</strong><span>Log one check-in and this becomes your first marker.</span></div>`}
    </article>`;
}

function formatChartDate(date) {
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

function consistencyDays(logs, days = 14) {
  const result = [];
  const byDay = logs.reduce((acc, log) => {
    const key = localDateKey(log.date);
    if (!acc[key] || ["DONE", "MINIMUM"].includes(log.type)) acc[key] = log;
    return acc;
  }, {});
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - i);
    const key = localDateKey(date);
    const log = byDay[key];
    result.push({ key, date, log, complete: ["DONE", "MINIMUM"].includes(log?.type) });
  }
  return result;
}

function renderConsistencyChart(logs) {
  const days = consistencyDays(logs, 14);
  const done = days.filter(day => day.complete).length;
  const streak = days.reduceRight((count, day) => day.complete && count === days.length - 1 - days.indexOf(day) ? count + 1 : count, 0);
  return `
    <article class="chart-card consistency" data-chart="consistency">
      <div class="chart-head">
        <div><h2>Consistency</h2><p class="subtle">Last 14 days: done/minimum beats perfect.</p></div>
        <div class="chart-stat"><strong>${done}/14</strong><span>${streak ? `${streak}d streak` : "start today"}</span></div>
      </div>
      <div class="consistency-grid" aria-label="14 day consistency chart">
        ${days.map(day => `<span class="consistency-cell ${day.complete ? "complete" : day.log?.type === "SKIPPED" ? "skipped" : "empty"}" title="${day.key}">${day.date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1)}</span>`).join("")}
      </div>
    </article>`;
}

function renderReadinessBars(logs) {
  const stats = readinessStats(logs, 14);
  const total = Math.max(1, stats.green + stats.yellow + stats.red);
  const pct = value => `${Math.max(8, (value / total) * 100).toFixed(1)}%`;
  return `
    <article class="chart-card readiness-visual" data-chart="readiness">
      <div class="chart-head">
        <div><h2>Readiness mix</h2><p class="subtle">Green should grow without hiding yellow/red signals.</p></div>
        <div class="chart-stat"><strong>${stats.green}/${stats.yellow}/${stats.red}</strong><span>G/Y/R · 14d</span></div>
      </div>
      <div class="readiness-bars" aria-label="Readiness distribution chart">
        <span class="bar green" style="width:${pct(stats.green)}"><b>${stats.green}</b></span>
        <span class="bar yellow" style="width:${pct(stats.yellow)}"><b>${stats.yellow}</b></span>
        <span class="bar red" style="width:${pct(stats.red)}"><b>${stats.red}</b></span>
      </div>
    </article>`;
}

function renderDataExportCard(logs = state.logs) {
  return `
    <section class="card export-card" style="margin-top:16px">
      <h2>Data export</h2>
      <p class="subtle">Download all local training logs for later analysis. JSON preserves the raw log objects; CSV flattens pain and skip-reason fields.</p>
      <div class="readiness-strip export-stats" style="margin-top:12px">
        <div class="metric"><strong>${logs.length}</strong><span>Total logs</span></div>
        <div class="metric"><strong>${logs.filter(log => log.type === "SKIPPED").length}</strong><span>Skipped</span></div>
        <div class="metric"><strong>${logs.filter(log => formatSkipReason(log)).length}</strong><span>With reason</span></div>
      </div>
      <div class="actions export-actions" style="margin-top:14px">
        <button class="btn primary" data-export-format="json" ${logs.length ? "" : "disabled"}>Export JSON</button>
        <button class="btn secondary" data-export-format="csv" ${logs.length ? "" : "disabled"}>Export CSV</button>
      </div>
    </section>`;
}


function renderPainSliders(prefix = "") {
  const labels = [
    ["knees", "Knees"],
    ["achilles", "Achilles"],
    ["hips", "Hips"],
    ["lowerBack", "Lower back"]
  ];
  return `<div class="slider-grid">${labels.map(([key, label]) => `
    <div class="slider-row">
      <label for="${prefix}pain-${key}">${label}</label>
      <span class="value" id="${prefix}value-${key}">${state.pain[key]}</span>
      <input id="${prefix}pain-${key}" data-pain="${key}" type="range" min="0" max="10" step="1" value="${state.pain[key]}" />
    </div>`).join("")}</div>`;
}

function diagramKeyForItem(item, card = currentCard()) {
  if (card.key === "sunday-review") return "";
  const text = item.toLowerCase();
  if (text.includes("ankle")) return "ankle";
  if (text.includes("calf")) return "calf";
  if (text.includes("spanish squat") || text.includes("wall sit") || text.includes("goblet squat")) return "squat";
  if (text.includes("90/90") || text.includes("hip switches")) return "hip";
  if (text.includes("hip flexor") || text.includes("couch stretch")) return "stretch";
  if (text.includes("bird dog")) return "birdDog";
  if (text.includes("karate class") || text.includes("sparring")) return "karate";
  if (text.includes("zone 2") || text.includes("cardio") || text.includes("bike") || text.includes("elliptical") || text.includes("rower")) return "cardio";
  if (text.includes("walk")) return "walk";
  if (text.includes("mobility") || text.includes("warm-up") || text.includes("easy movement") || text.includes("joint prep")) return "mobility";
  if (text.includes("breathing")) return "breath";
  if (text.includes("romanian deadlift")) return "hinge";
  if (text.includes("split squat")) return "squat";
  if (text.includes("push-up")) return "pushup";
  if (text.includes("row")) return "row";
  if (text.includes("side plank")) return "plank";
  if (text.includes("tibialis")) return "tibialis";
  if (text.includes("kamae bounce")) return "stance";
  if (text.includes("step-in") || text.includes("step-out")) return "step";
  if (text.includes("kizami")) return "punch";
  if (text.includes("retreat")) return "counter";
  if (text.includes("angle exit")) return "angle";
  if (text.includes("shadow kumite")) return "shadow";
  return "";
}

function renderExerciseDiagram(item, card = currentCard()) {
  const key = diagramKeyForItem(item, card);
  const paths = key ? DIAGRAM_PATHS[key] : "";
  if (!paths) return "";
  return `<span class="diagram-shell" aria-hidden="true"><svg class="exercise-diagram" viewBox="0 0 64 64" focusable="false">${paths}</svg></span>`;
}

function demoKeyForItem(item, card = currentCard()) {
  if (card.key === "sunday-review") return "";
  const text = item.toLowerCase();
  if (text.includes("no make-up") || text.includes("skip without debt") || text.includes("attend lightly")) return "";
  if (text.includes("ankle")) return "ankle";
  if (text.includes("tibialis")) return "tibialis";
  if (text.includes("calf")) return "calf";
  if (text.includes("spanish squat") || text.includes("wall sit")) return "spanishSquat";
  if (text.includes("goblet squat")) return "gobletSquat";
  if (text.includes("split squat")) return "splitSquat";
  if (text.includes("90/90") || text.includes("hip switches")) return "hipSwitch";
  if (text.includes("hip flexor") || text.includes("couch stretch")) return "couchStretch";
  if (text.includes("bird dog")) return "birdDog";
  if (text.includes("zone 2") || text.includes("cardio") || text.includes("bike") || text.includes("elliptical") || text.includes("rower") || text.includes("breathing")) return "zone2";
  if (text.includes("mobility") || text.includes("warm-up") || text.includes("easy movement") || text.includes("joint prep")) return "mobility";
  if (text.includes("romanian deadlift")) return "rdl";
  if (text.includes("push-up")) return "pushup";
  if (text.includes("row")) return "row";
  if (text.includes("side plank")) return "plank";
  if (text.includes("kamae bounce") || text.includes("karate class") || text.includes("sparring")) return "stance";
  if (text.includes("step-in") || text.includes("step-out")) return "step";
  if (text.includes("kizami")) return "punch";
  if (text.includes("retreat")) return "counter";
  if (text.includes("angle exit")) return "angle";
  if (text.includes("shadow kumite")) return "shadow";
  return "";
}

function renderDemoLink(item, card = currentCard()) {
  const key = demoKeyForItem(item, card);
  const demo = key ? DEMO_LINKS[key] : null;
  if (!demo) return "";
  return `<a class="demo-link" href="${demo.url}" target="_blank" rel="noopener noreferrer" aria-label="Watch ${escapeHtml(demo.title)} demo on YouTube">Watch ${escapeHtml(demo.title)} <span>${demo.duration}</span></a>`;
}

function renderListItem(item, index, card = currentCard()) {
  const diagram = renderExerciseDiagram(item, card);
  const demo = renderDemoLink(item, card);
  return `<li class="${diagram ? "has-diagram" : "no-diagram"}" data-index="${index + 1}">${diagram}<div class="exercise-copy"><span>${escapeHtml(item)}</span>${demo}</div></li>`;
}

function renderList(items, card = currentCard()) {
  return `<ol class="exercise-list">${items.map((item, index) => renderListItem(item, index, card)).join("")}</ol>`;
}

function renderSessionItem(item, card = currentCard()) {
  const diagram = renderExerciseDiagram(item, card);
  const demo = renderDemoLink(item, card);
  return `<div class="check-item ${diagram ? "has-diagram" : "no-diagram"}"><input type="checkbox" aria-label="${escapeHtml(item)}" />${diagram}<div class="exercise-copy"><span>${escapeHtml(item)}</span>${demo}</div></div>`;
}

function renderInsights() {
  const logs = state.logs;
  const weightPoints = metricPoints(logs, log => numericWeight(log.weight));
  const painPoints = metricPoints(logs, log => log.pain ? maxPain(log.pain) : null);
  const energyPoints = metricPoints(logs, log => Number(log.energy));
  const avgPain = averagePain(logs, 7);
  const avgEnergy = averageEnergy(logs, 7);
  return `
    <main class="screen" data-screen="insights">
      ${renderTopbar("Insights", "On-demand charts from local check-ins.")}
      <section class="insight-hero">
        <button class="btn ghost small" data-route="progress">← Analytics</button>
        <div>
          <p class="eyebrow">Visual cockpit</p>
          <h2>Signals, not clutter.</h2>
          <p class="subtle">Every chart is generated from <code>${STORAGE_KEY}</code>. One datapoint creates a first marker; trend lines appear as the log grows.</p>
        </div>
      </section>
      <section class="chart-stack" aria-label="Coaching visualizations">
        ${renderSparkChart({ title: "Weight trend", subtitle: "Bodyweight direction, not daily noise.", points: weightPoints, unit: "kg", tone: "weight" })}
        ${renderSparkChart({ title: "Pain trend", subtitle: `Max joint pain · 7-log avg ${avgPain.toFixed(1)}/10.`, points: painPoints, unit: "/10", tone: "pain", min: 0, max: 10 })}
        ${renderSparkChart({ title: "Energy trend", subtitle: `Readiness energy · avg ${avgEnergy === null ? "—" : avgEnergy.toFixed(1)}/10.`, points: energyPoints, unit: "/10", tone: "energy", min: 0, max: 10 })}
        ${renderConsistencyChart(logs)}
        ${renderReadinessBars(logs)}
      </section>
    </main>`;
}


function renderNotifications() {
  const capability = pushCapability();
  const permission = typeof Notification === "undefined" ? "unavailable" : Notification.permission;
  const installLabel = capability.standalone ? "Installed as Home Screen app" : "Open in Safari → Share → Add to Home Screen";
  const supportTone = capability.ready ? "green" : "yellow";
  const supportText = capability.ready ? "Ready for native Web Push setup." : capability.reason;
  return `
    <main class="screen" data-screen="notifications">
      ${renderTopbar("Notifications", "Native iOS reminders without Cloudflare.")}
      <section class="hero notification-hero">
        <div class="hero-meta">
          <span class="pill ${supportTone}">${capability.ready ? "PUSH READY" : "SETUP NEEDED"}</span>
          <span class="pill">Permission: ${permission}</span>
        </div>
        <h2 class="command">One-time iPhone push setup.</h2>
        <p class="subtle">iOS only allows Web Push after this site is added to the Home Screen and opened as the installed PWA. After permission, copy the setup code into the GitHub Secret <code>IOS_PUSH_SUBSCRIPTION</code>.</p>
      </section>

      <section class="stack" style="margin-top:16px">
        <div class="card accent-card">
          <h2>1 · Install check</h2>
          <div class="readiness-strip">
            <div class="metric"><strong>${capability.secure ? "YES" : "NO"}</strong><span>HTTPS / secure</span></div>
            <div class="metric"><strong>${capability.push ? "YES" : "NO"}</strong><span>Push API</span></div>
            <div class="metric"><strong>${capability.standalone ? "YES" : "NO"}</strong><span>Home Screen</span></div>
          </div>
          <p class="subtle" style="margin-top:12px">${installLabel}. ${supportText}</p>
        </div>

        <div class="card notification-card">
          <h2>2 · Create subscription</h2>
          <p class="subtle">This asks iOS for notification permission, subscribes this iPhone to the app’s public VAPID key, then creates an export code. No private VAPID key or GitHub token enters the app.</p>
          <div class="actions" style="margin-top:14px">
            <button class="btn primary" data-push-subscribe>${pushExportJson ? "Refresh setup code" : "Allow notifications"}</button>
            <button class="btn secondary" data-push-copy ${pushSetupCode ? "" : "disabled"}>Copy setup code</button>
          </div>
          ${pushStatus ? `<p class="push-status">${escapeHtml(pushStatus)}</p>` : ""}
        </div>

        <div class="card export-card">
          <h2>3 · Save in GitHub Secret</h2>
          <p class="subtle">Secret name: <code>IOS_PUSH_SUBSCRIPTION</code>. Value: setup code below. Keep it out of committed files.</p>
          <textarea class="subscription-export" readonly placeholder="Setup code appears here after subscribing.">${escapeHtml(pushSetupCode)}</textarea>
          <details>
            <summary>Show raw subscription JSON</summary>
            <textarea class="subscription-export raw" readonly>${escapeHtml(pushExportJson)}</textarea>
          </details>
        </div>

        <div class="card">
          <h2>What you’ll receive</h2>
          ${renderList(["Karate prep reminders on Monday/Friday mornings", "Recovery, strength, footwork, optional engine, and Sunday review nudges", "A tap opens Karate Cockpit directly at the public app URL"])}
          <button class="btn ghost" style="margin-top:14px" data-route="plan">Back to plan</button>
        </div>
      </section>
    </main>`;
}

function pushCapability() {
  const currentLocation = globalThis.location || window.location || {};
  const secure = Boolean(window.isSecureContext || currentLocation.protocol === "https:" || currentLocation.hostname === "localhost" || currentLocation.hostname === "127.0.0.1");
  const serviceWorker = "serviceWorker" in navigator;
  const notification = "Notification" in window;
  const push = "PushManager" in window;
  const standalone = Boolean(navigator.standalone || window.matchMedia?.("(display-mode: standalone)").matches);
  let reason = "Native Web Push needs HTTPS, service workers, Push API, and notification permission.";
  if (!secure) reason = "Open the GitHub Pages HTTPS URL before subscribing.";
  else if (!serviceWorker) reason = "This browser does not expose service workers.";
  else if (!notification || !push) reason = "This browser does not expose Web Push. On iPhone use iOS 16.4+ Safari and the Home Screen app.";
  else if (!standalone) reason = "On iPhone, add Karate Cockpit to the Home Screen and open that icon before allowing notifications.";
  return { secure, serviceWorker, notification, push, standalone, ready: secure && serviceWorker && notification && push, reason };
}

async function setupPushNotifications() {
  const capability = pushCapability();
  if (!capability.ready) {
    pushStatus = capability.reason;
    render();
    showToast("Notification setup needs the installed PWA.");
    return;
  }
  if (!VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY.includes("REPLACE")) {
    pushStatus = "VAPID public key is not configured.";
    render();
    return;
  }
  try {
    const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
    if (permission !== "granted") {
      pushStatus = `Permission is ${permission}. Enable notifications in iOS Settings if you denied it.`;
      render();
      return;
    }
    const registration = await navigator.serviceWorker.register("./sw.js");
    await registration.update().catch(() => {});
    const readyRegistration = await navigator.serviceWorker.ready;
    const existing = await readyRegistration.pushManager.getSubscription();
    const subscription = existing || await readyRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    const exportObject = {
      app: "karate-cockpit",
      version: 1,
      createdAt: new Date().toISOString(),
      appUrl: APP_URL,
      subscription: subscription.toJSON()
    };
    pushExportJson = JSON.stringify(exportObject, null, 2);
    pushSetupCode = btoa(unescape(encodeURIComponent(JSON.stringify(exportObject))));
    pushStatus = existing ? "Existing subscription found. Setup code refreshed." : "Subscribed. Setup code ready to copy.";
    render();
    await copyPushSetupCode(false);
  } catch (error) {
    pushStatus = `Setup failed: ${error?.message || "unknown error"}`;
    render();
  }
}

async function copyPushSetupCode(showCopiedToast = true) {
  if (!pushSetupCode) return;
  try {
    if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
    await navigator.clipboard.writeText(pushSetupCode);
    showToast(showCopiedToast ? "Setup code copied." : "Subscribed and copied.");
  } catch {
    showToast("Setup code ready — copy it manually.");
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = globalThis.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
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
        <div class="actions" style="margin-top:14px">
          <button class="btn primary" data-route="insights">Open charts</button>
          <button class="btn secondary" data-route="notifications">iPhone notifications</button>
        </div>
      </section>
      ${renderDataExportCard(logs)}
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
      <section class="card notify-entry" style="margin-top:16px">
        <div>
          <p class="eyebrow">iPhone native push</p>
          <h2>Reminder setup</h2>
          <p class="subtle">Optional one-time Home Screen PWA setup. Exports a private device subscription for GitHub Actions — never stores it in public app files.</p>
        </div>
        <button class="btn primary" data-route="notifications">Set up notifications</button>
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
  return `<nav class="bottom-nav" aria-label="Primary">${items.map(([key, label]) => {
    const active = route === key || (["insights", "notifications"].includes(route) && key === "progress");
    return `<button class="nav-btn" data-route="${key}" aria-current="${active ? "page" : "false"}">${label}</button>`;
  }).join("")}</nav>`;
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
  const note = document.querySelector("[data-note]");
  if (note) note.addEventListener("input", () => {
    state.note = note.value.trim();
    saveState();
  });
  const weight = document.querySelector("[data-weight]");
  if (weight) weight.addEventListener("input", () => {
    state.weight = weight.value.trim();
    saveState();
  });
  const energy = document.querySelector("[data-energy]");
  if (energy) energy.addEventListener("input", () => {
    state.energy = Number(energy.value);
    const value = document.querySelector("#value-energy");
    if (value) value.textContent = energy.value;
    saveState();
  });
  const skipCategory = document.querySelector("[data-skip-reason-category]");
  if (skipCategory) ["input", "change"].forEach(eventName => skipCategory.addEventListener(eventName, () => {
    state.skipReason = { ...(state.skipReason || {}), category: skipCategory.value };
    saveState();
  }));
  const skipText = document.querySelector("[data-skip-reason-text]");
  if (skipText) skipText.addEventListener("input", () => {
    state.skipReason = { ...(state.skipReason || {}), text: skipText.value.trim() };
    saveState();
  });
  document.querySelectorAll("[data-log]").forEach(button => button.addEventListener("click", () => logSession(button.dataset.log)));
  document.querySelectorAll("[data-start]").forEach(button => button.addEventListener("click", () => openSession(button.dataset.start)));
  document.querySelectorAll("[data-export-format]").forEach(button => button.addEventListener("click", () => downloadTrainingData(button.dataset.exportFormat)));
  document.querySelector("[data-push-subscribe]")?.addEventListener("click", setupPushNotifications);
  document.querySelector("[data-push-copy]")?.addEventListener("click", copyPushSetupCode);
  document.querySelectorAll(".demo-link").forEach(link => {
    link.addEventListener("click", event => event.stopPropagation());
    link.addEventListener("pointerdown", event => event.stopPropagation());
  });
}

function currentSkipReason() {
  const category = state.skipReason?.category || "";
  const text = state.skipReason?.text || "";
  if (!category && !text) return null;
  return { category: category || "other", text };
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
  const skipReason = type === "SKIPPED" ? currentSkipReason() : null;
  if (skipReason) log.skipReason = skipReason;
  const todayKey = localDateKey();
  state.logs = state.logs.filter(existing => !(existing.card === log.card && sameLocalDay(existing.date, todayKey)));
  state.logs = [log, ...state.logs];
  if (type === "SKIPPED") state.readiness = state.readiness === "GREEN" ? "YELLOW" : state.readiness;
  state.note = "";
  state.skipReason = { category: "", text: "" };
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
        ${items.map(item => renderSessionItem(item, card)).join("")}
      </div>
      ${renderSkipReasonInputs("session-")}
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
  overlay.querySelector("[data-skip-reason-category]")?.addEventListener("input", event => { state.skipReason = { ...(state.skipReason || {}), category: event.target.value }; saveState(); });
  overlay.querySelector("[data-skip-reason-category]")?.addEventListener("change", event => { state.skipReason = { ...(state.skipReason || {}), category: event.target.value }; saveState(); });
  overlay.querySelector("[data-skip-reason-text]")?.addEventListener("input", event => { state.skipReason = { ...(state.skipReason || {}), text: event.target.value.trim() }; saveState(); });
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
        ${renderReviewInputs(card, "session-")}
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
    const value = overlay.querySelector(`#session-value-${key}`);
    if (value) value.textContent = input.value;
    saveState();
  }));
  overlay.querySelector("[data-weight]")?.addEventListener("input", event => { state.weight = event.target.value.trim(); saveState(); });
  overlay.querySelector("[data-energy]")?.addEventListener("input", event => {
    state.energy = Number(event.target.value);
    const value = overlay.querySelector("#session-value-energy");
    if (value) value.textContent = event.target.value;
    saveState();
  });
  overlay.querySelector("[data-note]")?.addEventListener("input", event => { state.note = event.target.value.trim(); saveState(); });
  overlay.querySelector("[data-skip-reason-category]")?.addEventListener("input", event => { state.skipReason = { ...(state.skipReason || {}), category: event.target.value }; saveState(); });
  overlay.querySelector("[data-skip-reason-category]")?.addEventListener("change", event => { state.skipReason = { ...(state.skipReason || {}), category: event.target.value }; saveState(); });
  overlay.querySelector("[data-skip-reason-text]")?.addEventListener("input", event => { state.skipReason = { ...(state.skipReason || {}), text: event.target.value.trim() }; saveState(); });
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
  const reason = formatSkipReason(log);
  if (reason) parts.push(`skip: ${reason}`);
  if (log.note) parts.push(log.note);
  return parts.join(" · ");
}

function formatLogLine(log) {
  const date = new Date(log.date);
  const reason = formatSkipReason(log);
  return `${date.toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" })} · ${log.readiness} · ${formatPain(log.pain)}${reason ? ` · skip: ${reason}` : ""}`;
}

function formatSkipReason(log) {
  const category = skipReasonCategory(log);
  const text = skipReasonText(log);
  if (!category && !text) return "";
  const labels = { holiday: "Holiday", rest: "Rest", injury: "Injury", busy: "Busy", other: "Other" };
  return [labels[category] || category, text].filter(Boolean).join(" — ");
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
