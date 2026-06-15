module.exports = (err, req, res, next) => {
  const status = err.status || 500;
  console.error(`[ERROR] ${req.method} ${req.url} → ${status}: ${err.message}`);
  res.status(status).json({ error: err.message || 'Server error' });
};
