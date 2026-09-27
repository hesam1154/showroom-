require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// لاگ درخواست‌ها برای دیباگ
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  next();
});

app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cars', require('./routes/cars'));
app.use('/api/upload', require('./routes/upload'));

app.use(express.static(path.join(__dirname, '..', 'frontend')));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚗 Server running on http://localhost:${PORT}`);
  console.log(`🔐 Admin code: ${process.env.ADMIN_CODE || 'HESAM2025'}`);
  console.log(`🔑 JWT Secret set: ${!!process.env.JWT_SECRET}`);
});