const Geocode = (() => {
  const KEY = 'footprints:geocode-cache';
  let cache = {};
  try { cache = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { cache = {}; }

  const queue = [];
  const pending = new Map();
  let running = false;
  let enabled = true;
  let lang = 'es';

  const k = (loc) => `${loc[0].toFixed(4)},${loc[1].toFixed(4)}`;

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch {}
  }

  function summarize(d) {
    if (!d || d.error) return null;
    const a = d.address || {};
    const street = a.road ? `${a.road}${a.house_number ? ' ' + a.house_number : ''}` : null;
    const area = a.suburb || a.neighbourhood || a.city_district || a.town || a.city || a.village || null;
    const name = d.name || a.amenity || a.shop || a.tourism || a.leisure || a.building || street || area || d.display_name?.split(',')[0];
    const address = [street !== name ? street : null, area].filter(Boolean).join(', ');
    return { name, address };
  }

  async function pump() {
    if (running) return;
    running = true;
    while (queue.length) {
      const loc = queue.shift();
      const key = k(loc);
      let result = null;
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&accept-language=${lang}&lat=${loc[0]}&lon=${loc[1]}`;
        const r = await fetch(url, { headers: { Accept: 'application/json' } });
        if (r.ok) result = summarize(await r.json());
      } catch (e) { console.warn('Geocode', e); }
      cache[key] = result || { name: null };
      save();
      (pending.get(key) || []).forEach((fn) => fn(cache[key]));
      pending.delete(key);
      await new Promise((r) => setTimeout(r, 1100));
    }
    running = false;
  }

  function lookup(loc, cb) {
    const key = k(loc);
    if (key in cache) return cache[key];
    if (!enabled) return undefined;
    if (!pending.has(key)) { pending.set(key, []); queue.push(loc); }
    pending.get(key).push(cb);
    pump();
    return undefined;
  }

  function clearQueue() { queue.length = 0; pending.clear(); }

  return { lookup, clearQueue, setLang: (l) => { lang = l; }, setEnabled: (v) => { enabled = v; if (!v) clearQueue(); } };
})();
