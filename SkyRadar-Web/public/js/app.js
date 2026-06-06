// SkyRadar — main app orchestration

import { fetchFlights }                          from './api.js';
import { parseStates }                           from './aircraft.js';
import { initMap, getMap, getBounds, flyTo,
         updateMarkers, refreshMarkerIcon,
         setUserLocation }                       from './map.js';
import { showDetail, hideDetail, updateStats,
         showError, hideError, setLoading,
         openFilter, closeFilter, readFilters,
         initSearch, setSearchData, openSearch,
         closeSearch, populateCountryFilter }    from './ui.js';

// ── State ────────────────────────────────────────────────────────────────────
let allAircraft   = [];
let selectedId    = null;
let filters       = { showGround:false, showMilitary:true, onlyMilitary:false, altBand:'all', country:'' };
let userLatLng    = null;
let refreshTimer  = null;
const REFRESH_MS  = 12_000;

// ── Map init ─────────────────────────────────────────────────────────────────
const map = initMap('map', [50.0, 14.0], 7, onAircraftSelect);

// Re-fetch when user finishes panning / zooming
map.on('moveend', () => fetch_());

// ── GPS ───────────────────────────────────────────────────────────────────────
if ('geolocation' in navigator) {
  navigator.geolocation.watchPosition(
    pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      setUserLocation(lat, lng);

      if (!userLatLng) {          // first fix → fly there
        flyTo(lat, lng, 8);
        setTimeout(fetch_, 800);  // fetch after fly animation
      }
      userLatLng = { lat, lng };

      document.getElementById('btn-locate').style.color = '#00C8F0';
    },
    err => console.warn('[GPS]', err.message),
    { enableHighAccuracy: false, maximumAge: 10_000 }
  );
}

// ── Fetch & refresh ───────────────────────────────────────────────────────────
async function fetch_() {
  clearTimeout(refreshTimer);
  hideError();

  if (allAircraft.length === 0) setLoading(true);

  try {
    const bounds = getBounds();
    // Don't fetch if zoomed way out (too many aircraft)
    const span = Math.abs(bounds.north - bounds.south);
    if (span > 40) {
      setLoading(false);
      return;
    }

    const data = await fetchFlights(bounds);
    allAircraft = parseStates(data.states ?? []);
    setSearchData(allAircraft);
    populateCountryFilter(allAircraft);
    updateMarkers(allAircraft, selectedId, filters);
    updateStats(allAircraft);

    // stat-update is updated inside updateStats()
  } catch (e) {
    showError(e.message);
  } finally {
    setLoading(false);
  }

  refreshTimer = setTimeout(fetch_, REFRESH_MS);
}

// ── Aircraft selection ────────────────────────────────────────────────────────
function onAircraftSelect(ac) {
  const prev = selectedId;
  selectedId = ac.id;

  if (prev) refreshMarkerIcon(prev, selectedId);
  refreshMarkerIcon(ac.id, selectedId);

  showDetail(ac);
}

// ── Button wiring ─────────────────────────────────────────────────────────────
document.getElementById('btn-locate').addEventListener('click', () => {
  if (userLatLng) {
    flyTo(userLatLng.lat, userLatLng.lng, 8);
  } else {
    showError('GPS not yet available');
  }
});

document.getElementById('btn-search').addEventListener('click', openSearch);
document.getElementById('btn-filter').addEventListener('click', openFilter);

document.getElementById('btn-refresh').addEventListener('click', async () => {
  const btn = document.getElementById('btn-refresh');
  btn.classList.add('spinning');
  await fetch_();
  btn.classList.remove('spinning');
});

document.getElementById('dp-close').addEventListener('click', () => {
  hideDetail();
  selectedId = null;
});

document.getElementById('dp-centre-btn').addEventListener('click', () => {
  const ac = allAircraft.find(a => a.id === selectedId);
  if (ac) flyTo(ac.lat, ac.lon, 9);
});

// Filter panel
document.getElementById('filter-close').addEventListener('click', () => {
  filters = readFilters();
  updateMarkers(allAircraft, selectedId, filters);
  closeFilter();
});
document.getElementById('filter-reset').addEventListener('click', () => {
  document.getElementById('f-ground').checked    = false;
  document.getElementById('f-military').checked  = true;
  document.getElementById('f-only-mil').checked  = false;
  document.querySelector('input[name="altband"][value="all"]').checked = true;
  document.getElementById('f-country').value     = '';
  filters = readFilters();
  updateMarkers(allAircraft, selectedId, filters);
});

// Search
initSearch(ac => {
  onAircraftSelect(ac);
  flyTo(ac.lat, ac.lon, 9);
});
document.getElementById('search-close').addEventListener('click', closeSearch);
document.getElementById('search-input').addEventListener('keydown', e => {
  if (e.key === 'Escape') closeSearch();
});

// Close panels on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { hideDetail(); closeSearch(); closeFilter(); }
});

// ── Start ─────────────────────────────────────────────────────────────────────
fetch_();
