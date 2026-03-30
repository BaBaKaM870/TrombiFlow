const path = require('path');
const fs = require('fs');

const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local';
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

module.exports = { STORAGE_TYPE, UPLOAD_DIR };
