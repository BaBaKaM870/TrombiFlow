const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { UPLOAD_DIR } = require('../config/storage');

const PAGE_W  = 595.28;
const PAGE_H  = 841.89;
const MARGIN  = 30;
const COLS    = 5;
const CELL_W  = Math.floor((PAGE_W - 2 * MARGIN) / COLS);
const IMG_SIZE = 75;
const CELL_H  = IMG_SIZE + 22;
const FOOTER_H = 40;

async function generatePDF(students, options = {}) {
  const { title = 'Trombinoscope', class_label = '' } = options;
  const outputPath = path.join(UPLOAD_DIR, `trombi-${Date.now()}.pdf`);

  const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: true });
  const ws  = fs.createWriteStream(outputPath);
  doc.pipe(ws);

  doc.fontSize(18).fillColor('#222').text(title, 0, MARGIN, { align: 'center', width: PAGE_W });
  let headerH = MARGIN + 26;
  if (class_label) {
    doc.fontSize(12).fillColor('#555').text(`Classe : ${class_label}`, 0, headerH, { align: 'center', width: PAGE_W });
    headerH += 18;
  }
  headerH += 10;

  const rowsFirst = Math.max(1, Math.floor((PAGE_H - headerH - MARGIN - FOOTER_H) / CELL_H));
  const rowsOther = Math.max(1, Math.floor((PAGE_H - 2 * MARGIN - FOOTER_H) / CELL_H));

  let page = 0, row = 0, col = 0;
  const startY = () => (page === 0 ? headerH : MARGIN);

  for (const s of students) {
    const x = MARGIN + col * CELL_W + Math.floor((CELL_W - IMG_SIZE) / 2);
    const y = startY() + row * CELL_H;

    const photoPath = s.photo_url ? path.join(process.cwd(), s.photo_url) : null;
    if (photoPath && fs.existsSync(photoPath)) {
      try { doc.image(photoPath, x, y, { width: IMG_SIZE, height: IMG_SIZE, cover: [IMG_SIZE, IMG_SIZE] }); }
      catch { drawPlaceholder(doc, x, y); }
    } else {
      drawPlaceholder(doc, x, y);
    }

    doc.fontSize(7.5).fillColor('#222')
      .text(`${s.first_name} ${s.last_name}`, MARGIN + col * CELL_W, y + IMG_SIZE + 2, { width: CELL_W, align: 'center' });

    col++;
    if (col >= COLS) {
      col = 0; row++;
      const maxRows = page === 0 ? rowsFirst : rowsOther;
      if (row >= maxRows) { addFooter(doc); doc.addPage(); page++; row = 0; }
    }
  }

  addFooter(doc);
  doc.end();

  return new Promise((resolve, reject) => {
    ws.on('finish', () => resolve(outputPath));
    ws.on('error', reject);
  });
}

function drawPlaceholder(doc, x, y) {
  doc.save().rect(x, y, IMG_SIZE, IMG_SIZE).fillAndStroke('#e0e0e0', '#bbb').restore();
  doc.fontSize(7).fillColor('#888').text('photo', x, y + IMG_SIZE / 2 - 4, { width: IMG_SIZE, align: 'center' });
}

function addFooter(doc) {
  doc.fontSize(7).fillColor('#777').text(
    `⚠ Données personnelles — Conformité RGPD (UE 2016/679). Généré le ${new Date().toLocaleDateString('fr-FR')} par TrombiFlow. Toute diffusion non autorisée est interdite.`,
    MARGIN, PAGE_H - FOOTER_H, { width: PAGE_W - 2 * MARGIN, align: 'center' }
  );
}

module.exports = { generatePDF };
