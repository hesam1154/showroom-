// ========== ابزارها ==========
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function toPersian(num) {
  return Number(num).toLocaleString('fa-IR');
}

// ========== علاقه‌مندی ==========
function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem('favorites') || '[]');
  } catch { return []; }
}

function toggleFavorite(id) {
  const favs = getFavorites();
  const idx = favs.indexOf(id);
  let added = false;

  if (idx > -1) {
    favs.splice(idx, 1);
  } else {
    favs.push(id);
    added = true;
  }

  localStorage.setItem('favorites', JSON.stringify(favs));

  const btn = document.getElementById('fav-btn');
  if (btn) {
    btn.classList.toggle('active', added);
    btn.querySelector('span').textContent = added ? 'ذخیره شد ❤️' : 'افزودن به علاقه‌مندی';
  }

  // انیمیشن میکرو
  if (added && btn) {
    btn.style.transform = 'scale(1.05)';
    setTimeout(() => btn.style.transform = '', 200);
  }
}

// ========== آمار بازدید ==========
function trackVisit(carId) {
  const stats = JSON.parse(localStorage.getItem('visit_stats') || '{}');
  const key = 'car_' + carId;
  stats[key] = (stats[key] || 0) + 1;
  stats.last_visit = new Date().toISOString();
  localStorage.setItem('visit_stats', JSON.stringify(stats));
}

// ========== متغیرهای گالری ==========
let mediaList = [];
let currentMediaIndex = 0;
let currentCarId = null;

// ========== رندر صفحه ==========
async function loadCarDetail() {
  const id = getQueryParam('id');
  if (!id) {
    document.getElementById('detail-content').innerHTML =
      '<div style="text-align:center;padding:80px;color:#94a3b8;"><i class="fas fa-exclamation-triangle" style="font-size:50px;margin-bottom:15px;display:block;color:#d4af37;"></i><p>شناسه خودرو پیدا نشد</p><a href="index.html" style="display:inline-block;margin-top:20px;color:#d4af37;font-weight:700;">بازگشت به خانه</a></div>';
    document.getElementById('loading-detail').style.display = 'none';
    return;
  }

  currentCarId = Number(id);
  trackVisit(id);

  const car = await apiGetCar(id);
  document.getElementById('loading-detail').style.display = 'none';

  if (!car || car.error) {
    document.getElementById('detail-content').innerHTML =
      '<div style="text-align:center;padding:80px;color:#94a3b8;"><i class="fas fa-car-crash" style="font-size:50px;margin-bottom:15px;display:block;color:#d4af37;"></i><p>خودرو پیدا نشد</p><a href="index.html" style="display:inline-block;margin-top:20px;color:#d4af37;font-weight:700;">بازگشت به خانه</a></div>';
    return;
  }

  document.title = `${car.brand} ${car.model} | نمایشگاه خودرو`;
  document.getElementById('bc-title').textContent = `${car.brand} ${car.model}`;

  renderCar(car);
  renderSimilar(car.similar || []);
}

// ========== رندر اصلی ==========
function renderCar(car) {
  mediaList = car.media || [];
  const isFav = getFavorites().includes(car.id);

  const html = `
    <div class="detail-layout">
      <div class="gallery-wrap">
        <div class="main-media" id="main-media">
          ${renderMainMedia(0)}
          ${mediaList.length > 1 ? `
            <button class="media-nav prev" onclick="prevMedia()"><i class="fas fa-chevron-right"></i></button>
            <button class="media-nav next" onclick="nextMedia()"><i class="fas fa-chevron-left"></i></button>
            <div class="media-counter" id="media-counter">1 / ${mediaList.length}</div>
          ` : ''}
        </div>
        ${mediaList.length > 1 ? `
          <div class="thumbs-row" id="thumbs-row">
            ${mediaList.map((m, i) => `
              <div class="thumb-item ${i === 0 ? 'active' : ''}" onclick="goToMedia(${i})">
                ${m.type === 'image'
                  ? `<img src="http://localhost:5000${m.url}" alt="">`
                  : `<video src="http://localhost:5000${m.url}" muted></video><div class="video-badge"><i class="fas fa-play"></i></div>`}
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <div class="info-panel">
        <h1 class="detail-title">${car.brand} ${car.model}</h1>
        <div class="detail-subtitle">
          <span class="tracking-badge">${car.tracking_code}</span>
          ${car.is_featured ? '<span class="featured-badge">✨ ویژه</span>' : ''}
          <span><i class="fas fa-calendar-alt"></i> ${car.year}</span>
          <span><i class="fas fa-tachometer-alt"></i> ${toPersian(car.mileage)} کیلومتر</span>
        </div>

        <div class="detail-price">${toPersian(car.price)} <span>تومان</span></div>
        <div class="detail-price-label">قیمت نهایی نمایشگاه</div>

        <div class="action-buttons">
          <a href="tel:${car.phone || '09137808813'}" class="action-btn btn-call">
            <i class="fas fa-phone-alt"></i> تماس
          </a>
          <a href="https://wa.me/${car.whatsapp || '989137808813'}" target="_blank" class="action-btn btn-whatsapp">
            <i class="fab fa-whatsapp"></i> واتساپ
          </a>
        </div>

        <button class="favorite-btn ${isFav ? 'active' : ''}" id="fav-btn" onclick="toggleFavorite(${car.id})">
          <i class="fas fa-heart"></i>
          <span>${isFav ? 'ذخیره شد ❤️' : 'افزودن به علاقه‌مندی'}</span>
        </button>

        <div class="specs-title"><i class="fas fa-list-ul"></i> مشخصات خودرو</div>
        <div class="specs-grid">
          <div class="spec-item">
            <div class="spec-label"><i class="fas fa-calendar"></i> سال ساخت</div>
            <div class="spec-value">${car.year}</div>
          </div>
          <div class="spec-item">
            <div class="spec-label"><i class="fas fa-tachometer-alt"></i> کارکرد</div>
            <div class="spec-value">${toPersian(car.mileage)} km</div>
          </div>
          <div class="spec-item">
            <div class="spec-label"><i class="fas fa-palette"></i> رنگ</div>
            <div class="spec-value">${car.color || '—'}</div>
          </div>
          <div class="spec-item">
            <div class="spec-label"><i class="fas fa-cogs"></i> گیربکس</div>
            <div class="spec-value">${car.gearbox || '—'}</div>
          </div>
          <div class="spec-item">
            <div class="spec-label"><i class="fas fa-gas-pump"></i> سوخت</div>
            <div class="spec-value">${car.fuel || '—'}</div>
          </div>
          <div class="spec-item">
            <div class="spec-label"><i class="fas fa-shield-alt"></i> بیمه</div>
            <div class="spec-value">${car.insurance_months ? car.insurance_months + ' ماه' : '—'}</div>
          </div>
          <div class="spec-item">
            <div class="spec-label"><i class="fas fa-car"></i> بدنه</div>
            <div class="spec-value">${car.body_status || '—'}</div>
          </div>
          <div class="spec-item">
            <div class="spec-label"><i class="fas fa-microchip"></i> موتور</div>
            <div class="spec-value">${car.engine_status || '—'}</div>
          </div>
          <div class="spec-item">
            <div class="spec-label"><i class="fas fa-cube"></i> شاسی</div>
            <div class="spec-value">${car.chassis_status || '—'}</div>
          </div>
        </div>

        ${car.description ? `
          <div class="specs-title" style="margin-top:20px;"><i class="fas fa-align-right"></i> توضیحات</div>
          <div class="description-box">${car.description}</div>
        ` : ''}
      </div>
    </div>

    <!-- فرم درخواست بازدید -->
    <div class="visit-form-section">
      <h2><i class="fas fa-calendar-check"></i> درخواست بازدید حضوری</h2>
      <p>فرم زیر رو پر کن، کارشناسان ما برای هماهنگی بازدید با تو تماس می‌گیرن</p>
      <form class="visit-form" onsubmit="submitVisit(event)">
        <input type="text" id="v-name" placeholder="نام و نام خانوادگی *" required>
        <input type="tel" id="v-phone" placeholder="شماره تماس *" required>
        <input type="text" id="v-time" placeholder="زمان پیشنهادی (مثلاً فردا صبح)">
        <textarea id="v-message" placeholder="پیام یا سوال (اختیاری)"></textarea>
        <button type="submit"><i class="fas fa-paper-plane"></i> ارسال درخواست</button>
      </form>
    </div>

    <!-- اطلاعات تماس -->
    <div class="contact-strip">
      <a href="tel:09137808813" class="contact-strip-item">
        <span class="call-icon" style="width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fff;background:linear-gradient(135deg,#0f172a,#1e293b);"><i class="fas fa-phone"></i></span>
        <div>
          <div class="contact-name">سلیمانی</div>
          <span class="contact-num">0913 780 8813</span>
        </div>
      </a>
      <a href="tel:09138998617" class="contact-strip-item">
        <span style="width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fff;background:linear-gradient(135deg,#0f172a,#1e293b);"><i class="fas fa-phone"></i></span>
        <div>
          <div class="contact-name">ابراهیمی</div>
          <span class="contact-num">0913 899 8617</span>
        </div>
      </a>
      <a href="https://t.me/hesam_ss22" target="_blank" class="contact-strip-item">
        <span style="width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fff;background:linear-gradient(135deg,#0088cc,#006699);"><i class="fab fa-telegram"></i></span>
        <div>
          <div class="contact-name">تلگرام</div>
          <span class="contact-num">@hesam_ss22</span>
        </div>
      </a>
    </div>

    <!-- محل بازدید -->
    ${car.location ? `
      <div class="location-section">
        <h2><i class="fas fa-map-marker-alt"></i> محل بازدید</h2>
        <div class="location-text">
          <i class="fas fa-map-pin" style="color:#d4af37;font-size:20px;"></i>
          ${car.location}
        </div>
      </div>
    ` : ''}

    <!-- ماشین‌های مشابه -->
    <div id="similar-section"></div>
  `;

  document.getElementById('detail-content').innerHTML = html;
}

// ========== گالری ==========
function renderMainMedia(index) {
  if (!mediaList.length) {
    return `<div class="no-media"><i class="fas fa-image"></i></div>`;
  }
  const m = mediaList[index];
  if (m.type === 'image') {
    return `<img src="http://localhost:5000${m.url}" alt="">`;
  } else {
    return `<video src="http://localhost:5000${m.url}" controls autoplay muted></video>`;
  }
}

window.goToMedia = function(index) {
  currentMediaIndex = index;
  document.getElementById('main-media').innerHTML = `
    ${renderMainMedia(index)}
    ${mediaList.length > 1 ? `
      <button class="media-nav prev" onclick="prevMedia()"><i class="fas fa-chevron-right"></i></button>
      <button class="media-nav next" onclick="nextMedia()"><i class="fas fa-chevron-left"></i></button>
      <div class="media-counter">${index + 1} / ${mediaList.length}</div>
    ` : ''}
  `;

  document.querySelectorAll('.thumb-item').forEach((t, i) => {
    t.classList.toggle('active', i === index);
  });
};

window.prevMedia = function() {
  const newIdx = currentMediaIndex > 0 ? currentMediaIndex - 1 : mediaList.length - 1;
  goToMedia(newIdx);
};

window.nextMedia = function() {
  const newIdx = currentMediaIndex < mediaList.length - 1 ? currentMediaIndex + 1 : 0;
  goToMedia(newIdx);
};

// ========== ماشین‌های مشابه ==========
function renderSimilar(similar) {
  const section = document.getElementById('similar-section');
  if (!section) return;

  if (!similar || !similar.length) {
    section.innerHTML = '';
    return;
  }

  section.className = 'similar-section';
  section.innerHTML = `
    <h2><i class="fas fa-th-large"></i> خودروهای مشابه در این رنج قیمتی</h2>
    <div class="similar-grid">
      ${similar.map(s => `
        <div class="similar-card" onclick="location.href='car.html?id=${s.id}'">
          <div class="similar-card-image">
            ${s.thumbnail
              ? `<img src="http://localhost:5000${s.thumbnail}" alt="">`
              : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#cbd5e1;font-size:40px;"><i class="fas fa-image"></i></div>`}
          </div>
          <div class="similar-card-info">
            <h4>${s.brand} ${s.model}</h4>
            <div class="similar-price">${toPersian(s.price)} تومان</div>
            <div class="similar-meta">${s.year} • ${toPersian(s.mileage)} km</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ========== فرم بازدید ==========
window.submitVisit = async function(e) {
  e.preventDefault();

  const data = {
    name: document.getElementById('v-name').value.trim(),
    phone: document.getElementById('v-phone').value.trim(),
    preferred_time: document.getElementById('v-time').value.trim(),
    message: document.getElementById('v-message').value.trim(),
  };

  if (!data.name || !data.phone) {
    alert('لطفاً نام و شماره تماس رو وارد کن');
    return;
  }

  try {
    const res = await fetch(`http://localhost:5000/api/cars/${currentCarId}/visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());

    if (res.success) {
      alert('✅ درخواست شما ثبت شد! به زودی با شما تماس می‌گیریم.');
      e.target.reset();
    } else {
      alert('خطا در ارسال. دوباره تلاش کن.');
    }
  } catch {
    alert('خطا در ارتباط با سرور');
  }
};

// ========== چت ==========
window.toggleChat = function() {
  document.getElementById('chat-box').classList.toggle('open');
};

// ========== شروع ==========
loadCarDetail();