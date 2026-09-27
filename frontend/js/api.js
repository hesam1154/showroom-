const API_BASE = 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('admin_token');
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

async function apiGetCars(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  const res = await fetch(`${API_BASE}/cars?${params}`);
  return res.json();
}

async function apiGetCar(id) {
  const res = await fetch(`${API_BASE}/cars/${id}`);
  return res.json();
}

async function apiGetBrands() {
  const res = await fetch(`${API_BASE}/cars/meta/brands`);
  return res.json();
}

async function apiLogin(code) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  return res.json();
}

async function apiCreateCar(data) {
  const res = await fetch(`${API_BASE}/cars`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

async function apiUpdateCar(id, data) {
  const res = await fetch(`${API_BASE}/cars/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

async function apiDeleteCar(id) {
  const res = await fetch(`${API_BASE}/cars/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return res.json();
}

async function apiUploadMedia(carId, files) {
  const form = new FormData();
  for (const f of files) form.append('files', f);

  const res = await fetch(`${API_BASE}/upload/${carId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: form,
  });
  return res.json();
}