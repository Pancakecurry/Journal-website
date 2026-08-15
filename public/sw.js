const VERSION = "1.0.0";
const SHELL = `campus-atelier-shell-${VERSION}`;
const RUNTIME = `campus-atelier-runtime-${VERSION}`;
const CORE_ROUTES = [
  "/today",
  "/calendar",
  "/journal",
  "/search",
  "/my-world",
  "/my-world/keepsakes",
  "/my-world/doodles",
  "/my-world/games",
  "/me",
  "/me/personalization",
  "/me/privacy",
  "/me/export",
  "/me/data",
  "/me/storage",
  "/me/install",
  "/manifest.webmanifest",
  "/icons/atelier.svg",
  "/icons/atelier-192.png",
  "/icons/atelier-512.png",
  "/icons/atelier-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(CORE_ROUTES)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("campus-atelier-") && ![SHELL, RUNTIME].includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth")
  )
    return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, SHELL, "/today"));
    return;
  }
  if (
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:css|js|woff2|png|svg|webp)$/.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(request));
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(RUNTIME)).put(request, response.clone());
  return response;
}

async function networkFirst(request, cacheName, fallback) {
  try {
    const response = await fetch(request);
    if (response.ok && response.headers.get("content-type")?.includes("text/html"))
      (await caches.open(cacheName)).put(request, response.clone());
    return response;
  } catch {
    return (await caches.match(request)) || (await caches.match(fallback)) || Response.error();
  }
}
