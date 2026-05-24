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
- No Telegram/chat-style interface; Telegram should link here only.
