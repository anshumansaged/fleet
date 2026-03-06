const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const prisma = require('../config/prisma');

function generateTokens(userId) {
  const accessToken = jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpire,
  });
  const refreshToken = jwt.sign({ id: userId }, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpire,
  });
  return { accessToken, refreshToken };
}

function omitPassword(owner) {
  const { password, ...rest } = owner;
  return rest;
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password, businessName } = req.body;

    const existing = await prisma.owner.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
    if (existing) {
      return res.status(409).json({ error: 'Email or phone already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const owner = await prisma.owner.create({
      data: { name, email, phone, password: hashedPassword, businessName },
    });

    const tokens = generateTokens(owner.id);
    res.status(201).json({ owner: omitPassword(owner), ...tokens });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const owner = await prisma.owner.findUnique({ where: { email } });
    if (!owner || !(await bcrypt.compare(password, owner.password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!owner.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    const tokens = generateTokens(owner.id);
    res.json({ owner: omitPassword(owner), ...tokens });
  } catch (error) {
    next(error);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret);
    const owner = await prisma.owner.findUnique({ where: { id: decoded.id } });
    if (!owner || !owner.isActive) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const tokens = generateTokens(owner.id);
    res.json(tokens);
  } catch (error) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
};

exports.getProfile = async (req, res) => {
  res.json({ owner: req.user });
};
