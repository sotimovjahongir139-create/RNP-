const router = require('express').Router();
const c = require('../controllers/auth.controller');
const protect = require('../middleware/auth');
router.post('/login',  c.login);
router.post('/logout', c.logout);
router.get('/me',      protect, c.me);
module.exports = router;
