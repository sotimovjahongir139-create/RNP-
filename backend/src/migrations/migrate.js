const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations_log (
        id SERIAL PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        ran_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const dir = path.join(__dirname);
    const files = fs.readdirSync(dir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const { rows } = await client.query(
        'SELECT id FROM migrations_log WHERE filename = $1', [file]
      );
      if (rows.length > 0) {
        console.log(`[migrate] skip: ${file}`);
        continue;
      }
      const sql = fs.readFileSync(path.join(dir, file), 'utf8');
      console.log(`[migrate] running: ${file}`);
      await client.query(sql);
      await client.query(
        'INSERT INTO migrations_log (filename) VALUES ($1)', [file]
      );
      console.log(`[migrate] done: ${file}`);
    }
    console.log('[migrate] All migrations complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => {
  console.error('[migrate] FAILED:', err.message);
  process.exit(1);
});
