const router = require('express').Router();
const classController = require('../controllers/classController');

router.get('/',    classController.getAll);
router.get('/:id', classController.getById);
router.post('/',   classController.create);
router.put('/:id', classController.update);
router.delete('/:id', classController.remove);

module.exports = router;
