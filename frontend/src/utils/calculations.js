/**
 * Client-side trip calculation engine — mirrors backend for real-time UI updates.
 */

const UBER_COMMISSION_FIXED = 117;
const YATRI_COMMISSION_PER_TRIP = 10;

export function calculateTripTotals(platformEarnings, expenses, driverCommissionPct, startKm, endKm) {
  const totalKm = endKm - startKm;

  let totalEarnings = 0;
  let totalCommission = 0;
  let totalCashCollected = 0;

  const updatedEarnings = platformEarnings.map((pe) => {
    totalEarnings += pe.earning || 0;
    totalCashCollected += pe.cashCollected || 0;

    let commission = 0;
    if (pe.platform === 'uber' && pe.trips > 0) commission = UBER_COMMISSION_FIXED;
    if (pe.platform === 'yatri_sathi') commission = (pe.trips || 0) * YATRI_COMMISSION_PER_TRIP;

    totalCommission += commission;
    return { ...pe, commission };
  });

  const netEarnings = totalEarnings - totalCommission;
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const driverSalary = Math.round((netEarnings * driverCommissionPct) / 100);
  const ownerProfit = netEarnings - driverSalary - totalExpenses;

  return {
    totalKm,
    totalEarnings,
    totalCommission,
    netEarnings,
    totalExpenses,
    totalCashCollected,
    driverSalary,
    ownerProfit,
    platformEarnings: updatedEarnings,
  };
}

export function calculateSettlement(totalCashCollected, totalExpenses, onlinePayments, driverSalaryAmount, driverSalaryTaken, driverSalaryTakenAmount, cashGivenToCashier) {
  const cashInDriverHand = totalCashCollected - totalExpenses - onlinePayments;
  const actualSalaryTaken = driverSalaryTaken ? Math.min(driverSalaryTakenAmount, cashInDriverHand) : 0;
  const remainingBalance = cashInDriverHand - cashGivenToCashier - actualSalaryTaken;

  return {
    totalCashCollected,
    totalExpenses,
    onlinePayments,
    cashInDriverHand,
    driverSalaryAmount,
    driverSalaryTaken,
    driverSalaryTakenAmount: actualSalaryTaken,
    cashGivenToCashier,
    remainingBalance,
  };
}
