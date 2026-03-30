const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error('[error]', err.message);

  if (err.code === '23505') return res.status(409).json({ error: 'Resource already exists', detail: err.detail });
  if (err.code === '23503') return res.status(400).json({ error: 'Referenced resource does not exist' });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large (max 5 MB)' });

  res.status(err.status || err.statusCode || 500).json({ error: err.message || 'Internal server error' });
};

module.exports = errorHandler;
