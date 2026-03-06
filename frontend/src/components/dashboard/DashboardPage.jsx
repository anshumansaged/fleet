import React, { useEffect, useState } from 'react';
import { analyticsAPI } from '../../services/api';
import { formatCurrency, formatNumber } from '../../utils/helpers';
import { FiTrendingUp, FiTruck, FiUsers, FiDollarSign, FiMapPin, FiActivity } from 'react-icons/fi';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.overview()
      .then(({ data }) => setData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  if (!data) return <div className="text-center py-20 text-gray-500">Failed to load dashboard</div>;

  const stats = [
    { label: "Today's Earnings", value: formatCurrency(data.today.earnings), icon: FiDollarSign, color: 'text-green-600 bg-green-50' },
    { label: "Today's Profit", value: formatCurrency(data.today.profit), icon: FiTrendingUp, color: 'text-blue-600 bg-blue-50' },
    { label: "Today's Trips", value: data.today.trips, icon: FiActivity, color: 'text-purple-600 bg-purple-50' },
    { label: "Today's KM", value: formatNumber(data.today.km), icon: FiMapPin, color: 'text-orange-600 bg-orange-50' },
    { label: 'Active Drivers', value: data.activeDrivers, icon: FiUsers, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Active Vehicles', value: data.activeVehicles, icon: FiTruck, color: 'text-teal-600 bg-teal-50' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Today's Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Monthly Summary */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">This Month</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-sm text-gray-500">Earnings</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(data.month.earnings)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Expenses</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(data.month.expenses)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Profit</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(data.month.profit)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Trips</p>
            <p className="text-xl font-bold text-gray-900">{data.month.trips}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total KM</p>
            <p className="text-xl font-bold text-gray-900">{formatNumber(data.month.km)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
