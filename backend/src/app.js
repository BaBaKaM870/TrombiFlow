require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const classRoutes = require('./routes/classes');
const studentRoutes = require('./routes/students');
const trombiRoutes = require('./routes/trombi');
const authMiddleware = require('./middlewares/auth');
const errorHandler = require('./middlewares/errorHandler');
const { UPLOAD_DIR } = require('./config/storage');

const app = express();

// ── Core middleware ─────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── Static uploads ──────────────────────────────────────
app.use('/uploads', express.static(UPLOAD_DIR));

// ── Routes ──────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/trombi', trombiRoutes);

// Convenience alias: GET /api/me → same as GET /api/auth/me
app.get('/api/me', authMiddleware, (req, res) => res.json(req.user));

// ── 404 ─────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// ── Error handler ───────────────────────────────────────
app.use(errorHandler);

// ── Start server only when run directly ─────────────────
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`TrombiFlow API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
