const prisma = require('../../config/prisma');
const config = require('../../config');

function calculateCommission(platformEarnings) {
  let totalCommission = 0;
  const updated = [];

  for (const pe of platformEarnings) {
    let commission = 0;
    switch (pe.platform) {
      case 'uber':
        commission = pe.trips > 0 ? config.UBER_COMMISSION_FIXED : 0;
        break;
      case 'yatri_sathi':
        commission = pe.trips * config.YATRI_COMMISSION_PER_TRIP;
        break;
      default:
        commission = 0;
    }
    totalCommission += commission;
    updated.push({ ...pe, commission });
  }

  return { platformEarnings: updated, totalCommission };
}

function calculateTripTotals(trip, platformEarnings, expenses, driverCommissionPct) {
  const totalKm = trip.endKm - trip.startKm;
  const totalEarnings = platformEarnings.reduce((sum, pe) => sum + pe.earning, 0);
  const { platformEarnings: updatedEarnings, totalCommission } = calculateCommission(platformEarnings);
  const netEarnings = totalEarnings - totalCommission;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalCashCollected = platformEarnings.reduce((sum, pe) => sum + pe.cashCollected, 0);
  const driverSalaryAmount = Math.round((netEarnings * driverCommissionPct) / 100);
  const ownerProfit = netEarnings - driverSalaryAmount - totalExpenses;

  return {
    totalKm, totalEarnings, totalCommission, netEarnings,
    totalExpenses, totalCashCollected, driverSalaryAmount, ownerProfit,
    platformEarnings: updatedEarnings,
  };
}

async function recalculateTrip(tripId) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { platformEarnings: true, expenses: true, driver: true, settlement: true },
  });
  if (!trip) throw new Error('Trip not found');

  const driver = trip.driver;
  if (!driver) throw new Error('Driver not found');

  const totals = calculateTripTotals(trip, trip.platformEarnings, trip.expenses, driver.commissionPercentage);

  // Update commission on each platform earning
  for (const pe of totals.platformEarnings) {
    await prisma.platformEarning.update({
      where: { id: pe.id },
      data: { commission: pe.commission },
    });
  }

  // Update trip calculated fields
  const updated = await prisma.trip.update({
    where: { id: tripId },
    data: {
      totalKm: totals.totalKm,
      totalEarnings: totals.totalEarnings,
      totalCommission: totals.totalCommission,
      netEarnings: totals.netEarnings,
      totalExpenses: totals.totalExpenses,
      ownerProfit: totals.ownerProfit,
    },
    include: {
      driver: { select: { id: true, name: true, phone: true, commissionPercentage: true, pendingSalary: true } },
      vehicle: { select: { id: true, registrationNumber: true, model: true } },
      platformEarnings: true,
      expenses: true,
      settlement: true,
    },
  });

  // Update settlement if exists
  if (trip.settlement) {
    const cashInDriverHand = totals.totalCashCollected - totals.totalExpenses - (trip.settlement.onlinePayments || 0);
    const remainingBalance = cashInDriverHand - trip.settlement.cashGivenToCashier - trip.settlement.driverSalaryTakenAmount;

    await prisma.settlement.update({
      where: { tripId },
      data: {
        driverSalaryAmount: totals.driverSalaryAmount,
        totalCashCollected: totals.totalCashCollected,
        totalExpenses: totals.totalExpenses,
        cashInDriverHand,
        remainingBalance,
      },
    });
  }

  return updated;
}

module.exports = { calculateCommission, calculateTripTotals, recalculateTrip };
