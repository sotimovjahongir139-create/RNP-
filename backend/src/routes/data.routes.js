const router = require('express').Router();
const c = require('../controllers/data.controller');
const protect = require('../middleware/auth');
router.get   ('/params',     c.getParams);
router.get   ('/facts',      protect, c.getFacts);
router.post  ('/facts',      protect, c.saveFact);
router.delete('/facts/:id',  protect, c.deleteFact);
router.get   ('/summary',    protect, c.getSummary);
module.exports = router;
