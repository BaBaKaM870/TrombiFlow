const router = require('express').Router();
const classController = require('../controllers/classController');

// GET    /api/classes
router.get('/', classController.getAll);

// GET    /api/classes/:id
router.get('/:id', classController.getById);

// POST   /api/classes
router.post('/', classController.create);

// PUT    /api/classes/:id
router.put('/:id', classController.update);

// DELETE /api/classes/:id
router.delete('/:id', classController.remove);

module.exports = router;
