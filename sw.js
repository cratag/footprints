// Cache-first for remote map tiles, so viewed and prefetched tiles work offline.
const CACHE = 'footprints-tiles-v1';
const TILE = /^https:\/\/(tile\.openstreetmap\.org|server\.arcgisonline\.com)\//;
const inflight = new Map();

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  const { request: req } = e;
  if (req.method !== 'GET' || !TILE.test(req.url)) return;
  e.respondWith(serve(req));
});

async function serve(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req.url);
  if (hit) return hit;
  // Leaflet and the prefetcher may ask for the same tile at once
  if (!inflight.has(req.url)) {
    const p = fetch(req.url, { mode: 'cors', credentials: 'omit' })
      .then(async (res) => {
        if (res.ok) await cache.put(req.url, res.clone());
        return res;
      })
      .finally(() => inflight.delete(req.url));
    inflight.set(req.url, p);
  }
  return (await inflight.get(req.url)).clone();
}
