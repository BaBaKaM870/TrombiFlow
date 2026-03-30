const fs = require('fs');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Export = require('../models/Export');
const { generateTrombiHTML } = require('../services/htmlService');
const { generatePDF } = require('../services/pdfService');

async function generate(req, res, next) {
  try {
    const { class_id, format = 'html' } = req.query;

    if (!['html', 'pdf'].includes(format)) {
      return res.status(400).json({ error: 'format must be "html" or "pdf"' });
    }

    const students = await Student.findAll({ class_id });
    if (students.length === 0) return res.status(404).json({ error: 'No students found' });

    let class_label = '';
    if (class_id) {
      const cls = await Class.findById(class_id);
      class_label = cls ? cls.label : '';
    }

    const opts = { title: 'Trombinoscope', class_label };
    const userId = req.user ? req.user.id : null;

    if (format === 'html') {
      const html = generateTrombiHTML(students, opts);
      Export.create({ class_id: class_id || null, format: 'html', file_path: null, generated_by: userId })
        .catch((e) => console.warn('Export log failed:', e.message));
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    const pdfPath = await generatePDF(students, opts);
    Export.create({ class_id: class_id || null, format: 'pdf', file_path: pdfPath, generated_by: userId })
      .catch((e) => console.warn('Export log failed:', e.message));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="trombi-${class_label || 'all'}-${Date.now()}.pdf"`);
    const stream = fs.createReadStream(pdfPath);
    stream.pipe(res);
    stream.on('error', next);
  } catch (err) { next(err); }
}

module.exports = { generate };
