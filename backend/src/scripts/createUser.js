// Usage: node src/scripts/createUser.js <username> <password>
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const [,, username, password] = process.argv;
  if (!username || !password) {
    console.error('Usage: node src/scripts/createUser.js <username> <password>');
    process.exit(1);
  }
  if (password.length < 6) {
    console.error('Password must be at least 6 characters');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (username, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (username) DO UPDATE SET password_hash = $2
     RETURNING id, username, role`,
    [username, hash]
  );
  console.log('User created:', rows[0]);
  await pool.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
