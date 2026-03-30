const Export = require('../models/Export');

async function getAll(req, res, next) {
  try {
    const exports = await Export.findAll();
    res.json(exports);
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll };
