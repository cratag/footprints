const fs = require('fs');
const path = require('path');

const TILES_DIR = path.resolve(__dirname, '..', 'maps', 'tiles');
const UPSTREAM = 'https://tile.openstreetmap.org';
const USER_AGENT = 'Footprints/1.0 (local Google Timeline viewer; personal use)';
let MAX_CONCURRENT = 6;

const tilePath = (z, x, y) => path.join(TILES_DIR, String(z), String(x), `${y}.png`);

// Visible tiles ('high') always go before prefetch ('low'), which uses at most LOW_MAX slots
const LOW_MAX = 2;
let active = 0, activeLow = 0;
const waiting = { high: [], low: [] };
const inflight = new Map();

function canRun(prio) {
  if (active >= MAX_CONCURRENT) return false;
  return prio === 'high' || (!waiting.high.length && activeLow < LOW_MAX);
}
function slot(w) {
  if (canRun(w.prio)) { take(w); return Promise.resolve(); }
  return new Promise((r) => { w.go = r; waiting[w.prio].push(w); });
}
function take(w) { active++; if (w.prio === 'low') activeLow++; w.running = true; }
function release(w) {
  active--;
  if (w.prio === 'low') activeLow--;
  for (const prio of ['high', 'low']) {
    while (waiting[prio].length && canRun(prio)) {
      const n = waiting[prio].shift();
      take(n);
      n.go();
    }
  }
}
// A visible request for a queued 'low' tile promotes it
function boost(w) {
  if (w.prio === 'high') return;
  const i = waiting.low.indexOf(w);
  if (i >= 0) {
    waiting.low.splice(i, 1);
    w.prio = 'high';
    if (canRun('high')) { take(w); w.go(); } else waiting.high.push(w);
  } else if (!w.running) w.prio = 'high';
}

const exists = (z, x, y) => fs.existsSync(tilePath(z, x, y));

function getTile(z, x, y, { priority = 'high' } = {}) {
  const file = tilePath(z, x, y);
  if (fs.existsSync(file)) return fs.promises.readFile(file).then((data) => ({ data, cached: true }));
  const key = `${z}/${x}/${y}`;
  const cur = inflight.get(key);
  if (cur) { if (priority === 'high') boost(cur.waiter); return cur.promise; }
  const waiter = { prio: priority, running: false };
  const promise = (async () => {
    await slot(waiter);
    try {
      const res = await fetch(`${UPSTREAM}/${z}/${x}/${y}.png`, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = Buffer.from(await res.arrayBuffer());
      await fs.promises.mkdir(path.dirname(file), { recursive: true });
      const tmp = `${file}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
      await fs.promises.writeFile(tmp, data);
      await fs.promises.rename(tmp, file);
      return { data, cached: false };
    } finally {
      release(waiter);
      inflight.delete(key);
    }
  })();
  inflight.set(key, { promise, waiter });
  return promise;
}

function lngToX(lng, z) { return Math.floor(((lng + 180) / 360) * 2 ** z); }
function latToY(lat, z) {
  const r = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z);
}

module.exports = { TILES_DIR, tilePath, getTile, exists, lngToX, latToY, setConcurrency: (n) => { MAX_CONCURRENT = n; } };
