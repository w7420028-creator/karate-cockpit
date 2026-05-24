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
