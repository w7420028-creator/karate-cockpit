# Karate Cockpit V1

Standalone iOS-first PWA for Christian's karate check-ins.

## Run locally

```bash
cd karate-coach/cockpit
npm run start
```

Open locally: `http://localhost:4173`.

Public URL:

<https://w7420028-creator.github.io/karate-cockpit/>

Install on iPhone:

1. Open the public URL in Safari.
2. Share → Add to Home Screen.
3. Name it `Karate`.

Check static validity with:

```bash
npm run check
```

For iPhone testing on the same network, open `http://<mac-ip>:4173`, then Safari → Share → Add to Home Screen.

Deployment:

- GitHub repo: <https://github.com/w7420028-creator/karate-cockpit>
- GitHub Pages: <https://w7420028-creator.github.io/karate-cockpit/>

## V1 behavior

- Opens directly to Today.
- Daily check-in mode is derived from the lightweight karate/recovery rhythm.
- Logs `DONE` or `SKIPPED`, readiness, and the right check-in for the day to `localStorage`. Older `MINIMUM` logs are still readable/exportable for history, but the active UI no longer offers session/program tracking.
- Monday/Friday use a post-karate check for conditioning effort, strength effort, and overload notes.
- Days between karate use a recovery check for muscle-soreness areas, soreness intensity, stiffness, and recommendation.
- Sunday also tracks bodyweight and `Bauchumfang`/waist circumference so transformation can be read separately from scale noise.
- Progress includes Trend decision, Recovery debt, Weekly summary, Bodyweight, Transformation, Karate load, Recovery trend, Soreness map, Readiness mix, and charts for weight/waist/load/recovery.
- The active UI has only Today and Progress. Session/program cards and the old Plan tab are intentionally removed for now.
- Sleep is optional/import-ready for AutoSleep/Apple Health values; the PWA does not directly read HealthKit.
- Offline-capable via service worker.
- Native Web Push-capable for installed iOS Home Screen PWA reminders.
- No Telegram/chat-style interface; Telegram should link here only.

## Local data contract

Training data is stored client-side in browser `localStorage` under key `karate-cockpit-v1`.

State shape:

```json
{
  "readiness": "GREEN|YELLOW|RED",
  "trainingLoad": { "cardio": 0, "strength": 0 },
  "recovery": { "areas": [], "soreness": 0, "stiffness": 0, "recommendation": "normal|reduced|mobility|pause" },
  "sleepHours": "7.4",
  "weight": "94.0",
  "waistCm": "104.0",
  "note": "short text",
  "skipReason": { "category": "", "text": "" },
  "logs": []
}
```

Each entry in `logs` is one planned card per local day. Re-logging the same card on the same local day updates/replaces that entry instead of duplicating it. Logs are newest-first and intentionally uncapped so long-term analytics are not truncated.

Log entry shape:

```json
{
  "id": "uuid-or-timestamp",
  "date": "ISO-8601 timestamp",
  "card": "sunday-review|monday-karate|tuesday-recovery|wednesday-strength|thursday-footwork|friday-karate|saturday-optional",
  "type": "DONE|SKIPPED",
  "readiness": "GREEN|YELLOW|RED",
  "trainingLoad": { "cardio": 8, "strength": 6 },
  "recovery": { "areas": ["Unterschenkel"], "soreness": 5, "stiffness": 4, "recommendation": "mobility" },
  "sleepHours": "7.4",
  "weight": "94.0",
  "waistCm": "104.0",
  "note": "short text",
  "skipReason": { "category": "holiday|rest|injury|busy|other", "text": "optional detail" }
}
```

Analytics are derived from these logs: bodyweight from `weight`, waist from `waistCm`, karate load from `trainingLoad`, recovery from `recovery`, readiness from `readiness`, completion mix from `DONE`/`SKIPPED`, and skip classification from `skipReason`. Trend Engine v1 computes conservative 7-28 day signals for the top decision card, recovery debt, weekly summary, and transformation signal. Soreness map uses the six recovery muscle areas to show recent recurrence and per-area trend labels. Raw JSON preserves any older stored fields for history, but new logs and flattened CSV use only the current karate/recovery contract. Existing historical `MINIMUM` logs remain counted/exported. Data is durable for the installed browser profile, including offline use. The Progress screen exports the full uncapped log history as raw JSON or flattened CSV for later analytics. There is no backend sync yet.

## iOS Web Push reminders

No Cloudflare/backend is used. The public PWA creates an iPhone Web Push subscription locally, exports it as a setup code, and a private GitHub Actions workflow sends reminders with VAPID secrets.
Push setup is intentionally gated to the installed iPhone Home Screen PWA. Opening the site in a normal browser may show setup instructions, but it should not create a subscription there.
GitHub scheduled runs can start late, so the sender accepts reminders within a 25-minute Europe/Berlin grace window to avoid missed notifications without overlapping adjacent half-hour runs.

Current reminder behavior:

- Monday/Friday morning: karate prep and joint-prep reminder.
- Monday/Friday evening: post-karate conditioning effort, strength effort, and overload-note reminder.
- Tuesday/Wednesday/Thursday/Saturday: recovery/soreness/stiffness-first reminder.
- Sunday: weight tracking and weekly review reminder.

Frontend public VAPID key committed in `app.js`:

```text
BH2EnekLiapo_ZR4OcV2GxrTgGSzrlhKnRuYh_-cmfYWQCMBHomzrQynEAWwHGrCEwZvwh2ANmpI21mw4OA0Bqs
```

Required private repo secrets:

- `VAPID_PUBLIC_KEY` — same value as the frontend constant above
- `VAPID_PRIVATE_KEY` — matching private key; never commit it
- `IOS_PUSH_SUBSCRIPTION` — copied from the app’s Progress → iPhone notifications screen after subscribing on the iPhone
- Optional: `VAPID_SUBJECT` — `mailto:` or URL contact for VAPID; defaults to the GitHub repo URL

iPhone registration:

1. Open <https://w7420028-creator.github.io/karate-cockpit/> in Safari.
2. Share → Add to Home Screen → open the installed `Karate` icon.
3. Go to Progress → iPhone notifications.
4. Tap Allow notifications.
5. Copy the setup code and store it as the private `IOS_PUSH_SUBSCRIPTION` GitHub Secret.

The subscription code is device-specific. Do not place it in public Pages-served files.
