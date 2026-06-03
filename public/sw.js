// No-op service worker to prevent 404 errors.
// This file exists solely to satisfy requests for /sw.js.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
