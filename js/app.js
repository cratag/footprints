(() => {
  const $ = (s) => document.querySelector(s);
  const { t, tn } = I18n;
  const locale = () => I18n.lang;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const MODES = {
    WALKING: { icon: '🚶', color: '#2f9e44' },
    RUNNING: { icon: '🏃', color: '#5c940d' },
    CYCLING: { icon: '🚲', color: '#0ca678' },
    IN_PASSENGER_VEHICLE: { icon: '🚗', color: '#1c7ed6' },
    MOTORCYCLING: { icon: '🏍️', color: '#4263eb' },
    IN_TAXI: { icon: '🚕', color: '#f08c00' },
    IN_BUS: { icon: '🚌', color: '#e8590c' },
    IN_SUBWAY: { icon: '🚇', color: '#ae3ec9' },
    IN_TRAIN: { icon: '🚆', color: '#7048e8' },
    IN_TRAM: { icon: '🚊', color: '#d6336c' },
    PUBLIC_TRANSIT: { icon: '🚍', color: '#e8590c' },
    FLYING: { icon: '✈️', color: '#0b7285' },
    IN_FERRY: { icon: '⛴️', color: '#1098ad' },
    SKIING: { icon: '⛷️', color: '#3bc9db' },
    UNKNOWN: { icon: '📍', color: '#868e96' },
  };
  const MODE_ALIAS = {
    IN_VEHICLE: 'IN_PASSENGER_VEHICLE', DRIVING: 'IN_PASSENGER_VEHICLE', IN_CAR: 'IN_PASSENGER_VEHICLE',
    ON_FOOT: 'WALKING', ON_BICYCLE: 'CYCLING', SAILING: 'IN_FERRY', IN_RAIL_VEHICLE: 'IN_TRAIN',
    IN_CABLECAR: 'IN_TRAM', IN_GONDOLA_LIFT: 'IN_TRAM', IN_FUNICULAR: 'IN_TRAM',
  };
  const EDIT_MODES = [
    { key: 'WALKING', group: ['WALKING', 'RUNNING'] },
    { key: 'IN_TAXI' },
    { key: 'MOTORCYCLING' },
    { key: 'IN_PASSENGER_VEHICLE' },
    { key: 'PUBLIC_TRANSIT', group: ['PUBLIC_TRANSIT', 'IN_BUS', 'IN_SUBWAY', 'IN_TRAIN', 'IN_TRAM'] },
    { key: 'FLYING' },
    { key: 'IN_FERRY' },
    { key: 'UNKNOWN' },
  ];
  const editModeOf = (key) => EDIT_MODES.find((o) => (o.group || [o.key]).includes(key)) || null;
  function modeOf(m) {
    let k = String(m || 'UNKNOWN').toUpperCase().replace(/[\s-]+/g, '_');
    k = MODE_ALIAS[k] || k;
    if (!MODES[k]) k = 'UNKNOWN';
    return { key: k, label: t(`mode_${k}`), ...MODES[k] };
  }

  const pad = (n) => String(n).padStart(2, '0');
  const fmtTime = (t) => { const d = Parser.shifted(t); return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`; };
  function fmtDur(ms) {
    const m = Math.max(1, Math.round(ms / 60000));
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60), r = m % 60;
    return r ? `${h} h ${r} min` : `${h} h`;
  }
  function fmtDist(m) {
    if (m == null) return '';
    return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toLocaleString(locale(), { maximumFractionDigits: m < 10000 ? 1 : 0 })} km`;
  }
  const keyDate = (key) => new Date(key + 'T12:00:00Z');
  const fmtDay = (key) => keyDate(key).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const fmtShortDay = (key) => keyDate(key).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function semanticKind(v) {
    const s = String(v.semantic || '').toUpperCase();
    if (s.includes('HOME')) return 'home';
    if (s.includes('WORK')) return 'work';
    return null;
  }
  function placeInfo(v) {
    const kind = semanticKind(v);
    let geo = null;
    if (!v.name && state.geocode) {
      geo = Geocode.lookup(v.loc, () => onGeocoded());
    }
    const semanticName = kind === 'home' ? t('home') : kind === 'work' ? t('work') : null;
    const name = v.name || semanticName || geo?.name || t('unnamedPlace');
    const address = v.address || (geo && geo.name !== name ? [geo.name, geo.address].filter(Boolean).join(', ') : geo?.address) || '';
    return { name, address, kind };
  }

  const state = {
    days: new Map(),
    dayKeys: [],
    day: null,
    steps: [],
    places: [],
    idx: 0,
    playing: false,
    calMonth: null,
    geocode: true,
    segs: [],
    source: 'file', // 'file' | 'demo'
    editing: null,
  };

  let map, tiles, layer;
  function initMap() {
    if (map) return;
    map = L.map('map', { zoomControl: false, attributionControl: true, zoomSnap: 0.25 });
    L.control.zoom({ position: 'topright' }).addTo(map);
    setTiles();
    layer = L.layerGroup().addTo(map);
    map.setView([20, 0], 2);
    map.on('click', (e) => {
      const sheetWasOpen = document.body.classList.contains('sheet-open');
      setSheet(false);
      if (sheetWasOpen && window.innerWidth < 860) return;
      if (e.originalEvent?.target?.closest?.('.leaflet-tooltip')) return;
      showPick(e.latlng);
    });
    keepStrokeOnZoom();
  }
  function keepStrokeOnZoom() {
    const upd = L.SVG.prototype._updateStyle;
    L.SVG.include({ _updateStyle(l) { upd.call(this, l); l._path?.style.setProperty('--w', l.options.weight); } });
    const el = map.getContainer();
    let base = map.getZoom();
    const set = (z) => el.style.setProperty('--zs', map.getZoomScale(z, base));
    map.on('zoomanim', (e) => set(e.zoom));
    map.on('zoom', () => set(map.getZoom()));
    map.on('viewreset moveend', () => { base = map.getZoom(); el.style.setProperty('--zs', 1); });
  }
  function setSheet(open) {
    document.body.classList.toggle('sheet-open', open);
    $('#sheet-toggle').setAttribute('aria-expanded', open);
  }
  // Mobile bottom sheet: drag the header up/down, or pull the content down when scrolled to top.
  let sheetDragged = false;
  function initSheetDrag() {
    const sheet = $('#sidebar'), handle = $('#sheet-toggle'), body = $('#sheet-body');
    const mobile = matchMedia('(max-width: 860px)');
    let drag = null;

    const start = (y, fromBody) => {
      const open = document.body.classList.contains('sheet-open');
      const max = sheet.offsetHeight - handle.offsetHeight;
      drag = { y0: y, lastY: y, lastT: performance.now(), v: 0, max, base: open ? 0 : max, open, fromBody, active: false, pos: 0 };
    };
    const move = (y, e) => {
      if (!drag) return;
      const dy = y - drag.y0;
      if (!drag.active) {
        if (Math.abs(dy) < 6) return;
        // From content: only take over a downward pull while scrolled to top.
        if (drag.fromBody && (dy < 0 || body.scrollTop > 0)) { drag = null; return; }
        drag.active = true;
        sheet.style.transition = 'none';
      }
      e?.cancelable && e.preventDefault();
      const now = performance.now();
      drag.v = (y - drag.lastY) / Math.max(1, now - drag.lastT);
      drag.lastY = y; drag.lastT = now;
      drag.pos = Math.min(drag.max, Math.max(0, drag.base + dy));
      sheet.style.transform = `translateY(${drag.pos}px)`;
    };
    const end = () => {
      if (!drag) return;
      const d = drag; drag = null;
      if (!d.active) return;
      sheetDragged = !d.fromBody; // swallow the click that follows a header drag
      sheet.style.transition = '';
      sheet.style.transform = '';
      const open = Math.abs(d.v) > 0.4 ? d.v < 0 : d.pos < d.max / 2;
      setSheet(open);
      setTimeout(() => { sheetDragged = false; }, 50);
    };

    handle.style.touchAction = 'none';
    handle.addEventListener('pointerdown', (e) => {
      if (!mobile.matches || (e.pointerType === 'mouse' && e.button !== 0)) return;
      handle.setPointerCapture(e.pointerId);
      start(e.clientY, false);
    });
    handle.addEventListener('pointermove', (e) => move(e.clientY, e));
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);

    body.addEventListener('touchstart', (e) => {
      if (!mobile.matches || !document.body.classList.contains('sheet-open') || e.touches.length !== 1) return;
      start(e.touches[0].clientY, true);
    }, { passive: true });
    body.addEventListener('touchmove', (e) => { if (drag?.fromBody) move(e.touches[0].clientY, e); }, { passive: false });
    body.addEventListener('touchend', () => { if (drag?.fromBody) end(); });
    body.addEventListener('touchcancel', () => { if (drag?.fromBody) end(); });
  }
  const OSM_URL ='https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  let localTiles = Promise.resolve(false);
  function setTiles() {
    if (tiles) return;
    tiles = L.tileLayer(OSM_URL, {
      maxZoom: 19, className: 'map-tiles', crossOrigin: true, // CORS lets sw.js cache tiles
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    localTiles = fetch('tiles/health', { cache: 'no-store' })
      .then((r) => r.ok && r.json())
      .then((j) => { if (j && j.ok) { tiles.setUrl('tiles/{z}/{x}/{y}.png'); return true; } return false; })
      .catch(() => false);
  }

  function buildSteps(segs) {
    const steps = [];
    if (!segs.length) return steps;
    const first = segs[0];
    let i = 0;
    if (first.kind === 'visit') { steps.push({ type: 'start', visit: first, loc: first.loc }); i = 1; }
    else steps.push({ type: 'start', loc: first.from || first.path[0], time: first.start });
    for (; i < segs.length; i++) {
      const s = segs[i];
      if (s.kind === 'move') {
        const next = segs[i + 1];
        const arrival = next && next.kind === 'visit' ? next : null;
        const st = { type: 'move', move: s, arrival };
        const end = !arrival && (s.to || s.path[s.path.length - 1]);
        if (end) st.endpoint = { kind: 'endpoint', loc: end, start: s.end, end: s.end };
        steps.push(st);
        if (arrival) i++;
      } else {
        steps.push({ type: 'visit', visit: s });
      }
    }
    const places = [];
    for (const st of steps) {
      const v = st.visit || st.arrival || st.endpoint;
      if (!v) continue;
      let p = places.find((pl) => (v.placeId && pl.placeId === v.placeId) || Parser.haversine(pl.loc, v.loc) < 60);
      if (!p) { p = { id: places.length, loc: v.loc, placeId: v.placeId, visit: v }; places.push(p); }
      else if (p.visit.kind === 'endpoint' && v.kind !== 'endpoint') { p.visit = v; p.loc = v.loc; p.placeId = v.placeId; }
      st.place = p;
    }
    return { steps, places };
  }

  function loadSegments(segs, source = 'file') {
    state.segs = segs;
    state.source = source;
    state.editing = null;
    state.days = Parser.groupByDay(segs);
    state.dayKeys = [...state.days.keys()].sort();
    $('#upload-view').classList.add('hidden');
    $('#app-view').classList.remove('hidden');
    document.body.classList.remove('sheet-ready');
    requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('sheet-ready')));
    initMap();
    setTimeout(() => map.invalidateSize(), 50);
    const last = state.dayKeys[state.dayKeys.length - 1];
    selectDay(last);
    startPrefetch();
  }

  function startPrefetch() {
    Prefetch.stop();
    if (state.source !== 'file') return;
    const days = state.days;
    localTiles.then((ok) => {
      if (state.days !== days) return;
      const urlFor = (k) => { const [z, x, y] = k.split('/'); return L.Util.template(OSM_URL, { z, x, y }); };
      Prefetch.start(days, state.day, tiles, ok ? { mode: 'local' } : { mode: 'browser', urlFor });
    });
  }

  function dayStats(key) {
    const segs = state.days.get(key) || [];
    const moves = segs.filter((s) => s.kind === 'move');
    const visits = new Set();
    segs.filter((s) => s.kind === 'visit').forEach((v) => visits.add(v.placeId || `${v.loc[0].toFixed(3)},${v.loc[1].toFixed(3)}`));
    const byMode = {};
    let dist = 0;
    for (const m of moves) {
      const md = modeOf(m.mode);
      byMode[md.key] = byMode[md.key] || { ...md, dist: 0, time: 0 };
      byMode[md.key].dist += m.distance || 0;
      byMode[md.key].time += m.end.ms - m.start.ms;
      dist += m.distance || 0;
    }
    return { moves: moves.length, places: visits.size, dist, byMode };
  }

  function selectDay(key) {
    if (!key || !state.days.has(key)) return;
    stopPlay();
    Geocode.clearQueue();
    state.day = key;
    state.calMonth = key.slice(0, 7);
    const built = buildSteps(state.days.get(key));
    state.steps = built.steps || [];
    state.places = built.places || [];
    state.idx = 0;

    state.editing = null;
    renderDayHead();

    const i = state.dayKeys.indexOf(key);
    $('#day-prev').disabled = i <= 0;
    $('#day-next').disabled = i >= state.dayKeys.length - 1;

    renderCalendar();
    renderSteps();
    $('#steps').classList.remove('fade-in'); void $('#steps').offsetWidth; $('#steps').classList.add('fade-in');
    go(0, { animate: true });
    Prefetch.focus(key);
  }

  function renderDayHead() {
    const key = state.day;
    $('#day-title').textContent = cap(fmtDay(key));
    $('#sheet-day').textContent = cap(fmtDay(key));
    const st = dayStats(key);
    const bits = [];
    bits.push(tn('trips', st.moves));
    if (st.dist) bits.push(fmtDist(st.dist));
    bits.push(tn('places', st.places));
    $('#day-sub').textContent = bits.join(' · ');
    const modes = Object.values(st.byMode).sort((a, b) => b.dist - a.dist);
    const totalDist = modes.reduce((a, m) => a + m.dist, 0) || 1;
    $('#day-modes').innerHTML = modes.length
      ? `<div class="mode-bar">${modes.map((m) => `<span style="flex:${Math.max(m.dist / totalDist, 0.04)};background:${m.color}" title="${esc(m.label)} · ${fmtDist(m.dist)}"></span>`).join('')}</div>
         <div class="mode-chips">${modes.map((m) => `<span class="chip"><i style="background:${m.color}"></i>${m.icon} ${fmtDist(m.dist) || fmtDur(m.time)}</span>`).join('')}</div>`
      : '';
  }

  function renderWeekdays() {
    const el = $('#cal-dow');
    if (el.dataset.lang === locale()) return;
    el.dataset.lang = locale();
    el.innerHTML = Array.from({ length: 7 }, (_, i) =>
      `<span>${esc(cap(new Date(Date.UTC(2024, 0, 1 + i)).toLocaleDateString(locale(), { weekday: 'narrow', timeZone: 'UTC' })))}</span>`).join('');
  }
  function renderCalendar() {
    const [y, m] = state.calMonth.split('-').map(Number);
    const first = new Date(Date.UTC(y, m - 1, 1));
    const daysIn = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const lead = (first.getUTCDay() + 6) % 7;
    renderWeekdays();
    $('#cal-title').textContent = cap(first.toLocaleDateString(locale(), { month: 'long', year: 'numeric', timeZone: 'UTC' }));

    let maxDist = 1;
    const distCache = {};
    for (let d = 1; d <= daysIn; d++) {
      const k = `${state.calMonth}-${pad(d)}`;
      if (state.days.has(k)) { distCache[k] = dayStats(k).dist; maxDist = Math.max(maxDist, distCache[k]); }
    }
    let html = '';
    for (let i = 0; i < lead; i++) html += '<span></span>';
    for (let d = 1; d <= daysIn; d++) {
      const k = `${state.calMonth}-${pad(d)}`;
      const has = state.days.has(k);
      const lvl = has ? Math.ceil((distCache[k] / maxDist) * 3) : 0;
      html += `<button class="cal-day${has ? ' has' : ''}${k === state.day ? ' sel' : ''}" data-key="${k}" ${has ? '' : 'disabled'}>
        <span>${d}</span>${has ? `<i class="lvl${lvl}"></i>` : ''}</button>`;
    }
    $('#cal-grid').innerHTML = html;
    const firstKey = state.dayKeys[0].slice(0, 7), lastKey = state.dayKeys[state.dayKeys.length - 1].slice(0, 7);
    $('#cal-prev').disabled = state.calMonth <= firstKey;
    $('#cal-next').disabled = state.calMonth >= lastKey;
  }
  function shiftMonth(delta) {
    const [y, m] = state.calMonth.split('-').map(Number);
    const d = new Date(Date.UTC(y, m - 1 + delta, 1));
    state.calMonth = d.toISOString().slice(0, 7);
    renderCalendar();
  }

  function stepText(st) {
    if (st.type === 'start') {
      const p = st.visit ? placeInfo(st.visit) : null;
      return {
        icon: p?.kind === 'home' ? '🏠' : '◉', color: 'var(--primary)',
        time: st.visit ? (Parser.dayKey(st.visit.start) < state.day ? '00:00' : fmtTime(st.visit.start)) : fmtTime(st.time),
        title: p ? t('startAt', { place: p.name }) : t('dayStart'),
        sub: st.visit ? t('untilTime', { time: fmtTime(st.visit.end) }) : t('alreadyMoving'),
      };
    }
    if (st.type === 'move') {
      const md = modeOf(st.move.mode);
      const dest = st.arrival || st.endpoint;
      const p = dest ? placeInfo(dest) : null;
      return {
        icon: md.icon, color: md.color,
        time: fmtTime(st.move.start),
        title: p ? t('moveTo', { mode: md.label, place: p.name }) : md.label,
        sub: [fmtDur(st.move.end.ms - st.move.start.ms), fmtDist(st.move.distance), st.arrival ? t('stay', { dur: fmtDur(st.arrival.end.ms - st.arrival.start.ms) }) : null].filter(Boolean).join(' · '),
      };
    }
    const p = placeInfo(st.visit);
    return {
      icon: p.kind === 'home' ? '🏠' : p.kind === 'work' ? '💼' : '📍', color: 'var(--primary)',
      time: fmtTime(st.visit.start),
      title: p.name,
      sub: `${fmtTime(st.visit.start)}–${fmtTime(st.visit.end)} · ${fmtDur(st.visit.end.ms - st.visit.start.ms)}`,
    };
  }

  const EDIT_SVG = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';

  function updateExportBtn() {
    $('#export-btn').classList.toggle('hidden', !state.segs.some((s) => s.orig));
  }

  function renderSteps() {
    updateExportBtn();
    $('#steps').classList.remove('fade-in');
    $('#steps').innerHTML = state.steps.map((st, i) => {
      const tx = stepText(st);
      const edited = stepSegs(st).some((s) => s.orig);
      return `<li class="step${edited ? ' edited' : ''}${state.editing === i ? ' editing' : ''}" data-i="${i}" style="--c:${tx.color}">
        <div class="step-time">${tx.time}</div>
        <div class="step-dot"><span>${tx.icon}</span></div>
        <div class="step-body"><div class="step-title">${esc(tx.title)}</div><div class="step-sub">${esc(tx.sub)}${edited ? ` <span class="edited-tag">· ${esc(t('edited'))}</span>` : ''}</div></div>
        <button class="step-edit" data-edit="${i}" title="${esc(t('edit'))}" aria-label="${esc(t('editAria'))}">${EDIT_SVG}</button>
      </li>${state.editing === i ? editorHtml(st, i) : ''}`;
    }).join('');
    markSteps();
    const inp = document.querySelector('#steps .step-editor input');
    if (inp) inp.focus({ preventScroll: true });
  }

  const segKey = (s) => `${s.kind}|${s.start.ms}|${s.end.ms}`;
  function stepSegs(st) { return [st.move, st.arrival, st.visit].filter(Boolean); }
  function stepPlaceSeg(st) { return st.arrival || st.visit || null; }

  function editorHtml(st, i) {
    const place = stepPlaceSeg(st);
    const curMode = st.move ? editModeOf(modeOf(st.move.mode).key)?.key : null;
    const anyOrig = stepSegs(st).some((s) => s.orig);
    return `<li class="step-editor" data-i="${i}">
      ${st.move ? `<div class="ed-label">${esc(t('edTransport'))}</div>
        <div class="ed-modes" role="radiogroup">${EDIT_MODES.map(({ key: k }) => `<button type="button" class="ed-mode${k === curMode ? ' sel' : ''}" data-mode="${k}" role="radio" aria-checked="${k === curMode}" style="--c:${MODES[k].color}"><span>${MODES[k].icon}</span>${esc(t(`edit_${k}`))}</button>`).join('')}</div>` : ''}
      ${place ? `<label class="ed-label" for="ed-name-${i}">${esc(t(st.move ? 'edDestination' : 'edPlaceName'))}</label>
        <input id="ed-name-${i}" class="ed-input" type="text" value="${esc(place.name || '')}" placeholder="${esc(placeInfo(place).name)}" />` : ''}
      <div class="ed-actions">
        ${anyOrig ? `<button type="button" class="btn btn-ghost btn-sm ed-revert">${esc(t('edRevert'))}</button>` : ''}
        <span class="ed-spacer"></span>
        <button type="button" class="btn btn-ghost btn-sm ed-cancel">${esc(t('edCancel'))}</button>
        <button type="button" class="btn btn-primary btn-sm ed-save">${esc(t('edSave'))}</button>
      </div>
    </li>`;
  }

  function openEditor(i) {
    stopPlay();
    state.editing = state.editing === i ? null : i;
    renderSteps();
  }
  function closeEditor() {
    if (state.editing == null) return;
    state.editing = null;
    renderSteps();
  }

  function setField(seg, field, value) {
    const cur = seg[field] ?? null;
    if (cur === value) return;
    seg.orig = seg.orig || {};
    if (!(field in seg.orig)) seg.orig[field] = cur;
    seg[field] = value;
    if (seg.orig[field] === value) delete seg.orig[field];
    if (!Object.keys(seg.orig).length) delete seg.orig;
  }

  async function saveEditor() {
    const i = state.editing;
    const st = state.steps[i];
    const ed = document.querySelector('#steps .step-editor');
    if (!st || !ed) return;
    if (st.move) {
      const sel = ed.querySelector('.ed-mode.sel');
      const cur = modeOf(st.move.mode).key;
      if (sel && editModeOf(cur)?.key !== sel.dataset.mode) {
        const orig = st.move.orig && 'mode' in st.move.orig ? modeOf(st.move.orig.mode).key : null;
        setField(st.move, 'mode', orig && editModeOf(orig)?.key === sel.dataset.mode ? st.move.orig.mode : sel.dataset.mode);
      }
    }
    const place = stepPlaceSeg(st);
    const inp = ed.querySelector('.ed-input');
    if (place && inp) setField(place, 'name', inp.value.trim() || (place.orig && 'name' in place.orig ? place.orig.name : null));
    await afterEdit();
  }

  async function revertEditor() {
    const st = state.steps[state.editing];
    if (!st) return;
    for (const s of stepSegs(st)) {
      if (!s.orig) continue;
      Object.assign(s, s.orig);
      delete s.orig;
    }
    await afterEdit();
  }

  async function afterEdit() {
    state.editing = null;
    renderDayHead();
    renderSteps();
    refreshTooltips();
    go(state.idx, { animate: false });
    await persist();
  }

  async function persist() {
    if (state.source !== 'file') return;
    const edits = {};
    for (const s of state.segs) if (s.orig) edits[segKey(s)] = { mode: s.mode, name: s.name, orig: s.orig };
    await Store.set('segments', state.segs);
    await Store.set('edits', edits);
  }

  async function applySavedEdits(segs) {
    const edits = await Store.get('edits');
    if (!edits) return;
    for (const s of segs) {
      const e = edits[segKey(s)];
      if (!e || s.orig) continue;
      for (const f of Object.keys(e.orig || {})) setField(s, f, e[f]);
    }
  }

  function exportData() {
    if (!state.segs.length) return;
    const data = { format: 'footprints', version: 1, exportedAt: new Date().toISOString(), segments: state.segs };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `footprints-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function markSteps() {
    document.querySelectorAll('#steps .step').forEach((el) => {
      const i = +el.dataset.i;
      el.classList.toggle('done', i < state.idx);
      el.classList.toggle('current', i === state.idx);
    });
    const cur = document.querySelector('#steps .step.current');
    if (cur) cur.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
    $('#ctl-progress').textContent = state.steps.length ? `${state.idx + 1} / ${state.steps.length}` : '–';
    $('#ctl-prev').disabled = state.idx <= 0;
    if (state.idx < state.steps.length - 1) setNextDay(false);
    else if (!$('#ctl-next').classList.contains('next-day')) $('#ctl-next').disabled = true;
  }

  const hasNextDay = () => state.dayKeys.indexOf(state.day) < state.dayKeys.length - 1;
  function setNextDay(on) {
    const btn = $('#ctl-next');
    btn.disabled = false;
    if (btn.classList.contains('next-day') === on) return;
    btn.classList.toggle('next-day', on);
    labelNext();
  }
  function labelNext() {
    const btn = $('#ctl-next');
    const on = btn.classList.contains('next-day');
    btn.querySelector('.ctl-label').textContent = t(on ? 'ctlNextDay' : 'ctlNext');
    btn.title = t(on ? 'ctlNextDayTitle' : 'ctlNextTitle');
  }
  function armNextDay() {
    if (state.idx < state.steps.length - 1 || !hasNextDay() || $('#ctl-next').classList.contains('next-day')) return;
    setNextDay(true);
  }

  function renderCard(animate = true) {
    const st = state.steps[state.idx];
    const card = $('#step-card');
    if (!st) { card.innerHTML = ''; return; }
    let html = '';
    if (st.type === 'start') {
      const p = st.visit ? placeInfo(st.visit) : null;
      html = `<div class="card-kicker">${esc(t('dayStart'))}</div>
        <div class="card-title">${esc(p ? p.name : t('inMotion'))}</div>
        ${p?.address ? `<div class="card-addr">${esc(p.address)}</div>` : ''}
        <div class="card-meta">${st.visit ? t('leftAt', { time: fmtTime(st.visit.end) }) : t('sinceTime', { time: fmtTime(st.time) })}</div>`;
    } else if (st.type === 'move') {
      const md = modeOf(st.move.mode);
      const p = st.arrival ? placeInfo(st.arrival) : null;
      const ep = !p && st.endpoint ? placeInfo(st.endpoint) : null;
      html = `<div class="card-kicker" style="color:${md.color}">${md.icon} ${md.label}</div>
        <div class="card-meta">${fmtTime(st.move.start)} → ${fmtTime(st.move.end)} · ${fmtDur(st.move.end.ms - st.move.start.ms)}${st.move.distance ? ' · ' + fmtDist(st.move.distance) : ''}</div>
        ${st.move.stops?.length ? `<div class="card-stops">${st.move.stops.map((s) => esc(s.name)).filter(Boolean).join(' → ')}</div>` : ''}
        ${p ? `<div class="card-arrival">
          <div class="card-title">${esc(p.name)}</div>
          ${p.address ? `<div class="card-addr">${esc(p.address)}</div>` : ''}
          <div class="card-meta">${fmtTime(st.arrival.start)}–${fmtTime(st.arrival.end)} · ${esc(t('durHere', { dur: fmtDur(st.arrival.end.ms - st.arrival.start.ms) }))}</div>
        </div>` : ''}
        ${ep ? `<div class="card-arrival">
          <div class="card-title">${esc(ep.name)}</div>
          ${ep.address ? `<div class="card-addr">${esc(ep.address)}</div>` : ''}
          <div class="card-meta">${t('arrivedAt', { time: fmtTime(st.move.end) })}</div>
        </div>` : ''}`;
    } else {
      const p = placeInfo(st.visit);
      html = `<div class="card-kicker">${esc(t('visit'))}</div>
        <div class="card-title">${esc(p.name)}</div>
        ${p.address ? `<div class="card-addr">${esc(p.address)}</div>` : ''}
        <div class="card-meta">${fmtTime(st.visit.start)}–${fmtTime(st.visit.end)} · ${fmtDur(st.visit.end.ms - st.visit.start.ms)}</div>`;
    }
    card.innerHTML = `<div class="card-inner">${html}</div>`;
    if (animate) { card.classList.remove('show'); void card.offsetWidth; }
    card.classList.add('show');
  }

  let geoTimer = null;
  function onGeocoded() {
    clearTimeout(geoTimer);
    geoTimer = setTimeout(() => {
      if (state.editing != null) return onGeocoded();
      renderSteps();
      renderCard(false);
      refreshTooltips();
    }, 150);
  }

  let renderToken = 0;
  let placeMarkers = new Map();

  function pinIcon(place, opts = {}) {
    const v = place.visit;
    const kind = semanticKind(v);
    const label = kind === 'home' ? '🏠' : kind === 'work' ? '💼' : place.id + 1;
    const dur = v.end.ms - v.start.ms;
    const major = dur >= 45 * 60000 || kind;
    const cls = ['pin', major ? 'major' : 'minor', opts.current ? 'current' : '', opts.pop ? 'pop' : '', opts.start ? 'start' : ''].join(' ');
    return L.divIcon({ className: 'pin-wrap', html: `<div class="${cls}"><span>${label}</span></div>`, iconSize: [0, 0] });
  }

  function addPlace(place, opts) {
    const info = placeInfo(place.visit);
    const m = L.marker(place.loc, { icon: pinIcon(place, opts), zIndexOffset: opts.current ? 800 : 0, riseOnHover: true }).addTo(layer);
    m.bindTooltip(esc(info.name), { direction: 'top', offset: [0, -16], permanent: !!opts.current, className: 'place-tip' + (opts.current ? ' current' : '') });
    if (opts.current) m.on('click', showDestThumb);
    placeMarkers.set(place.id, m);
    return m;
  }

  const THUMB = { w: 220, h: 130, z: 18 };
  const SAT_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile';
  function satThumbHtml(loc) {
    const { w, h, z } = THUMB;
    const n = 256 * 2 ** z;
    const lat = (loc[0] * Math.PI) / 180;
    const px = ((loc[1] + 180) / 360) * n;
    const py = ((1 - Math.log(Math.tan(lat) + 1 / Math.cos(lat)) / Math.PI) / 2) * n;
    const x0 = px - w / 2, y0 = py - h / 2;
    let imgs = '';
    for (let tx = Math.floor(x0 / 256); tx <= Math.floor((x0 + w - 1) / 256); tx++) {
      for (let ty = Math.floor(y0 / 256); ty <= Math.floor((y0 + h - 1) / 256); ty++) {
        imgs += `<img crossorigin="anonymous" src="${SAT_URL}/${z}/${ty}/${tx}" alt="" style="left:${Math.round(tx * 256 - x0)}px;top:${Math.round(ty * 256 - y0)}px" />`;
      }
    }
    return `<div class="thumb-img" style="width:${w}px;height:${h}px">${imgs}<i class="thumb-dot"></i></div>`;
  }
  const streetViewUrl = (loc) => `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${loc[0].toFixed(6)},${loc[1].toFixed(6)}`;

  function thumbTooltip(loc, offsetY) {
    const html = `<a class="thumb-link" href="${streetViewUrl(loc)}" target="_blank" rel="noopener" title="${esc(t('streetViewTitle'))}">
        ${satThumbHtml(loc)}
        <span class="thumb-cta">${esc(t('streetViewCta'))}</span>
      </a>`;
    return L.tooltip({ direction: 'bottom', permanent: true, interactive: true, offset: [0, offsetY], className: 'place-thumb', opacity: 1 })
      .setLatLng(loc).setContent(html);
  }
  let destThumb = null;
  function addThumb(place) {
    pickLayer?.clearLayers();
    destThumb = thumbTooltip(place.loc, 24).addTo(layer);
  }
  function showDestThumb() {
    pickLayer?.clearLayers();
    if (destThumb && !layer.hasLayer(destThumb)) destThumb.addTo(layer);
  }

  let pickLayer;
  function showPick(latlng) {
    if (!pickLayer) pickLayer = L.layerGroup().addTo(map);
    pickLayer.clearLayers();
    if (destThumb) layer.removeLayer(destThumb);
    const loc = [latlng.lat, L.Util.wrapNum(latlng.lng, [-180, 180], true)];
    L.circleMarker(loc, { radius: 6, color: '#fff', weight: 2, fillColor: 'var(--primary)', fillOpacity: 1, interactive: false })
      .addTo(pickLayer);
    thumbTooltip(loc, 12).addTo(pickLayer);
  }

  function refreshTooltips() {
    placeMarkers.forEach((m, id) => {
      const p = state.places[id];
      if (p) m.setTooltipContent(esc(placeInfo(p.visit).name));
    });
  }

  function drawPath(move) {
    if (move._draw) return move._draw;
    let pts = move.path;
    for (let it = 0; it < 2 && pts.length > 2; it++) {
      const out = [pts[0]];
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
      }
      out.push(pts[pts.length - 1]);
      pts = out;
    }
    Object.defineProperty(move, '_draw', { value: pts, enumerable: false });
    return pts;
  }

  function drawMove(move, style) {
    const md = modeOf(move.mode);
    const path = drawPath(move);
    if (path.length < 2) return null;
    const past = style === 'past';
    L.polyline(path, { color: 'var(--line-casing)', weight: past ? 7 : 9, opacity: past ? 0.6 : 0.9, lineCap: 'round', lineJoin: 'round', className: 'casing' }).addTo(layer);
    const line = L.polyline(path, {
      color: md.color, weight: past ? 4 : 5.5, opacity: past ? 0.55 : 1, lineCap: 'round', lineJoin: 'round',
      dashArray: md.key === 'WALKING' || md.key === 'RUNNING' ? '1 9' : md.key === 'FLYING' ? '8 10' : null,
    }).addTo(layer);
    if (move.stops?.length && !past) {
      move.stops.forEach((s) => L.circleMarker(s.loc, { radius: 4, color: md.color, weight: 2, fillColor: '#fff', fillOpacity: 1 })
        .bindTooltip(esc(s.name || ''), { direction: 'top', className: 'place-tip' }).addTo(layer));
    }
    return line;
  }

  function stepBounds(st) {
    if (st.type === 'move') {
      const b = L.latLngBounds(st.move.path);
      const dest = st.arrival || st.endpoint;
      if (dest) b.extend(dest.loc);
      return b;
    }
    const loc = st.visit ? st.visit.loc : st.loc;
    return L.latLngBounds([loc, loc]);
  }

  function allBounds(upto) {
    let b = null;
    for (let i = 0; i <= upto; i++) {
      const sb = stepBounds(state.steps[i]);
      b = b ? b.extend(sb) : sb;
    }
    return b;
  }

  const cardPad = () => (window.innerWidth < 860 ? { paddingTopLeft: [30, 150], paddingBottomRight: [30, 90] } : { paddingTopLeft: [420, 60], paddingBottomRight: [70, 100] });

  function moveCamera(bounds, animate, { zoom = 15, duration = 0.9 } = {}) {
    if (!bounds) return Promise.resolve();
    const pad = cardPad();
    const isPoint = bounds.getNorthEast().equals(bounds.getSouthWest());
    return new Promise((resolve) => {
      let done = false;
      const finish = () => { if (!done) { done = true; resolve(); } };
      if (isPoint) {
        const z = Math.max(map.getZoom() || 0, zoom);
        const target = offsetCenter(bounds.getCenter(), z, pad);
        if (animate && !reduced) { map.once('moveend', finish); map.flyTo(target, z, { duration }); setTimeout(finish, duration * 1000 + 400); }
        else { map.setView(target, z, { animate: false }); finish(); }
      } else {
        const opts = { ...pad, maxZoom: 17 };
        if (animate && !reduced) { map.once('moveend', finish); map.flyToBounds(bounds, { ...opts, duration: 0.9 }); setTimeout(finish, 1300); }
        else { map.fitBounds(bounds, { ...opts, animate: false }); finish(); }
      }
    });
  }
  function offsetCenter(latlng, zoom, pad) {
    const dx = (pad.paddingTopLeft[0] - pad.paddingBottomRight[0]) / 2;
    const dy = (pad.paddingTopLeft[1] - pad.paddingBottomRight[1]) / 2;
    const p = map.project(latlng, zoom).subtract([dx, dy]);
    return map.unproject(p, zoom);
  }

  function animatePath(move, token) {
    const md = modeOf(move.mode);
    const path = drawPath(move);
    return new Promise((resolve) => {
      if (path.length < 2) return resolve(true);
      const cum = [0];
      for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + Parser.haversine(path[i - 1], path[i]));
      const total = cum[cum.length - 1];
      let px = 0;
      for (let i = 1; i < path.length; i++) px += map.latLngToContainerPoint(path[i - 1]).distanceTo(map.latLngToContainerPoint(path[i]));
      const dur = reduced ? 0 : Math.min(3200, Math.max(900, px * 2.4));

      const casing = L.polyline([path[0]], { color: 'var(--line-casing)', weight: 9, opacity: 0.9, lineCap: 'round', lineJoin: 'round', className: 'casing' }).addTo(layer);
      const line = L.polyline([path[0]], {
        color: md.color, weight: 5.5, lineCap: 'round', lineJoin: 'round',
        dashArray: md.key === 'WALKING' || md.key === 'RUNNING' ? '1 9' : md.key === 'FLYING' ? '8 10' : null,
      }).addTo(layer);
      const mover = L.marker(path[0], {
        icon: L.divIcon({ className: 'pin-wrap', html: `<div class="mover" style="--c:${md.color}">${md.icon}</div>`, iconSize: [0, 0] }),
        interactive: false, zIndexOffset: 1000,
      }).addTo(layer);

      const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
      const t0 = performance.now();
      let seg = 1;
      function frame(now) {
        if (token !== renderToken) return resolve(false);
        const p = dur ? Math.min(1, (now - t0) / dur) : 1;
        const d = ease(p) * total;
        while (seg < cum.length - 1 && cum[seg] < d) seg++;
        const a = path[seg - 1], b = path[seg];
        const segLen = cum[seg] - cum[seg - 1] || 1;
        const f = Math.min(1, Math.max(0, (d - cum[seg - 1]) / segLen));
        const head = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
        const pts = path.slice(0, seg); pts.push(head);
        line.setLatLngs(pts); casing.setLatLngs(pts);
        mover.setLatLng(head);
        if (p < 1) requestAnimationFrame(frame);
        else { layer.removeLayer(mover); resolve(true); }
      }
      requestAnimationFrame(frame);
    });
  }

  /** opts.fit: 'step' | 'all' */
  async function go(idx, opts) {
    await drawStep(idx, opts);
    if (state.idx === idx || idx >= state.steps.length - 1) armNextDay();
  }

  async function drawStep(idx, { animate = false, fit = 'step' } = {}) {
    if (!state.steps.length) { layer.clearLayers(); renderCard(); markSteps(); return; }
    idx = Math.max(0, Math.min(state.steps.length - 1, idx));
    state.idx = idx;
    const token = ++renderToken;
    markSteps();
    renderCard();

    layer.clearLayers();
    pickLayer?.clearLayers();
    destThumb = null;
    placeMarkers = new Map();
    const cur = state.steps[idx];
    const animMove = animate && fit !== 'all' && cur.type === 'move' && cur.move.path.length > 1;

    for (let i = 0; i < idx; i++) if (state.steps[i].type === 'move') drawMove(state.steps[i].move, 'past');
    if (cur.type === 'move' && !animMove) drawMove(cur.move, 'current');

    const shown = new Set();
    const curPlace = cur.place;
    const startStep = state.steps[0];
    if (!startStep.visit && startStep.loc) {
      L.marker(startStep.loc, { icon: L.divIcon({ className: 'pin-wrap', html: '<div class="pin start minor"><span>◉</span></div>', iconSize: [0, 0] }) })
        .bindTooltip(esc(t('startTip')), { direction: 'top', offset: [0, -14], className: 'place-tip' }).addTo(layer);
    }
    for (let i = 0; i <= idx; i++) {
      const p = state.steps[i].place;
      if (!p || shown.has(p.id)) continue;
      if (animMove && p === curPlace && !state.steps.slice(0, idx).some((s) => s.place === p)) continue;
      shown.add(p.id);
      const isCur = p === curPlace && !animMove;
      addPlace(p, { current: isCur, pop: isCur && animate, start: i === 0 });
    }

    if (fit === 'all') { await moveCamera(allBounds(idx), animate); return; }
    await moveCamera(stepBounds(cur), animate);
    if (token !== renderToken) return;

    if (animMove) {
      const ok = await animatePath(cur.move, token);
      if (!ok || token !== renderToken) return;
      if (curPlace) {
        const existing = placeMarkers.get(curPlace.id);
        if (existing) layer.removeLayer(existing);
        addPlace(curPlace, { current: true, pop: true });
        await new Promise((r) => setTimeout(r, reduced ? 0 : 350));
        if (token !== renderToken) return;
        await moveCamera(L.latLngBounds([curPlace.loc, curPlace.loc]), true, { zoom: 16, duration: 1.1 });
      }
    }
    if (curPlace && token === renderToken) addThumb(curPlace);
  }

  async function play() {
    if (state.playing) return stopPlay();
    if (state.idx >= state.steps.length - 1) await go(0, { animate: true });
    state.playing = true;
    document.body.classList.add('playing');
    while (state.playing && state.idx < state.steps.length - 1) {
      await go(state.idx + 1, { animate: true });
      if (!state.playing) break;
      await new Promise((r) => setTimeout(r, reduced ? 1200 : 1500));
    }
    stopPlay();
  }
  function stopPlay() {
    state.playing = false;
    document.body.classList.remove('playing');
  }

  const next = () => {
    stopPlay();
    if ($('#ctl-next').classList.contains('next-day')) return dayStep(1);
    if (state.idx < state.steps.length - 1) go(state.idx + 1, { animate: true });
  };
  const prev = () => { stopPlay(); if (state.idx > 0) go(state.idx - 1, { animate: false }); };
  const dayStep = (d) => { const i = state.dayKeys.indexOf(state.day) + d; if (i >= 0 && i < state.dayKeys.length) selectDay(state.dayKeys[i]); };

  function status(msg, type = '') {
    const el = $('#upload-status');
    el.className = 'upload-status ' + type;
    el.innerHTML = msg;
  }

  async function handleFiles(files) {
    if (!files || !files.length) return;
    status(`<span class="spinner"></span> ${esc(t('reading'))}`);
    await new Promise((r) => setTimeout(r, 30));
    try {
      const parts = [];
      const tryText = (text) => {
        let data;
        try { data = JSON.parse(text); } catch { return; }
        const p = Parser.parseAny(data);
        if (p && (p.segs.length || p.points.length || p.raw?.length)) parts.push(p);
      };
      for (const f of files) {
        if (/\.zip$/i.test(f.name) || f.type.includes('zip')) {
          status(`<span class="spinner"></span> ${esc(t('unzipping'))}`);
          const zip = await JSZip.loadAsync(f);
          const entries = Object.values(zip.files).filter((e) => !e.dir && /\.json$/i.test(e.name) && !/Records\.json$/i.test(e.name) && !/Settings\.json$/i.test(e.name));
          for (const e of entries) tryText(await e.async('string'));
        } else {
          tryText(await f.text());
        }
      }
      if (!parts.length) {
        status(t('unknownFormat'), 'error');
        return;
      }
      status(`<span class="spinner"></span> ${esc(t('processing'))}`);
      await new Promise((r) => setTimeout(r, 30));
      const segs = Parser.finalize(parts);
      if (!segs.length) { status(esc(t('emptyFile')), 'error'); return; }
      await applySavedEdits(segs);
      await Store.set('segments', segs);
      status('');
      loadSegments(segs);
    } catch (e) {
      console.error(e);
      status(esc(t('processError', { msg: e.message })), 'error');
    }
  }

  async function checkSaved() {
    const segs = await Store.get('segments');
    const btn = $('#resume-btn');
    if (segs && segs.length) {
      const keys = [...Parser.groupByDay(segs).keys()].sort();
      btn.textContent = t('resume', { from: fmtShortDay(keys[0]), to: fmtShortDay(keys[keys.length - 1]) });
      btn.classList.remove('hidden');
      btn.onclick = () => loadSegments(segs);
    } else btn.classList.add('hidden');
  }

  function showUpload() {
    stopPlay();
    Geocode.clearQueue();
    Prefetch.stop();
    $('#app-view').classList.add('hidden');
    $('#upload-view').classList.remove('hidden');
    checkSaved();
  }

  const dz = $('#dropzone'), input = $('#file-input');
  input.addEventListener('change', () => { handleFiles([...input.files]); input.value = ''; });
  dz.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
  ['dragenter', 'dragover'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('over'); }));
  dz.addEventListener('drop', (e) => handleFiles([...e.dataTransfer.files]));
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => e.preventDefault());

  $('#demo-btn').onclick = () => {
    const parts = Demo.data().map((d) => Parser.parseAny(d));
    loadSegments(Parser.finalize(parts), 'demo');
  };

  const geoOpt = $('#geocode-opt');
  try { geoOpt.checked = localStorage.getItem('footprints:geocode-opt') !== '0'; } catch {}
  state.geocode = geoOpt.checked;
  Geocode.setEnabled(state.geocode);
  geoOpt.onchange = () => {
    state.geocode = geoOpt.checked;
    Geocode.setEnabled(state.geocode);
    try { localStorage.setItem('footprints:geocode-opt', geoOpt.checked ? '1' : '0'); } catch {}
  };

  $('#sheet-toggle').onclick = () => {
    if (sheetDragged) { sheetDragged = false; return; }
    setSheet(!document.body.classList.contains('sheet-open'));
  };
  initSheetDrag();
  $('#home-btn').onclick = showUpload;
  $('#new-file-btn').onclick = showUpload;
  $('#cal-prev').onclick = () => shiftMonth(-1);
  $('#cal-next').onclick = () => shiftMonth(1);
  $('#cal-grid').onclick = (e) => { const b = e.target.closest('.cal-day.has'); if (b) selectDay(b.dataset.key); };
  $('#day-prev').onclick = () => dayStep(-1);
  $('#day-next').onclick = () => dayStep(1);
  $('#export-btn').onclick = exportData;
  $('#steps').onclick = (e) => {
    const editBtn = e.target.closest('.step-edit');
    if (editBtn) { e.stopPropagation(); openEditor(+editBtn.dataset.edit); return; }
    const ed = e.target.closest('.step-editor');
    if (ed) {
      const m = e.target.closest('.ed-mode');
      if (m) ed.querySelectorAll('.ed-mode').forEach((b) => { b.classList.toggle('sel', b === m); b.setAttribute('aria-checked', b === m); });
      else if (e.target.closest('.ed-save')) saveEditor();
      else if (e.target.closest('.ed-cancel')) closeEditor();
      else if (e.target.closest('.ed-revert')) revertEditor();
      return;
    }
    const li = e.target.closest('.step');
    if (!li) return;
    stopPlay();
    const i = +li.dataset.i;
    go(i, { animate: i === state.idx + 1 || i === 0 });
  };
  $('#ctl-next').onclick = next;
  $('#ctl-prev').onclick = prev;
  $('#ctl-play').onclick = play;
  $('#ctl-restart').onclick = () => { stopPlay(); go(0, { animate: true }); };
  $('#ctl-all').onclick = () => { stopPlay(); go(state.steps.length - 1, { animate: true, fit: 'all' }); };

  $('#steps').addEventListener('keydown', (e) => {
    if (!e.target.closest('.step-editor')) return;
    if (e.key === 'Escape') { e.preventDefault(); closeEditor(); }
    else if (e.key === 'Enter' && e.target.matches('input')) { e.preventDefault(); saveEditor(); }
  });

  document.addEventListener('keydown', (e) => {
    if ($('#app-view').classList.contains('hidden') || e.target.matches('input, textarea, button') && e.target.closest('.step-editor')) return;
    if (e.target.matches('input, textarea')) return;
    const k = e.key;
    if (k === 'ArrowRight') { e.preventDefault(); next(); }
    else if (k === 'ArrowLeft') { e.preventDefault(); prev(); }
    else if (k === 'ArrowDown' || k === 'PageDown' || k === ']') { e.preventDefault(); dayStep(1); }
    else if (k === 'ArrowUp' || k === 'PageUp' || k === '[') { e.preventDefault(); dayStep(-1); }
    else if (k === ' ') { e.preventDefault(); play(); }
    else if (k === 'Home') { e.preventDefault(); $('#ctl-restart').click(); }
    else if (k === 'End') { e.preventDefault(); $('#ctl-all').click(); }
  });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
    navigator.storage?.persist?.().catch(() => {});
  }

  function onLangChange() {
    Geocode.setLang(locale());
    labelNext();
    checkSaved();
    if ($('#app-view').classList.contains('hidden') || !state.day) return;
    renderDayHead();
    renderCalendar();
    renderSteps();
    renderCard(false);
    refreshTooltips();
    if (!state.playing) go(state.idx, { animate: false });
  }
  I18n.onChange(onLangChange);
  I18n.apply();
  Geocode.setLang(locale());
  labelNext();

  checkSaved();
})();
