const router = require('express').Router();
const authController = require('../controllers/authController');
const { registerRules, loginRules } = require('../validators');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');

router.post('/register', registerRules, validate, authController.register);
router.post('/login', loginRules, validate, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.get('/profile', auth, authController.getProfile);

module.exports = router;
