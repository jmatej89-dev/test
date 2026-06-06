// Aircraft model — parse OpenSky state vectors + computed properties

import { classifyAircraft } from './military.js';

// OpenSky state vector indices
const I = { icao24:0, callsign:1, country:2, lon:5, lat:6, baroAlt:7,
             onGround:8, velocity:9, heading:10, vRate:11, geoAlt:13, squawk:14 };

export function parseStates(states = []) {
  return states
    .map(s => {
      const lat = s[I.lat], lon = s[I.lon];
      if (lat == null || lon == null) return null;
      if (isNaN(lat) || isNaN(lon))   return null;

      const icao24   = s[I.icao24] ?? '';
      const callsign = (s[I.callsign] ?? '').trim();
      const mil      = classifyAircraft(icao24, callsign);

      const baroAlt = s[I.baroAlt];
      const geoAlt  = s[I.geoAlt];
      const alt     = baroAlt ?? geoAlt;
      const altFt   = alt != null && alt > 0 ? Math.round(alt * 3.28084) : null;

      const vel     = s[I.velocity];
      const velKts  = vel != null && vel > 0 ? Math.round(vel * 1.94384) : null;

      const vr      = s[I.vRate];
      const vFpm    = vr != null ? Math.round(vr * 196.85) : null;

      const heading  = s[I.heading];
      const onGround = s[I.onGround] ?? false;

      return {
        id:          icao24,
        callsign:    callsign || icao24.toUpperCase(),
        country:     s[I.country] ?? 'Unknown',
        lat, lon, altFt, velKts, vFpm, heading,
        onGround,
        squawk:      s[I.squawk] ?? null,
        isMilitary:  mil.isMilitary,
        milInfo:     mil.info,
        flightLevel: altFt != null ? `FL${Math.floor(altFt / 100)}` : (onGround ? 'GND' : '—'),
        altCat:      altCategory(altFt, onGround),
        climbStatus: climbStatus(vFpm),
        lastSeen:    Date.now(),
      };
    })
    .filter(Boolean);
}

function altCategory(altFt, onGround) {
  if (onGround || altFt == null || altFt < 500) return 'ground';
  if (altFt < 10_000) return 'low';
  if (altFt < 35_000) return 'medium';
  return 'high';
}

function climbStatus(vFpm) {
  if (vFpm == null) return 'level';
  if (vFpm >  200) return 'climbing';
  if (vFpm < -200) return 'descending';
  return 'level';
}

export const ALT_COLORS = {
  ground: '#8EAABF',
  low:    '#FF7043',
  medium: '#FFD600',
  high:   '#00C8F0',
};
export const MIL_COLOR = '#FFB300';

export function acColor(ac) {
  return ac.isMilitary ? MIL_COLOR : (ALT_COLORS[ac.altCat] ?? ALT_COLORS.high);
}
