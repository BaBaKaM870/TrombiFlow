const path = require('path');
const fs = require('fs');
const Student = require('../models/Student');
const { resizePhoto } = require('../services/imageService');
const { parseCsv, processCsvRecords } = require('../services/csvService');

async function getAll(req, res, next) {
  try { res.json(await Student.findAll(req.query)); } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const s = await Student.findById(req.params.id);
    if (!s) return res.status(404).json({ error: 'Student not found' });
    res.json(s);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { first_name, last_name, email, class_id, photo_url } = req.body;
    if (!first_name || !last_name) return res.status(400).json({ error: 'first_name and last_name are required' });
    res.status(201).json(await Student.create({ first_name, last_name, email, class_id, photo_url }));
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const s = await Student.update(req.params.id, req.body);
    if (!s) return res.status(404).json({ error: 'Student not found' });
    res.json(s);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const deleted = await Student.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Student not found' });
    res.status(204).send();
  } catch (err) { next(err); }
}

async function uploadPhoto(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No photo file uploaded' });

    const student = await Student.findById(req.params.id);
    if (!student) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Student not found' });
    }

    const finalPath = await resizePhoto(req.file.path);
    const relUrl = 'uploads/' + path.basename(finalPath);
    res.json(await Student.updatePhoto(req.params.id, relUrl));
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(err);
  }
}

async function importCsv(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No CSV file uploaded' });

    const records = await parseCsv(req.file.buffer);
    if (records.length === 0) return res.status(400).json({ error: 'CSV file is empty' });

    const { students, errors } = await processCsvRecords(records);
    if (students.length === 0) return res.status(400).json({ error: 'No valid students found in CSV', errors });

    const created = await Student.bulkCreate(students);
    res.status(201).json({ created: created.length, students: created, ...(errors.length > 0 && { errors }) });
  } catch (err) { next(err); }
}

module.exports = { getAll, getById, create, update, remove, uploadPhoto, importCsv };
