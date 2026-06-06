// API layer — calls our Node.js proxy server

const photoCache = new Map();   // icao24 → { photo | null }
const photoInFlight = new Map();

export async function fetchFlights(bounds) {
  const { south, north, west, east } = bounds;
  const params = new URLSearchParams({
    lamin: south.toFixed(4), lomin: west.toFixed(4),
    lamax: north.toFixed(4), lomax: east.toFixed(4),
  });

  const r = await fetch(`/api/flights?${params}`, { signal: AbortSignal.timeout(25_000) });
  if (!r.ok) {
    const { error } = await r.json().catch(() => ({}));
    throw new Error(error || `HTTP ${r.status}`);
  }
  return r.json();   // { time, states: [[...], ...] }
}

export async function fetchPhoto(icao24) {
  const key = icao24.toLowerCase();

  if (photoCache.has(key)) return photoCache.get(key);

  // De-duplicate concurrent requests
  if (photoInFlight.has(key)) return photoInFlight.get(key);

  const promise = (async () => {
    try {
      const r = await fetch(`/api/photo/${key}`, { signal: AbortSignal.timeout(12_000) });
      const { photos } = await r.json();
      const result = photos?.[0] ?? null;
      photoCache.set(key, result);
      return result;
    } catch {
      photoCache.set(key, null);
      return null;
    } finally {
      photoInFlight.delete(key);
    }
  })();

  photoInFlight.set(key, promise);
  return promise;
}
