const prisma = require('../config/prisma');
const ledgerService = require('../services/ledgerService');

function buildDateFilter(startDate, endDate) {
  const filter = {};
  if (startDate) filter.gte = new Date(startDate);
  if (endDate) filter.lte = new Date(endDate);
  return Object.keys(filter).length ? filter : undefined;
}

exports.dailySummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const trips = await prisma.trip.findMany({
      where: {
        ownerId: req.user.id,
        ...(startDate || endDate ? { date: buildDateFilter(startDate, endDate) } : {}),
      },
      select: { date: true, totalKm: true, totalEarnings: true, totalCommission: true, netEarnings: true, totalExpenses: true, ownerProfit: true },
    });

    const grouped = {};
    for (const t of trips) {
      const key = t.date.toISOString().slice(0, 10);
      if (!grouped[key]) grouped[key] = { _id: key, totalTrips: 0, totalKm: 0, totalEarnings: 0, totalCommission: 0, netEarnings: 0, totalExpenses: 0, ownerProfit: 0 };
      const g = grouped[key];
      g.totalTrips++;
      g.totalKm += t.totalKm || 0;
      g.totalEarnings += t.totalEarnings || 0;
      g.totalCommission += t.totalCommission || 0;
      g.netEarnings += t.netEarnings || 0;
      g.totalExpenses += t.totalExpenses || 0;
      g.ownerProfit += t.ownerProfit || 0;
    }

    const summary = Object.values(grouped).sort((a, b) => b._id.localeCompare(a._id));
    res.json({ summary });
  } catch (error) {
    next(error);
  }
};

exports.driverPerformance = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const trips = await prisma.trip.findMany({
      where: {
        ownerId: req.user.id,
        ...(startDate || endDate ? { date: buildDateFilter(startDate, endDate) } : {}),
      },
      select: { driverId: true, totalKm: true, totalEarnings: true, totalExpenses: true, netEarnings: true },
    });

    const grouped = {};
    for (const t of trips) {
      if (!grouped[t.driverId]) grouped[t.driverId] = { totalTrips: 0, totalKm: 0, totalEarnings: 0, totalExpenses: 0, netEarnings: 0 };
      const g = grouped[t.driverId];
      g.totalTrips++;
      g.totalKm += t.totalKm || 0;
      g.totalEarnings += t.totalEarnings || 0;
      g.totalExpenses += t.totalExpenses || 0;
      g.netEarnings += t.netEarnings || 0;
    }

    const driverIds = Object.keys(grouped);
    const drivers = await prisma.driver.findMany({ where: { id: { in: driverIds } }, select: { id: true, name: true, phone: true, commissionPercentage: true, pendingSalary: true } });
    const driverMap = Object.fromEntries(drivers.map((d) => [d.id, d]));

    const performance = driverIds.map((id) => {
      const g = grouped[id];
      const d = driverMap[id] || {};
      return {
        _id: id,
        driverName: d.name,
        driverPhone: d.phone,
        commissionPct: d.commissionPercentage,
        pendingSalary: d.pendingSalary,
        ...g,
        avgEarningPerTrip: g.totalTrips ? Math.round(g.totalEarnings / g.totalTrips) : 0,
        avgKmPerDay: g.totalTrips ? Math.round(g.totalKm / g.totalTrips) : 0,
      };
    }).sort((a, b) => b.totalEarnings - a.totalEarnings);

    res.json({ performance });
  } catch (error) {
    next(error);
  }
};

exports.vehicleStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const trips = await prisma.trip.findMany({
      where: {
        ownerId: req.user.id,
        ...(startDate || endDate ? { date: buildDateFilter(startDate, endDate) } : {}),
      },
      select: { vehicleId: true, totalKm: true, totalEarnings: true, totalExpenses: true, ownerProfit: true },
    });

    const grouped = {};
    for (const t of trips) {
      if (!grouped[t.vehicleId]) grouped[t.vehicleId] = { totalTrips: 0, totalKm: 0, totalEarnings: 0, totalExpenses: 0, ownerProfit: 0 };
      const g = grouped[t.vehicleId];
      g.totalTrips++;
      g.totalKm += t.totalKm || 0;
      g.totalEarnings += t.totalEarnings || 0;
      g.totalExpenses += t.totalExpenses || 0;
      g.ownerProfit += t.ownerProfit || 0;
    }

    const vehicleIds = Object.keys(grouped);
    const vehicles = await prisma.vehicle.findMany({ where: { id: { in: vehicleIds } }, select: { id: true, registrationNumber: true, model: true } });
    const vehicleMap = Object.fromEntries(vehicles.map((v) => [v.id, v]));

    const stats = vehicleIds.map((id) => {
      const g = grouped[id];
      const v = vehicleMap[id] || {};
      return {
        _id: id,
        registration: v.registrationNumber,
        model: v.model,
        ...g,
        earningPerKm: g.totalKm > 0 ? Math.round((g.totalEarnings / g.totalKm) * 100) / 100 : 0,
      };
    }).sort((a, b) => b.ownerProfit - a.ownerProfit);

    res.json({ stats });
  } catch (error) {
    next(error);
  }
};

exports.profitLoss = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = 'daily' } = req.query;
    const trips = await prisma.trip.findMany({
      where: {
        ownerId: req.user.id,
        ...(startDate || endDate ? { date: buildDateFilter(startDate, endDate) } : {}),
      },
      select: { date: true, totalEarnings: true, totalCommission: true, totalExpenses: true, netEarnings: true, ownerProfit: true, totalKm: true },
    });

    const grouped = {};
    for (const t of trips) {
      let key;
      const d = t.date;
      if (groupBy === 'monthly') key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      else if (groupBy === 'weekly') {
        const jan1 = new Date(d.getFullYear(), 0, 1);
        const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
        key = `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
      } else key = d.toISOString().slice(0, 10);

      if (!grouped[key]) grouped[key] = { _id: key, revenue: 0, commissions: 0, expenses: 0, netEarnings: 0, profit: 0, trips: 0, totalKm: 0 };
      const g = grouped[key];
      g.revenue += t.totalEarnings || 0;
      g.commissions += t.totalCommission || 0;
      g.expenses += t.totalExpenses || 0;
      g.netEarnings += t.netEarnings || 0;
      g.profit += t.ownerProfit || 0;
      g.trips++;
      g.totalKm += t.totalKm || 0;
    }

    const profitLoss = Object.values(grouped).sort((a, b) => b._id.localeCompare(a._id));
    res.json({ profitLoss });
  } catch (error) {
    next(error);
  }
};

exports.cashFlow = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const ledgerSummary = await ledgerService.getLedgerSummary(
      req.user.id,
      startDate || '2000-01-01',
      endDate || '2099-12-31'
    );
    res.json({ cashFlow: ledgerSummary });
  } catch (error) {
    next(error);
  }
};

exports.dashboardOverview = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayTrips, monthTrips, driverCount, vehicleCount] = await Promise.all([
      prisma.trip.findMany({
        where: { ownerId, date: { gte: today, lt: tomorrow } },
        select: { totalEarnings: true, totalExpenses: true, ownerProfit: true, totalKm: true },
      }),
      prisma.trip.findMany({
        where: { ownerId, date: { gte: monthStart, lt: tomorrow } },
        select: { totalEarnings: true, totalExpenses: true, ownerProfit: true, totalKm: true },
      }),
      prisma.driver.count({ where: { ownerId, isActive: true } }),
      prisma.vehicle.count({ where: { ownerId, isActive: true } }),
    ]);

    const aggregate = (arr) => arr.reduce((acc, t) => ({
      trips: acc.trips + 1,
      earnings: acc.earnings + (t.totalEarnings || 0),
      expenses: acc.expenses + (t.totalExpenses || 0),
      profit: acc.profit + (t.ownerProfit || 0),
      km: acc.km + (t.totalKm || 0),
    }), { trips: 0, earnings: 0, expenses: 0, profit: 0, km: 0 });

    res.json({
      today: aggregate(todayTrips),
      month: aggregate(monthTrips),
      activeDrivers: driverCount,
      activeVehicles: vehicleCount,
    });
  } catch (error) {
    next(error);
  }
};
