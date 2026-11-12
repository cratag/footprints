#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const Parser = require('../js/parser.js');
const TileCover = require('../js/tilecover.js');
const { getTile, tilePath, TILES_DIR, setConcurrency } = require('./tiles.js');
setConcurrency(2);

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? Number(args[i + 1]) : def;
};
const files = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--') && args[i - 1] !== '--dry'));
// OSM forbids bulk downloads at zoom ≥ 17
const MIN_Z = opt('min', 10);
const MAX_Z = Math.min(opt('max', 16), 16);
const LIMIT = opt('limit', 20000);

if (!files.length) {
  console.log('Usage: yarn map:download <file.json> [--min 10] [--max 16] [--limit 20000] [--since YYYY-MM-DD] [--dry]');
  process.exit(1);
}

const parts = [];
for (const f of files) {
  if (/\.zip$/i.test(f)) { console.error(`✗ ${f}: unzip the .zip and pass the .json file`); continue; }
  try {
    const p = Parser.parseAny(JSON.parse(fs.readFileSync(f, 'utf8')));
    if (p) parts.push(p); else console.error(`✗ ${f}: unrecognized format`);
  } catch (e) { console.error(`✗ ${f}: ${e.message}`); }
}
if (!parts.length) process.exit(1);
const segs = Parser.finalize(parts);

const SINCE = (() => { const i = args.indexOf('--since'); return i >= 0 ? args[i + 1] : null; })();

const all = TileCover.tiles(SINCE ? segs.filter((s) => Parser.dayKey(s.end) >= SINCE) : segs, { minZ: MIN_Z, maxZ: MAX_Z, pad: 1, overviewZ: MIN_Z });
const missing = all.filter((k) => { const [z, x, y] = k.split('/'); return !fs.existsSync(tilePath(z, x, y)); });
console.log(`\n  ${segs.length} segments · zoom ${MIN_Z}–${MAX_Z} · ${all.length} tiles (${all.length - missing.length} already saved, ${missing.length} to download)`);
if (missing.length > LIMIT) {
  console.log(`  ✗ More than ${LIMIT}. Lower --max or raise --limit if you really need them.\n`);
  process.exit(1);
}
if (!missing.length) { console.log('  ✓ All done.\n'); process.exit(0); }
if (args.includes('--dry')) { console.log('  (--dry: nothing was downloaded)\n'); process.exit(0); }

(async () => {
  let done = 0, failed = 0;
  const t0 = Date.now();
  const tick = () => {
    const pct = Math.round(((done + failed) / missing.length) * 100);
    process.stdout.write(`\r  Downloading… ${done + failed}/${missing.length} (${pct}%)${failed ? ` · ${failed} failed` : ''}   `);
  };
  await Promise.all(missing.map((k) => {
    const [z, x, y] = k.split('/').map(Number);
    return getTile(z, x, y).then(() => { done++; tick(); }, () => { failed++; tick(); });
  }));
  const mb = (dirSize(TILES_DIR) / 1e6).toFixed(1);
  console.log(`\n  ✓ ${done} downloaded in ${Math.round((Date.now() - t0) / 1000)} s · maps/tiles takes ${mb} MB\n`);
})();

function dirSize(dir) {
  let total = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    total += e.isDirectory() ? dirSize(p) : fs.statSync(p).size;
  }
  return total;
}
