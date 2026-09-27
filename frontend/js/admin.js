const loginView = document.getElementById('login-view');
const adminView = document.getElementById('admin-view');
const toast = document.getElementById('toast');
const toastText = document.getElementById('toast-text');

let currentEditId = null;
let currentUploadCarId = null;

// ========== مدیریت لاگین ==========
function checkAuth() {
  const token = localStorage.getItem('admin_token');
  if (token) {
    showAdmin();
  } else {
    showLogin();
  }
}

function showLogin() {
  loginView.style.display = 'flex';
  adminView.style.display = 'none';
}

function showAdmin() {
  loginView.style.display = 'none';
  adminView.style.display = 'block';
  loadAdminCars();
}

document.getElementById('login-btn').addEventListener('click', async () => {
  const code = document.getElementById('admin-code').value.trim();
  if (!code) return;

  const btn = document.getElementById('login-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال بررسی...';

  try {
    const result = await apiLogin(code);
    console.log('Login result:', result);

    if (result && result.token) {
      localStorage.setItem('admin_token', result.token);
      showAdmin();
      showToast('خوش آمدی! 👋', 'success');
    } else {
      document.getElementById('login-error').style.display = 'block';
      document.getElementById('login-error').textContent = result?.error || 'کد اشتباهه!';
    }
  } catch (err) {
    console.error('Login error:', err);
    document.getElementById('login-error').style.display = 'block';
    document.getElementById('login-error').textContent = 'خطا در ارتباط با سرور';
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> ورود';
  }
});

document.getElementById('admin-code').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('login-btn').click();
});

document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('admin_token');
  showLogin();
  document.getElementById('admin-code').value = '';
  document.getElementById('login-error').style.display = 'none';
});

// ========== تب‌ها ==========
document.querySelectorAll('.admin-tab[data-tab]').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');

    if (tab.dataset.tab === 'list') loadAdminCars();
  });
});

// ========== توست ==========
function showToast(msg, type = 'success') {
  toastText.textContent = msg;
  toast.className = 'toast ' + type;
  toast.querySelector('i').className = type === 'success'
    ? 'fas fa-check-circle'
    : 'fas fa-exclamation-circle';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ========== ذخیره خودرو ==========
document.getElementById('save-car-btn').addEventListener('click', async () => {
  const data = {
    brand: document.getElementById('f-brand').value,
    model: document.getElementById('f-model').value.trim(),
    year: document.getElementById('f-year').value,
    price: document.getElementById('f-price').value,
    mileage: document.getElementById('f-mileage').value,
    color: document.getElementById('f-color').value.trim(),
    gearbox: document.getElementById('f-gearbox').value,
    fuel: document.getElementById('f-fuel').value,
    body_status: document.getElementById('f-body').value,
    engine_status: document.getElementById('f-engine').value,
    chassis_status: document.getElementById('f-chassis').value,
    insurance_months: document.getElementById('f-insurance').value,
    phone: document.getElementById('f-phone').value.trim(),
    whatsapp: document.getElementById('f-whatsapp').value.trim(),
    location: document.getElementById('f-location').value.trim(),
    description: document.getElementById('f-description').value.trim(),
    is_featured: document.getElementById('f-featured').checked ? 1 : 0,
  };

  if (!data.brand || !data.model || !data.year || !data.price || !data.mileage) {
    showToast('فیلدهای اجباری رو پر کن', 'error');
    return;
  }

  let result;
  if (currentEditId) {
    result = await apiUpdateCar(currentEditId, data);
    if (result.success) {
      showToast('خودرو ویرایش شد ✅', 'success');
      resetForm();
      loadAdminCars();
    } else {
      showToast('خطا در ویرایش', 'error');
    }
  } else {
    result = await apiCreateCar(data);
    if (result.id) {
      showToast('خودرو ذخیره شد! حالا عکس اضافه کن 📸', 'success');
      currentUploadCarId = result.id;
      document.getElementById('upload-card').style.display = 'block';
      document.getElementById('upload-card').scrollIntoView({ behavior: 'smooth' });
      resetFormFields();
    } else {
      showToast('خطا در ذخیره', 'error');
    }
  }
});

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
  document.getElementById('upload-card').style.display = 'none';
  document.getElementById('media-preview').innerHTML = '';
  document.getElementById('cancel-edit-btn').style.display = 'none';
}

document.getElementById('cancel-edit-btn').addEventListener('click', resetForm);

// ========== آپلود رسانه ==========
document.getElementById('media-input').addEventListener('change', async (e) => {
  if (!currentUploadCarId) {
    showToast('اول خودرو رو ذخیره کن', 'error');
    return;
  }

  const files = Array.from(e.target.files);
  if (!files.length) return;

  showToast('در حال آپلود...', 'success');
  const result = await apiUploadMedia(currentUploadCarId, files);

  if (Array.isArray(result)) {
    showToast(`${result.length} فایل آپلود شد ✅`, 'success');
    appendPreview(result);
    loadAdminCars();
  } else {
    showToast('خطا در آپلود', 'error');
  }

  e.target.value = '';
});

function appendPreview(mediaList) {
  const preview = document.getElementById('media-preview');
  mediaList.forEach(m => {
    const div = document.createElement('div');
    div.className = 'media-item';
    div.innerHTML = `
      ${m.type === 'image'
        ? `<img src="http://localhost:5000${m.url}">`
        : `<video src="http://localhost:5000${m.url}" muted></video>`}
      <button class="remove" onclick="removeMedia(${m.id}, this)">×</button>
    `;
    preview.appendChild(div);
  });
}

function renderPreview(mediaList) {
  const preview = document.getElementById('media-preview');
  preview.innerHTML = '';
  appendPreview(mediaList);
}

window.removeMedia = async function(id, btn) {
  if (!confirm('این فایل حذف بشه؟')) return;
  const result = await fetch(`http://localhost:5000/api/upload/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
  }).then(r => r.json());

  if (result.success) {
    btn.closest('.media-item').remove();
    showToast('فایل حذف شد', 'success');
  }
};

// ========== لیست خودروها ==========
async function loadAdminCars() {
  const list = document.getElementById('admin-cars-list');
  const empty = document.getElementById('admin-empty');

  const cars = await apiGetCars();

  if (!cars.length) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  list.innerHTML = cars.map(car => `
    <div class="admin-car-card">
      <div class="admin-car-image">
        ${car.thumbnail
          ? `<img src="http://localhost:5000${car.thumbnail}">`
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
}

window.editCar = async function(id) {
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

  if (car.media && car.media.length) {
    renderPreview(car.media);
  } else {
    document.getElementById('media-preview').innerHTML = '';
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
  showToast('برای ویرایش آماده شد', 'success');
};

window.markSold = async function(id) {
  if (!confirm('این خودرو فروخته شده؟')) return;
  const result = await fetch(`http://localhost:5000/api/cars/${id}/sold`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
  }).then(r => r.json());

  if (result.success) {
    showToast('به عنوان فروخته شده علامت خورد', 'success');
    loadAdminCars();
  }
};

window.deleteCar = async function(id) {
  if (!confirm('مطمئنی؟ این خودرو برای همیشه حذف میشه!')) return;
  const result = await apiDeleteCar(id);
  if (result.success) {
    showToast('خودرو حذف شد', 'success');
    loadAdminCars();
  }
};

// ========== شروع ==========
checkAuth();