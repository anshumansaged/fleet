import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTrip, addEarning, addExpense, removeExpense, settleTrip, finalizeTrip } from '../../store/slices/tripsSlice';
import { formatCurrency, formatDate, PLATFORMS, EXPENSE_TYPES } from '../../utils/helpers';
import { calculateTripTotals, calculateSettlement } from '../../utils/calculations';
import { FiPlus, FiTrash2, FiLock, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function TripDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current: trip, loading } = useSelector((s) => s.trips);

  const [earningForm, setEarningForm] = useState({ platform: 'uber', trips: 0, earning: 0, cashCollected: 0 });
  const [expenseForm, setExpenseForm] = useState({ type: 'fuel', amount: 0, description: '' });
  const [settlementForm, setSettlementForm] = useState({ onlinePayments: 0, driverSalaryTaken: false, driverSalaryTakenAmount: 0, cashGivenToCashier: 0 });
  const [liveCalc, setLiveCalc] = useState(null);

  useEffect(() => { dispatch(fetchTrip(id)); }, [dispatch, id]);

  // Real-time client-side calculations
  useEffect(() => {
    if (trip && trip.driver) {
      const calc = calculateTripTotals(
        trip.platformEarnings || [],
        trip.expenses || [],
        trip.driver.commissionPercentage || 30,
        trip.startKm,
        trip.endKm
      );
      setLiveCalc(calc);
    }
  }, [trip]);

  const handleAddEarning = async (e) => {
    e.preventDefault();
    try {
      await dispatch(addEarning({ tripId: id, earningData: { ...earningForm, trips: Number(earningForm.trips), earning: Number(earningForm.earning), cashCollected: Number(earningForm.cashCollected) } })).unwrap();
      toast.success('Earning added');
      setEarningForm({ platform: 'uber', trips: 0, earning: 0, cashCollected: 0 });
    } catch (err) {
      toast.error(err || 'Failed');
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await dispatch(addExpense({ tripId: id, expenseData: { ...expenseForm, amount: Number(expenseForm.amount) } })).unwrap();
      toast.success('Expense added');
      setExpenseForm({ type: 'fuel', amount: 0, description: '' });
    } catch (err) {
      toast.error(err || 'Failed');
    }
  };

  const handleRemoveExpense = async (expenseId) => {
    try {
      await dispatch(removeExpense({ tripId: id, expenseId })).unwrap();
      toast.success('Expense removed');
    } catch (err) {
      toast.error(err || 'Failed');
    }
  };

  const handleSettle = async (e) => {
    e.preventDefault();
    try {
      await dispatch(settleTrip({
        tripId: id,
        settlementData: {
          onlinePayments: Number(settlementForm.onlinePayments),
          driverSalaryTaken: settlementForm.driverSalaryTaken,
          driverSalaryTakenAmount: Number(settlementForm.driverSalaryTakenAmount),
          cashGivenToCashier: Number(settlementForm.cashGivenToCashier),
        },
      })).unwrap();
      toast.success('Trip settled');
    } catch (err) {
      toast.error(err || 'Failed');
    }
  };

  const handleFinalize = async () => {
    if (!window.confirm('Finalize this trip? It cannot be edited after this.')) return;
    try {
      await dispatch(finalizeTrip(id)).unwrap();
      toast.success('Trip finalized');
    } catch (err) {
      toast.error(err || 'Failed');
    }
  };

  if (loading || !trip) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  const isLocked = trip.status === 'finalized';

  // Live settlement preview
  const liveSettlement = liveCalc ? calculateSettlement(
    liveCalc.totalCashCollected,
    liveCalc.totalExpenses,
    Number(settlementForm.onlinePayments),
    liveCalc.driverSalary,
    settlementForm.driverSalaryTaken,
    Number(settlementForm.driverSalaryTakenAmount),
    Number(settlementForm.cashGivenToCashier)
  ) : null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/trips')} className="p-2 hover:bg-gray-100 rounded-lg"><FiArrowLeft size={20} /></button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Trip — {formatDate(trip.date)}</h1>
          <p className="text-sm text-gray-500">{trip.driver?.name} • {trip.vehicle?.registrationNumber} • {trip.totalKm} km</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          trip.status === 'finalized' ? 'bg-green-50 text-green-700' :
          trip.status === 'submitted' ? 'bg-blue-50 text-blue-700' : 'bg-yellow-50 text-yellow-700'
        }`}>{trip.status}</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card"><p className="text-xs text-gray-500">Total Earnings</p><p className="text-xl font-bold">{formatCurrency(trip.totalEarnings)}</p></div>
        <div className="stat-card"><p className="text-xs text-gray-500">Commission</p><p className="text-xl font-bold text-red-600">{formatCurrency(trip.totalCommission)}</p></div>
        <div className="stat-card"><p className="text-xs text-gray-500">Net Earnings</p><p className="text-xl font-bold text-blue-600">{formatCurrency(trip.netEarnings)}</p></div>
        <div className="stat-card"><p className="text-xs text-gray-500">Owner Profit</p><p className="text-xl font-bold text-green-600">{formatCurrency(trip.ownerProfit)}</p></div>
      </div>

      {/* Platform Earnings */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Platform Earnings</h2>

        {trip.platformEarnings.length > 0 && (
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-gray-500"><th className="text-left py-2">Platform</th><th className="text-right">Trips</th><th className="text-right">Earning</th><th className="text-right">Cash</th><th className="text-right">Commission</th></tr></thead>
              <tbody>
                {trip.platformEarnings.map((pe, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2 font-medium capitalize">{pe.platform.replace('_', ' ')}</td>
                    <td className="text-right">{pe.trips}</td>
                    <td className="text-right">{formatCurrency(pe.earning)}</td>
                    <td className="text-right">{formatCurrency(pe.cashCollected)}</td>
                    <td className="text-right text-red-600">{formatCurrency(pe.commission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLocked && (
          <form onSubmit={handleAddEarning} className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Platform</label>
              <select value={earningForm.platform} onChange={(e) => setEarningForm({ ...earningForm, platform: e.target.value })} className="input-field text-sm">
                {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Trips</label>
              <input type="number" min="0" value={earningForm.trips} onChange={(e) => setEarningForm({ ...earningForm, trips: e.target.value })} className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Earning (₹)</label>
              <input type="number" min="0" value={earningForm.earning} onChange={(e) => setEarningForm({ ...earningForm, earning: e.target.value })} className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cash (₹)</label>
              <input type="number" min="0" value={earningForm.cashCollected} onChange={(e) => setEarningForm({ ...earningForm, cashCollected: e.target.value })} className="input-field text-sm" />
            </div>
            <button type="submit" className="btn-primary text-sm flex items-center gap-1"><FiPlus size={14} /> Add</button>
          </form>
        )}
      </div>

      {/* Expenses */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Expenses</h2>

        {trip.expenses.length > 0 && (
          <div className="space-y-2 mb-4">
            {trip.expenses.map((exp) => (
              <div key={exp.id} className="flex items-center justify-between py-2 border-b">
                <div>
                  <span className="font-medium capitalize">{exp.type}</span>
                  {exp.description && <span className="text-gray-500 ml-2">— {exp.description}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{formatCurrency(exp.amount)}</span>
                  {!isLocked && <button onClick={() => handleRemoveExpense(exp.id)} className="text-red-500 hover:text-red-700"><FiTrash2 size={14} /></button>}
                </div>
              </div>
            ))}
            <div className="flex justify-between pt-2 font-semibold">
              <span>Total Expenses</span>
              <span>{formatCurrency(trip.totalExpenses)}</span>
            </div>
          </div>
        )}

        {!isLocked && (
          <form onSubmit={handleAddExpense} className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Type</label>
              <select value={expenseForm.type} onChange={(e) => setExpenseForm({ ...expenseForm, type: e.target.value })} className="input-field text-sm">
                {EXPENSE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Amount (₹)</label>
              <input type="number" min="0" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} className="input-field text-sm" required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Description</label>
              <input value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} className="input-field text-sm" />
            </div>
            <button type="submit" className="btn-primary text-sm flex items-center gap-1"><FiPlus size={14} /> Add</button>
          </form>
        )}
      </div>

      {/* Settlement */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Cash Settlement</h2>

        {trip.settlement?.settledAt ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><p className="text-xs text-gray-500">Cash Collected</p><p className="font-semibold">{formatCurrency(trip.settlement.totalCashCollected)}</p></div>
              <div><p className="text-xs text-gray-500">Expenses</p><p className="font-semibold">{formatCurrency(trip.settlement.totalExpenses)}</p></div>
              <div><p className="text-xs text-gray-500">Online Payments</p><p className="font-semibold">{formatCurrency(trip.settlement.onlinePayments)}</p></div>
              <div><p className="text-xs text-gray-500">Cash In Hand</p><p className="font-semibold text-blue-600">{formatCurrency(trip.settlement.cashInDriverHand)}</p></div>
              <div><p className="text-xs text-gray-500">Driver Salary</p><p className="font-semibold">{formatCurrency(trip.settlement.driverSalaryAmount)} {trip.settlement.driverSalaryTaken ? '(Taken)' : '(Pending)'}</p></div>
              <div><p className="text-xs text-gray-500">Cash to Cashier</p><p className="font-semibold text-green-600">{formatCurrency(trip.settlement.cashGivenToCashier)}</p></div>
            </div>
            <div className="pt-3 border-t">
              <p className="text-xs text-gray-500">Remaining Balance</p>
              <p className={`text-xl font-bold ${trip.settlement.remainingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(trip.settlement.remainingBalance)}
              </p>
            </div>
          </div>
        ) : !isLocked ? (
          <form onSubmit={handleSettle} className="space-y-4">
            {/* Live preview */}
            {liveSettlement && (
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-blue-800 mb-2">Live Preview</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-blue-600">Cash In Hand:</span><span className="font-medium">{formatCurrency(liveSettlement.cashInDriverHand)}</span>
                  <span className="text-blue-600">Driver Salary:</span><span className="font-medium">{formatCurrency(liveCalc?.driverSalary)}</span>
                  <span className="text-blue-600">Remaining:</span><span className="font-medium">{formatCurrency(liveSettlement.remainingBalance)}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Online Payments (₹)</label>
                <input type="number" min="0" value={settlementForm.onlinePayments} onChange={(e) => setSettlementForm({ ...settlementForm, onlinePayments: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cash Given to Cashier (₹)</label>
                <input type="number" min="0" value={settlementForm.cashGivenToCashier} onChange={(e) => setSettlementForm({ ...settlementForm, cashGivenToCashier: e.target.value })} className="input-field" />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={settlementForm.driverSalaryTaken} onChange={(e) => setSettlementForm({ ...settlementForm, driverSalaryTaken: e.target.checked })} className="w-4 h-4" />
                  <span className="text-sm font-medium text-gray-700">Driver Salary Taken</span>
                </label>
              </div>
              {settlementForm.driverSalaryTaken && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary Amount Taken (₹)</label>
                  <input type="number" min="0" value={settlementForm.driverSalaryTakenAmount} onChange={(e) => setSettlementForm({ ...settlementForm, driverSalaryTakenAmount: e.target.value })} className="input-field" />
                </div>
              )}
            </div>
            <button type="submit" className="btn-primary">Settle Trip</button>
          </form>
        ) : null}
      </div>

      {/* Finalize */}
      {trip.status === 'submitted' && (
        <div className="card text-center">
          <p className="text-gray-600 mb-4">Ready to finalize? This locks the trip for audit.</p>
          <button onClick={handleFinalize} className="btn-primary flex items-center gap-2 mx-auto"><FiLock size={16} /> Finalize Trip</button>
        </div>
      )}
    </div>
  );
}
