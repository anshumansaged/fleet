const router = require('express').Router();
const tripController = require('../controllers/tripController');
const { tripRules, earningRules, expenseRules, settlementRules } = require('../validators');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');

router.use(auth);

// Trip CRUD
router.get('/', tripController.list);
router.get('/:id', tripController.getById);
router.post('/', tripRules, validate, tripController.create);
router.put('/:id', tripController.update);
router.post('/:id/finalize', tripController.finalize);

// Platform earnings
router.post('/:tripId/earnings', earningRules, validate, tripController.addEarning);

// Expenses
router.post('/:tripId/expenses', expenseRules, validate, tripController.addExpense);
router.delete('/:tripId/expenses/:expenseId', tripController.removeExpense);

// Settlement
router.post('/:tripId/settlement', settlementRules, validate, tripController.settle);

module.exports = router;
