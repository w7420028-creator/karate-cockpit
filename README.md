# Karate Cockpit V1

Standalone iOS-first PWA for Christian's karate return plan.

## Run locally

```bash
cd karate-coach/cockpit
npm run start
```

Open `http://localhost:4173`.

Check static validity with:

```bash
npm run check
```

For iPhone testing on the same network, open `http://<mac-ip>:4173`, then Safari → Share → Add to Home Screen.

## V1 behavior

- Opens directly to Today.
- Daily card is derived from the weekly rhythm in `../README.md`.
- Logs `DONE`, `MINIMUM`, `SKIPPED`, readiness, pain sliders, and a short note to `localStorage`.
- Offline-capable via service worker.
- No Telegram/chat-style interface; Telegram should link here only.
