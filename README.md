# Karate Cockpit V1

Standalone iOS-first PWA for Christian's karate return plan.

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
- Daily card is derived from the weekly rhythm in `../README.md`.
- Logs `DONE`, `MINIMUM`, `SKIPPED`, readiness, pain sliders, and a short note to `localStorage`.
- Offline-capable via service worker.
- Native Web Push-capable for installed iOS Home Screen PWA reminders.
- No Telegram/chat-style interface; Telegram should link here only.

## Local data contract

Training data is stored client-side in browser `localStorage` under key `karate-cockpit-v1`.

State shape:

```json
{
  "readiness": "GREEN|YELLOW|RED",
  "pain": { "knees": 0, "achilles": 0, "hips": 0, "lowerBack": 0 },
  "sparring": 0,
  "weight": "94.0",
  "energy": 7,
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
  "type": "DONE|MINIMUM|SKIPPED",
  "readiness": "GREEN|YELLOW|RED",
  "pain": { "knees": 0, "achilles": 0, "hips": 0, "lowerBack": 0 },
  "sparring": 0,
  "weight": "94.0",
  "energy": 7,
  "note": "short text",
  "skipReason": { "category": "holiday|rest|injury|busy|other", "text": "optional detail" }
}
```

Analytics are derived from these logs: planned-vs-actual can be reconstructed from `date` + `card` + `type`, weight from `weight`, pain from per-area pain values, energy from `energy`, completion mix from `DONE`/`MINIMUM`/`SKIPPED`, and skip classification from `skipReason`. Data is durable for the installed browser profile, including offline use. The Progress screen exports the full uncapped log history as raw JSON or flattened CSV for later analytics. There is no backend sync yet.

## iOS Web Push reminders

No Cloudflare/backend is used. The public PWA creates an iPhone Web Push subscription locally, exports it as a setup code, and a private GitHub Actions workflow sends reminders with VAPID secrets.

Frontend public VAPID key committed in `app.js`:

```text
BH2EnekLiapo_ZR4OcV2GxrTgGSzrlhKnRuYh_-cmfYWQCMBHomzrQynEAWwHGrCEwZvwh2ANmpI21mw4OA0Bqs
```

Required private repo secrets:

- `VAPID_PUBLIC_KEY` — same value as the frontend constant above
- `VAPID_PRIVATE_KEY` — matching private key; never commit it
- `IOS_PUSH_SUBSCRIPTION` — copied from the app’s Plan → Set up notifications screen after subscribing on the iPhone
- Optional: `VAPID_SUBJECT` — `mailto:` or URL contact for VAPID; defaults to the GitHub repo URL

iPhone registration:

1. Open <https://w7420028-creator.github.io/karate-cockpit/> in Safari.
2. Share → Add to Home Screen → open the installed `Karate` icon.
3. Go to Plan → Set up notifications.
4. Tap Allow notifications.
5. Copy the setup code and store it as the private `IOS_PUSH_SUBSCRIPTION` GitHub Secret.

The subscription code is device-specific. Do not place it in public Pages-served files.
