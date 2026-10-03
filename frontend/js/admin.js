const loginView = document.getElementById('login-view');
const adminView = document.getElementById('admin-view');
const toast = document.getElementById('toast');
const toastText = document.getElementById('toast-text');

let currentEditId = null;
let currentUploadCarId = null;

// ========== Auth ==========
function checkAuth() {
  const token = localStorage.getItem('admin_token');
  if (token) showAdmin();
  else showLogin();
}

function showLogin() {
  if (loginView) loginView.style.display = 'flex';
  if (adminView) {
    adminView.style.display = 'none';
    adminView.classList.remove('active');
  }
}

function showAdmin() {
  if (loginView) loginView.style.display = 'none';
  if (adminView) {
    adminView.style.display = 'block';
    adminView.classList.add('active');
    loadAdminCars();
    loadStats();
  }
}

// ========== Login ==========
const loginBtn = document.getElementById('login-btn');
if (loginBtn) {
  loginBtn.addEventListener('click', async () => {
    const code = document.getElementById('admin-code').value.trim();
    if (!code) return;

    const errEl = document.getElementById('login-error');
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال بررسی...';
    if (errEl) errEl.classList.remove('show');

    try {
      const result = await apiLogin(code);
      console.log('Login result:', result);

      if (result && result.token) {
        localStorage.setItem('admin_token', result.token);
        showAdmin();
        showToast('خوش آمدی! 👋', 'success');
      } else {
        if (errEl) {
          errEl.textContent = result?.error || 'کد اشتباهه!';
          errEl.classList.add('show');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      if (errEl) {
        errEl.textContent = 'خطا در ارتباط با سرور';
        errEl.classList.add('show');
      }
    } finally {
      loginBtn.disabled = false;
      loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> ورود به پنل';
    }
  });
}

const adminCodeEl = document.getElementById('admin-code');
if (adminCodeEl) {
  adminCodeEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && loginBtn) loginBtn.click();
  });
  adminCodeEl.addEventListener('input', () => {
    const errEl = document.getElementById('login-error');
    if (errEl) errEl.classList.remove('show');
  });
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('admin_token');
    showLogin();
    if (adminCodeEl) adminCodeEl.value = '';
    const errEl = document.getElementById('login-error');
    if (errEl) errEl.classList.remove('show');
  });
}

// ========== Tabs ==========
document.querySelectorAll('.admin-tab[data-tab]').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    const target = document.getElementById('tab-' + tab.dataset.tab);
    if (target) target.classList.add('active');
    if (tab.dataset.tab === 'list') loadAdminCars();
  });
});

// ========== Toast ==========
function showToast(msg, type = 'success') {
  if (!toast || !toastText) return;
  toastText.textContent = msg;
  toast.className = 'toast ' + type;
  const icon = toast.querySelector('i');
  if (icon) {
    icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
  }
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ========== Stats ==========
async function loadStats() {
  try {
    const cars = await apiGetCars();
    const stats = JSON.parse(localStorage.getItem('visit_stats') || '{}');
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]');

    let totalVisits = 0;
    Object.keys(stats).forEach(k => {
      if (k.startsWith('car_')) totalVisits += stats[k];
    });

    const featured = (cars || []).filter(c => c.is_featured === 1).length;

    const el1 = document.getElementById('stat-cars-count');
    const el2 = document.getElementById('stat-visits');
    const el3 = document.getElementById('stat-favorites');
    const el4 = document.getElementById('stat-featured');

    if (el1) el1.textContent = (cars || []).length.toLocaleString('fa-IR');
    if (el2) el2.textContent = totalVisits.toLocaleString('fa-IR');
    if (el3) el3.textContent = favs.length.toLocaleString('fa-IR');
    if (el4) el4.textContent = featured.toLocaleString('fa-IR');
  } catch (err) {
    console.error('Stats error:', err);
  }
}

// ========== Save Car ==========
const saveCarBtn = document.getElementById('save-car-btn');
if (saveCarBtn) {
  saveCarBtn.addEventListener('click', async () => {
    console.log('Save button clicked!');

    const data = {
      brand: document.getElementById('f-brand')?.value,
      model: document.getElementById('f-model')?.value.trim(),
      year: document.getElementById('f-year')?.value,
      price: document.getElementById('f-price')?.value,
      mileage: document.getElementById('f-mileage')?.value,
      color: document.getElementById('f-color')?.value.trim(),
      gearbox: document.getElementById('f-gearbox')?.value,
      fuel: document.getElementById('f-fuel')?.value,
      body_status: document.getElementById('f-body')?.value,
      engine_status: document.getElementById('f-engine')?.value,
      chassis_status: document.getElementById('f-chassis')?.value,
      insurance_months: document.getElementById('f-insurance')?.value,
      phone: document.getElementById('f-phone')?.value.trim(),
      whatsapp: document.getElementById('f-whatsapp')?.value.trim(),
      location: document.getElementById('f-location')?.value.trim(),
      description: document.getElementById('f-description')?.value.trim(),
      is_featured: document.getElementById('f-featured')?.checked ? 1 : 0,
    };

    console.log('Data to save:', data);

    if (!data.brand || !data.model || !data.year || !data.price || !data.mileage) {
      showToast('فیلدهای اجباری رو پر کن', 'error');
      return;
    }

    saveCarBtn.disabled = true;
    saveCarBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال ذخیره...';

    try {
      let result;
      if (currentEditId) {
        result = await apiUpdateCar(currentEditId, data);
        if (result.success) {
          showToast('خودرو ویرایش شد ✅', 'success');
          resetForm();
          loadAdminCars();
          loadStats();
        } else {
          showToast('خطا در ویرایش: ' + (result.error || ''), 'error');
        }
      } else {
        result = await apiCreateCar(data);
        console.log('Create result:', result);
        if (result.id) {
          showToast('خودرو ذخیره شد! حالا عکس اضافه کن 📸', 'success');
          currentUploadCarId = result.id;
          const uploadCard = document.getElementById('upload-card');
          if (uploadCard) {
            uploadCard.style.display = 'block';
            uploadCard.scrollIntoView({ behavior: 'smooth' });
          }
          resetFormFields();
        } else {
          showToast('خطا در ذخیره: ' + (result.error || ''), 'error');
        }
      }
    } catch (err) {
      console.error('Save error:', err);
      showToast('خطا در ارتباط با سرور', 'error');
    } finally {
      saveCarBtn.disabled = false;
      saveCarBtn.innerHTML = '<i class="fas fa-save"></i> ذخیره خودرو';
    }
  });
}

function resetFormFields() {
  document.querySelectorAll('#tab-add input, #tab-add select, #tab-add textarea')
    .forEach(el => {
      if (el.type === 'checkbox') el.checked = false;
      else el.value = '';
    });
}

function resetForm() {
  resetFormFields();
  currentEditId = null;
  currentUploadCarId = null;
  const uploadCard = document.getElementById('upload-card');
  const mediaPreview = document.getElementById('media-preview');
  const cancelBtn = document.getElementById('cancel-edit-btn');
  if (uploadCard) uploadCard.style.display = 'none';
  if (mediaPreview) mediaPreview.innerHTML = '';
  if (cancelBtn) cancelBtn.style.display = 'none';
}

const cancelEditBtn = document.getElementById('cancel-edit-btn');
if (cancelEditBtn) cancelEditBtn.addEventListener('click', resetForm);

// ========== Upload ==========
const mediaInput = document.getElementById('media-input');
if (mediaInput) {
  mediaInput.addEventListener('change', async (e) => {
    if (!currentUploadCarId) {
      showToast('اول خودرو رو ذخیره کن', 'error');
      return;
    }

    const files = Array.from(e.target.files);
    if (!files.length) return;

    showToast('در حال آپلود...', 'success');

    try {
      const result = await apiUploadMedia(currentUploadCarId, files);
      if (Array.isArray(result)) {
        showToast(`${result.length} فایل آپلود شد ✅`, 'success');
        appendPreview(result);
        loadAdminCars();
      } else {
        showToast('خطا در آپلود', 'error');
      }
    } catch (err) {
      console.error('Upload error:', err);
      showToast('خطا در آپلود', 'error');
    }

    e.target.value = '';
  });
}

function appendPreview(mediaList) {
  const preview = document.getElementById('media-preview');
  if (!preview) return;
  mediaList.forEach(m => {
    const div = document.createElement('div');
    div.className = 'media-item';
    div.innerHTML = `
      ${m.type === 'image'
        ? `<img src="${SERVER_URL}${m.url}">`
        : `<video src="${SERVER_URL}${m.url}" muted></video>`}
      <button class="remove" onclick="removeMedia(${m.id}, this)">×</button>
    `;
    preview.appendChild(div);
  });
}

function renderPreview(mediaList) {
  const preview = document.getElementById('media-preview');
  if (!preview) return;
  preview.innerHTML = '';
  appendPreview(mediaList);
}

window.removeMedia = async function(id, btn) {
  if (!confirm('این فایل حذف بشه؟')) return;
  try {
    const result = await fetch(`${SERVER_URL}/api/upload/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
    }).then(r => r.json());

    if (result.success) {
      btn.closest('.media-item').remove();
      showToast('فایل حذف شد', 'success');
    }
  } catch (err) {
    showToast('خطا', 'error');
  }
};

// ========== List Cars ==========
async function loadAdminCars() {
  const list = document.getElementById('admin-cars-list');
  const empty = document.getElementById('admin-empty');
  if (!list) return;

  try {
    const cars = await apiGetCars();

    if (!cars || !cars.length) {
      list.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }

    if (empty) empty.style.display = 'none';
    list.innerHTML = cars.map(car => `
      <div class="admin-car-card">
        <div class="admin-car-image">
          ${car.thumbnail
            ? `<img src="${SERVER_URL}${car.thumbnail}">`
            : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#cbd5e1;font-size:40px;"><i class="fas fa-image"></i></div>`}
        </div>
        <div class="admin-car-info">
          <h4>${car.brand} ${car.model}</h4>
          <p>${car.year} • ${Number(car.mileage).toLocaleString('fa-IR')} km • ${Number(car.price).toLocaleString('fa-IR')} تومان</p>
          <div class="admin-car-actions">
            <button class="btn-edit" onclick="editCar(${car.id})"><i class="fas fa-edit"></i> ویرایش</button>
            <button class="btn-sold" onclick="markSold(${car.id})"><i class="fas fa-check"></i> فروخته شد</button>
            <button class="btn-delete" onclick="deleteCar(${car.id})"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('List error:', err);
    list.innerHTML = '<div class="empty-admin"><i class="fas fa-exclamation-triangle"></i><p>خطا در بارگذاری</p></div>';
  }
}

window.editCar = async function(id) {
  try {
    const car = await apiGetCar(id);
    if (!car) return;

    currentEditId = id;
    currentUploadCarId = id;

    document.getElementById('f-brand').value = car.brand || '';
    document.getElementById('f-model').value = car.model || '';
    document.getElementById('f-year').value = car.year || '';
    document.getElementById('f-price').value = car.price || '';
    document.getElementById('f-mileage').value = car.mileage || '';
    document.getElementById('f-color').value = car.color || '';
    document.getElementById('f-gearbox').value = car.gearbox || '';
    document.getElementById('f-fuel').value = car.fuel || '';
    document.getElementById('f-body').value = car.body_status || '';
    document.getElementById('f-engine').value = car.engine_status || '';
    document.getElementById('f-chassis').value = car.chassis_status || '';
    document.getElementById('f-insurance').value = car.insurance_months || '';
    document.getElementById('f-phone').value = car.phone || '';
    document.getElementById('f-whatsapp').value = car.whatsapp || '';
    document.getElementById('f-location').value = car.location || '';
    document.getElementById('f-description').value = car.description || '';
    document.getElementById('f-featured').checked = car.is_featured === 1;

    document.querySelector('.admin-tab[data-tab="add"]').click();
    document.getElementById('upload-card').style.display = 'block';
    document.getElementById('cancel-edit-btn').style.display = 'inline-flex';

    if (car.media && car.media.length) renderPreview(car.media);
    else document.getElementById('media-preview').innerHTML = '';

    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('برای ویرایش آماده شد', 'success');
  } catch (err) {
    console.error('Edit error:', err);
    showToast('خطا در بارگذاری', 'error');
  }
};

window.markSold = async function(id) {
  if (!confirm('این خودرو فروخته شده؟')) return;
  try {
    const result = await fetch(`${SERVER_URL}/api/cars/${id}/sold`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
    }).then(r => r.json());

    if (result.success) {
      showToast('به عنوان فروخته شده علامت خورد', 'success');
      loadAdminCars();
      loadStats();
    }
  } catch (err) {
    showToast('خطا', 'error');
  }
};

window.deleteCar = async function(id) {
  if (!confirm('مطمئنی؟ این خودرو برای همیشه حذف میشه!')) return;
  try {
    const result = await apiDeleteCar(id);
    if (result.success) {
      showToast('خودرو حذف شد', 'success');
      loadAdminCars();
      loadStats();
    }
  } catch (err) {
    showToast('خطا', 'error');
  }
};

// ========== Start ==========
checkAuth();