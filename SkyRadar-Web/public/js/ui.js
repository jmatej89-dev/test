// UI — detail panel, stats bar, search, filter, toasts

import { fetchPhoto } from './api.js';
import { acColor, MIL_COLOR } from './aircraft.js';

// ── Detail panel ─────────────────────────────────────────────────────────────
const panel      = document.getElementById('detail-panel');
const panelPhoto = document.getElementById('dp-photo');
const panelPhotoImg = document.getElementById('dp-photo-img');
const panelCredit   = document.getElementById('dp-credit');

export function showDetail(ac) {
  // Reset
  panelPhotoImg.src = '';
  panelPhotoImg.classList.add('hidden');
  document.getElementById('dp-photo-shimmer').classList.remove('hidden');
  panelCredit.textContent = '';

  const color = acColor(ac);
  const isMil = ac.isMilitary;

  // Header
  document.getElementById('dp-icon').style.color       = color;
  document.getElementById('dp-icon').style.background  = `${color}18`;
  document.getElementById('dp-icon').style.borderColor = `${color}33`;
  document.getElementById('dp-callsign').textContent   = ac.callsign;
  document.getElementById('dp-country').innerHTML =
    `${isMil ? ac.milInfo?.flag ?? '' : '🌍'} ${isMil ? ac.milInfo?.country ?? ac.country : ac.country}`;
  document.getElementById('dp-squawk').textContent =
    ac.squawk ? `· SQK ${ac.squawk}` : '';

  // Climb badge
  const climbEl = document.getElementById('dp-climb-badge');
  const colors  = { climbing:'#00E676', descending:'#FF7043', level:'#6E8DAD' };
  const arrows  = { climbing:'↗ Climbing', descending:'↘ Descending', level:'→ Level' };
  climbEl.textContent = arrows[ac.climbStatus];
  climbEl.style.color      = colors[ac.climbStatus];
  climbEl.style.background = `${colors[ac.climbStatus]}1A`;

  // Military banner
  const milBanner = document.getElementById('dp-mil-banner');
  if (isMil) {
    milBanner.classList.remove('hidden');
    document.getElementById('dp-mil-text').textContent =
      `${ac.milInfo?.flag ?? ''} ${ac.milInfo?.branch ?? 'Military'}`;
  } else {
    milBanner.classList.add('hidden');
  }

  // Accent on action buttons
  document.querySelectorAll('.dp-action-btn').forEach(b => {
    b.style.color       = color;
    b.style.background  = `${color}12`;
    b.style.borderColor = `${color}30`;
  });

  // Metrics
  setMetric('dp-alt',     ac.altFt    != null ? ac.altFt.toLocaleString() : '—', 'ft',   isMil ? MIL_COLOR : color);
  setMetric('dp-speed',   ac.velKts   != null ? ac.velKts : '—',                 'kts',  color);
  setMetric('dp-vspeed',  ac.vFpm     != null ? Math.abs(ac.vFpm).toLocaleString() : '—', 'fpm', colors[ac.climbStatus]);
  setMetric('dp-heading', ac.heading  != null ? `${Math.round(ac.heading)}°` : '—', '',  '#FFD600');
  setMetric('dp-fl',      ac.flightLevel, '',  '#DCE9FA');
  setMetric('dp-icao',    ac.id.toUpperCase(), '', '#6E8DAD');

  // Status pills
  document.getElementById('dp-status-airborne').textContent  = ac.onGround ? '🏢 On Ground' : '✈ Airborne';
  document.getElementById('dp-status-airborne').style.color  = ac.onGround ? '#8EAABF' : '#00E676';
  document.getElementById('dp-status-airborne').style.background = ac.onGround ? '#8EAABF1A' : '#00E6761A';

  panel.classList.remove('hidden');
  panel.classList.add('open');

  // Load photo async
  loadPhoto(ac.id);
}

export function hideDetail() {
  panel.classList.remove('open');
  panel.classList.add('hidden');
}

function setMetric(id, value, unit, color) {
  const el = document.getElementById(id);
  if (!el) return;
  el.querySelector('.m-val').textContent  = value;
  el.querySelector('.m-unit').textContent = unit;
  el.querySelector('.m-val').style.color  = color;
}

async function loadPhoto(icao24) {
  const shimmer = document.getElementById('dp-photo-shimmer');
  const photo = await fetchPhoto(icao24);

  shimmer.classList.add('hidden');

  if (photo?.large || photo?.thumbnail) {
    panelPhotoImg.src = photo.large || photo.thumbnail;
    panelPhotoImg.onload = () => panelPhotoImg.classList.remove('hidden');
    panelPhotoImg.onerror = () => panelPhotoImg.classList.add('hidden');
    if (photo.photographer) {
      panelCredit.textContent = `📷 © ${photo.photographer}${photo.model ? ' · ' + photo.model : ''}`;
    }
  }
}

// ── Stats bar ────────────────────────────────────────────────────────────────
export function updateStats(aircraft) {
  const airborne   = aircraft.filter(a => !a.onGround);
  const military   = aircraft.filter(a => a.isMilitary);
  const climbing   = airborne.filter(a => a.climbStatus === 'climbing').length;
  const descending = airborne.filter(a => a.climbStatus === 'descending').length;

  const speeds = airborne.map(a => a.velKts).filter(Boolean);
  const alts   = airborne.map(a => a.altFt).filter(Boolean);
  const avgSpd = speeds.length ? Math.round(speeds.reduce((a,b)=>a+b,0)/speeds.length) : 0;
  const avgAlt = alts.length   ? Math.round(alts.reduce((a,b)=>a+b,0)/alts.length).toLocaleString() : '—';

  setText('stat-airborne',  airborne.length);
  setText('stat-airborne2', airborne.length);
  setText('stat-military',  military.length);
  setText('stat-climbing',  climbing);
  setText('stat-descending',descending);
  setText('stat-avg-spd',   avgSpd);
  setText('stat-avg-alt',   avgAlt);

  const milChip = document.getElementById('stat-mil-chip');
  if (military.length > 0) {
    milChip.classList.remove('hidden');
  } else {
    milChip.classList.add('hidden');
  }

  document.getElementById('stat-update').textContent = new Date().toLocaleTimeString();
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ── Error / toast ────────────────────────────────────────────────────────────
export function showError(msg) {
  const el = document.getElementById('error-toast');
  el.querySelector('#error-msg').textContent = msg;
  el.classList.remove('hidden');
  el.classList.add('show');
  setTimeout(() => { el.classList.remove('show'); el.classList.add('hidden'); }, 5000);
}

export function hideError() {
  document.getElementById('error-toast').classList.add('hidden');
}

// ── Loading spinner ──────────────────────────────────────────────────────────
export function setLoading(on) {
  document.getElementById('loading-overlay').classList.toggle('hidden', !on);
}

// ── Filter panel ─────────────────────────────────────────────────────────────
export function openFilter() {
  document.getElementById('filter-panel').classList.add('open');
}
export function closeFilter() {
  document.getElementById('filter-panel').classList.remove('open');
}

export function readFilters() {
  return {
    showGround:   document.getElementById('f-ground').checked,
    showMilitary: document.getElementById('f-military').checked,
    onlyMilitary: document.getElementById('f-only-mil').checked,
    altBand:      document.querySelector('input[name="altband"]:checked')?.value ?? 'all',
    country:      document.getElementById('f-country').value,
  };
}

// ── Search ───────────────────────────────────────────────────────────────────
let allAircraft = [];
let onSearchSelectCb = null;

export function initSearch(onSelect) {
  onSearchSelectCb = onSelect;
  const input   = document.getElementById('search-input');
  const results = document.getElementById('search-results');

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    renderSearchResults(q, results);
  });
}

export function setSearchData(aircraft) {
  allAircraft = aircraft;
}

export function openSearch() {
  document.getElementById('search-overlay').classList.add('open');
  document.getElementById('search-input').focus();
}
export function closeSearch() {
  document.getElementById('search-overlay').classList.remove('open');
  document.getElementById('search-input').value = '';
}

function renderSearchResults(query, container) {
  const filtered = query
    ? allAircraft.filter(a =>
        a.callsign.toLowerCase().includes(query)  ||
        a.id.toLowerCase().includes(query)         ||
        a.country.toLowerCase().includes(query)    ||
        (a.milInfo?.branch?.toLowerCase() ?? '').includes(query)
      ).slice(0, 30)
    : allAircraft.slice(0, 30);

  container.innerHTML = '';

  if (filtered.length === 0) {
    container.innerHTML = '<div class="search-empty">No flights found</div>';
    return;
  }

  for (const ac of filtered) {
    const color = acColor(ac);
    const div = document.createElement('div');
    div.className = 'search-row';
    div.innerHTML = `
      <div class="sr-icon" style="background:${color}18;color:${color}">✈</div>
      <div class="sr-info">
        <div class="sr-cs" style="color:${ac.isMilitary ? MIL_COLOR : '#DCE9FA'}">${ac.callsign}
          ${ac.isMilitary ? '<span class="sr-mil-badge">MIL</span>' : ''}
        </div>
        <div class="sr-sub">${ac.milInfo?.flag ?? '🌍'} ${ac.country} &nbsp;·&nbsp; <span style="color:${color}">${ac.flightLevel}</span></div>
      </div>
      <div class="sr-spd">${ac.velKts != null ? ac.velKts + ' kts' : ''}</div>
    `;
    div.addEventListener('click', () => {
      onSearchSelectCb?.(ac);
      closeSearch();
    });
    container.appendChild(div);
  }
}

// ── Country dropdown ─────────────────────────────────────────────────────────
export function populateCountryFilter(aircraft) {
  const countries = [...new Set(aircraft.map(a => a.country))].sort();
  const select = document.getElementById('f-country');
  const current = select.value;
  select.innerHTML = '<option value="">All countries</option>';
  for (const c of countries) {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    if (c === current) opt.selected = true;
    select.appendChild(opt);
  }
}
