const router = require('express').Router();
const driverController = require('../controllers/driverController');
const { driverRules } = require('../validators');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', driverController.list);
router.get('/:id', driverController.getById);
router.post('/', driverRules, validate, driverController.create);
router.put('/:id', driverController.update);

module.exports = router;
