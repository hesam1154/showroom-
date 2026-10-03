const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const db = require('../database');
const auth = require('../middleware/auth');
const router = express.Router();

// مسیر ذخیره: روی Render از /tmp استفاده کن
const UPLOAD_DIR = process.env.NODE_ENV === 'production'
  ? '/tmp/uploads'
  : path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  try {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log('📁 Upload dir created:', UPLOAD_DIR);
  } catch (err) {
    console.error('❌ Cannot create upload dir:', err.message);
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /jpeg|jpg|png|webp|gif|mp4|mov|webm/.test(file.mimetype);
    cb(ok ? null : new Error('فرمت پشتیبانی نمی‌شود'), ok);
  },
});

router.post('/:carId', auth, upload.array('files', 30), async (req, res) => {
  try {
    const carId = Number(req.params.carId);
    console.log('📤 Upload request for car:', carId, 'files:', req.files?.length);

    const car = db.getCarById(carId);
    if (!car) {
      return res.status(404).json({ error: 'ماشین پیدا نشد' });
    }

    if (!req.files || !req.files.length) {
      return res.status(400).json({ error: 'فایلی ارسال نشد' });
    }

    const results = [];

    for (const file of req.files) {
      const isVideo = file.mimetype.startsWith('video');
      const ext = isVideo ? path.extname(file.originalname) : '.webp';
      const filename = `${carId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
      const filepath = path.join(UPLOAD_DIR, filename);

      try {
        if (isVideo) {
          fs.writeFileSync(filepath, file.buffer);
          const media = db.addMedia({
            car_id: carId,
            type: 'video',
            url: `/uploads/${filename}`,
            thumbnail: null,
            sort_order: 0
          });
          results.push(media);
          console.log('✅ Video uploaded:', filename);
        } else {
          try {
            await sharp(file.buffer)
              .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
              .webp({ quality: 82 })
              .toFile(filepath);

            const thumbName = 'thumb_' + filename;
            await sharp(file.buffer)
              .resize(400, 400, { fit: 'cover' })
              .webp({ quality: 70 })
              .toFile(path.join(UPLOAD_DIR, thumbName));

            const media = db.addMedia({
              car_id: carId,
              type: 'image',
              url: `/uploads/${filename}`,
              thumbnail: `/uploads/${thumbName}`,
              sort_order: 0
            });
            results.push(media);
            console.log('✅ Image uploaded:', filename);
          } catch (sharpErr) {
            console.error('❌ Sharp error:', sharpErr.message);
            fs.writeFileSync(filepath, file.buffer);
            const media = db.addMedia({
              car_id: carId,
              type: 'image',
              url: `/uploads/${filename}`,
              thumbnail: null,
              sort_order: 0
            });
            results.push(media);
          }
        }
      } catch (fileErr) {
        console.error('❌ File save error:', fileErr.message);
      }
    }

    console.log('✅ Upload complete:', results.length, 'files');
    res.json(results);
  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).json({ error: err.message || 'خطا در آپلود' });
  }
});

router.delete('/:mediaId', auth, (req, res) => {
  try {
    const data = db.getData();
    const media = data.media.find(m => m.id === Number(req.params.mediaId));
    if (!media) return res.status(404).json({ error: 'فایل پیدا نشد' });

    try {
      fs.unlinkSync(path.join(UPLOAD_DIR, path.basename(media.url)));
    } catch {}
    try {
      if (media.thumbnail) fs.unlinkSync(path.join(UPLOAD_DIR, path.basename(media.thumbnail)));
    } catch {}

    db.deleteMedia(req.params.mediaId);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;