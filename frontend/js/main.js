const carsGrid = document.getElementById('cars-grid');
const empty = document.getElementById('empty');

let currentCategory = '';
let allCarsData = [];
let activeQuickFilter = '';

// ========== Skeleton ==========
function showSkeleton(n = 6) {
  carsGrid.innerHTML = Array.from({ length: n })
    .map(() => '<div class="skeleton"></div>')
    .join('');
}

// ========== Load Cars ==========
async function loadCars(extraFilters = {}) {
  showSkeleton(6);
  empty.style.display = 'none';

  const filters = { ...getFilters(), ...extraFilters };
  if (currentCategory) filters.category = currentCategory;

  if (activeQuickFilter === 'cheap') filters.max_price = 500000000;
  else if (activeQuickFilter === 'lowkm') filters.max_km = 50000;
  else if (activeQuickFilter === 'featured') filters.featured = '1';

  try {
    console.log('Loading cars with filters:', filters);
    console.log('API Base:', typeof API_BASE !== 'undefined' ? API_BASE : 'NOT DEFINED');
    console.log('Server URL:', typeof SERVER_URL !== 'undefined' ? SERVER_URL : 'NOT DEFINED');

    const cars = await apiGetCars(filters);
    console.log('Cars loaded:', cars);

    if (cars && cars.error) {
      carsGrid.innerHTML = `<div class="empty"><i class="fas fa-exclamation-triangle"></i><p>خطا: ${cars.error}</p></div>`;
      return;
    }

    allCarsData = cars || [];
    renderCars(allCarsData);
    updateCount(allCarsData.length);
  } catch (e) {
    console.error('Error loading cars:', e);
    carsGrid.innerHTML = `
      <div class="empty">
        <i class="fas fa-exclamation-triangle"></i>
        <p style="font-weight:700;margin-bottom:10px;">خطا در بارگذاری</p>
        <p style="font-size:12px;color:#94a3b8;">${e.message || 'سرور پاسخ نمی‌دهد'}</p>
        <button onclick="loadCars()" style="margin-top:16px;background:linear-gradient(135deg,#d4af37,#a8862c);color:#0f172a;padding:10px 24px;border:none;border-radius:10px;font-weight:800;cursor:pointer;font-family:inherit;">
          <i class="fas fa-redo"></i> تلاش مجدد
        </button>
      </div>`;
  }
}

// ========== Render Cars ==========
function renderCars(cars) {
  if (!cars || !cars.length) {
    carsGrid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  carsGrid.innerHTML = cars.map((car, i) => `
    <div class="car-card" style="animation-delay:${i * 0.05}s" onclick="location.href='car.html?id=${car.id}'">
      <div class="car-image">
        ${car.thumbnail
          ? `<img src="${SERVER_URL}${car.thumbnail}" alt="${car.brand} ${car.model}" loading="lazy">`
          : `<div class="no-image"><i class="fas fa-image"></i></div>`}
        ${car.is_featured ? '<span class="badge-featured">✨ ویژه</span>' : ''}
        <span class="tracking-code">${car.tracking_code}</span>
      </div>
      <div class="car-info">
        <h3>${car.brand} ${car.model}</h3>
        <div class="car-meta">
          <span><i class="fas fa-calendar-alt"></i> ${car.year}</span>
          <span><i class="fas fa-tachometer-alt"></i> ${Number(car.mileage).toLocaleString('fa-IR')} km</span>
        </div>
        <div class="car-price">${Number(car.price).toLocaleString('fa-IR')} تومان</div>
      </div>
    </div>
  `).join('');
}

// ========== Update Count ==========
function updateCount(n) {
  const el = document.getElementById('cars-count');
  if (el) el.textContent = `${n.toLocaleString('fa-IR')} خودرو`;
}

// ========== Update Title ==========
function updateTitle() {
  const titles = {
    '': 'همه خودروها',
    'iranian': 'خودروهای ایرانی',
    'chinese': 'خودروهای چینی',
    'foreign': 'خودروهای خارجی',
  };
  const el = document.getElementById('cars-title');
  if (el) el.innerHTML = `<i class="fas fa-car"></i> ${titles[currentCategory] || 'همه خودروها'}`;
}

// ========== Category Tabs ==========
document.querySelectorAll('.category-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentCategory = tab.dataset.category;
    updateTitle();
    loadCars();
  });
});

// ========== Quick Filters ==========
document.querySelectorAll('.quick-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const type = chip.dataset.quick;
    if (activeQuickFilter === type) {
      activeQuickFilter = '';
      chip.classList.remove('active');
    } else {
      document.querySelectorAll('.quick-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeQuickFilter = type;
    }
    loadCars();
  });
});

// ========== Get Filters ==========
function getFilters() {
  const f = {};
  const isMobile = window.innerWidth <= 768;

  const g = id => document.getElementById(id)?.value;

  if (isMobile) {
    if (g('m-filter-brand')) f.brand = g('m-filter-brand');
    if (g('m-filter-min-price')) f.min_price = g('m-filter-min-price');
    if (g('m-filter-max-price')) f.max_price = g('m-filter-max-price');
    if (g('m-filter-min-year')) f.min_year = g('m-filter-min-year');
    if (g('m-filter-max-year')) f.max_year = g('m-filter-max-year');
    if (g('m-filter-max-km')) f.max_km = g('m-filter-max-km');
    if (g('m-filter-sort')) f.sort = g('m-filter-sort');
  } else {
    if (g('filter-brand')) f.brand = g('filter-brand');
    if (g('filter-min-price')) f.min_price = g('filter-min-price');
    if (g('filter-max-price')) f.max_price = g('filter-max-price');
    if (g('filter-min-year')) f.min_year = g('filter-min-year');
    if (g('filter-max-year')) f.max_year = g('filter-max-year');
    if (g('filter-max-km')) f.max_km = g('filter-max-km');
    if (g('filter-sort')) f.sort = g('filter-sort');
  }

  if (g('live-search')) f.search = g('live-search');
  return f;
}

// ========== Live Search ==========
let timer;
const liveSearch = document.getElementById('live-search');
if (liveSearch) {
  liveSearch.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => loadCars(), 350);
  });
}

// ========== Apply/Reset (Desktop) ==========
const applyBtn = document.getElementById('apply-filters');
if (applyBtn) applyBtn.addEventListener('click', () => loadCars());

const resetBtn = document.getElementById('reset-filters');
if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    document.querySelectorAll('.filters-new-grid input, .filters-new-grid select')
      .forEach(el => el.value = '');
    const sortEl = document.getElementById('filter-sort');
    if (sortEl) sortEl.value = 'newest';
    activeQuickFilter = '';
    document.querySelectorAll('.quick-chip').forEach(c => c.classList.remove('active'));
    loadCars();
  });
}

// ========== Mobile Menu ==========
const menuToggle = document.getElementById('menu-toggle');
const mainNav = document.getElementById('main-nav');

if (menuToggle && mainNav) {
  menuToggle.addEventListener('click', () => {
    mainNav.classList.toggle('open');
    const icon = menuToggle.querySelector('i');
    icon.className = mainNav.classList.contains('open') ? 'fas fa-times' : 'fas fa-bars';
  });

  mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      menuToggle.querySelector('i').className = 'fas fa-bars';
    });
  });
}

// ========== Mobile Bottom Sheet ==========
const filterOverlay = document.getElementById('filter-overlay');
const filterSheet = document.getElementById('filter-sheet');
const floatingFilterBtn = document.getElementById('floating-filter-btn');

function openFilterSheet() {
  filterOverlay.classList.add('active');
  filterSheet.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeFilterSheet() {
  filterOverlay.classList.remove('active');
  filterSheet.classList.remove('active');
  document.body.style.overflow = '';
}

if (floatingFilterBtn) floatingFilterBtn.addEventListener('click', openFilterSheet);
if (filterOverlay) filterOverlay.addEventListener('click', closeFilterSheet);

const mApplyBtn = document.getElementById('m-apply-filters');
if (mApplyBtn) {
  mApplyBtn.addEventListener('click', () => {
    closeFilterSheet();
    loadCars();
  });
}

const mResetBtn = document.getElementById('m-reset-filters');
if (mResetBtn) {
  mResetBtn.addEventListener('click', () => {
    document.querySelectorAll('.filter-sheet input, .filter-sheet select')
      .forEach(el => el.value = '');
    const sortEl = document.getElementById('m-filter-sort');
    if (sortEl) sortEl.value = 'newest';
    activeQuickFilter = '';
    document.querySelectorAll('.quick-chip').forEach(c => c.classList.remove('active'));
    closeFilterSheet();
    loadCars();
  });
}

// ========== Load Brands ==========
async function loadBrands() {
  try {
    const brands = await apiGetBrands();
    const selectors = ['filter-brand', 'm-filter-brand'];

    selectors.forEach(selId => {
      const sel = document.getElementById(selId);
      if (!sel) return;

      while (sel.options.length > 1) sel.remove(1);

      if (Array.isArray(brands)) {
        brands.forEach(b => {
          const o = document.createElement('option');
          o.value = b;
          o.textContent = b;
          sel.appendChild(o);
        });
      } else if (typeof brands === 'object') {
        const labels = { iranian: '🇮🇷 ایرانی', chinese: '🇨🇳 چینی', foreign: '🌍 خارجی' };
        Object.keys(brands).forEach(key => {
          const group = document.createElement('optgroup');
          group.label = labels[key] || key;
          brands[key].forEach(b => {
            const o = document.createElement('option');
            o.value = b;
            o.textContent = b;
            group.appendChild(o);
          });
          sel.appendChild(group);
        });
      }
    });
  } catch (e) {
    console.error('Error loading brands:', e);
  }
}

// ========== Start ==========
loadBrands();
loadCars();