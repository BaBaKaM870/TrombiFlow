/**
 * Centralized Express error handler.
 * Must be registered last with app.use().
 */
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error('[error]', err.message);

  // PostgreSQL unique constraint violation
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Resource already exists', detail: err.detail });
  }
  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced resource does not exist' });
  }
  // Multer file size exceeded
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large (max 5 MB)' });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
};

module.exports = errorHandler;
