import webpush from 'web-push';
import { pathToFileURL } from 'node:url';

const APP_URL = process.env.APP_URL || 'https://w7420028-creator.github.io/karate-cockpit/';
const TIME_ZONE = 'Europe/Berlin';
const GRACE_MINUTES = Number(process.env.REMINDER_GRACE_MINUTES || 25);

const REMINDERS = [
  { key: 'mon-prep', weekday: 1, time: '08:00', title: 'Karate today', body: '6 min joint prep before class. After training, log conditioning and strength effort.' },
  { key: 'mon-post', weekday: 1, time: '21:30', title: 'Post-karate check', body: 'Log conditioning, strength effort, and any overload note. No extra training tonight.' },
  { key: 'tue-recovery', weekday: 2, time: '07:30', title: 'Recovery check', body: 'Check muscle soreness and stiffness first. Then choose normal, reduced, mobility, or pause.' },
  { key: 'wed-strength', weekday: 3, time: '20:00', title: 'Strength if recovered', body: 'Check soreness before strength. Green = tendon work, yellow = reduced, red = mobility or pause.' },
  { key: 'thu-footwork', weekday: 4, time: '20:30', title: 'Footwork if legs are ready', body: 'Check soreness before footwork. Keep it light if calves, hips, or knees are still loaded.' },
  { key: 'fri-prep', weekday: 5, time: '08:00', title: 'Karate today', body: '6 min joint prep before class. Later: post-karate conditioning and strength check.' },
  { key: 'fri-post', weekday: 5, time: '21:30', title: 'Post-karate check', body: 'Log conditioning, strength effort, and where the body feels overloaded. Weekend adapts from this.' },
  { key: 'sat-optional', weekday: 6, time: '09:30', title: 'Recovery first', body: 'Check soreness and sleep before optional work. If not green, family walk or mobility is enough.' },
  { key: 'sun-review', weekday: 0, time: '20:30', title: 'Sunday review', body: 'Keep weight tracking: enter weight, review recovery, and set the next week calmly.' }
];

function missing(name) {
  return !process.env[name] || !process.env[name].trim();
}

function berlinParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});
  const weekdays = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { weekday: weekdays[parts.weekday], hour: Number(parts.hour), minute: Number(parts.minute) };
}

function minutesOfDay(time) {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

function dueReminders(now = new Date(), graceMinutes = GRACE_MINUTES) {
  const local = berlinParts(now);
  const current = local.hour * 60 + local.minute;
  return REMINDERS.filter(reminder => reminder.weekday === local.weekday && Math.abs(current - minutesOfDay(reminder.time)) <= graceMinutes);
}

function parseSubscriptionSecret(value) {
  const trimmed = value.trim();
  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    const decoded = Buffer.from(trimmed, 'base64').toString('utf8');
    parsed = JSON.parse(decoded);
  }
  const entries = Array.isArray(parsed) ? parsed : [parsed];
  return entries.map(entry => entry.subscription || entry).filter(entry => entry?.endpoint && entry?.keys?.p256dh && entry?.keys?.auth);
}

async function main() {
  const required = ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'IOS_PUSH_SUBSCRIPTION'];
  const absent = required.filter(missing);
  if (absent.length) {
    console.log(`Push reminders skipped: missing secret(s): ${absent.join(', ')}`);
    return;
  }

  const due = dueReminders();
  if (!due.length && !process.env.FORCE_REMINDER_KEY) {
    console.log('Push reminders skipped: no Europe/Berlin reminder due now.');
    return;
  }

  const subscriptions = parseSubscriptionSecret(process.env.IOS_PUSH_SUBSCRIPTION);
  if (!subscriptions.length) {
    console.log('Push reminders skipped: IOS_PUSH_SUBSCRIPTION did not contain a valid Web Push subscription.');
    return;
  }

  const subject = process.env.VAPID_SUBJECT || (process.env.GITHUB_REPOSITORY ? `https://github.com/${process.env.GITHUB_REPOSITORY}` : APP_URL);
  webpush.setVapidDetails(subject, process.env.VAPID_PUBLIC_KEY.trim(), process.env.VAPID_PRIVATE_KEY.trim());

  const selected = process.env.FORCE_REMINDER_KEY ? REMINDERS.filter(reminder => reminder.key === process.env.FORCE_REMINDER_KEY) : due;
  if (!selected.length) {
    console.log(`Push reminders skipped: unknown FORCE_REMINDER_KEY ${process.env.FORCE_REMINDER_KEY}.`);
    return;
  }

  for (const reminder of selected) {
    const payload = JSON.stringify({
      title: reminder.title,
      body: `${reminder.body} Open Karate Cockpit.`,
      url: APP_URL,
      tag: `karate-${reminder.key}`,
      reminderKey: reminder.key
    });
    for (const subscription of subscriptions) {
      try {
        if (process.env.IOS_PUSH_DRY_RUN === '1') {
          console.log(`[dry-run] Would send ${reminder.key} to ${subscription.endpoint.slice(0, 42)}…`);
          continue;
        }
        await webpush.sendNotification(subscription, payload, { TTL: 6 * 60 * 60, urgency: 'normal' });
        console.log(`Sent ${reminder.key} to ${subscription.endpoint.slice(0, 42)}…`);
      } catch (error) {
        const status = error?.statusCode ? ` HTTP ${error.statusCode}` : '';
        console.log(`Push send failed for ${reminder.key}${status}: ${error?.message || error}`);
      }
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.log(`Push reminders skipped after unexpected error: ${error?.message || error}`);
  });
}

export { REMINDERS, berlinParts, dueReminders, parseSubscriptionSecret };
