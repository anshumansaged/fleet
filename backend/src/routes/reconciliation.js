const router = require('express').Router();
const reconciliationController = require('../controllers/reconciliationController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/daily', reconciliationController.runDaily);
router.get('/list', reconciliationController.list);
router.get('/audit-logs', reconciliationController.getAuditLogs);
router.get('/:date', reconciliationController.getByDate);

module.exports = router;
