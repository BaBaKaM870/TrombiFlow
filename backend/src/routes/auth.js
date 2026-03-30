const router = require('express').Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth');

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/register
router.post('/register', authController.register);

// GET /api/auth/me  (also exposed as GET /api/me via app.js)
router.get('/me', authMiddleware, authController.me);

module.exports = router;
