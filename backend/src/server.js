const express = require('express');
const path    = require('path');
const { execSync } = require('child_process');
const { PORT, NODE_ENV } = require('./config/config');

const app = express();
app.use(express.json());
app.use(require('./middleware/logger'));
app.use(express.static(path.join(__dirname, '../../frontend')));
app.use('/api', require('./routes/index'));
app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, '../../frontend/index.html'))
);
app.use(require('./middleware/errorHandler'));

async function start() {
  if (process.env.DATABASE_URL) {
    console.log('[server] Running migrations...');
    try {
      execSync('node ' + path.join(__dirname, 'migrations/migrate.js'), {
        stdio: 'inherit',
        env: process.env,
      });
    } catch (err) {
      console.warn('[server] Migration failed (DB unavailable?) — continuing without DB:', err.message);
    }
  } else {
    console.warn('[server] No DATABASE_URL — skipping migrations. Login/save will not work.');
  }
  app.listen(PORT, () =>
    console.log(`[server] http://localhost:${PORT} [${NODE_ENV}]`)
  );
}

start().catch(err => {
  console.error('[server] Failed to start:', err.message);
  process.exit(1);
});

module.exports = app;
