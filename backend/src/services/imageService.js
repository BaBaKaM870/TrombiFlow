const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Resize an uploaded photo to 300×300 JPEG.
 * The original file is replaced by the resized version.
 * Returns the final absolute file path.
 */
async function resizePhoto(inputPath) {
  const dir = path.dirname(inputPath);
  const base = path.basename(inputPath, path.extname(inputPath));
  const outputPath = path.join(dir, `${base}.jpg`);

  await sharp(inputPath)
    .resize(300, 300, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 85 })
    .toFile(outputPath);

  // Remove original only if it differs from the output
  if (outputPath !== inputPath && fs.existsSync(inputPath)) {
    fs.unlinkSync(inputPath);
  }

  return outputPath;
}

module.exports = { resizePhoto };
