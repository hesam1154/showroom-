const express = require('express');
const db = require('../database');
const auth = require('../middleware/auth');
const router = express.Router();

// دسته‌بندی برندها
const BRAND_CATEGORIES = {
  iranian: ['ایران خودرو', 'سایپا', 'پارس خودرو', 'کرمان موتور', 'مدیران خودرو', 'بهمن موتور'],
  chinese: ['چری', 'MVM', 'فونیکس', 'جک', 'لیفان', 'هایما', 'جیلی', 'BYD', 'چانگان', 'دانگ‌فنگ', 'ام‌وی‌ام', 'تیگو', 'آریزو'],
  foreign: ['تویوتا', 'هوندا', 'هیوندای', 'کیا', 'نیسان', 'مزدا', 'بنز', 'بی‌ام‌و', 'آئودی', 'پورشه', 'لکسوس', 'رنج روور', 'ولوو', 'فولکس‌واگن', 'رنو', 'پژو', 'سیتروئن', 'فیات', 'شورولت', 'فورد']
};

// گرفتن همه ماشین‌ها
router.get('/', (req, res) => {
  const {
    brand, category, min_price, max_price, min_year, max_year,
    min_km, max_km, search, sort
  } = req.query;

  let sql = 'SELECT * FROM cars WHERE is_sold = 0';
  const params = [];

  if (brand) { sql += ' AND brand = ?'; params.push(brand); }
  if (category && BRAND_CATEGORIES[category]) {
    const brands = BRAND_CATEGORIES[category];
    sql += ` AND brand IN (${brands.map(() => '?').join(',')})`;
    params.push(...brands);
  }
  if (min_price) { sql += ' AND price >= ?'; params.push(Number(min_price)); }
  if (max_price) { sql += ' AND price <= ?'; params.push(Number(max_price)); }
  if (min_year) { sql += ' AND year >= ?'; params.push(Number(min_year)); }
  if (max_year) { sql += ' AND year <= ?'; params.push(Number(max_year)); }
  if (min_km) { sql += ' AND mileage >= ?'; params.push(Number(min_km)); }
  if (max_km) { sql += ' AND mileage <= ?'; params.push(Number(max_km)); }
  if (search) {
    sql += ' AND (brand LIKE ? OR model LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const sorts = {
    newest: 'created_at DESC',
    cheapest: 'price ASC',
    expensive: 'price DESC',
    low_km: 'mileage ASC',
  };
  sql += ` ORDER BY ${sorts[sort] || 'created_at DESC'}`;

  db.all(sql, params, (err, cars) => {
    if (err) return res.status(500).json({ error: err.message });

    const result = [];
    let pending = cars.length;
    if (pending === 0) return res.json([]);

    cars.forEach(car => {
      db.get(
        `SELECT url FROM media WHERE car_id = ? AND type = 'image' ORDER BY sort_order LIMIT 1`,
        [car.id],
        (err, media) => {
          result.push({ ...car, thumbnail: media ? media.url : null });
          pending--;
          if (pending === 0) res.json(result);
        }
      );
    });
  });
});

// گرفتن برندهای دسته‌بندی شده
router.get('/meta/brands', (req, res) => {
  res.json(BRAND_CATEGORIES);
});

// گرفتن یک ماشین
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM cars WHERE id = ?', [req.params.id], (err, car) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!car) return res.status(404).json({ error: 'ماشین پیدا نشد' });

    db.all(
      'SELECT * FROM media WHERE car_id = ? ORDER BY sort_order',
      [car.id],
      (err, media) => {
        if (err) return res.status(500).json({ error: err.message });

        const minPrice = car.price * 0.85;
        const maxPrice = car.price * 1.15;

        db.all(
          `SELECT id, brand, model, year, price, mileage FROM cars
           WHERE is_sold = 0 AND id != ? AND price BETWEEN ? AND ?
           ORDER BY ABS(price - ?) LIMIT 4`,
          [car.id, minPrice, maxPrice, car.price],
          (err, similar) => {
            if (err) return res.status(500).json({ error: err.message });

            const withThumb = [];
            let pending = similar.length;
            if (pending === 0) {
              return res.json({ ...car, media, similar: [] });
            }

            similar.forEach(s => {
              db.get(
                `SELECT url FROM media WHERE car_id = ? AND type = 'image' LIMIT 1`,
                [s.id],
                (err, m) => {
                  withThumb.push({ ...s, thumbnail: m ? m.url : null });
                  pending--;
                  if (pending === 0) {
                    res.json({ ...car, media, similar: withThumb });
                  }
                }
              );
            });
          }
        );
      }
    );
  });
});

// افزودن ماشین
router.post('/', auth, (req, res) => {
  const b = req.body;
  const tracking_code = 'SR' + Date.now().toString().slice(-8);

  const sql = `
    INSERT INTO cars (tracking_code, brand, model, year, price, mileage, color, gearbox, fuel,
      body_status, engine_status, chassis_status, insurance_months, description,
      location, phone, whatsapp, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    tracking_code, b.brand, b.model, Number(b.year), Number(b.price), Number(b.mileage),
    b.color || null, b.gearbox || null, b.fuel || null,
    b.body_status || null, b.engine_status || null, b.chassis_status || null,
    Number(b.insurance_months) || 0,
    b.description || null, b.location || null, b.phone || null, b.whatsapp || null,
    b.is_featured ? 1 : 0
  ];

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, tracking_code });
  });
});

// ویرایش
router.put('/:id', auth, (req, res) => {
  const fields = req.body;
  const keys = Object.keys(fields);
  if (!keys.length) return res.status(400).json({ error: 'داده‌ای ارسال نشد' });

  const setClause = keys.map(k => `${k} = ?`).join(', ');
  const params = [...keys.map(k => fields[k]), req.params.id];

  db.run(
    `UPDATE cars SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    params,
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// حذف
router.delete('/:id', auth, (req, res) => {
  db.run('DELETE FROM cars WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// فروخته شده
router.patch('/:id/sold', auth, (req, res) => {
  db.run('UPDATE cars SET is_sold = 1 WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// درخواست بازدید
router.post('/:id/visit', (req, res) => {
  const { name, phone, preferred_time, message } = req.body;
  db.run(
    'INSERT INTO visits (car_id, name, phone, preferred_time, message) VALUES (?, ?, ?, ?, ?)',
    [req.params.id, name, phone, preferred_time || null, message || null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

module.exports = router;