const prisma = require('../config/prisma');

async function generateLedgerEntries(tripId) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { platformEarnings: true, expenses: true, settlement: true },
  });
  if (!trip || !trip.settlement) return;

  // Delete old entries for idempotent regeneration
  await prisma.ledgerEntry.deleteMany({ where: { tripId } });

  const base = {
    ownerId: trip.ownerId,
    tripId: trip.id,
    driverId: trip.driverId,
    date: trip.date,
  };

  const entries = [];

  // 1. Revenue entries (per platform)
  for (const pe of trip.platformEarnings) {
    if (pe.earning > 0) {
      entries.push({ ...base, account: 'cash', type: 'debit', amount: pe.earning, description: `${pe.platform} earnings`, referenceType: 'earning' });
      entries.push({ ...base, account: 'revenue', type: 'credit', amount: pe.earning, description: `${pe.platform} revenue`, referenceType: 'earning' });
    }
    if (pe.commission > 0) {
      entries.push({ ...base, account: 'commission_expense', type: 'debit', amount: pe.commission, description: `${pe.platform} commission`, referenceType: 'commission' });
      entries.push({ ...base, account: 'cash', type: 'credit', amount: pe.commission, description: `${pe.platform} commission paid`, referenceType: 'commission' });
    }
  }

  // 2. Expense entries
  for (const exp of trip.expenses) {
    const account = exp.type === 'fuel' ? 'fuel_expense' : 'other_expense';
    entries.push({ ...base, account, type: 'debit', amount: exp.amount, description: `${exp.type}: ${exp.description || ''}`.trim(), referenceType: 'expense' });
    entries.push({ ...base, account: 'cash', type: 'credit', amount: exp.amount, description: `Cash paid for ${exp.type}`, referenceType: 'expense' });
  }

  // 3. Online payments
  if (trip.settlement.onlinePayments > 0) {
    entries.push({ ...base, account: 'online_payment', type: 'debit', amount: trip.settlement.onlinePayments, description: 'Online payment received', referenceType: 'online_payment' });
    entries.push({ ...base, account: 'cash', type: 'credit', amount: trip.settlement.onlinePayments, description: 'Online payment offset from cash', referenceType: 'online_payment' });
  }

  // 4. Driver salary
  if (trip.settlement.driverSalaryTakenAmount > 0) {
    entries.push({ ...base, account: 'driver_salary', type: 'debit', amount: trip.settlement.driverSalaryTakenAmount, description: 'Driver salary paid', referenceType: 'salary' });
    entries.push({ ...base, account: 'cash', type: 'credit', amount: trip.settlement.driverSalaryTakenAmount, description: 'Cash paid as driver salary', referenceType: 'salary' });
  }

  const pendingSalary = trip.settlement.driverSalaryAmount - (trip.settlement.driverSalaryTakenAmount || 0);
  if (pendingSalary > 0) {
    entries.push({ ...base, account: 'driver_salary', type: 'debit', amount: pendingSalary, description: 'Driver salary accrued (pending)', referenceType: 'salary' });
    entries.push({ ...base, account: 'driver_salary_payable', type: 'credit', amount: pendingSalary, description: 'Driver salary payable', referenceType: 'salary' });
  }

  // 5. Cash to cashier
  if (trip.settlement.cashGivenToCashier > 0) {
    entries.push({ ...base, account: 'cashier_cash', type: 'debit', amount: trip.settlement.cashGivenToCashier, description: 'Cash handed to cashier', referenceType: 'settlement' });
    entries.push({ ...base, account: 'cash', type: 'credit', amount: trip.settlement.cashGivenToCashier, description: 'Cash given to cashier', referenceType: 'settlement' });
  }

  if (entries.length > 0) {
    await prisma.ledgerEntry.createMany({ data: entries });
  }

  return entries;
}

async function getLedgerSummary(ownerId, startDate, endDate) {
  const entries = await prisma.ledgerEntry.groupBy({
    by: ['account', 'type'],
    where: {
      ownerId,
      date: { gte: new Date(startDate), lte: new Date(endDate) },
    },
    _sum: { amount: true },
    _count: true,
  });

  return entries.map((e) => ({
    _id: { account: e.account, type: e.type },
    total: e._sum.amount || 0,
    count: e._count,
  }));
}

module.exports = { generateLedgerEntries, getLedgerSummary };
