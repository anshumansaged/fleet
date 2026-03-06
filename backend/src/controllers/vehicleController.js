const prisma = require('../config/prisma');
const auditService = require('../services/auditService');

exports.create = async (req, res, next) => {
  try {
    const { registrationNumber, model, year, fuelType, currentDriver } = req.body;
    const vehicle = await prisma.vehicle.create({
      data: {
        ownerId: req.user.id,
        registrationNumber,
        model,
        year: year ? Number(year) : undefined,
        fuelType,
        currentDriverId: currentDriver || undefined,
      },
      include: { currentDriver: { select: { id: true, name: true, phone: true } } },
    });

    await auditService.logAction({
      ownerId: req.user.id, userId: req.user.id,
      action: 'vehicle.created', entityType: 'vehicle', entityId: vehicle.id,
      newData: vehicle, ipAddress: req.ip,
    });

    res.status(201).json({ vehicle });
  } catch (error) {
    next(error);
  }
};

exports.list = async (req, res, next) => {
  try {
    const where = { ownerId: req.user.id };
    if (req.query.active !== undefined) where.isActive = req.query.active === 'true';

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: { currentDriver: { select: { id: true, name: true, phone: true } } },
      orderBy: { registrationNumber: 'asc' },
    });

    res.json({ vehicles });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: req.params.id, ownerId: req.user.id },
      include: { currentDriver: { select: { id: true, name: true, phone: true } } },
    });

    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({ vehicle });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await prisma.vehicle.findFirst({
      where: { id: req.params.id, ownerId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'Vehicle not found' });

    const allowed = ['registrationNumber', 'model', 'year', 'fuelType', 'isActive', 'currentOdometerKm'];
    const data = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    if (req.body.currentDriver !== undefined) {
      data.currentDriverId = req.body.currentDriver || null;
    }

    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id },
      data,
      include: { currentDriver: { select: { id: true, name: true, phone: true } } },
    });

    await auditService.logAction({
      ownerId: req.user.id, userId: req.user.id,
      action: 'vehicle.updated', entityType: 'vehicle', entityId: vehicle.id,
      previousData: existing, newData: vehicle, ipAddress: req.ip,
    });

    res.json({ vehicle });
  } catch (error) {
    next(error);
  }
};
