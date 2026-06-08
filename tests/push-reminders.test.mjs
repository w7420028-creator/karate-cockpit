import assert from 'node:assert/strict';
import { REMINDERS, dueReminders } from '../scripts/send-ios-push-reminder.mjs';

const byKey = Object.fromEntries(REMINDERS.map(reminder => [reminder.key, reminder]));

assert.match(byKey['mon-post'].body, /conditioning/i);
assert.match(byKey['mon-post'].body, /strength/i);
assert.doesNotMatch(byKey['mon-post'].body, /sharp feeling/i);

assert.match(byKey['fri-post'].body, /conditioning/i);
assert.match(byKey['fri-post'].body, /strength/i);
assert.doesNotMatch(byKey['fri-post'].body, /Pain signals decide/i);

assert.match(byKey['tue-recovery'].body, /soreness/i);
assert.match(byKey['wed-strength'].body, /soreness/i);
assert.match(byKey['thu-footwork'].body, /soreness/i);
assert.match(byKey['sat-optional'].body, /soreness/i);
assert.match(byKey['sun-review'].body, /weight/i);

const mondayPostDelayed = dueReminders(new Date('2026-06-01T19:50:00.000Z'));
assert.equal(mondayPostDelayed.some(reminder => reminder.key === 'mon-post'), true);

const betweenSlots = dueReminders(new Date('2026-06-01T18:50:00.000Z'));
assert.equal(betweenSlots.some(reminder => reminder.key === 'mon-post'), false);

console.log('push-reminders tests passed');
