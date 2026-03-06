const router = require('express').Router();

router.use('/auth', require('./auth'));
router.use('/drivers', require('./drivers'));
router.use('/vehicles', require('./vehicles'));
router.use('/trips', require('./trips'));
router.use('/analytics', require('./analytics'));
router.use('/reconciliation', require('./reconciliation'));

module.exports = router;
