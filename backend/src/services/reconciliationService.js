const prisma = require('../config/prisma');

async function runDailyReconciliation(ownerId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const trips = await prisma.trip.findMany({
    where: { ownerId, date: { gte: startOfDay, lte: endOfDay } },
    include: { settlement: true },
  });

  if (trips.length === 0) {
    return { message: 'No trips found for this date' };
  }

  let totalEarnings = 0;
  let totalCommissions = 0;
  let totalExpenses = 0;
  let totalDriverSalaries = 0;
  let totalCashCollected = 0;
  let totalCashToCashier = 0;
  let totalOnlinePayments = 0;

  const tripIds = [];

  for (const trip of trips) {
    tripIds.push(trip.id);
    totalEarnings += trip.totalEarnings || 0;
    totalCommissions += trip.totalCommission || 0;
    totalExpenses += trip.totalExpenses || 0;

    if (trip.settlement) {
      totalDriverSalaries += trip.settlement.driverSalaryTakenAmount || 0;
      totalCashCollected += trip.settlement.totalCashCollected || 0;
      totalCashToCashier += trip.settlement.cashGivenToCashier || 0;
      totalOnlinePayments += trip.settlement.onlinePayments || 0;
    }
  }

  const netProfit = totalEarnings - totalCommissions - totalExpenses - totalDriverSalaries;
  const expectedCash = totalCashCollected - totalExpenses - totalOnlinePayments - totalDriverSalaries;
  const actualCash = totalCashToCashier;
  const discrepancy = expectedCash - actualCash;

  const recon = await prisma.reconciliation.upsert({
    where: { ownerId_date: { ownerId, date: startOfDay } },
    update: {
      totalTrips: trips.length,
      totalEarnings,
      totalCommissions,
      totalExpenses,
      totalDriverSalaries,
      totalCashCollected,
      totalCashToCashier,
      totalOnlinePayments,
      netProfit,
      expectedCash,
      actualCash,
      discrepancy,
      hasDiscrepancy: Math.abs(discrepancy) > 1,
      tripIds,
      status: Math.abs(discrepancy) > 1 ? 'flagged' : 'verified',
    },
    create: {
      ownerId,
      date: startOfDay,
      totalTrips: trips.length,
      totalEarnings,
      totalCommissions,
      totalExpenses,
      totalDriverSalaries,
      totalCashCollected,
      totalCashToCashier,
      totalOnlinePayments,
      netProfit,
      expectedCash,
      actualCash,
      discrepancy,
      hasDiscrepancy: Math.abs(discrepancy) > 1,
      tripIds,
      status: Math.abs(discrepancy) > 1 ? 'flagged' : 'verified',
    },
  });

  return recon;
}

module.exports = { runDailyReconciliation };
