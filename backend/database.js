const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'showroom.json');

let data = {
  cars: [],
  media: [],
  visits: [],
  lastCarId: 0,
  lastMediaId: 0,
  lastVisitId: 0
};

function load() {
  if (fs.existsSync(dbPath)) {
    try {
      data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      if (!data.cars) data.cars = [];
      if (!data.media) data.media = [];
      if (!data.visits) data.visits = [];
    } catch (err) {
      console.error('Error loading DB:', err);
    }
  } else {
    save();
  }
}

function save() {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error saving DB:', err);
  }
}

load();

module.exports = {
  getData: () => data,
  save,

  getCars: (filters = {}) => {
    let cars = data.cars.filter(c => !c.is_sold);

    if (filters.brand) cars = cars.filter(c => c.brand === filters.brand);
    if (filters.category) {
      const cats = {
        iranian: ['ایران خودرو', 'سایپا', 'پارس خودرو', 'کرمان موتور', 'مدیران خودرو', 'بهمن موتور'],
        chinese: ['چری', 'MVM', 'فونیکس', 'جک', 'لیفان', 'هایما', 'جیلی', 'BYD', 'چانگان', 'دانگ‌فنگ', 'ام‌وی‌ام', 'تیگو', 'آریزو'],
        foreign: ['تویوتا', 'هوندا', 'هیوندای', 'کیا', 'نیسان', 'مزدا', 'بنز', 'بی‌ام‌و', 'آئودی', 'پورشه', 'لکسوس', 'رنج روور', 'ولوو', 'فولکس‌واگن', 'رنو', 'پژو', 'سیتروئن', 'فیات', 'شورولت', 'فورد']
      };
      const brands = cats[filters.category] || [];
      cars = cars.filter(c => brands.includes(c.brand));
    }
    if (filters.min_price) cars = cars.filter(c => c.price >= Number(filters.min_price));
    if (filters.max_price) cars = cars.filter(c => c.price <= Number(filters.max_price));
    if (filters.min_year) cars = cars.filter(c => c.year >= Number(filters.min_year));
    if (filters.max_year) cars = cars.filter(c => c.year <= Number(filters.max_year));
    if (filters.min_km) cars = cars.filter(c => c.mileage >= Number(filters.min_km));
    if (filters.max_km) cars = cars.filter(c => c.mileage <= Number(filters.max_km));
    if (filters.search) {
      const s = filters.search.toLowerCase();
      cars = cars.filter(c =>
        c.brand.toLowerCase().includes(s) ||
        c.model.toLowerCase().includes(s) ||
        (c.description || '').toLowerCase().includes(s)
      );
    }
    if (filters.featured) cars = cars.filter(c => c.is_featured === 1);

    const sort = filters.sort || 'newest';
    if (sort === 'cheapest') cars.sort((a, b) => a.price - b.price);
    else if (sort === 'expensive') cars.sort((a, b) => b.price - a.price);
    else if (sort === 'low_km') cars.sort((a, b) => a.mileage - b.mileage);
    else cars.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return cars.map(c => {
      const img = data.media.find(m => m.car_id === c.id && m.type === 'image');
      return { ...c, thumbnail: img ? img.url : null };
    });
  },

  getCarById: (id) => {
    const car = data.cars.find(c => c.id === Number(id));
    if (!car) return null;
    const media = data.media.filter(m => m.car_id === car.id).sort((a, b) => a.sort_order - b.sort_order);
    const similar = data.cars
      .filter(c => !c.is_sold && c.id !== car.id && c.price >= car.price * 0.85 && c.price <= car.price * 1.15)
      .slice(0, 4)
      .map(s => {
        const img = data.media.find(m => m.car_id === s.id && m.type === 'image');
        return { id: s.id, brand: s.brand, model: s.model, year: s.year, price: s.price, mileage: s.mileage, thumbnail: img ? img.url : null };
      });
    return { ...car, media, similar };
  },

  addCar: (car) => {
    data.lastCarId++;
    const newCar = {
      id: data.lastCarId,
      tracking_code: 'SR' + Date.now().toString().slice(-8),
      brand: car.brand,
      model: car.model,
      year: Number(car.year),
      price: Number(car.price),
      mileage: Number(car.mileage),
      color: car.color || null,
      gearbox: car.gearbox || null,
      fuel: car.fuel || null,
      body_status: car.body_status || null,
      engine_status: car.engine_status || null,
      chassis_status: car.chassis_status || null,
      insurance_months: Number(car.insurance_months) || 0,
      description: car.description || null,
      location: car.location || null,
      phone: car.phone || null,
      whatsapp: car.whatsapp || null,
      is_sold: 0,
      is_featured: car.is_featured ? 1 : 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    data.cars.push(newCar);
    save();
    return newCar;
  },

  updateCar: (id, fields) => {
    const car = data.cars.find(c => c.id === Number(id));
    if (!car) return false;
    Object.assign(car, fields, { updated_at: new Date().toISOString() });
    save();
    return true;
  },

  deleteCar: (id) => {
    data.cars = data.cars.filter(c => c.id !== Number(id));
    data.media = data.media.filter(m => m.car_id !== Number(id));
    save();
  },

  markSold: (id) => {
    const car = data.cars.find(c => c.id === Number(id));
    if (car) { car.is_sold = 1; save(); }
  },

  addMedia: (media) => {
    data.lastMediaId++;
    const newMedia = { id: data.lastMediaId, ...media };
    data.media.push(newMedia);
    save();
    return newMedia;
  },

  deleteMedia: (id) => {
    data.media = data.media.filter(m => m.id !== Number(id));
    save();
  },

  addVisit: (visit) => {
    data.lastVisitId++;
    data.visits.push({ id: data.lastVisitId, ...visit, created_at: new Date().toISOString() });
    save();
  }
};