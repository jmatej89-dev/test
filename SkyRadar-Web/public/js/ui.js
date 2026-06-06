// UI — detail panel, stats bar, search, filter, toasts

import { fetchPhoto } from './api.js';
import { acColor, MIL_COLOR } from './aircraft.js';

// ── Detail panel ─────────────────────────────────────────────────────────────
const panel          = document.getElementById('detail-panel');
const panelPhotoImg  = document.getElementById('dp-photo-img');
const panelCredit    = document.getElementById('dp-credit');

export function showDetail(ac) {
  // Reset photo
  panelPhotoImg.src = '';
  panelPhotoImg.classList.add('hidden');
  panelPhotoImg.classList.remove('loading');
  document.getElementById('dp-photo-shimmer').classList.remove('hidden');
  panelCredit.textContent = '';

  const color = acColor(ac);
  const isMil = ac.isMilitary;

  // Plane icon
  const iconEl = document.getElementById('dp-icon');
  iconEl.style.color       = color;
  iconEl.style.background  = `${color}15`;
  iconEl.style.borderColor = `${color}2A`;

  // Callsign
  document.getElementById('dp-callsign').textContent = ac.callsign;

  // Country / flag
  document.getElementById('dp-country').innerHTML =
    `${isMil ? ac.milInfo?.flag ?? '' : '🌍'} ${isMil ? ac.milInfo?.country ?? ac.country : ac.country}`;

  // Squawk
  document.getElementById('dp-squawk').textContent = ac.squawk ? `· SQK ${ac.squawk}` : '';

  // Climb badge
  const climbEl = document.getElementById('dp-climb-badge');
  const cColors = { climbing: '#00E676', descending: '#FF7043', level: '#6E8DAD' };
  const cArrows = { climbing: '↗ Climbing', descending: '↘ Descending', level: '→ Level' };
  climbEl.textContent       = cArrows[ac.climbStatus];
  climbEl.style.color       = cColors[ac.climbStatus];
  climbEl.style.background  = `${cColors[ac.climbStatus]}18`;

  // Military banner
  const milBanner = document.getElementById('dp-mil-banner');
  if (isMil) {
    milBanner.classList.remove('hidden');
    document.getElementById('dp-mil-text').textContent =
      `${ac.milInfo?.flag ?? ''} ${ac.milInfo?.branch ?? 'Military'}`;
  } else {
    milBanner.classList.add('hidden');
  }

  // Action button accent
  document.querySelectorAll('.dp-action-btn').forEach(b => {
    b.style.color       = color;
    b.style.background  = `${color}10`;
    b.style.borderColor = `${color}28`;
  });

  // Metrics
  setMetric('dp-alt',    ac.altFt    != null ? ac.altFt.toLocaleString() : '—', 'ft',  isMil ? MIL_COLOR : color);
  setMetric('dp-speed',  ac.velKts   != null ? ac.velKts.toLocaleString() : '—', 'kts', color);
  setMetric('dp-vspeed', ac.vFpm     != null ? Math.abs(ac.vFpm).toLocaleString() : '—', 'fpm', cColors[ac.climbStatus]);
  setMetric('dp-heading',ac.heading  != null ? `${Math.round(ac.heading)}°` : '—', '', '#FFD600');
  setMetric('dp-fl',     ac.flightLevel, '', '#DCE9FA');
  setMetric('dp-icao',   ac.id.toUpperCase(), '', '#6E8DAD');

  // Status pill
  const pillEl = document.getElementById('dp-status-airborne');
  pillEl.textContent       = ac.onGround ? '🏢 On Ground' : '✈ Airborne';
  pillEl.style.color       = ac.onGround ? '#6E8DAD' : '#00E676';
  pillEl.style.background  = ac.onGround ? '#6E8DAD18' : '#00E67618';

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
  const photo   = await fetchPhoto(icao24);

  shimmer.classList.add('hidden');

  if (photo?.large || photo?.thumbnail) {
    panelPhotoImg.classList.add('loading');
    panelPhotoImg.src = photo.large || photo.thumbnail;

    panelPhotoImg.onload = () => {
      panelPhotoImg.classList.remove('hidden');
      requestAnimationFrame(() => {
        panelPhotoImg.style.transition = 'filter .45s ease, opacity .3s ease';
        panelPhotoImg.classList.remove('loading');
      });
    };
    panelPhotoImg.onerror = () => {
      panelPhotoImg.classList.add('hidden');
    };

    if (photo.photographer) {
      panelCredit.textContent =
        `📷 ${photo.photographer}${photo.model ? ' · ' + photo.model : ''}`;
    }
  }
}

// ── Stats bar ────────────────────────────────────────────────────────────────
const prevCounts = {};

export function updateStats(aircraft) {
  const airborne   = aircraft.filter(a => !a.onGround);
  const military   = aircraft.filter(a => a.isMilitary);
  const climbing   = airborne.filter(a => a.climbStatus === 'climbing').length;
  const descending = airborne.filter(a => a.climbStatus === 'descending').length;

  const speeds  = airborne.map(a => a.velKts).filter(Boolean);
  const alts    = airborne.map(a => a.altFt).filter(Boolean);
  const avgSpd  = speeds.length ? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length) : 0;
  const avgAlt  = alts.length   ? Math.round(alts.reduce((a, b) => a + b, 0) / alts.length) : 0;

  animateCount('stat-airborne',  airborne.length);
  animateCount('stat-airborne2', airborne.length);
  animateCount('stat-military',  military.length);
  animateCount('stat-climbing',  climbing);
  animateCount('stat-descending',descending);
  animateCount('stat-avg-spd',   avgSpd);

  const altEl = document.getElementById('stat-avg-alt');
  if (altEl) altEl.textContent = avgAlt > 0 ? avgAlt.toLocaleString() : '—';

  // Military chip
  const milChip = document.getElementById('stat-mil-chip');
  if (milChip) milChip.classList.toggle('hidden', military.length === 0);

  document.getElementById('stat-update').textContent = new Date().toLocaleTimeString();
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const from = prevCounts[id] ?? 0;
  prevCounts[id] = target;
  if (from === target) return;

  const dur   = 550;
  const start = performance.now();
  const tick  = (now) => {
    const t = Math.min((now - start) / dur, 1);
    const ease = 1 - Math.pow(1 - t, 3);   // ease-out cubic
    el.textContent = Math.round(from + (target - from) * ease);
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
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
  const el = document.getElementById('error-toast');
  el.classList.remove('show');
  el.classList.add('hidden');
}

// ── Loading ───────────────────────────────────────────────────────────────────
export function setLoading(on) {
  document.getElementById('loading-overlay').classList.toggle('hidden', !on);
}

// ── Filter panel ─────────────────────────────────────────────────────────────
export function openFilter()  { document.getElementById('filter-panel').classList.add('open'); }
export function closeFilter() { document.getElementById('filter-panel').classList.remove('open'); }

export function readFilters() {
  return {
    showGround:   document.getElementById('f-ground').checked,
    showMilitary: document.getElementById('f-military').checked,
    onlyMilitary: document.getElementById('f-only-mil').checked,
    altBand:      document.querySelector('input[name="altband"]:checked')?.value ?? 'all',
    country:      document.getElementById('f-country').value,
  };
}

// ── Search ────────────────────────────────────────────────────────────────────
let allAircraft = [];
let onSearchSelectCb = null;

export function initSearch(onSelect) {
  onSearchSelectCb = onSelect;
  const input   = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  input.addEventListener('input', () => renderSearchResults(input.value.trim().toLowerCase(), results));
}

export function setSearchData(aircraft) { allAircraft = aircraft; }

export function openSearch() {
  document.getElementById('search-overlay').classList.add('open');
  setTimeout(() => document.getElementById('search-input').focus(), 80);
}
export function closeSearch() {
  document.getElementById('search-overlay').classList.remove('open');
  document.getElementById('search-input').value = '';
  document.getElementById('search-results').innerHTML = '';
}

function renderSearchResults(query, container) {
  const filtered = query
    ? allAircraft.filter(a =>
        a.callsign.toLowerCase().includes(query) ||
        a.id.toLowerCase().includes(query)        ||
        a.country.toLowerCase().includes(query)   ||
        (a.milInfo?.branch?.toLowerCase() ?? '').includes(query)
      ).slice(0, 35)
    : allAircraft.slice(0, 35);

  container.innerHTML = '';

  if (filtered.length === 0) {
    container.innerHTML = '<div class="search-empty">No flights found</div>';
    return;
  }

  const frag = document.createDocumentFragment();
  for (const ac of filtered) {
    const color = acColor(ac);
    const div   = document.createElement('div');
    div.className = 'search-row';

    const cs = query
      ? ac.callsign.replace(new RegExp(`(${escapeRe(query)})`, 'gi'),
          '<mark style="background:rgba(0,200,240,.25);color:inherit;border-radius:2px">$1</mark>')
      : ac.callsign;

    div.innerHTML = `
      <div class="sr-icon" style="background:${color}15;color:${color}">✈</div>
      <div class="sr-info">
        <div class="sr-cs" style="color:${ac.isMilitary ? MIL_COLOR : '#DCE9FA'}">${cs}${
          ac.isMilitary ? ' <span class="sr-mil-badge">MIL</span>' : ''
        }</div>
        <div class="sr-sub">${ac.milInfo?.flag ?? '🌍'} ${ac.country} &nbsp;·&nbsp;
          <span style="color:${color};font-variant-numeric:tabular-nums">${ac.flightLevel}</span>
        </div>
      </div>
      <div class="sr-spd">${ac.velKts != null ? ac.velKts.toLocaleString() + ' kts' : ''}</div>`;

    div.addEventListener('click', () => {
      onSearchSelectCb?.(ac);
      closeSearch();
    });
    frag.appendChild(div);
  }
  container.appendChild(frag);
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Country filter ────────────────────────────────────────────────────────────
export function populateCountryFilter(aircraft) {
  const countries = [...new Set(aircraft.map(a => a.country))].sort();
  const select    = document.getElementById('f-country');
  const current   = select.value;
  select.innerHTML = '<option value="">All countries</option>';
  for (const c of countries) {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    if (c === current) opt.selected = true;
    select.appendChild(opt);
  }
}
