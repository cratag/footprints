// Background tile prefetch, into the browser cache (sw.js) or the `yarn dev` disk cache.
// Priority: visible tiles > selected day, step by step > other days, nearest first.
const Prefetch = (() => {
  const CACHE = 'footprints-tiles-v1'; // keep in sync with sw.js
  const CONCURRENCY = 2;
  const BATCH = 500;
  const BG_LIMIT = 20000;
  const DAY = { minZ: 10, maxZ: 16, pad: 1 };
  // OSM forbids bulk downloads at z ≥ 13 from the public server, so the browser stops at 12
  const BG = { local: { minZ: 10, maxZ: 16, pad: 1 }, browser: { minZ: 10, maxZ: 12, pad: 1 } };

  let enabled = false;
  let gen = 0; // bumped on start/stop to drop stale async work
  let backend = null;
  let days = null;
  let order = [];
  let seen = new Set();
  let urgent = [], bg = [];
  let active = 0, bgFetched = 0, mapBusy = false, filling = false;
  let focusDay = null;

  const local = {
    bg: BG.local,
    async missing(keys) {
      const out = [];
      for (let i = 0; i < keys.length; i += BATCH) {
        const res = await fetch('tiles/missing', { method: 'POST', body: JSON.stringify(keys.slice(i, i + BATCH)) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        out.push(...(await res.json()));
      }
      return out;
    },
    get: (key) => fetch(`tiles/prefetch/${key}`, { cache: 'no-store' }),
  };

  function browser(urlFor) {
    const open = () => caches.open(CACHE);
    return {
      bg: BG.browser,
      async missing(keys) {
        const cache = await open();
        const hits = await Promise.all(keys.map((k) => cache.match(urlFor(k))));
        return keys.filter((_, i) => !hits[i]);
      },
      async get(key) {
        const url = urlFor(key);
        const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
        // Without an active service worker nothing else stores it
        if (res.ok && !navigator.serviceWorker?.controller) await (await open()).put(url, res);
      },
    };
  }

  async function keysFor(list) {
    const keys = list.filter((k) => !seen.has(k));
    keys.forEach((k) => seen.add(k));
    return keys.length ? backend.missing(keys) : [];
  }

  // Day overview first, then each segment in playback order
  function dayTiles(segs) {
    const out = new Set(TileCover.tiles(segs, { ...DAY, maxZ: DAY.minZ - 1 }));
    for (const s of segs) for (const k of TileCover.tiles([s], { ...DAY, overviewZ: DAY.minZ })) out.add(k);
    return [...out];
  }

  // One day at a time to keep the main thread free
  async function refill() {
    if (filling || bgFetched >= BG_LIMIT) return;
    filling = true;
    const g = gen;
    try {
      while (!bg.length && order.length && g === gen) {
        const segs = days.get(order.shift());
        await new Promise((r) => setTimeout(r, 0));
        const keys = await keysFor(TileCover.tiles(segs, backend.bg));
        if (g === gen) bg.push(...keys);
      }
    } catch (e) {
      console.warn('[prefetch]', e.message);
    } finally {
      filling = false;
    }
    if (g === gen) pump();
  }

  function next() {
    if (urgent.length) return { key: urgent.shift(), fromBg: false };
    if (mapBusy || bgFetched >= BG_LIMIT || !bg.length) return null;
    return { key: bg.shift(), fromBg: true };
  }

  function pump() {
    if (!enabled) return;
    while (active < CONCURRENCY) {
      const job = next();
      if (!job) break;
      if (job.fromBg) bgFetched++;
      active++;
      const g = gen;
      backend.get(job.key)
        .catch(() => {})
        .finally(() => { active--; if (g === gen) pump(); });
    }
    if (!bg.length && !urgent.length && order.length) refill();
  }

  async function focus(dayKey) {
    if (!enabled || !days.has(dayKey) || dayKey === focusDay) return;
    focusDay = dayKey;
    const g = gen;
    order = order.filter((k) => k !== dayKey);
    try {
      const keys = await keysFor(dayTiles(days.get(dayKey)));
      if (g !== gen) return;
      if (focusDay !== dayKey) { bg.unshift(...keys); return; }
      bg.unshift(...urgent);
      urgent = keys;
      order.sort((a, b) => Math.abs(dayDiff(a, dayKey)) - Math.abs(dayDiff(b, dayKey)));
    } catch (e) {
      console.warn('[prefetch]', e.message);
    }
    pump();
  }

  const dayMs = (k) => Date.parse(`${k}T00:00:00Z`);
  const dayDiff = (a, b) => (dayMs(a) - dayMs(b)) / 86400000;

  // mode: 'local' (yarn dev) or 'browser'; urlFor maps "z/x/y" to the tile URL in browser mode
  function start(dayMap, currentDay, layer, { mode = 'browser', urlFor } = {}) {
    stop();
    if (mode === 'browser' && typeof caches === 'undefined') return;
    backend = mode === 'local' ? local : browser(urlFor);
    enabled = true;
    days = dayMap;
    order = [...dayMap.keys()].sort((a, b) => Math.abs(dayDiff(a, currentDay)) - Math.abs(dayDiff(b, currentDay)));
    if (layer && !layer._prefetchHooked) {
      layer._prefetchHooked = true;
      let t;
      const idle = () => { clearTimeout(t); mapBusy = false; pump(); };
      // Don't stay paused forever if 'load' never fires
      layer.on('loading', () => { mapBusy = true; clearTimeout(t); t = setTimeout(idle, 10000); });
      layer.on('load', idle);
    }
    mapBusy = !!layer?.isLoading?.();
    focus(currentDay);
  }

  function stop() {
    gen++;
    enabled = false;
    days = null;
    order = []; urgent = []; bg = [];
    seen = new Set();
    focusDay = null; bgFetched = 0;
  }

  return { start, stop, focus };
})();
