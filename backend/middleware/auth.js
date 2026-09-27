const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'توکن ارسال نشده' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'توکن نامعتبر' });

  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'توکن نامعتبر' });
  }
};