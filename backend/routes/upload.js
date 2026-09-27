const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const db = require('../database');
const auth = require('../middleware/auth');
const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /jpeg|jpg|png|webp|mp4|mov|webm/.test(file.mimetype);
    cb(ok ? null : new Error('فرمت پشتیبانی نمی‌شود'), ok);
  },
});

router.post('/:carId', auth, upload.array('files', 30), async (req, res) => {
  const carId = req.params.carId;

  db.get('SELECT id FROM cars WHERE id = ?', [carId], async (err, car) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!car) return res.status(404).json({ error: 'ماشین پیدا نشد' });

    const results = [];

    try {
      for (const file of req.files) {
        const isVideo = file.mimetype.startsWith('video');
        const ext = isVideo ? path.extname(file.originalname) : '.webp';
        const filename = `${carId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
        const filepath = path.join(uploadDir, filename);

        if (isVideo) {
          fs.writeFileSync(filepath, file.buffer);
          await new Promise((resolve, reject) => {
            db.run(
              'INSERT INTO media (car_id, type, url) VALUES (?, ?, ?)',
              [carId, 'video', `/uploads/${filename}`],
              function (err) {
                if (err) return reject(err);
                results.push({ id: this.lastID, type: 'video', url: `/uploads/${filename}` });
                resolve();
              }
            );
          });
        } else {
          await sharp(file.buffer)
            .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 82 })
            .toFile(filepath);

          const thumbName = 'thumb_' + filename;
          await sharp(file.buffer)
            .resize(400, 400, { fit: 'cover' })
            .webp({ quality: 70 })
            .toFile(path.join(uploadDir, thumbName));

          await new Promise((resolve, reject) => {
            db.run(
              'INSERT INTO media (car_id, type, url, thumbnail) VALUES (?, ?, ?, ?)',
              [carId, 'image', `/uploads/${filename}`, `/uploads/${thumbName}`],
              function (err) {
                if (err) return reject(err);
                results.push({
                  id: this.lastID,
                  type: 'image',
                  url: `/uploads/${filename}`,
                  thumbnail: `/uploads/${thumbName}`
                });
                resolve();
              }
            );
          });
        }
      }

      res.json(results);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
});

router.delete('/:mediaId', auth, (req, res) => {
  db.get('SELECT * FROM media WHERE id = ?', [req.params.mediaId], (err, media) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!media) return res.status(404).json({ error: 'فایل پیدا نشد' });

    try { fs.unlinkSync(path.join(uploadDir, path.basename(media.url))); } catch {}
    try {
      if (media.thumbnail) fs.unlinkSync(path.join(uploadDir, path.basename(media.thumbnail)));
    } catch {}

    db.run('DELETE FROM media WHERE id = ?', [req.params.mediaId], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

module.exports = router;