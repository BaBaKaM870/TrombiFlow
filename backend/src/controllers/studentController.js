const path = require('path');
const fs = require('fs');
const Student = require('../models/Student');
const { resizePhoto } = require('../services/imageService');
const { parseCsv, processCsvRecords } = require('../services/csvService');
const { UPLOAD_DIR } = require('../config/storage');

async function getAll(req, res, next) {
  try {
    const { class_id, q } = req.query;
    const students = await Student.findAll({ class_id, q });
    res.json(students);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { first_name, last_name, email, class_id, photo_url } = req.body;
    if (!first_name || !last_name) {
      return res.status(400).json({ error: 'first_name and last_name are required' });
    }
    const student = await Student.create({ first_name, last_name, email, class_id, photo_url });
    res.status(201).json(student);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { first_name, last_name, email, class_id, photo_url } = req.body;
    const student = await Student.update(req.params.id, { first_name, last_name, email, class_id, photo_url });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const deleted = await Student.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Student not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function uploadPhoto(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No photo file uploaded' });

    const student = await Student.findById(req.params.id);
    if (!student) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Student not found' });
    }

    // Resize to 300×300 and get final path
    const finalPath = await resizePhoto(req.file.path);
    const relUrl = 'uploads/' + path.basename(finalPath);

    const updated = await Student.updatePhoto(req.params.id, relUrl);
    res.json(updated);
  } catch (err) {
    // Clean up on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(err);
  }
}

async function importCsv(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No CSV file uploaded' });

    const records = await parseCsv(req.file.buffer);
    if (records.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty' });
    }

    const { students, errors } = await processCsvRecords(records);

    if (students.length === 0) {
      return res.status(400).json({ error: 'No valid students found in CSV', errors });
    }

    const created = await Student.bulkCreate(students);

    res.status(201).json({
      created: created.length,
      students: created,
      ...(errors.length > 0 && { errors }),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, create, update, remove, uploadPhoto, importCsv };
