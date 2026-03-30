const Export = require('../models/Export');

async function getAll(_req, res, next) {
  try { res.json(await Export.findAll()); } catch (err) { next(err); }
}

module.exports = { getAll };
