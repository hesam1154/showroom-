const express = require('express');
const db = require('../database');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', (req, res) => {
  try {
    const cars = db.getCars(req.query);
    res.json(cars);
  } catch (err) {
    console.error('GET /cars error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/meta/brands', (req, res) => {
  res.json({
    iranian: ['ایران خودرو', 'سایپا', 'پارس خودرو', 'کرمان موتور', 'مدیران خودرو', 'بهمن موتور'],
    chinese: ['چری', 'MVM', 'فونیکس', 'جک', 'لیفان', 'هایما', 'جیلی', 'BYD', 'چانگان', 'دانگ‌فنگ', 'ام‌وی‌ام', 'تیگو', 'آریزو'],
    foreign: ['تویوتا', 'هوندا', 'هیوندای', 'کیا', 'نیسان', 'مزدا', 'بنز', 'بی‌ام‌و', 'آئودی', 'پورشه', 'لکسوس', 'رنج روور', 'ولوو', 'فولکس‌واگن', 'رنو', 'پژو', 'سیتروئن', 'فیات', 'شورولت', 'فورد']
  });
});

router.get('/:id', (req, res) => {
  try {
    const car = db.getCarById(req.params.id);
    if (!car) return res.status(404).json({ error: 'ماشین پیدا نشد' });
    res.json(car);
  } catch (err) {
    console.error('GET /cars/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, (req, res) => {
  try {
    console.log('📝 POST /cars - Body:', req.body);
    const newCar = db.addCar(req.body);
    console.log('✅ Car added:', newCar.id);
    res.json({ id: newCar.id, tracking_code: newCar.tracking_code });
  } catch (err) {
    console.error('❌ POST /cars error:', err);
    res.status(500).json({ error: err.message || 'خطا در ذخیره' });
  }
});

router.put('/:id', auth, (req, res) => {
  try {
    const ok = db.updateCar(req.params.id, req.body);
    if (!ok) return res.status(404).json({ error: 'ماشین پیدا نشد' });
    res.json({ success: true });
  } catch (err) {
    console.error('PUT /cars error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, (req, res) => {
  try {
    db.deleteCar(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /cars error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/sold', auth, (req, res) => {
  try {
    db.markSold(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('PATCH /cars/sold error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/visit', (req, res) => {
  try {
    const { name, phone, preferred_time, message } = req.body;
    db.addVisit({
      car_id: Number(req.params.id),
      name, phone,
      preferred_time: preferred_time || null,
      message: message || null,
      status: 'pending'
    });
    res.json({ success: true });
  } catch (err) {
    console.error('POST /cars/visit error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;