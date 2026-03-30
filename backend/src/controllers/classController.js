const Class = require('../models/Class');

async function getAll(_req, res, next) {
  try { res.json(await Class.findAll()); } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    res.json(cls);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { label, year } = req.body;
    if (!label) return res.status(400).json({ error: 'label is required' });
    res.status(201).json(await Class.create({ label, year }));
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const cls = await Class.update(req.params.id, req.body);
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    res.json(cls);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const deleted = await Class.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Class not found' });
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { getAll, getById, create, update, remove };
