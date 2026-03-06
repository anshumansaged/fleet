const jwt = require('jsonwebtoken');
const config = require('../config');
const prisma = require('../config/prisma');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);

    const owner = await prisma.owner.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        businessName: true,
        role: true,
        isActive: true,
      },
    });

    if (!owner || !owner.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive account' });
    }

    req.user = owner;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = auth;
