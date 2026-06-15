const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/config');

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'username va password kerak' });

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
    const { rows } = await db.query(
      'SELECT id, username, role FROM users WHERE id = $1', [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};
