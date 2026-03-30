require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { UPLOAD_DIR } = require('./config/storage');
const authMiddleware = require('./middlewares/auth');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static(UPLOAD_DIR));

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/classes',  require('./routes/classes'));
app.use('/api/students', require('./routes/students'));
app.use('/api/trombi',   require('./routes/trombi'));

app.get('/api/me', authMiddleware, (req, res) => res.json(req.user));

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`TrombiFlow API → http://localhost:${PORT}`));
}

module.exports = app;
