const router = require('express').Router();
const trombiController = require('../controllers/trombiController');
const exportController = require('../controllers/exportController');

// GET /api/trombi?class_id=&format=html|pdf
router.get('/', trombiController.generate);

// GET /api/trombi/exports — historique des exports
router.get('/exports', exportController.getAll);

module.exports = router;
