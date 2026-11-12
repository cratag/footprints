#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { getTile, exists } = require('./tiles.js');

const ROOT = path.resolve(__dirname, '..');
const START_PORT = Number(process.env.PORT) || 8000;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json',
};

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);

  if (p === '/tiles/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end('{"ok":true}');
  }
  // Returns the given "z/x/y" keys not yet cached
  if (p === '/tiles/missing' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 1e6) req.destroy(); });
    req.on('end', () => {
      try {
        const keys = JSON.parse(body);
        const out = keys.filter((k) => /^\d+\/\d+\/\d+$/.test(k) && !exists(...k.split('/')));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(out));
      } catch (e) { res.writeHead(400); res.end(e.message); }
    });
    return;
  }
  const pf = /^\/tiles\/prefetch\/(\d+)\/(\d+)\/(\d+)$/.exec(p);
  if (pf) {
    if (+pf[1] > 16) { res.writeHead(400); return res.end(); } // OSM forbids bulk downloads at z ≥ 17
    getTile(+pf[1], +pf[2], +pf[3], { priority: 'low' }).then(
      () => { res.writeHead(204); res.end(); },
      (e) => { res.writeHead(502); res.end(String(e.message)); },
    );
    return;
  }
  const t = /^\/tiles\/(\d+)\/(\d+)\/(\d+)\.png$/.exec(p);
  if (t) {
    getTile(+t[1], +t[2], +t[3]).then(
      ({ data }) => { res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=604800' }); res.end(data); },
      (e) => { res.writeHead(502); res.end(String(e.message)); },
    );
    return;
  }

  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
});

function listen(port) {
  server.once('error', (e) => {
    if (e.code === 'EADDRINUSE' && port < START_PORT + 20) listen(port + 1);
    else { console.error(e.message); process.exit(1); }
  });
  server.listen(port, '127.0.0.1', () => {
    const url = `http://localhost:${port}`;
    console.log(`\n  🗺️  Footprints running at ${url}\n  (Ctrl+C to stop)\n`);
    if (!process.env.NO_OPEN) {
      const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start ""' : 'xdg-open';
      exec(`${cmd} ${url}`);
    }
  });
}
listen(START_PORT);
