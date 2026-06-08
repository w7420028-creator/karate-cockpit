import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('app.js', 'utf8') + '\nObject.assign(globalThis, { CARDS, state, VAPID_PUBLIC_KEY, renderToday, renderProgress, renderInsights, renderNotifications, pushCapability, urlBase64ToUint8Array, logSession, weightTrend, waistTrend, trendEngine, averageEnergy, renderReviewInputs, renderList, renderExerciseDiagram, diagramKeyForItem, demoKeyForItem, renderDemoLink, metricPoints, exportLogsAsJson, exportLogsAsCsv });';
function makeEl(tag = 'div') {
  return {
    tag,
    innerHTML: '',
    textContent: '',
    className: '',
    dataset: {},
    style: {},
    appendChild() {},
    remove() {},
    addEventListener() {},
    querySelector() { return makeEl(); },
    querySelectorAll() { return []; }
  };
}
const app = makeEl('div');
const local = new Map();
const context = {
  document: {
    querySelector(selector) { if (selector === '#app') return app; return makeEl(); },
    querySelectorAll() { return []; },
    createElement: makeEl,
    body: makeEl('body')
  },
  localStorage: { getItem: key => local.get(key) ?? null, setItem: (key, value) => local.set(key, value) },
  navigator: {},
  window: { addEventListener() {}, matchMedia: () => ({ matches: false }), location: { protocol: 'https:', hostname: 'localhost' }, isSecureContext: true },
  location: { protocol: 'https:', hostname: 'localhost' },
  console,
  Date,
  Math,
  Number,
  String,
  JSON,
  structuredClone: value => JSON.parse(JSON.stringify(value)),
  crypto: { randomUUID: () => 'test-id' },
  atob, btoa,
  setTimeout, clearTimeout, setInterval, clearInterval
};
vm.createContext(context);
vm.runInContext(source, context);

for (let day = 0; day <= 6; day++) {
  if (!context.CARDS?.[day]) throw new Error(`card ${day} missing`);
  const card = context.CARDS[day];
  for (const key of ['key', 'shortDay', 'label', 'command', 'time', 'reason']) {
    if (!card[key]) throw new Error(`card ${day} missing ${key}`);
  }
}
const sundayHtml = context.renderReviewInputs(context.CARDS[0]);
for (const token of ['id="weight"', 'id="waist-cm"', 'data-waist-cm', 'data-sleep-hours', 'Weekly review note', 'data-skip-reason-category', 'value="holiday"']) {
  if (!sundayHtml.includes(token)) throw new Error(`Sunday input missing ${token}`);
}
for (const token of ['id="energy"', 'data-pain="knees"', 'Best kumite feeling']) {
  if (sundayHtml.includes(token)) throw new Error(`Sunday input should not expose old token ${token}`);
}
const mondayHtml = context.renderReviewInputs(context.CARDS[1]);
for (const token of ['Post-karate check', 'id="load-cardio"', 'Conditioning / cardio effort', 'Strength effort', 'data-sleep-hours']) {
  if (!mondayHtml.includes(token)) throw new Error(`Monday post-karate input missing ${token}`);
}
const tuesdayHtml = context.renderReviewInputs(context.CARDS[2]);
for (const token of ['Recovery check', 'Muscle soreness', 'id="recovery-soreness"', 'Unterschenkel', 'Oberschenkel', 'Bauch', 'Rücken', 'Oberarme', 'Unterarme', 'data-recovery-recommendation']) {
  if (!tuesdayHtml.includes(token)) throw new Error(`Tuesday recovery input missing ${token}`);
}
for (const token of ['calves/Achilles', 'hips', 'shoulders']) {
  if (tuesdayHtml.includes(token)) throw new Error(`Tuesday recovery input should not expose old soreness area ${token}`);
}
const todayHtml = context.renderToday();
for (const token of ['Full session', 'Minimum version', 'data-start="full"', 'data-start="minimum"', 'data-log="MINIMUM"']) {
  if (todayHtml.includes(token)) throw new Error(`today should not expose session/program control ${token}`);
}
context.state.logs = [
  { date: new Date().toISOString(), card: 'monday-karate', type: 'DONE', readiness: 'GREEN', pain: { knees: 1, achilles: 2, hips: 1, lowerBack: 0 }, weight: '94,0', waistCm: '104.0', energy: 0, trainingLoad: { cardio: 8, strength: 6 }, note: 'test' },
  { date: new Date(Date.now() - 7*864e5).toISOString(), card: 'tuesday-recovery', type: 'DONE', readiness: 'YELLOW', pain: { knees: 2, achilles: 2, hips: 1, lowerBack: 1 }, weight: '94.7', waistCm: '105.0', energy: 5, recovery: { areas: ['Rücken'], soreness: 5, stiffness: 4, recommendation: 'mobility' }, note: 'test' }
];
if (context.weightTrend(context.state.logs).latest !== '94.0') throw new Error('weight latest failed');
if (context.waistTrend(context.state.logs).latest !== '104.0') throw new Error('waist latest failed');
if (context.karateLoadStats(context.state.logs).avgCardio !== 8) throw new Error('cardio load stat failed');
if (context.recoveryStats(context.state.logs).avgSoreness !== 5) throw new Error('soreness stat failed');
if (!context.trendEngine(context.state.logs).decision.label) throw new Error('trend engine decision missing');
const progress = context.renderProgress();
for (const token of ['Trend decision', 'Recovery debt', 'Weekly summary', 'Transformation', 'Coach decision', 'Data export', 'Export JSON', 'Export CSV', 'Bodyweight', 'Karate load', 'Recovery trend', 'Readiness mix', 'Open charts', 'iPhone notifications', 'data-route="notifications"']) {
  if (!progress.includes(token)) throw new Error(`progress missing ${token}`);
}
const insights = context.renderInsights();
for (const token of ['Visual cockpit', 'data-chart="weight-trend"', 'data-chart="waist-trend"', 'data-chart="cardio-load"', 'data-chart="strength-load"', 'data-chart="soreness-trend"', 'data-chart="stiffness-trend"', 'data-chart="consistency"']) {
  if (!insights.includes(token)) throw new Error(`insights missing ${token}`);
}
if (context.metricPoints(context.state.logs, log => log.trainingLoad?.cardio).length !== 1) throw new Error('cardio chart points missing');
const notificationSetup = context.renderNotifications();
for (const token of ['One-time iPhone push setup', 'IOS_PUSH_SUBSCRIPTION', 'No private VAPID key or GitHub token', 'Copy setup code', 'post-karate conditioning and strength', 'soreness, stiffness', 'Back to progress']) {
  if (!notificationSetup.includes(token)) throw new Error(`notification setup missing ${token}`);
}
if (context.urlBase64ToUint8Array(context.VAPID_PUBLIC_KEY).length !== 65) throw new Error('VAPID public key should decode to a P-256 public key');

const swSource = fs.readFileSync('sw.js', 'utf8');
for (const token of ['karate-cockpit-v20', 'addEventListener("push"', 'showNotification', 'notificationclick', 'openOrFocusClient']) {
  if (!swSource.includes(token)) throw new Error(`service worker push coverage missing ${token}`);
}
context.state.logs = [context.state.logs[0]];
const firstMarker = context.renderInsights();
if (!firstMarker.includes('first marker · keep logging')) throw new Error('single datapoint first marker missing');

// Same-day logging should update, not duplicate.
context.state.logs = [];
context.logSession('DONE');
context.logSession('DONE');
if (context.state.logs.length !== 1) throw new Error('same-day duplicate log was not replaced');
if (context.state.logs[0].type !== 'DONE') throw new Error('same-day update did not keep latest log');

// New logs must not truncate historical analytics data.
context.state.logs = Array.from({ length: 181 }, (_, index) => ({
  id: `old-${index}`,
  date: new Date(Date.now() - (index + 1) * 864e5).toISOString(),
  card: 'monday-karate',
  type: 'DONE',
  readiness: 'GREEN',
  pain: { knees: 0, achilles: 0, hips: 0, lowerBack: 0 },
  weight: '',
  energy: 7,
  note: ''
}));
context.logSession('DONE');
if (context.state.logs.length !== 182) throw new Error('historical logs were truncated when adding a new log');

context.state.skipReason = { category: 'holiday', text: 'Pentecost holiday' };
context.logSession('SKIPPED');
if (context.state.logs[0].skipReason?.category !== 'holiday') throw new Error('skip reason category was not stored');
if (!context.exportLogsAsJson().includes('"logCount": 182')) throw new Error('JSON export should include all logs');
const csv = context.exportLogsAsCsv();
if (!csv.includes('skip_reason_category,skip_reason_text')) throw new Error('CSV export missing skip reason columns');
if (!csv.includes('waist_cm')) throw new Error('CSV export missing waist column');
if (!csv.includes('holiday,Pentecost holiday')) throw new Error('CSV export missing holiday skip reason');

console.log('qa-smoke passed');
