const router = require('express').Router();
router.use('/auth', require('./auth.routes'));
router.use('/data', require('./data.routes'));
router.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));
module.exports = router;
