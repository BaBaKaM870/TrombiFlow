const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { uploadPhoto, uploadCsv } = require('../middlewares/upload');

router.get('/',    studentController.getAll);
router.get('/:id', studentController.getById);
router.post('/',   studentController.create);
router.post('/import', uploadCsv.single('file'), studentController.importCsv);
router.put('/:id', studentController.update);
router.delete('/:id', studentController.remove);
router.post('/:id/photo', uploadPhoto.single('photo'), studentController.uploadPhoto);

module.exports = router;
