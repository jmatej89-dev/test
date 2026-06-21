/* ── STATE ──────────────────────────────────────────────────────────────────── */

const state = {
  type: 'info',
  photos: {           // per-zone photo File objects
    info: null,
    citation: null,
    data: null,
  },
  carousel: {
    slides: [],       // [{headline, eyebrow, cyan, fo0, fo1, fontsize, ynudge, photo, photoURL}]
    current: 0,       // currently previewed slide index
    previewImages: [], // base64 strings per slide
  },
  debounce: null,
  previewGeneration: 0,  // track to ignore stale responses
};

/* ── BOOTSTRAP ──────────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  initTypeTabs();
  initDropzones();
  initSliders();
  initCarousel();
  initDataChart();
  initButtons();
  watchInputs();
  addCarouselSlide(); // start with 1 slide
  triggerPreview();
});

/* ── TYPE TABS ──────────────────────────────────────────────────────────────── */

function initTypeTabs() {
  document.querySelectorAll('.type-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      state.type = btn.dataset.type;
      document.querySelectorAll('.type-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.post-panel').forEach(p => p.classList.add('hidden'));
      document.getElementById(`panel-${state.type}`).classList.remove('hidden');
      updateCarouselNav();
      triggerPreview();
    });
  });
}

/* ── DROPZONES ──────────────────────────────────────────────────────────────── */

function initDropzones() {
  ['info', 'citation', 'data'].forEach(zone => {
    const dz    = document.getElementById(`dz-${zone}`);
    const input = document.getElementById(`photo-${zone}`);
    if (!dz || !input) return;

    input.addEventListener('change', () => handlePhotoFile(zone, input.files[0]));

    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
    dz.addEventListener('drop', e => {
      e.preventDefault();
      dz.classList.remove('dragover');
      const file = e.dataTransfer?.files?.[0];
      if (file && file.type.startsWith('image/')) handlePhotoFile(zone, file);
    });
  });

  // Clear buttons
  document.querySelectorAll('.photo-clear').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const zone = btn.dataset.target;
      clearPhoto(zone);
    });
  });
}

function handlePhotoFile(zone, file) {
  if (!file) return;
  state.photos[zone] = file;
  const dz = document.getElementById(`dz-${zone}`);
  const reader = new FileReader();
  reader.onload = ev => {
    dz.classList.add('has-photo');
    let img = dz.querySelector('img.dz-preview-img');
    if (!img) {
      img = document.createElement('img');
      img.className = 'dz-preview-img';
      dz.insertBefore(img, dz.firstChild);
    }
    img.src = ev.target.result;
    // Hide text elements
    dz.querySelectorAll('.dz-icon,.dz-text,.dz-hint').forEach(el => el.style.display = 'none');
    triggerPreview();
  };
  reader.readAsDataURL(file);
}

function clearPhoto(zone) {
  state.photos[zone] = null;
  const dz    = document.getElementById(`dz-${zone}`);
  const input = document.getElementById(`photo-${zone}`);
  if (!dz) return;
  dz.classList.remove('has-photo', 'dragover');
  const img = dz.querySelector('img.dz-preview-img');
  if (img) img.remove();
  dz.querySelectorAll('.dz-icon,.dz-text,.dz-hint').forEach(el => el.style.display = '');
  if (input) input.value = '';
  triggerPreview();
}

/* ── SLIDERS ──────────────────────────────────────────────────────────────────── */

function initSliders() {
  document.querySelectorAll('input[type="range"]').forEach(slider => {
    const valId = slider.id + '-val';
    const valEl = document.getElementById(valId);
    if (valEl) valEl.textContent = parseFloat(slider.value).toFixed(
      slider.step && parseFloat(slider.step) < 1 ? 2 : 0
    );
    slider.addEventListener('input', () => {
      if (valEl) valEl.textContent = parseFloat(slider.value).toFixed(
        slider.step && parseFloat(slider.step) < 1 ? 2 : 0
      );
      triggerPreview();
    });
  });
}

/* ── CAROUSEL ─────────────────────────────────────────────────────────────────── */

let slideCounter = 0;

function initCarousel() {
  document.getElementById('add-slide').addEventListener('click', () => {
    if (state.carousel.slides.length >= 5) { toast('Maximálně 5 slidů', 'error'); return; }
    addCarouselSlide();
  });
  document.getElementById('prev-slide').addEventListener('click', () => {
    if (state.carousel.current > 0) {
      state.carousel.current--;
      showCarouselSlide(state.carousel.current);
    }
  });
  document.getElementById('next-slide').addEventListener('click', () => {
    if (state.carousel.current < state.carousel.slides.length - 1) {
      state.carousel.current++;
      showCarouselSlide(state.carousel.current);
    }
  });
}

function addCarouselSlide(data = {}) {
  const id  = ++slideCounter;
  const idx = state.carousel.slides.length;
  const slide = {
    id,
    headline:  data.headline  || '',
    eyebrow:   data.eyebrow   || '',
    cyan:      data.cyan      || '',
    fo0:       data.fo0       ?? 0.72,
    fo1:       data.fo1       ?? 0.96,
    fontsize:  data.fontsize  ?? 0,
    ynudge:    data.ynudge    ?? 0,
    photo:     null,
    photoURL:  null,
    isLast:    false,
  };
  state.carousel.slides.push(slide);
  renderSlideCard(idx);
  updateSlideIsLast();
  updateCarouselNav();
  triggerPreview();
}

function renderSlideCard(idx) {
  const slide = state.carousel.slides[idx];
  const list  = document.getElementById('slide-list');
  const card  = document.createElement('div');
  card.className = 'slide-card';
  card.dataset.slideId = slide.id;
  const num   = idx + 1;
  card.innerHTML = `
    <div class="slide-card-header" data-slide-id="${slide.id}">
      <span class="slide-num">${num}</span>
      <span class="slide-card-title">${slide.headline || `Slide ${num}`}</span>
      <button class="slide-del" data-slide-id="${slide.id}" title="Smazat slide">✕</button>
    </div>
    <div class="slide-card-body" id="slide-body-${slide.id}">
      <div class="dropzone" id="dz-slide-${slide.id}" style="min-height:80px">
        <input type="file" accept="image/*" id="photo-slide-${slide.id}">
        <div class="dz-icon" style="font-size:20px">🖼️</div>
        <div class="dz-text">Fotografie slidu</div>
        <button class="photo-clear" data-slide-id="${slide.id}" title="Odebrat">✕</button>
      </div>
      <div class="field">
        <label class="field-label">Eyebrow</label>
        <input type="text" class="sl-eyebrow" data-slide-id="${slide.id}" placeholder="KONTEXT, FAKTA…" value="${slide.eyebrow}">
      </div>
      <div class="field">
        <label class="field-label">Nadpis</label>
        <textarea class="sl-headline" data-slide-id="${slide.id}" rows="3" placeholder="Nejsilnější výrok slidu…">${slide.headline}</textarea>
      </div>
      <div class="field">
        <label class="field-label">Cyan</label>
        <input type="text" class="sl-cyan" data-slide-id="${slide.id}" placeholder="fráze|další" value="${slide.cyan}">
      </div>
      <details class="tech" style="margin-top:4px">
        <summary style="font-size:11px">⚙ Gradient & písmo</summary>
        <div class="tech-body">
          <div class="slider-row">
            <span class="slider-label">fo0</span>
            <input type="range" class="sl-fo0" data-slide-id="${slide.id}" min="0.3" max="0.95" step="0.01" value="${slide.fo0}">
            <span class="slider-val sl-fo0-val">0.72</span>
          </div>
          <div class="slider-row">
            <span class="slider-label">fo1</span>
            <input type="range" class="sl-fo1" data-slide-id="${slide.id}" min="0.5" max="1.0" step="0.01" value="${slide.fo1}">
            <span class="slider-val sl-fo1-val">0.96</span>
          </div>
          <div class="field">
            <label class="field-label">Písmo</label>
            <select class="sl-fontsize" data-slide-id="${slide.id}">
              <option value="0">Auto</option>
              <option value="84">84px</option>
              <option value="78">78px</option>
              <option value="68">68px</option>
              <option value="56">56px</option>
            </select>
          </div>
          <div class="slider-row">
            <span class="slider-label">Y-nudge</span>
            <input type="range" class="sl-ynudge" data-slide-id="${slide.id}" min="-120" max="120" step="4" value="0">
            <span class="slider-val sl-ynudge-val">0</span>
          </div>
        </div>
      </details>
    </div>
  `;
  list.appendChild(card);

  // Header toggle
  card.querySelector('.slide-card-header').addEventListener('click', e => {
    if (e.target.closest('.slide-del')) return;
    const body = card.querySelector('.slide-card-body');
    body.classList.toggle('collapsed');
    // Show this slide in preview
    const clickedIdx = state.carousel.slides.findIndex(s => s.id === slide.id);
    if (clickedIdx >= 0) {
      state.carousel.current = clickedIdx;
      showCarouselSlide(clickedIdx);
    }
  });

  // Delete button
  card.querySelector('.slide-del').addEventListener('click', e => {
    e.stopPropagation();
    removeSlide(slide.id);
  });

  // Photo upload
  const dzSlide    = card.querySelector(`#dz-slide-${slide.id}`);
  const photoInput = card.querySelector(`#photo-slide-${slide.id}`);
  photoInput.addEventListener('change', () => handleSlidePhoto(slide.id, photoInput.files[0]));
  dzSlide.addEventListener('dragover', e => { e.preventDefault(); dzSlide.classList.add('dragover'); });
  dzSlide.addEventListener('dragleave', () => dzSlide.classList.remove('dragover'));
  dzSlide.addEventListener('drop', e => {
    e.preventDefault();
    dzSlide.classList.remove('dragover');
    const f = e.dataTransfer?.files?.[0];
    if (f && f.type.startsWith('image/')) handleSlidePhoto(slide.id, f);
  });
  card.querySelector('.photo-clear').addEventListener('click', e => {
    e.stopPropagation();
    clearSlidePhoto(slide.id);
  });

  // Text inputs
  card.querySelector('.sl-headline').addEventListener('input', e => {
    slide.headline = e.target.value;
    card.querySelector('.slide-card-title').textContent = slide.headline || `Slide ${idx + 1}`;
    triggerPreview();
  });
  card.querySelector('.sl-eyebrow').addEventListener('input', e => { slide.eyebrow = e.target.value; triggerPreview(); });
  card.querySelector('.sl-cyan').addEventListener('input', e => { slide.cyan = e.target.value; triggerPreview(); });

  // Sliders in slide
  card.querySelectorAll('input[type="range"]').forEach(r => {
    const valEl = r.nextElementSibling;
    r.addEventListener('input', () => {
      if (valEl) valEl.textContent = parseFloat(r.value).toFixed(r.step < 1 ? 2 : 0);
      if (r.classList.contains('sl-fo0'))    slide.fo0     = parseFloat(r.value);
      if (r.classList.contains('sl-fo1'))    slide.fo1     = parseFloat(r.value);
      if (r.classList.contains('sl-ynudge')) slide.ynudge  = parseInt(r.value);
      triggerPreview();
    });
    // Set initial display
    if (valEl) valEl.textContent = parseFloat(r.value).toFixed(r.step < 1 ? 2 : 0);
  });

  card.querySelector('.sl-fontsize').addEventListener('change', e => {
    slide.fontsize = parseInt(e.target.value);
    triggerPreview();
  });
}

function handleSlidePhoto(slideId, file) {
  if (!file) return;
  const slide = state.carousel.slides.find(s => s.id === slideId);
  if (!slide) return;
  slide.photo = file;
  const reader = new FileReader();
  reader.onload = ev => {
    slide.photoURL = ev.target.result;
    const dz = document.getElementById(`dz-slide-${slideId}`);
    if (dz) {
      dz.classList.add('has-photo');
      let img = dz.querySelector('img.dz-preview-img');
      if (!img) { img = document.createElement('img'); img.className='dz-preview-img'; dz.insertBefore(img, dz.firstChild); }
      img.src = ev.target.result;
      dz.querySelectorAll('.dz-icon,.dz-text').forEach(el => el.style.display = 'none');
    }
    triggerPreview();
  };
  reader.readAsDataURL(file);
}

function clearSlidePhoto(slideId) {
  const slide = state.carousel.slides.find(s => s.id === slideId);
  if (!slide) return;
  slide.photo = null;
  slide.photoURL = null;
  const dz = document.getElementById(`dz-slide-${slideId}`);
  if (dz) {
    dz.classList.remove('has-photo');
    const img = dz.querySelector('img.dz-preview-img');
    if (img) img.remove();
    dz.querySelectorAll('.dz-icon,.dz-text').forEach(el => el.style.display = '');
  }
  triggerPreview();
}

function removeSlide(slideId) {
  const idx = state.carousel.slides.findIndex(s => s.id === slideId);
  if (idx < 0) return;
  if (state.carousel.slides.length === 1) { toast('Musí být alespoň 1 slide', 'error'); return; }
  state.carousel.slides.splice(idx, 1);
  state.carousel.previewImages.splice(idx, 1);
  if (state.carousel.current >= state.carousel.slides.length)
    state.carousel.current = state.carousel.slides.length - 1;
  rerenderSlideList();
  updateSlideIsLast();
  updateCarouselNav();
  triggerPreview();
}

function rerenderSlideList() {
  const list = document.getElementById('slide-list');
  list.innerHTML = '';
  slideCounter = 0;
  const saved = state.carousel.slides.map(s => ({ ...s }));
  state.carousel.slides = [];
  saved.forEach(s => { state.carousel.slides.push(s); renderSlideCard(state.carousel.slides.length - 1); });
}

function updateSlideIsLast() {
  state.carousel.slides.forEach((s, i) => s.isLast = i === state.carousel.slides.length - 1);
}

function updateCarouselNav() {
  const nav = document.getElementById('carousel-nav');
  if (state.type === 'carousel') {
    nav.classList.remove('hidden');
    const n = state.carousel.slides.length;
    document.getElementById('slide-indicator').textContent =
      `${Math.min(state.carousel.current + 1, n)} / ${n}`;
  } else {
    nav.classList.add('hidden');
  }
}

function showCarouselSlide(idx) {
  state.carousel.current = idx;
  updateCarouselNav();
  const img = document.getElementById('preview-img');
  const b64 = state.carousel.previewImages[idx];
  if (b64) {
    img.src = 'data:image/png;base64,' + b64;
    img.style.display = 'block';
    document.getElementById('preview-empty').style.display = 'none';
  }
}

/* ── DATA CHART ROWS ─────────────────────────────────────────────────────────── */

const PARTY_COLORS = ['#2255A4', '#034D9B', '#FF0000', '#000000', '#00A651',
                      '#FFD700', '#971B2F', '#FF6600', '#6600CC', '#008080'];
let chartRowCount = 0;

function initDataChart() {
  document.getElementById('add-chart-row').addEventListener('click', addChartRow);
  // Seed with a few rows
  [
    { label: 'ANO', value: '32', color: '#2255A4' },
    { label: 'ODS', value: '14', color: '#034D9B' },
    { label: 'STAN', value: '11', color: '#00A651' },
    { label: 'Piráti', value: '9', color: '#231F20' },
  ].forEach(addChartRow);
}

function addChartRow(data = {}) {
  const id  = ++chartRowCount;
  const row = document.createElement('div');
  row.className = 'chart-row';
  row.dataset.rowId = id;
  const color = typeof data === 'object' && data.color ? data.color :
    PARTY_COLORS[(chartRowCount - 1) % PARTY_COLORS.length];
  const label = typeof data === 'object' ? (data.label || '') : '';
  const value = typeof data === 'object' ? (data.value || '') : '';
  row.innerHTML = `
    <input type="text"   class="cr-label" placeholder="Název" value="${label}">
    <input type="number" class="cr-value" placeholder="%" min="0" max="100" value="${value}">
    <input type="color" class="cr-color" value="${color}">
    <button class="icon-btn cr-del" title="Smazat">✕</button>
  `;
  document.getElementById('chart-rows').appendChild(row);
  row.querySelector('.cr-del').addEventListener('click', () => { row.remove(); triggerPreview(); });
  row.querySelectorAll('input').forEach(i => i.addEventListener('input', () => triggerPreview()));
}

function getChartData() {
  const rows = [];
  document.querySelectorAll('.chart-row').forEach(row => {
    const label = row.querySelector('.cr-label').value.trim();
    const value = parseFloat(row.querySelector('.cr-value').value) || 0;
    const color = row.querySelector('.cr-color').value;
    if (label) rows.push({ label, value, color: hexToRgb(color) });
  });
  return rows;
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

/* ── WATCH ALL INPUTS ──────────────────────────────────────────────────────────── */

function watchInputs() {
  const ids = [
    'info-eyebrow', 'info-eyebrow-on', 'info-headline', 'info-cyan',
    'cit-quote', 'cit-cyan', 'cit-name', 'cit-role',
    'data-eyebrow', 'data-headline', 'data-cyan', 'data-footnote',
    'data-chart-type', 'clean-color',
    'info-fontsize', 'cit-fontsize', 'data-fontsize',
  ];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const evt = el.tagName === 'SELECT' || el.type === 'checkbox' ? 'change' : 'input';
    el.addEventListener(evt, () => triggerPreview());
  });
}

/* ── PREVIEW ──────────────────────────────────────────────────────────────────── */

function triggerPreview() {
  clearTimeout(state.debounce);
  state.debounce = setTimeout(fetchPreview, 420);
}

async function fetchPreview() {
  const gen = ++state.previewGeneration;
  setLoading(true);

  try {
    if (state.type === 'carousel') {
      await fetchCarouselPreview(gen);
    } else {
      const formData = buildFormData(true);
      const res = await fetch(`/api/generate/${state.type}`, { method: 'POST', body: formData });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Server error'); }
      const data = await res.json();
      if (gen !== state.previewGeneration) return;
      showPreviewImage(data.image);
    }
  } catch (err) {
    if (gen !== state.previewGeneration) return;
    console.error(err);
    // Don't toast on every keystroke — only show on explicit refresh
  } finally {
    setLoading(false);
  }
}

async function fetchCarouselPreview(gen) {
  const formData = buildCarouselFormData(true);
  const res = await fetch('/api/generate/carousel', { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Server error');
  const data = await res.json();
  if (gen !== state.previewGeneration) return;
  state.carousel.previewImages = data.images || [];
  const idx = Math.min(state.carousel.current, state.carousel.previewImages.length - 1);
  showCarouselSlide(idx);
  updateCarouselNav();
}

function showPreviewImage(b64) {
  const img   = document.getElementById('preview-img');
  const empty = document.getElementById('preview-empty');
  img.src = 'data:image/png;base64,' + b64;
  img.style.display = 'block';
  empty.style.display = 'none';
}

function setLoading(on) {
  document.getElementById('preview-loading').style.display = on ? 'flex' : 'none';
}

/* ── FORM DATA BUILDERS ─────────────────────────────────────────────────────── */

function buildFormData(preview) {
  const fd = new FormData();
  fd.append('preview', preview ? 'true' : 'false');

  if (state.type === 'info') {
    const eyebrowOn = document.getElementById('info-eyebrow-on').checked;
    fd.append('headline',     document.getElementById('info-headline').value.trim());
    fd.append('eyebrow',      eyebrowOn ? document.getElementById('info-eyebrow').value.trim() : '');
    fd.append('cyan_phrases', JSON.stringify(parseCyan(document.getElementById('info-cyan').value)));
    fd.append('fo0',          document.getElementById('info-fo0').value);
    fd.append('fo1',          document.getElementById('info-fo1').value);
    fd.append('font_size',    document.getElementById('info-fontsize').value);
    fd.append('y_nudge',      document.getElementById('info-ynudge').value);
    if (state.photos.info)     fd.append('photo', state.photos.info);
  }

  if (state.type === 'citation') {
    fd.append('quote',        document.getElementById('cit-quote').value.trim());
    fd.append('cyan_phrase',  document.getElementById('cit-cyan').value.trim());
    fd.append('author_name',  document.getElementById('cit-name').value.trim());
    fd.append('author_role',  document.getElementById('cit-role').value.trim());
    fd.append('fo0',          document.getElementById('cit-fo0').value);
    fd.append('fo1',          document.getElementById('cit-fo1').value);
    fd.append('font_size',    document.getElementById('cit-fontsize').value);
    fd.append('y_nudge',      document.getElementById('cit-ynudge').value);
    if (state.photos.citation) fd.append('photo', state.photos.citation);
  }

  if (state.type === 'data') {
    fd.append('headline',     document.getElementById('data-headline').value.trim());
    fd.append('eyebrow',      document.getElementById('data-eyebrow').value.trim());
    fd.append('cyan_phrases', JSON.stringify(parseCyan(document.getElementById('data-cyan').value)));
    fd.append('chart_type',   document.getElementById('data-chart-type').value);
    fd.append('chart_data',   JSON.stringify(getChartData()));
    fd.append('footnote',     document.getElementById('data-footnote').value.trim());
    fd.append('fo0',          document.getElementById('data-fo0').value);
    fd.append('fo1',          document.getElementById('data-fo1').value);
    fd.append('font_size',    document.getElementById('data-fontsize').value);
    fd.append('y_nudge',      document.getElementById('data-ynudge').value);
    if (state.photos.data)     fd.append('photo', state.photos.data);
  }

  if (state.type === 'clean') {
    fd.append('color', document.getElementById('clean-color').value);
  }

  return fd;
}

function buildCarouselFormData(preview) {
  const fd = new FormData();
  fd.append('preview', preview ? 'true' : 'false');
  const slidesJson = state.carousel.slides.map((s, i) => ({
    headline:     s.headline,
    eyebrow:      s.eyebrow,
    cyan_phrases: parseCyan(s.cyan),
    fo0:          s.fo0,
    fo1:          s.fo1,
    font_size:    s.fontsize || 0,
    y_nudge:      s.ynudge || 0,
    is_last:      s.isLast,
  }));
  fd.append('slides_json', JSON.stringify(slidesJson));
  state.carousel.slides.forEach((s, i) => {
    if (s.photo) fd.append(`photo_${i}`, s.photo);
  });
  return fd;
}

function parseCyan(raw) {
  return (raw || '').split('|').map(s => s.trim()).filter(Boolean);
}

/* ── EXPORT ─────────────────────────────────────────────────────────────────── */

async function exportPost() {
  const btn = document.getElementById('btn-export');
  btn.disabled = true;
  btn.textContent = '⏳ Generuji…';

  try {
    let res, filename, mime;
    if (state.type === 'carousel') {
      res = await fetch('/api/generate/carousel', { method: 'POST', body: buildCarouselFormData(false) });
      filename = 'carousel.zip';
      mime = 'application/zip';
    } else {
      res = await fetch(`/api/generate/${state.type}`, { method: 'POST', body: buildFormData(false) });
      filename = state.type === 'citation' ? 'citation.png' :
                 state.type === 'data'     ? 'data_post.png' :
                 state.type === 'clean'    ? 'clean_bg.png'  : 'info_post.png';
      mime = 'image/png';
    }
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Export selhal'); }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Staženo: ${filename}`, 'success');
  } catch (err) {
    toast(err.message || 'Export selhal', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '⬇ Export PNG';
  }
}

/* ── CAPTION GENERATOR ───────────────────────────────────────────────────────── */

function generateCaption() {
  const text   = document.getElementById('cap-text').value.trim();
  const source = document.getElementById('cap-source').value.trim();
  const tags   = document.getElementById('cap-tags').value.trim();

  if (!text) { toast('Vyplňte hlavní věty pro caption', 'error'); return; }

  const today = new Date().toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' });
  const parts = [
    text,
    '',
    'Zajímá mě váš názor, proto mi ho prosím napište do komentářů!',
    '',
    '👆Nezapomeňte mě sledovat pro váš větší přehled!',
  ];
  if (source) parts.push('', `Zdroj: ${source} · ${today}`);
  if (tags)   parts.push('', tags);

  document.getElementById('caption-output').textContent = parts.join('\n');
  toast('Caption vygenerován', 'success');
}

function copyCaption() {
  const text = document.getElementById('caption-output').textContent;
  if (!text || text.startsWith('Caption se zobrazí')) {
    toast('Nejprve vygenerujte caption', 'error');
    return;
  }
  navigator.clipboard.writeText(text).then(() => toast('Zkopírováno do schránky', 'success'));
}

/* ── BUTTONS ─────────────────────────────────────────────────────────────────── */

function initButtons() {
  document.getElementById('btn-export').addEventListener('click', exportPost);
  document.getElementById('btn-refresh').addEventListener('click', () => {
    state.previewGeneration++;
    fetchPreview();
  });
  document.getElementById('btn-gen-caption').addEventListener('click', generateCaption);
  document.getElementById('btn-copy-caption').addEventListener('click', copyCaption);
}

/* ── TOASTS ──────────────────────────────────────────────────────────────────── */

/* ── LIGHTBOX ─────────────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('preview-img').addEventListener('click', openLightbox);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
});

async function openLightbox() {
  const src = document.getElementById('preview-img').src;
  if (!src || src === window.location.href) return;

  const lb    = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img');

  // Show immediately with preview (scaled up), then swap to full-res
  lbImg.src = src;
  lbImg.style.opacity = '0.5';
  lb.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  try {
    let res;
    if (state.type === 'carousel') {
      res = await fetch('/api/generate/carousel', { method: 'POST', body: buildCarouselFormData(false) });
      // For carousel, show current slide at full res
      const fd2 = buildCarouselFormData(true);
      // We already have the preview — just show it larger via CSS; full-res carousel is ZIP
      lbImg.style.opacity = '1';
      lbImg.style.imageRendering = 'crisp-edges';
      return;
    } else {
      res = await fetch(`/api/generate/${state.type}`, { method: 'POST', body: buildFormData(false) });
    }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    lbImg.onload = () => { lbImg.style.opacity = '1'; URL.revokeObjectURL(url); };
    lbImg.src = url;
  } catch {
    lbImg.style.opacity = '1';
  }
}

function closeLightbox() {
  document.getElementById('lightbox').style.display = 'none';
  document.body.style.overflow = '';
}

function toast(msg, type = '') {
  const container = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
