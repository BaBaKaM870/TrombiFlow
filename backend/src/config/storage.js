const path = require('path');
const fs = require('fs');
require('dotenv').config();

const STORAGE_TYPE = process.env.STORAGE || 'local';
const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(process.cwd(), 'uploads');

if (STORAGE_TYPE === 'local') {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

module.exports = { STORAGE_TYPE, UPLOAD_DIR };
