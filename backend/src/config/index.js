const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || '1d',
  jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
  nodeEnv: process.env.NODE_ENV || 'development',

  // Business constants
  UBER_COMMISSION_FIXED: 117,
  YATRI_COMMISSION_PER_TRIP: 10,
  MAX_DAILY_KM: 500,
  MIN_DAILY_KM: 0,
  MAX_EARNING_PER_PLATFORM: 50000,
};
