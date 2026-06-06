// Leaflet map — premium markers with SVG aircraft silhouettes + position trails

import { acColor, MIL_COLOR } from './aircraft.js';

let map;
const markers     = new Map();   // icao24 → { marker, ac }
const trailGroups = new Map();   // icao24 → L.LayerGroup
const posHistory  = new Map();   // icao24 → [{lat,lng}, ...]
let onSelectCb = null;

const TRAIL_MAX = 7;

// ── Init ─────────────────────────────────────────────────────────────────────
export function initMap(containerId, center, zoom, onSelect) {
  onSelectCb = onSelect;
  map = L.map(containerId, { center, zoom, zoomControl: false, attributionControl: true });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map);

  L.control.zoom({ position: 'bottomright' }).addTo(map);
  return map;
}

export function getMap()    { return map; }
export function getBounds() {
  const b = map.getBounds();
  return { south: b.getSouth(), north: b.getNorth(), west: b.getWest(), east: b.getEast() };
}
export function flyTo(lat, lng, zoom = 9) {
  map.flyTo([lat, lng], zoom, { duration: 1.2 });
}

// ── Aircraft SVG silhouette ───────────────────────────────────────────────────
// Plane points UP (north) at heading=0. Rotate by heading degrees.
function planeSVG(color, heading, selected, isMilitary, onGround) {
  const rot   = heading ?? 0;
  const sz    = onGround ? 24 : selected ? 38 : 30;
  const opac  = onGround ? 0.48 : 1;
  const glow  = selected
    ? `drop-shadow(0 0 7px ${color}) drop-shadow(0 0 3px ${color})`
    : 'drop-shadow(0 1px 5px rgba(0,0,0,.95))';

  const selRing = selected ? `
    <circle cx="20" cy="20" r="17.5" fill="none" stroke="${color}" stroke-width="1.2"
      stroke-dasharray="5 3.5" opacity="0.65">
      <animateTransform attributeName="transform" type="rotate"
        from="0 20 20" to="360 20 20" dur="9s" repeatCount="indefinite"/>
    </circle>` : '';

  const milBadge = isMilitary ? `
    <circle cx="28.5" cy="11" r="4.2" fill="${MIL_COLOR}" stroke="#060D16" stroke-width="1.3"/>
    <text x="28.5" y="14" text-anchor="middle" font-size="3.8" fill="#060D16"
      font-weight="900" font-family="-apple-system,system-ui,sans-serif">MIL</text>` : '';

  return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"
    width="${sz}" height="${sz}" style="filter:${glow};opacity:${opac};overflow:visible">
    ${selRing}
    <g transform="rotate(${rot},20,20)">
      <!-- Fuselage -->
      <ellipse cx="20" cy="20" rx="2.1" ry="12.5" fill="${color}"/>
      <!-- Swept main wings -->
      <path d="M20 14.5 L3 24 L5.5 25.8 L20 20.5 L34.5 25.8 L37 24 Z" fill="${color}"/>
      <!-- Tail stabilizers -->
      <path d="M20 29.5 L15.5 34.5 L17.5 34.5 L20 31 L22.5 34.5 L24.5 34.5 Z"
        fill="${color}" opacity="0.82"/>
    </g>
    ${milBadge}
  </svg>`;
}

function makeIcon(ac, selected = false) {
  const color    = acColor(ac);
  const csColor  = ac.isMilitary ? MIL_COLOR : '#DCE9FA';

  return L.divIcon({
    className: '',
    html: `<div class="ac-wrap${selected ? ' selected' : ''}">
      <div class="ac-svg">${planeSVG(color, ac.heading, selected, ac.isMilitary, ac.onGround)}</div>
      <div class="ac-lbl">
        <span class="ac-cs" style="color:${csColor}">${ac.callsign}</span>
        <span class="ac-fl" style="color:${color}">${ac.flightLevel}</span>
      </div>
    </div>`,
    iconSize:   [76, 84],
    iconAnchor: [38, 20],
  });
}

// ── Position trail ────────────────────────────────────────────────────────────
function updateTrail(ac) {
  if (ac.onGround) return;

  const hist = posHistory.get(ac.id) ?? [];
  const last = hist[hist.length - 1];
  if (!last ||
      Math.abs(last.lat - ac.lat) > 0.00015 ||
      Math.abs(last.lng - ac.lon) > 0.00015) {
    hist.push({ lat: ac.lat, lng: ac.lon });
    while (hist.length > TRAIL_MAX) hist.shift();
    posHistory.set(ac.id, hist);
  }

  const old = trailGroups.get(ac.id);
  if (old) map.removeLayer(old);
  if (hist.length < 2) return;

  const color = acColor(ac);
  const group = L.layerGroup();

  for (let i = 0; i < hist.length - 1; i++) {
    const t = (i + 1) / hist.length;
    L.circleMarker([hist[i].lat, hist[i].lng], {
      radius:      1 + t * 2.2,
      fillColor:   color,
      fillOpacity: t * 0.42,
      color:       'transparent',
      interactive: false,
    }).addTo(group);
  }

  group.addTo(map);
  trailGroups.set(ac.id, group);
}

// ── Update all markers ────────────────────────────────────────────────────────
export function updateMarkers(aircraftList, selectedId, filters) {
  const incoming = new Set(aircraftList.map(a => a.id));

  for (const [id, { marker }] of markers) {
    if (!incoming.has(id)) {
      map.removeLayer(marker);
      markers.delete(id);
      const tg = trailGroups.get(id);
      if (tg) { map.removeLayer(tg); trailGroups.delete(id); }
    }
  }

  for (const ac of aircraftList) {
    if (!passFilter(ac, filters)) {
      if (markers.has(ac.id)) { map.removeLayer(markers.get(ac.id).marker); markers.delete(ac.id); }
      const tg = trailGroups.get(ac.id);
      if (tg) { map.removeLayer(tg); trailGroups.delete(ac.id); }
      continue;
    }

    updateTrail(ac);
    const isSel = ac.id === selectedId;

    if (markers.has(ac.id)) {
      const entry = markers.get(ac.id);
      animateTo(entry.marker, ac.lat, ac.lon, 5000);
      entry.marker.setIcon(makeIcon(ac, isSel));
      entry.marker.setZIndexOffset(isSel ? 1000 : ac.isMilitary ? 500 : 0);
      entry.ac = ac;
    } else {
      const marker = L.marker([ac.lat, ac.lon], {
        icon: makeIcon(ac, isSel),
        zIndexOffset: isSel ? 1000 : ac.isMilitary ? 500 : 0,
        keyboard: false, riseOnHover: true,
      });
      marker.on('click', () => onSelectCb?.(ac));
      marker.addTo(map);
      markers.set(ac.id, { marker, ac });
    }
  }
}

export function refreshMarkerIcon(id, selectedId) {
  const entry = markers.get(id);
  if (!entry) return;
  entry.marker.setIcon(makeIcon(entry.ac, id === selectedId));
  entry.marker.setZIndexOffset(id === selectedId ? 1000 : entry.ac.isMilitary ? 500 : 0);
}

// ── Smooth eased position animation ──────────────────────────────────────────
function animateTo(marker, newLat, newLng, dur) {
  const start = marker.getLatLng();
  const t0    = performance.now();
  const tick  = (now) => {
    let t = Math.min((now - t0) / dur, 1);
    t = t < .5 ? 2*t*t : -1 + (4 - 2*t) * t;   // ease in-out quad
    marker.setLatLng([
      start.lat + (newLat - start.lat) * t,
      start.lng + (newLng - start.lng) * t,
    ]);
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ── Filters ───────────────────────────────────────────────────────────────────
function passFilter(ac, { showGround, showMilitary, onlyMilitary, altBand, country }) {
  if (!showGround   && ac.onGround)    return false;
  if (!showMilitary && ac.isMilitary)  return false;
  if (onlyMilitary  && !ac.isMilitary) return false;
  if (country && ac.country !== country) return false;
  if (altBand === 'low'    && (ac.altFt ?? 0) >= 10_000) return false;
  if (altBand === 'medium' && ((ac.altFt ?? 0) < 10_000 || (ac.altFt ?? 0) >= 35_000)) return false;
  if (altBand === 'high'   && (ac.altFt ?? 0) < 35_000) return false;
  return true;
}

// ── User GPS dot ──────────────────────────────────────────────────────────────
let userMarker = null;
export function setUserLocation(lat, lng) {
  const icon = L.divIcon({
    className: '',
    html: `<div class="user-dot">
      <div class="user-ring"></div>
      <div class="user-ring r2"></div>
    </div>`,
    iconSize: [24, 24], iconAnchor: [12, 12],
  });
  if (userMarker) userMarker.setLatLng([lat, lng]);
  else userMarker = L.marker([lat, lng], { icon, zIndexOffset: 2000 }).addTo(map);
}
