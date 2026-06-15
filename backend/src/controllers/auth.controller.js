const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/config');

const DEMO_HASH = '$2a$10$2rhubuJZwZ64qaFmrReIhO0VELoBSTDvHCudwBeGbMLI2So9/onvW';

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'username va password kerak' });

    // Demo mode: no DB configured
    if (!process.env.DATABASE_URL) {
      if (username !== 'admin') return res.status(401).json({ error: 'Foydalanuvchi topilmadi' });
      const ok = await bcrypt.compare(password, DEMO_HASH);
      if (!ok) return res.status(401).json({ error: 'Parol noto\'g\'ri' });
      const user = { id: 1, username: 'admin', role: 'admin' };
      const token = jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
      return res.json({ token, user });
    }

    const { rows } = await db.query(
      'SELECT * FROM users WHERE username = $1', [username]
    );
    if (!rows.length)
      return res.status(401).json({ error: 'Foydalanuvchi topilmadi' });

    const ok = await bcrypt.compare(password, rows[0].password_hash);
    if (!ok)
      return res.status(401).json({ error: 'Parol noto\'g\'ri' });

    const user = { id: rows[0].id, username: rows[0].username, role: rows[0].role };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ token, user });
  } catch (err) { next(err); }
};

exports.logout = (req, res) => res.json({ message: 'ok' });

exports.me = async (req, res, next) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.json({ id: req.user.id, username: req.user.username, role: req.user.role });
    }
    const { rows } = await db.query(
      'SELECT id, username, role FROM users WHERE id = $1', [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};
