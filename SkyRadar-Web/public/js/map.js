// Leaflet map management — markers, movement, selection

import { acColor, MIL_COLOR } from './aircraft.js';

let map;
const markers = new Map();   // icao24 → { marker, ac, tweenId }
let onSelectCb = null;

// ── Init ─────────────────────────────────────────────────────────────────────
export function initMap(containerId, center, zoom, onSelect) {
  onSelectCb = onSelect;

  map = L.map(containerId, {
    center, zoom,
    zoomControl: false,
    attributionControl: true,
  });

  // Dark CartoDB tiles (no API key)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map);

  // Zoom controls bottom-right
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  return map;
}

export function getMap() { return map; }

export function getBounds() {
  const b = map.getBounds();
  return { south: b.getSouth(), north: b.getNorth(), west: b.getWest(), east: b.getEast() };
}

export function flyTo(lat, lng, zoom = 9) {
  map.flyTo([lat, lng], zoom, { duration: 1.2 });
}

// ── Marker icon ──────────────────────────────────────────────────────────────
function makeIcon(ac, selected = false) {
  const color = acColor(ac);
  const rot   = ((ac.heading ?? 0) - 45);   // ✈ symbol points NE at 0°
  const scale = ac.onGround ? 0.8 : 1;
  const sel   = selected ? 'selected' : '';

  return L.divIcon({
    className: '',
    html: `
      <div class="ac-wrap ${sel}" style="transform:scale(${scale})">
        <div class="ac-body">
          ${selected ? `<div class="ac-ring" style="border-color:${color}"></div>` : ''}
          <div class="ac-plane" style="color:${color};transform:rotate(${rot}deg)">✈</div>
          ${ac.isMilitary ? `<div class="ac-mil-dot"></div>` : ''}
        </div>
        <div class="ac-lbl">
          <span class="ac-cs" style="color:${ac.isMilitary ? MIL_COLOR : '#fff'}">${ac.callsign}</span>
          <span class="ac-fl" style="color:${color}">${ac.flightLevel}</span>
        </div>
      </div>`,
    iconSize:   [64, 72],
    iconAnchor: [32, 24],
  });
}

// ── Update all markers ───────────────────────────────────────────────────────
export function updateMarkers(aircraftList, selectedId, filters) {
  const incoming = new Set(aircraftList.map(a => a.id));

  // Remove gone aircraft
  for (const [id, { marker }] of markers) {
    if (!incoming.has(id)) {
      map.removeLayer(marker);
      markers.delete(id);
    }
  }

  for (const ac of aircraftList) {
    if (!passFilter(ac, filters)) {
      if (markers.has(ac.id)) {
        map.removeLayer(markers.get(ac.id).marker);
        markers.delete(ac.id);
      }
      continue;
    }

    const isSelected = ac.id === selectedId;

    if (markers.has(ac.id)) {
      const entry = markers.get(ac.id);
      animateTo(entry.marker, ac.lat, ac.lon, 5000);
      entry.marker.setIcon(makeIcon(ac, isSelected));
      entry.ac = ac;
    } else {
      const marker = L.marker([ac.lat, ac.lon], {
        icon:            makeIcon(ac, isSelected),
        zIndexOffset:    isSelected ? 1000 : (ac.isMilitary ? 500 : 0),
        keyboard:        false,
        riseOnHover:     true,
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
  entry.marker.setZIndexOffset(id === selectedId ? 1000 : (entry.ac.isMilitary ? 500 : 0));
}

// ── Smooth position animation ────────────────────────────────────────────────
function animateTo(marker, newLat, newLng, durationMs) {
  const start    = marker.getLatLng();
  const startTs  = performance.now();

  const tick = (now) => {
    const t = Math.min((now - startTs) / durationMs, 1);
    marker.setLatLng([
      start.lat + (newLat - start.lat) * t,
      start.lng + (newLng - start.lng) * t,
    ]);
    if (t < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

// ── Filters ──────────────────────────────────────────────────────────────────
function passFilter(ac, { showGround, showMilitary, onlyMilitary, altBand, country }) {
  if (!showGround   && ac.onGround)   return false;
  if (!showMilitary && ac.isMilitary) return false;
  if (onlyMilitary  && !ac.isMilitary) return false;
  if (country && ac.country !== country) return false;

  if (altBand === 'low'    && (ac.altFt ?? 0) >= 10_000) return false;
  if (altBand === 'medium' && ((ac.altFt ?? 0) < 10_000 || (ac.altFt ?? 0) >= 35_000)) return false;
  if (altBand === 'high'   && (ac.altFt ?? 0) < 35_000)  return false;

  return true;
}

// ── User location marker ─────────────────────────────────────────────────────
let userMarker = null;

export function setUserLocation(lat, lng) {
  const icon = L.divIcon({
    className: '',
    html: `<div class="user-dot"><div class="user-ring"></div></div>`,
    iconSize:   [20, 20],
    iconAnchor: [10, 10],
  });

  if (userMarker) {
    userMarker.setLatLng([lat, lng]);
  } else {
    userMarker = L.marker([lat, lng], { icon, zIndexOffset: 2000 }).addTo(map);
  }
}
