import React, { useEffect, useState } from 'react';
import { analyticsAPI } from '../../services/api';
import { formatCurrency, formatNumber } from '../../utils/helpers';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

export default function AnalyticsPage() {
  const [tab, setTab] = useState('profit');
  const [profitData, setProfitData] = useState([]);
  const [driverData, setDriverData] = useState([]);
  const [vehicleData, setVehicleData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Default: last 30 days
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  useEffect(() => {
    setLoading(true);
    const params = { startDate, endDate };
    Promise.all([
      analyticsAPI.profitLoss(params),
      analyticsAPI.driverPerformance(params),
      analyticsAPI.vehicleStats(params),
    ])
      .then(([pl, dp, vs]) => {
        setProfitData(pl.data.profitLoss.reverse());
        setDriverData(dp.data.performance);
        setVehicleData(vs.data.stats);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const tabs = [
    { key: 'profit', label: 'Profit & Loss' },
    { key: 'drivers', label: 'Driver Performance' },
    { key: 'vehicles', label: 'Vehicle Stats' },
  ];

  const profitChart = {
    labels: profitData.map((d) => d._id),
    datasets: [
      { label: 'Revenue', data: profitData.map((d) => d.revenue), backgroundColor: 'rgba(59,130,246,0.6)' },
      { label: 'Expenses', data: profitData.map((d) => d.expenses), backgroundColor: 'rgba(239,68,68,0.6)' },
      { label: 'Profit', data: profitData.map((d) => d.profit), backgroundColor: 'rgba(34,197,94,0.6)' },
    ],
  };

  const kmChart = {
    labels: profitData.map((d) => d._id),
    datasets: [
      { label: 'KM Driven', data: profitData.map((d) => d.totalKm), borderColor: '#3b82f6', tension: 0.3, fill: false },
      { label: 'Trips', data: profitData.map((d) => d.trips), borderColor: '#22c55e', tension: 0.3, fill: false },
    ],
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Analytics</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === t.key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profit' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Revenue vs Expenses vs Profit (Last 30 Days)</h2>
            <div className="h-80"><Bar data={profitChart} options={{ responsive: true, maintainAspectRatio: false }} /></div>
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">KM & Trips Trend</h2>
            <div className="h-80"><Line data={kmChart} options={{ responsive: true, maintainAspectRatio: false }} /></div>
          </div>
        </div>
      )}

      {tab === 'drivers' && (
        <div className="card overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4">Driver Performance</h2>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-gray-500"><th className="text-left py-2">Driver</th><th className="text-right">Trips</th><th className="text-right">KM</th><th className="text-right">Earnings</th><th className="text-right">Avg/Trip</th><th className="text-right">Pending Salary</th></tr></thead>
            <tbody>
              {driverData.map((d) => (
                <tr key={d._id} className="border-b hover:bg-gray-50">
                  <td className="py-2 font-medium">{d.driverName}<br /><span className="text-xs text-gray-500">{d.commissionPct}% commission</span></td>
                  <td className="text-right">{d.totalTrips}</td>
                  <td className="text-right">{formatNumber(d.totalKm)}</td>
                  <td className="text-right">{formatCurrency(d.totalEarnings)}</td>
                  <td className="text-right">{formatCurrency(d.avgEarningPerTrip)}</td>
                  <td className="text-right text-orange-600">{formatCurrency(d.pendingSalary)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {driverData.length === 0 && <p className="text-center text-gray-500 py-6">No data for this period</p>}
        </div>
      )}

      {tab === 'vehicles' && (
        <div className="card overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4">Vehicle Statistics</h2>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-gray-500"><th className="text-left py-2">Vehicle</th><th className="text-right">Trips</th><th className="text-right">KM</th><th className="text-right">Earnings</th><th className="text-right">₹/km</th><th className="text-right">Profit</th></tr></thead>
            <tbody>
              {vehicleData.map((v) => (
                <tr key={v._id} className="border-b hover:bg-gray-50">
                  <td className="py-2 font-medium">{v.registration}<br /><span className="text-xs text-gray-500">{v.model}</span></td>
                  <td className="text-right">{v.totalTrips}</td>
                  <td className="text-right">{formatNumber(v.totalKm)}</td>
                  <td className="text-right">{formatCurrency(v.totalEarnings)}</td>
                  <td className="text-right">{v.earningPerKm}</td>
                  <td className="text-right text-green-600">{formatCurrency(v.ownerProfit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {vehicleData.length === 0 && <p className="text-center text-gray-500 py-6">No data for this period</p>}
        </div>
      )}
    </div>
  );
}
