const STORAGE_KEY = "karate-cockpit-v1";
const APP_URL = "https://w7420028-creator.github.io/karate-cockpit/";
const VAPID_PUBLIC_KEY = "BH2EnekLiapo_ZR4OcV2GxrTgGSzrlhKnRuYh_-cmfYWQCMBHomzrQynEAWwHGrCEwZvwh2ANmpI21mw4OA0Bqs";

const CARDS = {
  0: {
    key: "sunday-review",
    shortDay: "SUN",
    label: "Weight + Review",
    command: "Weight and weekly recovery review.",
    time: "3 min",
    reason: "Log bodyweight, quick state, and one useful note for the next week."
  },
  1: {
    key: "monday-karate",
    shortDay: "MON",
    label: "Post-karate check",
    command: "After training: load check.",
    time: "30 sec",
    reason: "Log conditioning/cardio effort, strength effort, and any overload note."
  },
  2: {
    key: "tuesday-recovery",
    shortDay: "TUE",
    label: "Recovery check",
    command: "Check soreness before adding anything.",
    time: "30 sec",
    reason: "Track muscle soreness, stiffness, and today’s sensible recovery choice."
  },
  3: {
    key: "wednesday-strength",
    shortDay: "WED",
    label: "Recovery check",
    command: "Muscle state decides the day.",
    time: "30 sec",
    reason: "Track soreness/stiffness first; only train normally if recovery is green."
  },
  4: {
    key: "thursday-footwork",
    shortDay: "THU",
    label: "Recovery check",
    command: "Leg state first.",
    time: "30 sec",
    reason: "Track soreness/stiffness before any light movement."
  },
  5: {
    key: "friday-karate",
    shortDay: "FRI",
    label: "Post-karate check",
    command: "After training: load check.",
    time: "30 sec",
    reason: "Log conditioning/cardio effort, strength effort, and where the body feels overloaded."
  },
  6: {
    key: "saturday-optional",
    shortDay: "SAT",
    label: "Recovery check",
    command: "Recovery first.",
    time: "30 sec",
    reason: "Track soreness, stiffness, sleep, and weight before deciding how much the day can handle."
  }
};

const DEFAULT_STATE = {
  readiness: "GREEN",
  trainingLoad: { cardio: 0, strength: 0 },
  recovery: { areas: [], soreness: 0, stiffness: 0, recommendation: "normal" },
  sleepHours: "",
  weight: "",
  waistCm: "",
  note: "",
  skipReason: { category: "", text: "" },
  logs: []
};

const app = document.querySelector("#app");
let state = loadState();
let route = "today";
let toastTimer;
let pushExportJson = "";
let pushSetupCode = "";
let pushStatus = "";

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      ...DEFAULT_STATE,
      ...parsed,
      trainingLoad: { ...DEFAULT_STATE.trainingLoad, ...(parsed?.trainingLoad || {}) },
      recovery: {
        ...DEFAULT_STATE.recovery,
        ...(parsed?.recovery || {}),
        areas: Array.isArray(parsed?.recovery?.areas) ? parsed.recovery.areas : []
      },
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

function currentCard() {
  return CARDS[dayKey()];
}

function readinessClass(value = state.readiness) {
  return value.toLowerCase();
}

function suggestedReadiness() {
  return ["GREEN", "YELLOW", "RED"].includes(state.readiness) ? state.readiness : "GREEN";
}

function isKarateCheckin(card = currentCard()) {
  return ["monday-karate", "friday-karate"].includes(card.key);
}

function isRecoveryCheckin(card = currentCard()) {
  return card.key !== "sunday-review" && !isKarateCheckin(card);
}

function recoveryRecommendation(recovery = state.recovery) {
  const max = Math.max(Number(recovery.soreness) || 0, Number(recovery.stiffness) || 0);
  if (state.readiness === "RED" || max >= 7) return "pause";
  if (max >= 5) return "mobility";
  if (state.readiness === "YELLOW" || max >= 3) return "reduced";
  return "normal";
}

function recoveryReadiness(recovery = state.recovery) {
  const recommendation = recoveryRecommendation(recovery);
  if (recommendation === "pause") return "RED";
  if (["mobility", "reduced"].includes(recommendation)) return "YELLOW";
  return suggestedReadiness();
}

function checkinReadiness(card = currentCard()) {
  return isRecoveryCheckin(card) ? recoveryReadiness() : suggestedReadiness();
}

function render() {
  if (route === "plan") route = "today";
  const screen = route === "progress" ? renderProgress() : route === "insights" ? renderInsights() : route === "notifications" ? renderNotifications() : renderToday();
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
  const lastLog = state.logs[0];
  const todaysLog = todayLog(card);
  const completedToday = isCompletedLog(todaysLog);
  const skippedToday = todaysLog?.type === "SKIPPED";
  return `
    <main class="screen" data-screen="today">
      ${renderTopbar("Today", "Local check-in tracking")}
      <section class="hero">
        <div class="hero-meta">
          <span class="pill accent">${card.shortDay}</span>
          <span class="pill">${card.time}</span>
          <span class="pill">${card.label}</span>
        </div>
        <h2 class="command">${completedToday ? "Completed today." : skippedToday ? "Skipped today. No debt." : card.command}</h2>
        <p class="subtle">${completedToday ? "You can update today’s entry, but the app will not create duplicate logs for this card." : skippedToday ? "Continue with the next scheduled card. Update only if the situation changed." : card.reason}</p>
        ${todaysLog ? `<div class="today-status ${todaysLog.type.toLowerCase()}"><strong>${todaysLog.type}</strong><span>${formatLogLine(todaysLog)}</span></div>` : ""}
        ${completedToday ? `<div class="actions wide"><button class="btn secondary" data-route="progress">View analytics</button></div>` : ""}
      </section>

      <section class="stack" style="margin-top:16px">
        ${lastLog ? `<div class="card compact"><span class="pill ${readinessClass(lastLog.readiness)}">Last: ${lastLog.type}</span><p class="subtle" style="margin:10px 0 0">${formatLogLine(lastLog)}</p></div>` : ""}
        <div class="card accent-card">
          <h2>Quick state</h2>
          ${renderReadinessControl()}
        </div>
        <div class="card">
          <h2>${card.key === "sunday-review" ? "Sunday Review" : "30-sec check-in"}</h2>
          ${renderReviewInputs(card)}
          <div class="actions" style="margin-top:14px">
            <button class="btn primary" data-log="DONE">${completedToday ? "Update entry" : "Done"}</button>
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
  if (!isSunday) return isKarateCheckin(card) ? renderPostKarateInputs(prefix) : renderRecoveryInputs(prefix);
  return renderSundayReviewInputs(card, prefix);
}

function renderSundayReviewInputs(card = currentCard(), prefix = "") {
  const isSunday = card.key === "sunday-review";
  return `
    <div class="input-grid">
      <label class="field-label" for="${prefix}weight">Weight <span>${isSunday ? "current bodyweight in kg" : "optional"}</span></label>
      <input id="${prefix}weight" data-weight inputmode="decimal" autocomplete="off" placeholder="94.0" value="${escapeHtml(state.weight || "")}" />
      <label class="field-label" for="${prefix}waist-cm">Bauchumfang <span>weekly cm</span></label>
      <input id="${prefix}waist-cm" data-waist-cm inputmode="decimal" autocomplete="off" placeholder="104.0" value="${escapeHtml(state.waistCm || "")}" />
      <label class="field-label" for="${prefix}sleep-hours">Sleep hours <span>optional AutoSleep / Health</span></label>
      <input id="${prefix}sleep-hours" data-sleep-hours inputmode="decimal" autocomplete="off" placeholder="7.4" value="${escapeHtml(state.sleepHours || "")}" />
    </div>
    <label class="eyebrow" for="${prefix}note">Weekly review note</label>
    <textarea id="${prefix}note" data-note maxlength="140" placeholder="e.g. recovery good, Rücken settled, next week normal">${escapeHtml(state.note || "")}</textarea>
    ${renderSkipReasonInputs(prefix)}`;
}

function renderPostKarateInputs(prefix = "") {
  return `
    <div class="checkin-mode post-karate-check">
      <h2>Post-karate check</h2>
      <p class="subtle">After Monday/Friday training: log load, not a medical questionnaire.</p>
      <div class="slider-grid">
        ${renderLoadSlider("cardio", "Conditioning / cardio effort", prefix)}
        ${renderLoadSlider("strength", "Strength effort", prefix)}
      </div>
      <label class="eyebrow" for="${prefix}note">Karate fatigue / overload notes</label>
      <textarea id="${prefix}note" data-note maxlength="140" placeholder="Unterschenkel heavy, Rücken tight, Unterarme tired">${escapeHtml(state.note || "")}</textarea>
      ${renderOptionalRecoveryImports(prefix)}
      ${renderSkipReasonInputs(prefix)}
    </div>`;
}

function renderRecoveryInputs(prefix = "") {
  state.recovery.recommendation = recoveryRecommendation();
  return `
    <div class="checkin-mode recovery-check">
      <h2>Recovery check</h2>
      <p class="subtle">Between karate days: muscle soreness, stiffness, and today’s sensible training choice.</p>
      <div class="input-grid">
        <label class="field-label">Muscle soreness <span>tap areas</span></label>
        <div class="chip-grid" role="group" aria-label="Muscle soreness areas">
          ${["Unterschenkel", "Oberschenkel", "Bauch", "Rücken", "Oberarme", "Unterarme"].map(area => {
            const active = state.recovery.areas.includes(area);
            return `<button class="chip-btn" type="button" data-soreness-area="${escapeHtml(area)}" aria-pressed="${active}">${escapeHtml(area)}</button>`;
          }).join("")}
        </div>
      </div>
      <div class="slider-grid">
        ${renderRecoverySlider("soreness", "Soreness intensity", prefix)}
        ${renderRecoverySlider("stiffness", "Stiffness", prefix)}
      </div>
      <label class="field-label" for="${prefix}recovery-recommendation">Recommendation <span>auto-adjusts</span></label>
      <select id="${prefix}recovery-recommendation" data-recovery-recommendation>
        ${[["normal", "normal"], ["reduced", "reduced"], ["mobility", "mobility"], ["pause", "pause"]].map(([value, label]) => `<option value="${value}" ${state.recovery.recommendation === value ? "selected" : ""}>${label}</option>`).join("")}
      </select>
      ${renderOptionalRecoveryImports(prefix)}
      ${renderSkipReasonInputs(prefix)}
    </div>`;
}

function renderLoadSlider(key, label, prefix = "") {
  const value = state.trainingLoad?.[key] ?? 0;
  return `
    <div class="slider-row">
      <label for="${prefix}load-${key}">${label}</label>
      <span class="value" id="${prefix}value-load-${key}">${value}</span>
      <input id="${prefix}load-${key}" data-load="${key}" type="range" min="0" max="10" step="1" value="${value}" />
    </div>`;
}

function renderRecoverySlider(key, label, prefix = "") {
  const value = state.recovery?.[key] ?? 0;
  return `
    <div class="slider-row">
      <label for="${prefix}recovery-${key}">${label}</label>
      <span class="value" id="${prefix}value-recovery-${key}">${value}</span>
      <input id="${prefix}recovery-${key}" data-recovery="${key}" type="range" min="0" max="10" step="1" value="${value}" />
    </div>`;
}

function renderOptionalRecoveryImports(prefix = "") {
  return `
    <details class="optional-imports">
      <summary>Optional sleep / weight import</summary>
      <div class="optional-grid">
        <label class="field-label" for="${prefix}sleep-hours">Sleep hours <span>AutoSleep / Health</span></label>
        <input id="${prefix}sleep-hours" data-sleep-hours inputmode="decimal" autocomplete="off" placeholder="7.4" value="${escapeHtml(state.sleepHours || "")}" />
        <label class="field-label" for="${prefix}weight">Weight <span>optional</span></label>
        <input id="${prefix}weight" data-weight inputmode="decimal" autocomplete="off" placeholder="94.0" value="${escapeHtml(state.weight || "")}" />
      </div>
    </details>`;
}

function renderSkipReasonInputs(prefix = "") {
  const category = state.skipReason?.category || "";
  const text = state.skipReason?.text || "";
  const options = [
    ["", "No skip reason"],
    ["holiday", "Holiday"],
    ["rest", "Rest / recovery"],
    ["injury", "Injury / health"],
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

function numericWaist(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function measurementTrend(logs, selector, unit, fallbackValue = null, days = 30) {
  const points = logs
    .filter(log => selector(log) !== null)
    .map(log => ({ date: new Date(log.date), value: selector(log) }))
    .filter(point => point.date.toString() !== "Invalid Date")
    .sort((a, b) => a.date - b.date);
  const latestPoint = points.length ? points[points.length - 1] : null;
  const latest = latestPoint?.value ?? fallbackValue;
  const recent = points.filter(point => Date.now() - point.date.getTime() <= days * 24 * 60 * 60 * 1000);
  const basis = recent.length >= 2 ? recent : points;
  const deltaValue = basis.length >= 2 ? basis[basis.length - 1].value - basis[0].value : null;
  return {
    latest: latest === null || latest === undefined ? "" : latest.toFixed(1),
    delta: deltaValue === null ? "—" : `${deltaValue >= 0 ? "+" : ""}${deltaValue.toFixed(1)} ${unit}`,
    deltaValue,
    count: points.length,
    points
  };
}

function weightTrend(logs) {
  return measurementTrend(logs, log => numericWeight(log.weight), "kg", numericWeight(state.weight));
}

function waistTrend(logs) {
  return measurementTrend(logs, log => numericWaist(log.waistCm), "cm", numericWaist(state.waistCm));
}

function averageMetric(logs, selector, limit = 7) {
  const values = logs
    .map(selector)
    .map(value => Number(value))
    .filter(value => Number.isFinite(value) && value >= 0)
    .slice(0, limit);
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatAverage(value) {
  return value === null || value === undefined ? "—" : value.toFixed(1);
}

function karateLoadStats(logs, limit = 6) {
  const sample = logs.filter(log => log.trainingLoad).slice(0, limit);
  return {
    count: sample.length,
    avgCardio: averageMetric(sample, log => log.trainingLoad?.cardio, limit),
    avgStrength: averageMetric(sample, log => log.trainingLoad?.strength, limit)
  };
}

function recoveryStats(logs, limit = 7) {
  const sample = logs.filter(log => log.recovery).slice(0, limit);
  const recommendations = sample.reduce((acc, log) => {
    const key = log.recovery?.recommendation || "normal";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, { normal: 0, reduced: 0, mobility: 0, pause: 0 });
  const areas = [...new Set(sample.flatMap(log => log.recovery?.areas || []))].slice(0, 3);
  return {
    count: sample.length,
    avgSoreness: averageMetric(sample, log => log.recovery?.soreness, limit),
    avgStiffness: averageMetric(sample, log => log.recovery?.stiffness, limit),
    recommendations,
    areas
  };
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

function coachingDecision({ completed, readiness, load, recovery }) {
  if (readiness.red > 0 || recovery.recommendations.pause > 0 || recovery.avgSoreness >= 7 || recovery.avgStiffness >= 7) {
    return { level: "red", text: "Recovery signal is high. Pause hard work and let soreness/stiffness come down first." };
  }
  if (readiness.yellow >= 2 || recovery.avgSoreness >= 5 || recovery.avgStiffness >= 5 || load.avgCardio >= 8) {
    return { level: "yellow", text: "Hold or reduce load. Keep karate technical until recovery trends normalize." };
  }
  if (completed >= 3 && load.count && recovery.count) {
    return { level: "green", text: "Stable signals. Normal training is fine; progress only one variable at a time." };
  }
  return { level: "yellow", text: "Not enough signal yet. Keep logging karate load and recovery for a clean baseline." };
}

function trendPoints(logs, selector, days = 28) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return metricPoints(logs, selector).filter(point => point.date.getTime() >= cutoff);
}

function trendDirection(delta, threshold = 0.5, lowerIsBetter = false) {
  if (delta === null || delta === undefined) return "Not enough data";
  if (Math.abs(delta) < threshold) return "Stable";
  const better = lowerIsBetter ? delta < 0 : delta > 0;
  return better ? "Improving" : "Worsening";
}

function rollingTrend(logs, selector, { days = 28, threshold = 0.5, lowerIsBetter = false } = {}) {
  const points = trendPoints(logs, selector, days);
  if (points.length < 2) return { count: points.length, delta: null, direction: "Not enough data", latest: points.at(-1)?.value ?? null };
  const delta = points.at(-1).value - points[0].value;
  return {
    count: points.length,
    delta,
    direction: trendDirection(delta, threshold, lowerIsBetter),
    latest: points.at(-1).value
  };
}

function recoveryDebtSignal({ load, recovery, readiness, trends }) {
  const sorenessBad = trends.soreness.direction === "Worsening" || trends.stiffness.direction === "Worsening";
  if (readiness.red > 0 || recovery.recommendations.pause > 0 || recovery.avgSoreness >= 7 || recovery.avgStiffness >= 7) {
    return { level: "red", label: "High", text: "Recovery debt is high. Keep hard work paused until soreness/stiffness drops." };
  }
  if ((load.avgCardio ?? 0) >= 8 && (recovery.avgSoreness >= 5 || recovery.avgStiffness >= 5 || sorenessBad)) {
    return { level: "yellow", label: "Building", text: "Karate load is high while recovery is not clean. Reduce the next non-karate work." };
  }
  if (recovery.avgSoreness >= 5 || recovery.avgStiffness >= 5 || readiness.yellow >= 2) {
    return { level: "yellow", label: "Watch", text: "Recovery is acceptable but not fresh. Keep the next day technical or easy." };
  }
  if (load.count && recovery.count) {
    return { level: "green", label: "Low", text: "Load and recovery are currently balanced." };
  }
  return { level: "yellow", label: "Unknown", text: "Need more karate and recovery logs before judging debt." };
}

function transformationSignal(weight, waist, readiness) {
  if (waist.count < 2) return { label: "First markers", text: "Add weekly Bauchumfang to separate real body change from weight noise." };
  if ((waist.deltaValue ?? 0) <= -0.5 && (weight.deltaValue ?? 0) <= 0.3) {
    return { label: "Leaning out", text: "Waist is down while weight is stable or down. That is the transformation signal to watch." };
  }
  if ((weight.deltaValue ?? 0) <= -1.5 && (waist.deltaValue ?? 0) > -0.3 && (readiness.yellow + readiness.red) >= 2) {
    return { label: "Watch loss quality", text: "Weight is dropping without waist moving and readiness is mixed. Do not chase faster loss." };
  }
  return { label: "Stable", text: "No clear body-composition trend yet. Keep weekly waist and weight consistent." };
}

function trendEngine(logs = state.logs) {
  const last14 = logs.filter(log => Date.now() - new Date(log.date).getTime() <= 14 * 24 * 60 * 60 * 1000);
  const completed = last14.filter(log => log.type === "DONE").length;
  const readiness = readinessStats(logs, 14);
  const load = karateLoadStats(logs);
  const recovery = recoveryStats(logs);
  const weight = weightTrend(logs);
  const waist = waistTrend(logs);
  const trends = {
    weight: rollingTrend(logs, log => numericWeight(log.weight), { days: 28, threshold: 0.4, lowerIsBetter: true }),
    waist: rollingTrend(logs, log => numericWaist(log.waistCm), { days: 28, threshold: 0.5, lowerIsBetter: true }),
    cardio: rollingTrend(logs, log => log.trainingLoad?.cardio, { days: 28, threshold: 1 }),
    strength: rollingTrend(logs, log => log.trainingLoad?.strength, { days: 28, threshold: 1 }),
    soreness: rollingTrend(logs, log => log.recovery?.soreness, { days: 28, threshold: 1, lowerIsBetter: true }),
    stiffness: rollingTrend(logs, log => log.recovery?.stiffness, { days: 28, threshold: 1, lowerIsBetter: true })
  };
  const debt = recoveryDebtSignal({ load, recovery, readiness, trends });
  let decision = { level: "yellow", label: "Watch", text: "Keep collecting clean data; the baseline is still forming." };
  if (debt.level === "red") decision = { level: "red", label: "Recovery", text: debt.text };
  else if (debt.level === "yellow") decision = { level: "yellow", label: debt.label === "Building" ? "Reduce" : "Watch", text: debt.text };
  else if (completed >= 3) decision = { level: "green", label: "Normal", text: "Current trend is sustainable. Train normally and keep logging." };
  return {
    completed,
    readiness,
    load,
    recovery,
    weight,
    waist,
    trends,
    debt,
    transformation: transformationSignal(weight, waist, readiness),
    decision
  };
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
    "id", "date", "card", "type", "readiness", "weight", "waist_cm", "note", "skip_reason_category", "skip_reason_text", "sleep_hours", "load_cardio", "load_strength", "soreness_areas", "soreness", "stiffness", "recommendation"
  ];
  const rows = logs.map(log => [
    log.id,
    log.date,
    log.card,
    log.type,
    log.readiness,
    log.weight,
    log.waistCm || "",
    log.note,
    skipReasonCategory(log),
    skipReasonText(log),
    log.sleepHours || "",
    log.trainingLoad?.cardio ?? "",
    log.trainingLoad?.strength ?? "",
    log.recovery?.areas?.join("|") || "",
    log.recovery?.soreness ?? "",
    log.recovery?.stiffness ?? "",
    log.recovery?.recommendation || ""
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

function chartDecimals(unit) {
  return ["kg", "cm"].includes(unit) ? 1 : 0;
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
  const decimals = chartDecimals(unit);
  const latest = latestPoint ? `${latestPoint.value.toFixed(decimals)}${unit ? ` ${unit}` : ""}` : "—";
  const direction = delta === null ? "First marker" : `${delta >= 0 ? "+" : ""}${delta.toFixed(decimals)}${unit ? ` ${unit}` : ""}`;
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
        <div><h2>Consistency</h2><p class="subtle">Last 14 days: logged check-ins beat perfect.</p></div>
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
      <p class="subtle">Download all local training logs for later analysis. JSON preserves raw log objects; CSV flattens the current weight, waist, sleep, karate load, recovery, and skip-reason fields.</p>
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


function renderList(items) {
  return `<ol class="plain-list">${items.map((item, index) => `<li data-index="${index + 1}">${escapeHtml(item)}</li>`).join("")}</ol>`;
}

function renderInsights() {
  const logs = state.logs;
  const weightPoints = metricPoints(logs, log => numericWeight(log.weight));
  const waistPoints = metricPoints(logs, log => numericWaist(log.waistCm));
  const cardioPoints = metricPoints(logs, log => log.trainingLoad?.cardio);
  const strengthPoints = metricPoints(logs, log => log.trainingLoad?.strength);
  const sorenessPoints = metricPoints(logs, log => log.recovery?.soreness);
  const stiffnessPoints = metricPoints(logs, log => log.recovery?.stiffness);
  const load = karateLoadStats(logs);
  const recovery = recoveryStats(logs);
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
        ${renderSparkChart({ title: "Waist trend", subtitle: "Weekly Bauchumfang for body transformation signal.", points: waistPoints, unit: "cm", tone: "weight" })}
        ${renderSparkChart({ title: "Cardio load", subtitle: `Post-karate conditioning effort · avg ${formatAverage(load.avgCardio)}/10.`, points: cardioPoints, unit: "/10", tone: "load-high", min: 0, max: 10 })}
        ${renderSparkChart({ title: "Strength load", subtitle: `Post-karate strength effort · avg ${formatAverage(load.avgStrength)}/10.`, points: strengthPoints, unit: "/10", tone: "load-stable", min: 0, max: 10 })}
        ${renderSparkChart({ title: "Soreness trend", subtitle: `Between-karate soreness · avg ${formatAverage(recovery.avgSoreness)}/10.`, points: sorenessPoints, unit: "/10", tone: "load-high", min: 0, max: 10 })}
        ${renderSparkChart({ title: "Stiffness trend", subtitle: `Between-karate stiffness · avg ${formatAverage(recovery.avgStiffness)}/10.`, points: stiffnessPoints, unit: "/10", tone: "load-stable", min: 0, max: 10 })}
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
            <button class="btn primary" data-push-subscribe ${capability.ready ? "" : "disabled"}>${pushExportJson ? "Refresh setup code" : "Allow notifications"}</button>
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
          ${renderList(["Monday/Friday morning karate prep reminders", "Monday/Friday post-karate conditioning and strength check reminders", "Between-karate recovery, soreness, stiffness, and Sunday weight-review nudges", "A tap opens Karate Cockpit directly at the public app URL"])}
          <button class="btn ghost" style="margin-top:14px" data-route="progress">Back to progress</button>
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
  return { secure, serviceWorker, notification, push, standalone, ready: secure && serviceWorker && notification && push && standalone, reason };
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
  const engine = trendEngine(logs);
  const { completed, readiness, load, recovery, weight, waist } = engine;
  const recommendationMix = `${recovery.recommendations.normal}/${recovery.recommendations.reduced}/${recovery.recommendations.mobility}/${recovery.recommendations.pause}`;
  const decision = coachingDecision({ completed, readiness, load, recovery });
  return `
    <main class="screen" data-screen="progress">
      ${renderTopbar("Analytics", "Local trends from your check-ins.")}
      <section class="card accent-card">
        <h2>Trend decision</h2>
        <p class="decision ${engine.decision.level}">${engine.decision.label}: ${engine.decision.text}</p>
        <div class="readiness-strip" style="margin-top:12px">
          <div class="metric"><strong>${engine.debt.label}</strong><span>Recovery debt</span></div>
          <div class="metric"><strong>${engine.trends.waist.direction}</strong><span>Waist trend</span></div>
          <div class="metric"><strong>${engine.trends.soreness.direction}</strong><span>Soreness trend</span></div>
        </div>
        <p class="subtle" style="margin-top:10px">7–28 day rolling signal. If sample size is too small, it stays conservative.</p>
        <div class="actions" style="margin-top:14px">
          <button class="btn primary" data-route="insights">Open charts</button>
          <button class="btn secondary" data-route="notifications">iPhone notifications</button>
        </div>
      </section>
      <section class="card" style="margin-top:16px">
        <h2>Weekly summary</h2>
        <div class="readiness-strip">
          <div class="metric"><strong>${completed}</strong><span>Done 14d</span></div>
          <div class="metric"><strong>${formatAverage(load.avgCardio)}</strong><span>Cardio avg</span></div>
          <div class="metric"><strong>${formatAverage(recovery.avgSoreness)}</strong><span>Soreness avg</span></div>
        </div>
        <p class="subtle" style="margin-top:10px">${engine.debt.text}</p>
      </section>
      <section class="card" style="margin-top:16px">
        <h2>Coach decision</h2>
        <p class="decision ${decision.level}">${decision.text}</p>
        <p class="subtle">Based on last 7–14 days. Data stays on this iPhone.</p>
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
        <h2>Transformation</h2>
        <div class="readiness-strip">
          <div class="metric"><strong>${waist.latest || "—"}</strong><span>Latest cm</span></div>
          <div class="metric"><strong>${waist.delta}</strong><span>30d trend</span></div>
          <div class="metric"><strong>${waist.count}</strong><span>waist logs</span></div>
        </div>
        <p class="subtle" style="margin-top:10px"><strong>${engine.transformation.label}.</strong> ${engine.transformation.text}</p>
      </section>
      <section class="card" style="margin-top:16px">
        <h2>Karate load</h2>
        <div class="readiness-strip">
          <div class="metric"><strong>${formatAverage(load.avgCardio)}</strong><span>Avg cardio</span></div>
          <div class="metric"><strong>${formatAverage(load.avgStrength)}</strong><span>Avg strength</span></div>
          <div class="metric"><strong>${load.count}</strong><span>Karate logs</span></div>
        </div>
        <p class="subtle" style="margin-top:10px">From Monday/Friday post-karate check-ins only.</p>
      </section>
      <section class="card" style="margin-top:16px">
        <h2>Recovery trend</h2>
        <div class="readiness-strip">
          <div class="metric"><strong>${formatAverage(recovery.avgSoreness)}</strong><span>Avg soreness</span></div>
          <div class="metric"><strong>${formatAverage(recovery.avgStiffness)}</strong><span>Avg stiffness</span></div>
          <div class="metric"><strong>${recommendationMix}</strong><span>N/R/M/P</span></div>
        </div>
        <p class="subtle" style="margin-top:10px">${recovery.areas.length ? `Recent areas: ${recovery.areas.map(escapeHtml).join(", ")}.` : "Add recovery check-ins to see common sore areas."}</p>
      </section>
      <section class="card" style="margin-top:16px">
        <h2>Readiness mix</h2>
        <div class="readiness-strip">
          <div class="metric"><strong>${completed}</strong><span>Done 14d</span></div>
          <div class="metric"><strong>${readiness.green}/${readiness.yellow}/${readiness.red}</strong><span>G/Y/R</span></div>
          <div class="metric"><strong>${logs.length}</strong><span>Total logs</span></div>
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
    <div><div class="kind">${log.type}</div><div class="metric-detail">${formatMetricLog(log)}</div></div>
    <span class="pill ${readinessClass(log.readiness)}">${log.readiness}</span>
  </div>`;
}

function renderNav() {
  const items = [["today", "Today"], ["progress", "Progress"]];
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
    state.recovery.recommendation = recoveryRecommendation();
    saveState();
    render();
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
  const waistCm = document.querySelector("[data-waist-cm]");
  if (waistCm) waistCm.addEventListener("input", () => {
    state.waistCm = waistCm.value.trim();
    saveState();
  });
  document.querySelectorAll("[data-load]").forEach(input => input.addEventListener("input", () => {
    const key = input.dataset.load;
    state.trainingLoad[key] = Number(input.value);
    const value = document.querySelector(`#value-load-${key}`);
    if (value) value.textContent = input.value;
    saveState();
  }));
  document.querySelectorAll("[data-recovery]").forEach(input => input.addEventListener("input", () => {
    const key = input.dataset.recovery;
    state.recovery[key] = Number(input.value);
    state.recovery.recommendation = recoveryRecommendation();
    const value = document.querySelector(`#value-recovery-${key}`);
    const recommendation = document.querySelector("[data-recovery-recommendation]");
    if (value) value.textContent = input.value;
    if (recommendation) recommendation.value = state.recovery.recommendation;
    saveState();
  }));
  document.querySelectorAll("[data-soreness-area]").forEach(button => button.addEventListener("click", () => {
    const areas = new Set(state.recovery.areas || []);
    if (areas.has(button.dataset.sorenessArea)) areas.delete(button.dataset.sorenessArea);
    else areas.add(button.dataset.sorenessArea);
    state.recovery.areas = [...areas];
    button.setAttribute("aria-pressed", String(areas.has(button.dataset.sorenessArea)));
    saveState();
  }));
  const recommendation = document.querySelector("[data-recovery-recommendation]");
  if (recommendation) ["input", "change"].forEach(eventName => recommendation.addEventListener(eventName, () => {
    state.recovery.recommendation = recommendation.value;
    saveState();
  }));
  const sleepHours = document.querySelector("[data-sleep-hours]");
  if (sleepHours) sleepHours.addEventListener("input", () => {
    state.sleepHours = sleepHours.value.trim();
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
  document.querySelectorAll("[data-export-format]").forEach(button => button.addEventListener("click", () => downloadTrainingData(button.dataset.exportFormat)));
  document.querySelector("[data-push-subscribe]")?.addEventListener("click", setupPushNotifications);
  document.querySelector("[data-push-copy]")?.addEventListener("click", copyPushSetupCode);
}

function currentSkipReason() {
  const categoryInput = document.querySelector("[data-skip-reason-category]");
  const textInput = document.querySelector("[data-skip-reason-text]");
  const category = categoryInput?.value || state.skipReason?.category || "";
  const text = (textInput?.value?.trim()) || state.skipReason?.text || "";
  if (!category && !text) return null;
  return { category: category || "other", text };
}

function logSession(type) {
  const card = currentCard();
  const readiness = type === "SKIPPED" ? suggestedReadiness() : checkinReadiness(card);
  const log = {
    id: globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
    date: new Date().toISOString(),
    card: card.key,
    type,
    readiness,
    weight: state.weight || "",
    waistCm: state.waistCm || "",
    sleepHours: state.sleepHours || "",
    note: state.note || ""
  };
  if (isKarateCheckin(card)) log.trainingLoad = { ...state.trainingLoad };
  if (isRecoveryCheckin(card)) {
    state.recovery.recommendation = recoveryRecommendation();
    log.recovery = {
      areas: [...(state.recovery.areas || [])],
      soreness: Number(state.recovery.soreness || 0),
      stiffness: Number(state.recovery.stiffness || 0),
      recommendation: state.recovery.recommendation
    };
  }
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

function formatHistoricalLog() {
  return "historical check-in";
}

function formatMetricLog(log) {
  const parts = [];
  if (log.weight) parts.push(`${log.weight} kg`);
  if (log.waistCm) parts.push(`waist ${log.waistCm} cm`);
  if (log.sleepHours) parts.push(`sleep ${log.sleepHours}h`);
  if (log.trainingLoad) parts.push(`cardio ${log.trainingLoad.cardio}/10`, `strength ${log.trainingLoad.strength}/10`);
  if (log.recovery) {
    if (log.recovery.areas?.length) parts.push(log.recovery.areas.join(", "));
    parts.push(`sore ${log.recovery.soreness}/10`, `stiff ${log.recovery.stiffness}/10`, log.recovery.recommendation);
  }
  if (!log.trainingLoad && !log.recovery) parts.push(formatHistoricalLog());
  const reason = formatSkipReason(log);
  if (reason) parts.push(`skip: ${reason}`);
  if (log.note) parts.push(log.note);
  return parts.length ? parts.join(" · ") : "No metric detail";
}

function formatLogLine(log) {
  const date = new Date(log.date);
  const reason = formatSkipReason(log);
  const detail = [];
  if (log.trainingLoad) detail.push(`cardio ${log.trainingLoad.cardio}/10`, `strength ${log.trainingLoad.strength}/10`);
  else if (log.recovery) detail.push(`recovery: ${log.recovery.recommendation}`);
  else detail.push(formatHistoricalLog());
  if (reason) detail.push(`skip: ${reason}`);
  return `${date.toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" })} · ${log.readiness} · ${detail.join(" · ")}`;
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
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").then(registration => registration.update()).catch(() => {});
  });
}

render();
