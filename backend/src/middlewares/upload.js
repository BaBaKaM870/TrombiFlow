const multer = require('multer');
const path = require('path');
const { UPLOAD_DIR } = require('../config/storage');

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const photoFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(Object.assign(new Error('Only JPEG, PNG and WebP images are allowed'), { status: 415 }));
  }
};

const csvFilter = (_req, file, cb) => {
  const okMime = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
  if (okMime.includes(file.mimetype) || file.originalname.toLowerCase().endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(Object.assign(new Error('Only CSV files are allowed'), { status: 415 }));
  }
};

const uploadPhoto = multer({ storage: diskStorage, fileFilter: photoFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadCsv   = multer({ storage: multer.memoryStorage(), fileFilter: csvFilter, limits: { fileSize: 10 * 1024 * 1024 } });

module.exports = { uploadPhoto, uploadCsv };
