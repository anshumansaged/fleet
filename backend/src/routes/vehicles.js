const router = require('express').Router();
const vehicleController = require('../controllers/vehicleController');
const { vehicleRules } = require('../validators');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', vehicleController.list);
router.get('/:id', vehicleController.getById);
router.post('/', vehicleRules, validate, vehicleController.create);
router.put('/:id', vehicleController.update);

module.exports = router;
