const { Pool } = require('pg');
const { DATABASE_URL, NODE_ENV } = require('./config');

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('[db] idle client error:', err.message);
});

module.exports = pool;
