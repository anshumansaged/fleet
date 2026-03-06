const router = require('express').Router();
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/overview', analyticsController.dashboardOverview);
router.get('/daily-summary', analyticsController.dailySummary);
router.get('/driver-performance', analyticsController.driverPerformance);
router.get('/vehicle-stats', analyticsController.vehicleStats);
router.get('/profit-loss', analyticsController.profitLoss);
router.get('/cash-flow', analyticsController.cashFlow);

module.exports = router;
