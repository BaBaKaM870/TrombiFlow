const router = require('express').Router();
const studentController = require('../controllers/studentController');
const { uploadPhoto, uploadCsv } = require('../middlewares/upload');

// GET    /api/students?class_id=&q=
router.get('/', studentController.getAll);

// GET    /api/students/:id
router.get('/:id', studentController.getById);

// POST   /api/students  (JSON body)
router.post('/', studentController.create);

// POST   /api/students/import  (multipart CSV) — must be before /:id
router.post('/import', uploadCsv.single('file'), studentController.importCsv);

// PUT    /api/students/:id
router.put('/:id', studentController.update);

// DELETE /api/students/:id
router.delete('/:id', studentController.remove);

// POST   /api/students/:id/photo  (multipart image)
router.post('/:id/photo', uploadPhoto.single('photo'), studentController.uploadPhoto);

module.exports = router;
