const Parser = (() => {
  const E7_WRAP = 4294967296;

  function e7(v) {
    let n = Number(v);
    if (n > 1800000000) n -= E7_WRAP;
    return n / 1e7;
  }

  function parseLatLng(v) {
    if (v == null) return null;
    if (typeof v === 'string') {
      const parts = v.replace(/^geo:/i, '').replace(/°/g, '').split(',').map((x) => parseFloat(x.trim()));
      return parts.length >= 2 && isFinite(parts[0]) && isFinite(parts[1]) ? [parts[0], parts[1]] : null;
    }
    if (typeof v === 'object') {
      if (Array.isArray(v)) return v.length >= 2 ? [+v[0], +v[1]] : null;
      if ('latitudeE7' in v) return [e7(v.latitudeE7), e7(v.longitudeE7)];
      if ('latE7' in v) return [e7(v.latE7), e7(v.lngE7)];
      if ('latLng' in v) return parseLatLng(v.latLng);
      if ('LatLng' in v) return parseLatLng(v.LatLng);
      if ('point' in v) return parseLatLng(v.point);
      if ('latitude' in v) return [+v.latitude, +v.longitude];
      if ('lat' in v) return [+v.lat, +(v.lng ?? v.lon)];
    }
    return null;
  }

  function parseTime(s, offsetMin) {
    if (s == null || s === '') return null;
    if (typeof s === 'number' || /^\d{10,}$/.test(s)) {
      const ms = Number(s);
      return { ms, off: offsetMin ?? -new Date(ms).getTimezoneOffset() };
    }
    const ms = Date.parse(s);
    if (isNaN(ms)) return null;
    let off = offsetMin;
    if (off == null) {
      const m = /T.*([+-])(\d{2}):?(\d{2})$/.exec(s);
      off = m ? (m[1] === '-' ? -1 : 1) * (+m[2] * 60 + +m[3]) : -new Date(ms).getTimezoneOffset();
    }
    return { ms, off };
  }

  const num = (v) => (v == null || v === '' || isNaN(+v) ? null : +v);

  const MAX_ACCURACY_M = 100;
  function parseRawPositions(list) {
    const out = [];
    for (const r of list || []) {
      const pos = r?.position || r?.rawSignal?.signal?.position || r?.signal?.position;
      if (!pos) continue;
      const acc = pos.accuracyMeters ?? (pos.accuracyMm != null ? pos.accuracyMm / 1000 : null);
      if (acc != null && acc > MAX_ACCURACY_M) continue;
      const loc = parseLatLng(pos.LatLng ?? pos.latLng ?? pos.point);
      const ms = parseTime(pos.timestamp)?.ms;
      if (loc && ms != null) out.push({ loc, ms });
    }
    return out;
  }

  function parseSemanticSegments(list) {
    const segs = [];
    const points = [];
    for (const s of list) {
      if (!s || typeof s !== 'object') continue;
      const off = num(s.startTimeTimezoneUtcOffsetMinutes);
      const start = parseTime(s.startTime, off ?? undefined);
      const end = parseTime(s.endTime, num(s.endTimeTimezoneUtcOffsetMinutes) ?? off ?? undefined);
      if (!start || !end) continue;

      if (s.visit) {
        const c = s.visit.topCandidate || {};
        const loc = parseLatLng(c.placeLocation);
        if (!loc) continue;
        segs.push({
          kind: 'visit', start, end, loc,
          semantic: c.semanticType || null,
          placeId: c.placeId || c.placeID || null,
          level: num(s.visit.hierarchyLevel) || 0,
          name: null, address: null,
        });
      } else if (s.activity) {
        const a = s.activity;
        const c = a.topCandidate || {};
        segs.push({
          kind: 'move', start, end,
          from: parseLatLng(a.start), to: parseLatLng(a.end),
          mode: c.type || null,
          distance: num(a.distanceMeters),
          path: null, stops: [],
        });
      } else if (Array.isArray(s.timelinePath)) {
        for (const p of s.timelinePath) {
          const loc = parseLatLng(p.point);
          if (!loc) continue;
          let ms = null;
          if (p.time) ms = parseTime(p.time)?.ms ?? null;
          else if (p.durationMinutesOffsetFromStartTime != null) ms = start.ms + num(p.durationMinutesOffsetFromStartTime) * 60000;
          if (ms != null) points.push({ loc, ms });
        }
      }
    }
    return { segs, points };
  }

  function takeoutDuration(d) {
    if (!d) return [null, null];
    return [
      parseTime(d.startTimestamp ?? d.startTimestampMs),
      parseTime(d.endTimestamp ?? d.endTimestampMs),
    ];
  }

  function parseTakeout(objs) {
    const segs = [];
    for (const o of objs) {
      if (o.placeVisit) {
        const v = o.placeVisit;
        const L = v.location || {};
        const [start, end] = takeoutDuration(v.duration);
        const loc = parseLatLng(L) || parseLatLng(v.centerLatE7 != null ? { latE7: v.centerLatE7, lngE7: v.centerLngE7 } : null);
        if (!start || !end || !loc) continue;
        segs.push({
          kind: 'visit', start, end, loc,
          name: L.name || null, address: L.address || null,
          semantic: L.semanticType || null, placeId: L.placeId || null, level: 0,
        });
      } else if (o.activitySegment) {
        const a = o.activitySegment;
        const [start, end] = takeoutDuration(a.duration);
        if (!start || !end) continue;
        let path = null;
        const raw = a.simplifiedRawPath?.points;
        const wp = a.waypointPath?.waypoints;
        if (Array.isArray(wp) && wp.length > 1) path = wp.map(parseLatLng).filter(Boolean);
        else if (Array.isArray(raw) && raw.length > 1) path = raw.map(parseLatLng).filter(Boolean);
        const from = parseLatLng(a.startLocation);
        const to = parseLatLng(a.endLocation);
        if (path) {
          if (from) path.unshift(from);
          if (to) path.push(to);
        }
        const stops = (a.transitPath?.transitStops || [])
          .map((st) => ({ name: st.name || null, loc: parseLatLng(st) }))
          .filter((st) => st.loc);
        segs.push({
          kind: 'move', start, end, from, to,
          mode: a.activityType || a.activities?.[0]?.activityType || null,
          distance: num(a.distance ?? a.waypointPath?.distanceMeters),
          path, stops,
        });
      }
    }
    return { segs, points: [] };
  }

  function parseTimelineEdits(list) {
    const flat = (s) => ({ ...s, ...(s.segment || {}) });
    const edited = list.filter((e) => e.userEditedSemanticSegment).map((e) => flat(e.userEditedSemanticSegment));
    const inferred = list.filter((e) => e.inferredSemanticSegment).map((e) => flat(e.inferredSemanticSegment));

    const a = parseSemanticSegments(edited);
    const b = parseSemanticSegments(inferred);
    const overlaps = (x, y) => Math.min(x.end.ms, y.end.ms) - Math.max(x.start.ms, y.start.ms) > 0.5 * Math.min(x.end.ms - x.start.ms, y.end.ms - y.start.ms);
    const segs = a.segs.concat(b.segs.filter((s) => !a.segs.some((u) => overlaps(s, u))));

    const raw = parseRawPositions(list);
    return { segs, points: [], raw };
  }

  function parseAny(data) {
    if (Array.isArray(data)) {
      if (data.some((x) => x && (x.visit || x.activity || x.timelinePath))) return parseSemanticSegments(data);
      if (data.some((x) => x && (x.placeVisit || x.activitySegment))) return parseTakeout(data);
    } else if (data && typeof data === 'object') {
      if (data.format === 'footprints' && Array.isArray(data.segments)) return { segs: data.segments, points: [] };
      if (Array.isArray(data.semanticSegments)) {
        const r = parseSemanticSegments(data.semanticSegments);
        r.raw = parseRawPositions(data.rawSignals);
        return r;
      }
      if (Array.isArray(data.timelineObjects)) return parseTakeout(data.timelineObjects);
      if (Array.isArray(data.timelineEdits)) return parseTimelineEdits(data.timelineEdits);
    }
    return null;
  }

  function lowerBound(arr, ms) {
    let lo = 0, hi = arr.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (arr[mid].ms < ms) lo = mid + 1; else hi = mid;
    }
    return lo;
  }

  function finalize(parts) {
    let segs = [];
    let points = [];
    let raw = [];
    for (const p of parts) {
      segs = segs.concat(p.segs);
      points = points.concat(p.points || []);
      raw = raw.concat(p.raw || []);
    }
    points.sort((a, b) => a.ms - b.ms);
    raw.sort((a, b) => a.ms - b.ms);
    const window = (from, to) => {
      const r = raw.slice(lowerBound(raw, from), lowerBound(raw, to + 1));
      if (r.length >= 2) return r;
      return points.slice(lowerBound(points, from), lowerBound(points, to + 1));
    };

    const seen = new Set();
    segs = segs.filter((s) => {
      const k = `${s.kind}|${s.start.ms}|${s.end.ms}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    segs.sort((a, b) => a.start.ms - b.start.ms || (a.kind === 'visit' ? -1 : 1));

    segs = segs.filter((s) => s.kind !== 'visit' || !s.level);

    const GAP = 10 * 60000;
    segs.forEach((s, k) => {
      if (s.kind !== 'move') return;
      if (!s.path || s.path.length < 2) {
        const prev = segs[k - 1], next = segs[k + 1];
        if (prev && prev.kind === 'visit' && Math.abs(prev.end.ms - s.start.ms) <= GAP) s.from = prev.loc;
        if (next && next.kind === 'visit' && Math.abs(next.start.ms - s.end.ms) <= GAP) s.to = next.loc;
        const mid = window(s.start.ms, s.end.ms).map((p) => p.loc);
        s.path = despike([s.from, ...mid, s.to].filter(Boolean));
      }
      s.path = simplify(s.path, toleranceFor(s.mode));
      if (!s.from && s.path.length) s.from = s.path[0];
      if (!s.to && s.path.length) s.to = s.path[s.path.length - 1];
      if (s.distance == null && s.path.length > 1) s.distance = pathLength(s.path);
    });
    return segs.filter((s) => s.kind === 'visit' || (s.path && s.path.length >= 1));
  }

  function despike(path) {
    const out = [];
    for (const p of path) {
      const last = out[out.length - 1];
      if (!last || haversine(last, p) > 5) out.push(p);
    }
    let changed = true;
    while (changed && out.length > 2) {
      changed = false;
      for (let i = 1; i < out.length - 1; i++) {
        const ab = haversine(out[i - 1], out[i]), bc = haversine(out[i], out[i + 1]), ac = haversine(out[i - 1], out[i + 1]);
        if (ab > 60 && bc > 60 && ab + bc > 1.7 * ac + 60) { out.splice(i, 1); changed = true; break; }
      }
    }
    return out;
  }

  function toleranceFor(mode) {
    const m = String(mode || '').toUpperCase();
    if (m.includes('FLY')) return Infinity;
    if (m.includes('WALK') || m.includes('RUN') || m.includes('FOOT')) return 70;
    if (m.includes('CYCL') || m.includes('BICYC')) return 100;
    return 180;
  }

  /** Douglas–Peucker. */
  function simplify(path, tol) {
    if (path.length <= 2) return path;
    if (!isFinite(tol)) return [path[0], path[path.length - 1]];
    const lat0 = (path[0][0] * Math.PI) / 180;
    const P = path.map((p) => [p[1] * 111320 * Math.cos(lat0), p[0] * 110540]);
    const keep = new Uint8Array(path.length);
    keep[0] = keep[path.length - 1] = 1;
    const stack = [[0, path.length - 1]];
    while (stack.length) {
      const [a, b] = stack.pop();
      let maxD = 0, idx = -1;
      const [ax, ay] = P[a], [bx, by] = P[b];
      const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
      for (let i = a + 1; i < b; i++) {
        const [px, py] = P[i];
        let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
        t = Math.max(0, Math.min(1, t));
        const d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
        if (d > maxD) { maxD = d; idx = i; }
      }
      if (maxD > tol) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
    }
    return path.filter((_, i) => keep[i]);
  }

  function haversine(a, b) {
    const R = 6371000, toR = Math.PI / 180;
    const dLat = (b[0] - a[0]) * toR, dLng = (b[1] - a[1]) * toR;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * toR) * Math.cos(b[0] * toR) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function pathLength(path) {
    let d = 0;
    for (let i = 1; i < path.length; i++) d += haversine(path[i - 1], path[i]);
    return d;
  }

  function shifted(t) { return new Date(t.ms + t.off * 60000); }
  function dayKey(t) { return shifted(t).toISOString().slice(0, 10); }
  function nextKey(key) {
    const d = new Date(key + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  function groupByDay(segs) {
    const days = new Map();
    for (const s of segs) {
      let k = dayKey(s.start);
      const last = dayKey({ ms: Math.max(s.start.ms, s.end.ms - 1), off: s.end.off });
      for (let guard = 0; guard < 40; guard++) {
        if (!days.has(k)) days.set(k, []);
        days.get(k).push(s);
        if (k >= last) break;
        k = nextKey(k);
      }
    }
    return days;
  }

  return { parseAny, finalize, groupByDay, dayKey, shifted, haversine, pathLength, parseLatLng };
})();

if (typeof module !== 'undefined') module.exports = Parser;
