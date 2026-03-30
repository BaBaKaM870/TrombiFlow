const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function resizePhoto(inputPath) {
  const dir  = path.dirname(inputPath);
  const base = path.basename(inputPath, path.extname(inputPath));
  const outputPath = path.join(dir, `${base}.jpg`);

  await sharp(inputPath)
    .resize(300, 300, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 85 })
    .toFile(outputPath);

  if (outputPath !== inputPath && fs.existsSync(inputPath)) {
    fs.unlinkSync(inputPath);
  }

  return outputPath;
}

module.exports = { resizePhoto };
