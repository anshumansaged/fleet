const prisma = require('../config/prisma');
const tripCalc = require('../services/calculations/tripCalculations');
const auditService = require('../services/auditService');
const { fleetEvents, EVENTS } = require('../events/eventEmitter');

const tripInclude = {
  driver: { select: { id: true, name: true, phone: true, commissionPercentage: true, pendingSalary: true } },
  vehicle: { select: { id: true, registrationNumber: true, model: true } },
  platformEarnings: true,
  expenses: true,
  settlement: true,
};

exports.create = async (req, res, next) => {
  try {
    const { driver, vehicle, date, startKm, endKm, notes } = req.body;

    const driverDoc = await prisma.driver.findFirst({
      where: { id: driver, ownerId: req.user.id },
    });
    if (!driverDoc) return res.status(404).json({ error: 'Driver not found' });

    const trip = await prisma.trip.create({
      data: {
        ownerId: req.user.id,
        driverId: driver,
        vehicleId: vehicle,
        date: new Date(date),
        startKm: Number(startKm),
        endKm: Number(endKm),
        totalKm: Number(endKm) - Number(startKm),
        notes,
      },
      include: tripInclude,
    });

    await auditService.logAction({
      ownerId: req.user.id, userId: req.user.id,
      action: 'trip.created', entityType: 'trip', entityId: trip.id,
      newData: trip, ipAddress: req.ip,
    });

    fleetEvents.emit(EVENTS.TRIP_CREATED, { tripId: trip.id, userId: req.user.id });

    res.status(201).json({ trip });
  } catch (error) {
    next(error);
  }
};

exports.list = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, driver, vehicle, status, startDate, endDate } = req.query;
    const where = { ownerId: req.user.id };

    if (driver) where.driverId = driver;
    if (vehicle) where.vehicleId = vehicle;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const [total, trips] = await Promise.all([
      prisma.trip.count({ where }),
      prisma.trip.findMany({
        where,
        include: tripInclude,
        orderBy: { date: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
    ]);

    res.json({
      trips,
      pagination: { total, page: pageNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.id, ownerId: req.user.id },
      include: tripInclude,
    });

    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    res.json({ trip });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await prisma.trip.findFirst({
      where: { id: req.params.id, ownerId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'Trip not found' });
    if (existing.status === 'finalized') {
      return res.status(403).json({ error: 'Cannot edit a finalized trip' });
    }

    const data = {};
    if (req.body.date !== undefined) data.date = new Date(req.body.date);
    if (req.body.startKm !== undefined) data.startKm = Number(req.body.startKm);
    if (req.body.endKm !== undefined) data.endKm = Number(req.body.endKm);
    if (req.body.notes !== undefined) data.notes = req.body.notes;

    const newStartKm = data.startKm ?? existing.startKm;
    const newEndKm = data.endKm ?? existing.endKm;
    data.totalKm = newEndKm - newStartKm;

    await prisma.trip.update({ where: { id: req.params.id }, data });

    const updated = await tripCalc.recalculateTrip(req.params.id);

    await auditService.logAction({
      ownerId: req.user.id, userId: req.user.id,
      action: 'trip.updated', entityType: 'trip', entityId: req.params.id,
      previousData: existing, newData: updated, ipAddress: req.ip,
    });

    fleetEvents.emit(EVENTS.TRIP_UPDATED, { tripId: req.params.id, userId: req.user.id });
    res.json({ trip: updated });
  } catch (error) {
    next(error);
  }
};

exports.addEarning = async (req, res, next) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.tripId, ownerId: req.user.id },
    });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.status === 'finalized') {
      return res.status(403).json({ error: 'Cannot edit a finalized trip' });
    }

    const { platform, trips: tripCount, earning, cashCollected } = req.body;

    await prisma.platformEarning.upsert({
      where: { tripId_platform: { tripId: trip.id, platform } },
      update: { trips: Number(tripCount), earning: Number(earning), cashCollected: Number(cashCollected) },
      create: { tripId: trip.id, platform, trips: Number(tripCount), earning: Number(earning), cashCollected: Number(cashCollected) },
    });

    const updated = await tripCalc.recalculateTrip(trip.id);

    await auditService.logAction({
      ownerId: req.user.id, userId: req.user.id,
      action: 'earnings.added', entityType: 'earning', entityId: trip.id,
      newData: { platform, trips: tripCount, earning, cashCollected }, ipAddress: req.ip,
    });

    fleetEvents.emit(EVENTS.EARNINGS_UPDATED, { tripId: trip.id, userId: req.user.id });
    res.json({ trip: updated });
  } catch (error) {
    next(error);
  }
};

exports.addExpense = async (req, res, next) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.tripId, ownerId: req.user.id },
    });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.status === 'finalized') {
      return res.status(403).json({ error: 'Cannot edit a finalized trip' });
    }

    const { type, amount, description } = req.body;
    await prisma.expense.create({
      data: { tripId: trip.id, type, amount: Number(amount), description },
    });

    const updated = await tripCalc.recalculateTrip(trip.id);

    await auditService.logAction({
      ownerId: req.user.id, userId: req.user.id,
      action: 'expense.added', entityType: 'expense', entityId: trip.id,
      newData: req.body, ipAddress: req.ip,
    });

    fleetEvents.emit(EVENTS.EXPENSES_UPDATED, { tripId: trip.id, userId: req.user.id });
    res.json({ trip: updated });
  } catch (error) {
    next(error);
  }
};

exports.removeExpense = async (req, res, next) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.tripId, ownerId: req.user.id },
    });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.status === 'finalized') {
      return res.status(403).json({ error: 'Cannot edit a finalized trip' });
    }

    const expense = await prisma.expense.findFirst({
      where: { id: req.params.expenseId, tripId: trip.id },
    });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    await prisma.expense.delete({ where: { id: req.params.expenseId } });

    const updated = await tripCalc.recalculateTrip(trip.id);

    await auditService.logAction({
      ownerId: req.user.id, userId: req.user.id,
      action: 'expense.deleted', entityType: 'expense', entityId: trip.id,
      previousData: expense, ipAddress: req.ip,
    });

    fleetEvents.emit(EVENTS.EXPENSES_UPDATED, { tripId: trip.id, userId: req.user.id });
    res.json({ trip: updated });
  } catch (error) {
    next(error);
  }
};

exports.settle = async (req, res, next) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.tripId, ownerId: req.user.id },
      include: { platformEarnings: true, expenses: true, settlement: true },
    });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.status === 'finalized') {
      return res.status(403).json({ error: 'Cannot edit a finalized trip' });
    }

    const driver = await prisma.driver.findUnique({ where: { id: trip.driverId } });
    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    // Recalculate first
    await tripCalc.recalculateTrip(trip.id);
    const freshTrip = await prisma.trip.findUnique({
      where: { id: trip.id },
      include: { platformEarnings: true, expenses: true },
    });

    const { onlinePayments, driverSalaryTaken, driverSalaryTakenAmount, cashGivenToCashier } = req.body;

    const totalCashCollected = freshTrip.platformEarnings.reduce((s, pe) => s + pe.cashCollected, 0);
    const totalExpenses = freshTrip.expenses.reduce((s, e) => s + e.amount, 0);
    const cashInDriverHand = totalCashCollected - totalExpenses - Number(onlinePayments);
    const driverSalaryAmount = Math.round((freshTrip.netEarnings * driver.commissionPercentage) / 100);
    const actualSalaryTaken = driverSalaryTaken
      ? Math.min(Number(driverSalaryTakenAmount) || driverSalaryAmount, cashInDriverHand)
      : 0;
    const remainingBalance = cashInDriverHand - Number(cashGivenToCashier) - actualSalaryTaken;

    const settlementData = {
      totalCashCollected,
      totalExpenses,
      onlinePayments: Number(onlinePayments),
      cashInDriverHand,
      driverSalaryAmount,
      driverSalaryTaken: !!driverSalaryTaken,
      driverSalaryTakenAmount: actualSalaryTaken,
      cashGivenToCashier: Number(cashGivenToCashier),
      remainingBalance,
      settledAt: new Date(),
      settledBy: req.user.id,
    };

    await prisma.settlement.upsert({
      where: { tripId: trip.id },
      update: settlementData,
      create: { tripId: trip.id, ...settlementData },
    });

    await prisma.trip.update({
      where: { id: trip.id },
      data: { status: 'submitted' },
    });

    // Update driver pending salary
    if (!driverSalaryTaken || actualSalaryTaken < driverSalaryAmount) {
      const pending = driverSalaryAmount - actualSalaryTaken;
      await prisma.driver.update({
        where: { id: driver.id },
        data: { pendingSalary: { increment: pending } },
      });
    }

    const updated = await prisma.trip.findUnique({
      where: { id: trip.id },
      include: tripInclude,
    });

    await auditService.logAction({
      ownerId: req.user.id, userId: req.user.id,
      action: 'settlement.created', entityType: 'settlement', entityId: trip.id,
      newData: settlementData, ipAddress: req.ip,
    });

    fleetEvents.emit(EVENTS.SETTLEMENT_CREATED, { tripId: trip.id, userId: req.user.id });
    res.json({ trip: updated });
  } catch (error) {
    next(error);
  }
};

exports.finalize = async (req, res, next) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.id, ownerId: req.user.id },
      include: { settlement: true },
    });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.status === 'finalized') {
      return res.status(400).json({ error: 'Trip already finalized' });
    }
    if (!trip.settlement || !trip.settlement.settledAt) {
      return res.status(400).json({ error: 'Trip must be settled before finalizing' });
    }

    const updated = await prisma.trip.update({
      where: { id: trip.id },
      data: { status: 'finalized', finalizedAt: new Date(), finalizedBy: req.user.id },
      include: tripInclude,
    });

    await auditService.logAction({
      ownerId: req.user.id, userId: req.user.id,
      action: 'trip.finalized', entityType: 'trip', entityId: trip.id,
      newData: { finalizedAt: updated.finalizedAt }, ipAddress: req.ip,
    });

    fleetEvents.emit(EVENTS.TRIP_FINALIZED, { tripId: trip.id, userId: req.user.id });
    res.json({ trip: updated });
  } catch (error) {
    next(error);
  }
};
