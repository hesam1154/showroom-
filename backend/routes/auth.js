const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.post('/login', (req, res) => {
  try {
    const { code } = req.body;

    console.log('=== Login Attempt ===');
    console.log('Code received:', code);
    console.log('Admin code from env:', process.env.ADMIN_CODE);
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ 
        error: 'تنظیمات سرور ناقص است (JWT_SECRET وجود ندارد)' 
      });
    }

    const ADMIN_CODE = process.env.ADMIN_CODE || 'HESAM2025';

    if (code === ADMIN_CODE) {
      const token = jwt.sign(
        { role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
      console.log('✅ Login successful, token generated');
      return res.json({ token });
    }

    console.log('❌ Wrong code');
    res.status(401).json({ error: 'کد ادمین اشتباه است' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'خطای سرور: ' + err.message });
  }
});

module.exports = router;