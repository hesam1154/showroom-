const carsGrid = document.getElementById('cars-grid');
const empty = document.getElementById('empty');

function showSkeleton(n = 6) {
  carsGrid.innerHTML = Array.from({ length: n })
    .map(() => '<div class="skeleton"></div>')
    .join('');
}

async function loadCars(filters = {}) {
  showSkeleton(6);
  empty.style.display = 'none';

  try {
    const cars = await apiGetCars(filters);
    renderCars(cars);
  } catch (e) {
    console.error(e);
    carsGrid.innerHTML = '<div class="empty">خطا در بارگذاری</div>';
  }
}

function renderCars(cars) {
  if (!cars || !cars.length) {
    carsGrid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  carsGrid.innerHTML = cars.map((car, i) => `
    <div class="car-card" style="animation-delay:${i * 0.05}s" onclick="location.href='car.html?id=${car.id}'">
      <div class="car-image">
        ${car.thumbnail
          ? `<img src="http://localhost:5000${car.thumbnail}" alt="${car.brand} ${car.model}">`
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

function getFilters() {
  const f = {};
  const g = id => document.getElementById(id).value;
  if (g('filter-brand')) f.brand = g('filter-brand');
  if (g('filter-min-price')) f.min_price = g('filter-min-price');
  if (g('filter-max-price')) f.max_price = g('filter-max-price');
  if (g('filter-min-year')) f.min_year = g('filter-min-year');
  if (g('filter-max-year')) f.max_year = g('filter-max-year');
  if (g('filter-max-km')) f.max_km = g('filter-max-km');
  if (g('filter-sort')) f.sort = g('filter-sort');
  if (g('live-search')) f.search = g('live-search');
  return f;
}

let timer;
document.getElementById('live-search').addEventListener('input', () => {
  clearTimeout(timer);
  timer = setTimeout(() => loadCars(getFilters()), 350);
});

document.getElementById('apply-filters').addEventListener('click', () => loadCars(getFilters()));

document.getElementById('reset-filters').addEventListener('click', () => {
  document.querySelectorAll('.filter-grid input, .filter-grid select')
    .forEach(el => el.value = '');
  document.getElementById('filter-sort').value = 'newest';
  loadCars();
});

async function loadBrands() {
  try {
    const brands = await apiGetBrands();
    const sel = document.getElementById('filter-brand');
    brands.forEach(b => {
      const o = document.createElement('option');
      o.value = b;
      o.textContent = b;
      sel.appendChild(o);
    });
  } catch (e) {
    console.error(e);
  }
}

loadBrands();
loadCars();
