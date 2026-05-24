import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('app.js', 'utf8') + '\nObject.assign(globalThis, { CARDS, state, VAPID_PUBLIC_KEY, renderToday, renderProgress, renderInsights, renderPlan, renderNotifications, pushCapability, urlBase64ToUint8Array, openSession, logSession, weightTrend, averageEnergy, renderReviewInputs, renderList, renderExerciseDiagram, diagramKeyForItem, metricPoints });';
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
  for (const key of ['key', 'shortDay', 'label', 'command', 'time', 'full', 'minimum', 'painRule', 'reason']) {
    if (!card[key]) throw new Error(`card ${day} missing ${key}`);
  }
}
const sundayHtml = context.renderReviewInputs(context.CARDS[0]);
for (const token of ['id="weight"', 'id="energy"', 'data-pain="knees"', 'Best kumite feeling']) {
  if (!sundayHtml.includes(token)) throw new Error(`Sunday input missing ${token}`);
}
context.state.logs = [
  { date: new Date().toISOString(), type: 'DONE', readiness: 'GREEN', pain: { knees: 1, achilles: 2, hips: 1, lowerBack: 0 }, weight: '94,0', energy: 0, note: 'test' },
  { date: new Date(Date.now() - 7*864e5).toISOString(), type: 'MINIMUM', readiness: 'YELLOW', pain: { knees: 2, achilles: 2, hips: 1, lowerBack: 1 }, weight: '94.7', energy: 5, note: 'test' }
];
if (context.weightTrend(context.state.logs).latest !== '94.0') throw new Error('weight latest failed');
if (context.averageEnergy(context.state.logs, 7) !== 2.5) throw new Error('energy zero should count');
const progress = context.renderProgress();
for (const token of ['Coach decision', 'Bodyweight', 'Pain trend', 'Readiness + recovery', 'Open charts']) {
  if (!progress.includes(token)) throw new Error(`progress missing ${token}`);
}
const insights = context.renderInsights();
for (const token of ['Visual cockpit', 'data-chart="weight-trend"', 'data-chart="pain-trend"', 'data-chart="energy-trend"', 'data-chart="consistency"']) {
  if (!insights.includes(token)) throw new Error(`insights missing ${token}`);
}
if (context.metricPoints(context.state.logs, log => Number(log.energy)).length !== 2) throw new Error('energy chart points missing');
const illustratedList = context.renderList(context.CARDS[3].full, context.CARDS[3]);
for (const token of ['diagram-shell', '<svg class="exercise-diagram" viewBox="0 0 64 64"', 'Goblet squat', 'Romanian deadlift']) {
  if (!illustratedList.includes(token)) throw new Error(`exercise illustration missing ${token}`);
}
if (context.diagramKeyForItem('Kizami-zuki entry, no power', context.CARDS[4]) !== 'punch') throw new Error('karate footwork icon classification failed');
if (context.diagramKeyForItem('Slow calf raises', context.CARDS[1]) !== 'calf') throw new Error('calf icon classification failed');
if (context.diagramKeyForItem('6-min joint prep only', context.CARDS[1]) !== 'mobility') throw new Error('joint prep icon classification failed');
const plan = context.renderPlan();
for (const token of ['iPhone native push', 'Set up notifications', 'data-route="notifications"']) {
  if (!plan.includes(token)) throw new Error(`plan notification entry missing ${token}`);
}
const notificationSetup = context.renderNotifications();
for (const token of ['One-time iPhone push setup', 'IOS_PUSH_SUBSCRIPTION', 'No private VAPID key or GitHub token', 'Copy setup code']) {
  if (!notificationSetup.includes(token)) throw new Error(`notification setup missing ${token}`);
}
if (context.urlBase64ToUint8Array(context.VAPID_PUBLIC_KEY).length !== 65) throw new Error('VAPID public key should decode to a P-256 public key');

const swSource = fs.readFileSync('sw.js', 'utf8');
for (const token of ['karate-cockpit-v10', 'addEventListener("push"', 'showNotification', 'notificationclick', 'openOrFocusClient']) {
  if (!swSource.includes(token)) throw new Error(`service worker push coverage missing ${token}`);
}
context.state.logs = [context.state.logs[0]];
const firstMarker = context.renderInsights();
if (!firstMarker.includes('first marker · keep logging')) throw new Error('single datapoint first marker missing');

// Same-day logging should update, not duplicate.
context.state.logs = [];
context.logSession('DONE');
context.logSession('MINIMUM');
if (context.state.logs.length !== 1) throw new Error('same-day duplicate log was not replaced');
if (context.state.logs[0].type !== 'MINIMUM') throw new Error('same-day update did not keep latest log');

console.log('qa-smoke passed');
