const express = require('express');
const router = express.Router();
const trombiController = require('../controllers/trombiController');
const exportController = require('../controllers/exportController');

router.get('/',        trombiController.generate);
router.get('/exports', exportController.getAll);

module.exports = router;
