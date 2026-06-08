import assert from 'node:assert/strict';
import { REMINDERS, dueReminders, parseSubscriptionSecret } from '../scripts/send-ios-push-reminder.mjs';

const byKey = Object.fromEntries(REMINDERS.map(reminder => [reminder.key, reminder]));

assert.match(byKey['mon-post'].body, /conditioning/i);
assert.match(byKey['mon-post'].body, /strength/i);
assert.doesNotMatch(byKey['mon-post'].body, /sharp feeling/i);

assert.match(byKey['fri-post'].body, /conditioning/i);
assert.match(byKey['fri-post'].body, /strength/i);
assert.doesNotMatch(byKey['fri-post'].body, /Pain signals decide/i);

assert.match(byKey['tue-recovery'].body, /soreness/i);
assert.match(byKey['wed-recovery'].body, /soreness/i);
assert.match(byKey['wed-recovery'].body, /stiffness/i);
assert.doesNotMatch(byKey['wed-recovery'].title, /Strength/i);
assert.match(byKey['thu-recovery'].body, /soreness/i);
assert.match(byKey['thu-recovery'].body, /stiffness/i);
assert.doesNotMatch(byKey['thu-recovery'].title, /Footwork/i);
assert.match(byKey['sat-recovery'].body, /soreness/i);
assert.match(byKey['sat-recovery'].body, /stiffness/i);
assert.doesNotMatch(byKey['sat-recovery'].body, /optional work/i);
assert.match(byKey['sun-review'].body, /weight/i);

const mondayPostDelayed = dueReminders(new Date('2026-06-01T19:50:00.000Z'));
assert.equal(mondayPostDelayed.some(reminder => reminder.key === 'mon-post'), true);

const betweenSlots = dueReminders(new Date('2026-06-01T18:50:00.000Z'));
assert.equal(betweenSlots.some(reminder => reminder.key === 'mon-post'), false);

const validSubscription = {
  endpoint: 'https://web.push.apple.com/example',
  keys: { p256dh: 'p256dh', auth: 'auth' }
};
assert.equal(parseSubscriptionSecret(JSON.stringify(validSubscription)).length, 0);
assert.equal(parseSubscriptionSecret(JSON.stringify({ app: 'other-app', appUrl: 'https://example.com/', subscription: validSubscription })).length, 0);
assert.equal(parseSubscriptionSecret(JSON.stringify({ app: 'karate-cockpit', appUrl: 'https://w7420028-creator.github.io/karate-cockpit/', subscription: validSubscription })).length, 1);

console.log('push-reminders tests passed');
