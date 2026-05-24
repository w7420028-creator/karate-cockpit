const CACHE = "karate-cockpit-v9";
const DEFAULT_URL = "./";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const request = event.request;
  event.respondWith(networkFirst(request));
});

self.addEventListener("push", event => {
  const payload = readPushPayload(event);
  const title = payload.title || "Karate Cockpit";
  const options = {
    body: payload.body || "Open today’s karate cockpit.",
    tag: payload.tag || "karate-reminder",
    renotify: Boolean(payload.renotify),
    icon: payload.icon || "./icons/icon-192.png",
    badge: payload.badge || "./icons/icon-180.png",
    data: { url: payload.url || DEFAULT_URL, reminderKey: payload.reminderKey || null }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || DEFAULT_URL, self.location.href).href;
  event.waitUntil(openOrFocusClient(targetUrl));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request, { cache: "no-cache" });
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || caches.match("./index.html");
  }
}

function readPushPayload(event) {
  if (!event.data) return {};
  try {
    return event.data.json();
  } catch {
    return { body: event.data.text() };
  }
}

async function openOrFocusClient(targetUrl) {
  const windowClients = await clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of windowClients) {
    const clientUrl = new URL(client.url);
    const target = new URL(targetUrl);
    if (clientUrl.origin === target.origin && clientUrl.pathname.startsWith(target.pathname.replace(/index\.html$/, ""))) {
      await client.focus();
      return client.navigate ? client.navigate(targetUrl) : undefined;
    }
  }
  return clients.openWindow(targetUrl);
}
