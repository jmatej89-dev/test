'use strict';
const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// ── OpenSky Network proxy ────────────────────────────────────────────────────
app.get('/api/flights', async (req, res) => {
  const { lamin, lomin, lamax, lomax } = req.query;

  let url = 'https://opensky-network.org/api/states/all';
  if (lamin) {
    url += `?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;
  }

  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'SkyRadar/1.0', Accept: 'application/json' },
      signal:  AbortSignal.timeout(22_000),
    });

    if (r.status === 429) return res.status(429).json({ error: 'OpenSky rate limit — wait a moment' });
    if (!r.ok)           return res.status(r.status).json({ error: `OpenSky HTTP ${r.status}` });

    res.json(await r.json());
  } catch (e) {
    console.error('[flights]', e.message);
    res.status(503).json({ error: 'Cannot reach OpenSky Network' });
  }
});

// ── Planespotters photo proxy ────────────────────────────────────────────────
app.get('/api/photo/:icao24', async (req, res) => {
  const icao24 = req.params.icao24.toLowerCase();
  if (!/^[0-9a-f]{6}$/.test(icao24)) return res.json({ photos: [] });

  try {
    const r = await fetch(
      `https://api.planespotters.net/pub/photos/hex/${icao24}`,
      { headers: { 'User-Agent': 'SkyRadar/1.0' }, signal: AbortSignal.timeout(10_000) }
    );
    if (!r.ok) return res.json({ photos: [] });

    const data = await r.json();
    const photos = (data.photos || []).slice(0, 1).map(p => ({
      thumbnail:    p.thumbnail?.src ?? null,
      large:        p.thumbnail_large?.src ?? null,
      photographer: p.photographer ?? '',
      model:        p.aircraft?.model ?? null,
      link:         p.link ?? null,
    }));
    res.json({ photos });
  } catch {
    res.json({ photos: [] });
  }
});

app.listen(PORT, () => {
  console.log(`\n  ✈  SkyRadar  →  http://localhost:${PORT}\n`);
});
