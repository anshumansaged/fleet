const prisma = require('../config/prisma');
const auditService = require('../services/auditService');

exports.create = async (req, res, next) => {
  try {
    const { name, phone, commissionPercentage, licenseNumber } = req.body;
    const driver = await prisma.driver.create({
      data: { ownerId: req.user.id, name, phone, commissionPercentage, licenseNumber },
    });

    await auditService.logAction({
      ownerId: req.user.id, userId: req.user.id,
      action: 'driver.created', entityType: 'driver', entityId: driver.id,
      newData: driver, ipAddress: req.ip,
    });

    res.status(201).json({ driver });
  } catch (error) {
    next(error);
  }
};

exports.list = async (req, res, next) => {
  try {
    const { active } = req.query;
    const where = { ownerId: req.user.id };
    if (active !== undefined) where.isActive = active === 'true';

    const drivers = await prisma.driver.findMany({
      where,
      include: { assignedVehicle: { select: { id: true, registrationNumber: true, model: true } } },
      orderBy: { name: 'asc' },
    });

    res.json({ drivers });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const driver = await prisma.driver.findFirst({
      where: { id: req.params.id, ownerId: req.user.id },
      include: { assignedVehicle: { select: { id: true, registrationNumber: true, model: true } } },
    });

    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    res.json({ driver });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await prisma.driver.findFirst({
      where: { id: req.params.id, ownerId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'Driver not found' });

    const allowed = ['name', 'phone', 'commissionPercentage', 'licenseNumber', 'isActive'];
    const data = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    // Bank details
    if (req.body.bankDetails) {
      if (req.body.bankDetails.accountNumber !== undefined) data.bankAccountNumber = req.body.bankDetails.accountNumber;
      if (req.body.bankDetails.ifsc !== undefined) data.bankIfsc = req.body.bankDetails.ifsc;
      if (req.body.bankDetails.bankName !== undefined) data.bankName = req.body.bankDetails.bankName;
    }

    const driver = await prisma.driver.update({
      where: { id: req.params.id },
      data,
      include: { assignedVehicle: { select: { id: true, registrationNumber: true, model: true } } },
    });

    await auditService.logAction({
      ownerId: req.user.id, userId: req.user.id,
      action: 'driver.updated', entityType: 'driver', entityId: driver.id,
      previousData: existing, newData: driver, ipAddress: req.ip,
    });

    res.json({ driver });
  } catch (error) {
    next(error);
  }
};
