const Demo = (() => {
  const P = {
    home:   { name: 'Casa', lat: -34.5889, lng: -58.4306, semanticType: 'TYPE_HOME' },
    cafe:   { name: 'Café Cortázar', address: 'Medrano 1501, Palermo', lat: -34.5925, lng: -58.4213 },
    subA:   { name: 'Estación Scalabrini Ortiz', lat: -34.5853, lng: -58.4161 },
    office: { name: 'Oficina', address: 'Av. Leandro N. Alem 855, Retiro', lat: -34.5985, lng: -58.3720, semanticType: 'TYPE_WORK' },
    lunch:  { name: 'Parrilla La Ribera', address: 'Av. Alicia Moreau de Justo 1050', lat: -34.6062, lng: -58.3655 },
    gym:    { name: 'Gimnasio Megatlon', address: 'Av. Santa Fe 3253', lat: -34.5878, lng: -58.4108 },
    park:   { name: 'Bosques de Palermo', lat: -34.5718, lng: -58.4177 },
    market: { name: 'Mercado de San Telmo', address: 'Defensa 961', lat: -34.6205, lng: -58.3720 },
    friend: { name: 'Casa de Martina', address: 'Av. Rivadavia 5100, Caballito', lat: -34.6185, lng: -58.4380 },
    museum: { name: 'MALBA', address: 'Av. Figueroa Alcorta 3415', lat: -34.5770, lng: -58.4035 },
  };

  const E7 = (x) => Math.round(x * 1e7);
  const loc = (p) => ({ latitudeE7: E7(p.lat), longitudeE7: E7(p.lng) });

  function streetPath(a, b, seed = 1) {
    const pts = [];
    const steps = 18;
    const corner = { lat: a.lat + (b.lat - a.lat) * 0.55, lng: a.lng + (b.lng - a.lng) * 0.15 };
    const legs = [[a, corner], [corner, b]];
    for (const [p, q] of legs) {
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const j = Math.sin((i + seed) * 1.7) * 0.00025;
        pts.push({ latE7: E7(p.lat + (q.lat - p.lat) * t + j), lngE7: E7(p.lng + (q.lng - p.lng) * t - j) });
      }
    }
    pts.push({ latE7: E7(b.lat), lngE7: E7(b.lng) });
    return pts;
  }

  function build(dateISO, plan) {
    const objs = [];
    let t = Date.parse(dateISO + 'T00:00:00-03:00');
    const iso = (ms) => new Date(ms - 3 * 3600000).toISOString().replace('Z', '-03:00');
    plan.forEach((item, idx) => {
      const start = iso(t);
      t += item.min * 60000;
      const end = iso(t);
      if (item.at) {
        const p = P[item.at];
        objs.push({ placeVisit: { location: { ...loc(p), name: p.name, address: p.address, semanticType: p.semanticType }, duration: { startTimestamp: start, endTimestamp: end } } });
      } else {
        const a = P[item.from], b = P[item.to];
        objs.push({
          activitySegment: {
            startLocation: loc(a), endLocation: loc(b),
            duration: { startTimestamp: start, endTimestamp: end },
            activityType: item.mode,
            waypointPath: { waypoints: streetPath(a, b, idx) },
            transitPath: item.stops ? { transitStops: item.stops.map((k) => ({ ...loc(P[k]), name: P[k].name })) } : undefined,
          },
        });
      }
    });
    return objs;
  }

  function data() {
    const d1 = build('2026-11-02', [
      { at: 'home', min: 8 * 60 + 10 },
      { from: 'home', to: 'cafe', mode: 'WALKING', min: 12 },
      { at: 'cafe', min: 30 },
      { from: 'cafe', to: 'subA', mode: 'WALKING', min: 9 },
      { from: 'subA', to: 'office', mode: 'IN_SUBWAY', min: 24 },
      { at: 'office', min: 200 },
      { from: 'office', to: 'lunch', mode: 'WALKING', min: 14 },
      { at: 'lunch', min: 55 },
      { from: 'lunch', to: 'office', mode: 'WALKING', min: 15 },
      { at: 'office', min: 230 },
      { from: 'office', to: 'gym', mode: 'IN_BUS', min: 38 },
      { at: 'gym', min: 75 },
      { from: 'gym', to: 'home', mode: 'WALKING', min: 18 },
      { at: 'home', min: 230 },
    ]);
    const d2 = build('2026-11-03', [
      { at: 'home', min: 9 * 60 },
      { from: 'home', to: 'park', mode: 'CYCLING', min: 16 },
      { at: 'park', min: 70 },
      { from: 'park', to: 'museum', mode: 'CYCLING', min: 12 },
      { at: 'museum', min: 110 },
      { from: 'museum', to: 'market', mode: 'IN_PASSENGER_VEHICLE', min: 28 },
      { at: 'market', min: 90 },
      { from: 'market', to: 'friend', mode: 'IN_BUS', min: 35 },
      { at: 'friend', min: 180 },
      { from: 'friend', to: 'home', mode: 'IN_PASSENGER_VEHICLE', min: 22 },
      { at: 'home', min: 24 * 60 - (9 * 60 + 16 + 70 + 12 + 110 + 28 + 90 + 35 + 180 + 22) },
    ]);
    return [{ timelineObjects: d1 }, { timelineObjects: d2 }];
  }

  return { data };
})();
