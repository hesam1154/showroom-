function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem('favorites') || '[]');
  } catch { return []; }
}

async function loadFavorites() {
  const favIds = getFavorites();
  const grid = document.getElementById('fav-grid');
  const empty = document.getElementById('fav-empty');
  const count = document.getElementById('fav-count');

  if (!favIds.length) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    count.innerHTML = '';
    return;
  }

  const allCars = await apiGetCars();
  const favCars = allCars.filter(c => favIds.includes(c.id));

  if (!favCars.length) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    count.innerHTML = '';
    return;
  }

  empty.style.display = 'none';
  count.innerHTML = `<span class="fav-count-badge">❤️ ${favCars.length} خودرو ذخیره شده</span>`;

  grid.innerHTML = favCars.map((car, i) => `
    <div class="car-card" style="animation-delay:${i * 0.05}s">
      <div onclick="location.href='car.html?id=${car.id}'" style="cursor:pointer;">
        <div class="car-image">
          ${car.thumbnail
            ? `<img src="http://localhost:5000${car.thumbnail}" alt="">`
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
      <button onclick="removeFromFav(${car.id})" style="width:calc(100% - 30px);margin:0 15px 15px;padding:11px;border:2px solid #fee2e2;background:#fff;color:#ef4444;border-radius:12px;font-family:inherit;font-weight:700;font-size:13px;cursor:pointer;transition:all 0.3s;">
        <i class="fas fa-trash"></i> حذف از علاقه‌مندی
      </button>
    </div>
  `).join('');
}

window.removeFromFav = function(id) {
  const favs = getFavorites();
  const idx = favs.indexOf(id);
  if (idx > -1) favs.splice(idx, 1);
  localStorage.setItem('favorites', JSON.stringify(favs));
  loadFavorites();
};

loadFavorites();