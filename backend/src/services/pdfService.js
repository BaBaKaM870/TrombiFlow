const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { UPLOAD_DIR } = require('../config/storage');

// A4 dimensions in points (72 pt = 1 inch)
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 30;

// Grid layout
const COLS = 5;
const CELL_W = Math.floor((PAGE_W - 2 * MARGIN) / COLS); // ~107 pt
const IMG_SIZE = 75;
const NAME_H = 20;
const CELL_H = IMG_SIZE + NAME_H + 8;
const FOOTER_H = 48;

/**
 * Generate a PDF trombinoscope with pdfkit.
 * @param {Array}  students  - list of student objects
 * @param {Object} options   - { title, class_label }
 * @returns {Promise<string>} absolute path of the generated PDF
 */
async function generatePDF(students, options = {}) {
  const { title = 'Trombinoscope', class_label = '' } = options;
  const outputPath = path.join(UPLOAD_DIR, `trombi-${Date.now()}.pdf`);

  const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: true });
  const writeStream = fs.createWriteStream(outputPath);
  doc.pipe(writeStream);

  // ── Title ──────────────────────────────────────────────
  doc.fontSize(18).fillColor('#222')
    .text(title, 0, MARGIN, { align: 'center', width: PAGE_W });

  let headerH = MARGIN + 26;
  if (class_label) {
    doc.fontSize(12).fillColor('#555')
      .text(`Classe : ${class_label}`, 0, headerH, { align: 'center', width: PAGE_W });
    headerH += 18;
  }
  headerH += 10; // padding below header

  // ── Grid ───────────────────────────────────────────────
  const usableH = PAGE_H - MARGIN - headerH - FOOTER_H;
  const rowsOnFirstPage = Math.max(1, Math.floor(usableH / CELL_H));
  const rowsOnOtherPages = Math.max(1, Math.floor((PAGE_H - 2 * MARGIN - FOOTER_H) / CELL_H));

  let pageIndex = 0;
  let rowOnPage = 0;
  let col = 0;

  const getStartY = () => (pageIndex === 0 ? headerH : MARGIN);

  for (const student of students) {
    const x = MARGIN + col * CELL_W + Math.floor((CELL_W - IMG_SIZE) / 2);
    const y = getStartY() + rowOnPage * CELL_H;

    // Draw photo or placeholder
    const photoPath = resolvePhotoPath(student.photo_url);
    if (photoPath && fs.existsSync(photoPath)) {
      try {
        doc.image(photoPath, x, y, { width: IMG_SIZE, height: IMG_SIZE, cover: [IMG_SIZE, IMG_SIZE] });
      } catch {
        drawPlaceholder(doc, x, y, IMG_SIZE);
      }
    } else {
      drawPlaceholder(doc, x, y, IMG_SIZE);
    }

    // Draw name
    doc.fontSize(7.5).fillColor('#222')
      .text(
        `${student.first_name} ${student.last_name}`,
        MARGIN + col * CELL_W,
        y + IMG_SIZE + 2,
        { width: CELL_W, align: 'center' }
      );

    // Advance position
    col++;
    if (col >= COLS) {
      col = 0;
      rowOnPage++;
      const maxRows = pageIndex === 0 ? rowsOnFirstPage : rowsOnOtherPages;
      if (rowOnPage >= maxRows) {
        addFooter(doc, PAGE_H);
        doc.addPage();
        pageIndex++;
        rowOnPage = 0;
      }
    }
  }

  // ── RGPD footer on last page ───────────────────────────
  addFooter(doc, PAGE_H);
  doc.end();

  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => resolve(outputPath));
    writeStream.on('error', reject);
  });
}

function drawPlaceholder(doc, x, y, size) {
  doc.save()
    .rect(x, y, size, size)
    .fillAndStroke('#e0e0e0', '#bbb')
    .restore();
  doc.fontSize(7).fillColor('#888')
    .text('photo', x, y + size / 2 - 5, { width: size, align: 'center' });
}

function addFooter(doc, pageH) {
  const text =
    '⚠ Données personnelles — Conformité RGPD (UE 2016/679). ' +
    `Généré le ${new Date().toLocaleDateString('fr-FR')} par TrombiFlow. ` +
    'Toute diffusion non autorisée est interdite.';
  doc.fontSize(7).fillColor('#777')
    .text(text, MARGIN, pageH - FOOTER_H, { width: PAGE_W - 2 * MARGIN, align: 'center' });
}

function resolvePhotoPath(photoUrl) {
  if (!photoUrl) return null;
  if (path.isAbsolute(photoUrl) && fs.existsSync(photoUrl)) return photoUrl;
  // Relative path like "uploads/filename.jpg"
  const candidate = path.join(process.cwd(), photoUrl);
  return candidate;
}

module.exports = { generatePDF };
