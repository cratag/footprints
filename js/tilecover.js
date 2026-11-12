const TileCover = (() => {
  const H = typeof Parser !== 'undefined' ? Parser : require('./parser.js');

  function lngToX(lng, z) { return Math.floor(((lng + 180) / 360) * 2 ** z); }
  function latToY(lat, z) {
    const r = (lat * Math.PI) / 180;
    return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z);
  }

  const isFoot = (m) => /WALK|RUN|FOOT|CYCL|BICYC/i.test(m || '');

  // [lat, lng, maxZoom] samples along the segments
  function points(segs, maxZ = 16) {
    const pts = [];
    for (const s of segs) {
      if (s.kind === 'visit') { if (s.loc) pts.push([s.loc[0], s.loc[1], maxZ]); continue; }
      const path = s.path || [];
      if (!path.length) continue;
      if (/FLY/i.test(s.mode || '')) { pts.push([...path[0], maxZ], [...path[path.length - 1], maxZ]); continue; }
      const zMax = isFoot(s.mode) ? maxZ : Math.min(maxZ, 14);
      for (let i = 0; i < path.length; i++) {
        const a = path[i], b = path[i + 1];
        pts.push([a[0], a[1], zMax]);
        if (!b) continue;
        const steps = Math.min(400, Math.ceil(H.haversine(a, b) / 300));
        for (let k = 1; k < steps; k++) pts.push([a[0] + ((b[0] - a[0]) * k) / steps, a[1] + ((b[1] - a[1]) * k) / steps, zMax]);
      }
    }
    return pts;
  }

  // "z/x/y" keys: bounding box below minZ (if small enough), `pad` tiles around each point above
  function tiles(segs, { minZ = 10, maxZ = 16, pad = 1, overviewZ = 5, maxOverview = 64 } = {}) {
    const pts = points(segs, maxZ);
    const out = new Set();
    if (!pts.length) return [];
    let s = 90, n = -90, w = 180, e = -180;
    for (const [lat, lng] of pts) { s = Math.min(s, lat); n = Math.max(n, lat); w = Math.min(w, lng); e = Math.max(e, lng); }
    for (let z = overviewZ; z < minZ; z++) {
      const N = 2 ** z;
      const x0 = Math.max(0, lngToX(w, z) - pad), x1 = Math.min(N - 1, lngToX(e, z) + pad);
      const y0 = Math.max(0, latToY(n, z) - pad), y1 = Math.min(N - 1, latToY(s, z) + pad);
      if ((x1 - x0 + 1) * (y1 - y0 + 1) > maxOverview) continue;
      for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) out.add(`${z}/${x}/${y}`);
    }
    for (let z = minZ; z <= maxZ; z++) {
      const N = 2 ** z;
      for (const [lat, lng, zMax] of pts) {
        if (z > zMax) continue;
        const x = lngToX(lng, z), y = latToY(lat, z);
        for (let dx = -pad; dx <= pad; dx++)
          for (let dy = -pad; dy <= pad; dy++) {
            const tx = (x + dx + N) % N, ty = y + dy;
            if (ty >= 0 && ty < N) out.add(`${z}/${tx}/${ty}`);
          }
      }
    }
    return [...out];
  }

  return { tiles, points, lngToX, latToY };
})();

if (typeof module !== 'undefined') module.exports = TileCover;
