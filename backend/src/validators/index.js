const { body } = require('express-validator');

exports.registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Valid 10-digit Indian phone number required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('businessName').optional().trim().isLength({ max: 200 }),
];

exports.loginRules = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

exports.driverRules = [
  body('name').trim().notEmpty().withMessage('Driver name is required').isLength({ max: 100 }),
  body('phone')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Valid 10-digit Indian phone number required'),
  body('commissionPercentage')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Commission must be between 0 and 100'),
  body('licenseNumber').optional().trim().isLength({ max: 20 }),
];

exports.vehicleRules = [
  body('registrationNumber')
    .trim()
    .notEmpty()
    .withMessage('Registration number is required')
    .isLength({ max: 15 }),
  body('model').optional().trim().isLength({ max: 50 }),
  body('year').optional().isInt({ min: 2000, max: 2030 }),
  body('fuelType').optional().isIn(['petrol', 'diesel', 'cng', 'electric', 'hybrid']),
];

exports.tripRules = [
  body('driver').isString().notEmpty().withMessage('Valid driver ID is required'),
  body('vehicle').isString().notEmpty().withMessage('Valid vehicle ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('startKm').isFloat({ min: 0 }).withMessage('Start KM must be a positive number'),
  body('endKm').isFloat({ min: 0 }).withMessage('End KM must be a positive number'),
];

exports.earningRules = [
  body('platform')
    .isIn(['uber', 'indrive', 'yatri_sathi', 'rapido', 'offline'])
    .withMessage('Invalid platform'),
  body('trips').isInt({ min: 0, max: 100 }).withMessage('Trips must be 0-100'),
  body('earning').isFloat({ min: 0, max: 50000 }).withMessage('Earning must be 0-50000'),
  body('cashCollected')
    .isFloat({ min: 0, max: 50000 })
    .withMessage('Cash collected must be 0-50000'),
];

exports.expenseRules = [
  body('type')
    .isIn(['fuel', 'toll', 'repair', 'parking', 'challan', 'other'])
    .withMessage('Invalid expense type'),
  body('amount').isFloat({ min: 0, max: 100000 }).withMessage('Amount must be 0-100000'),
  body('description').optional().trim().isLength({ max: 200 }),
];

exports.settlementRules = [
  body('onlinePayments')
    .isFloat({ min: 0 })
    .withMessage('Online payments must be non-negative'),
  body('driverSalaryTaken').isBoolean().withMessage('driverSalaryTaken must be boolean'),
  body('driverSalaryTakenAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Salary amount must be non-negative'),
  body('cashGivenToCashier')
    .isFloat({ min: 0 })
    .withMessage('Cash to cashier must be non-negative'),
];
