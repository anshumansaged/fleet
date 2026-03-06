import React, { useEffect, useState } from 'react';
import { analyticsAPI } from '../../services/api';
import { formatCurrency, formatNumber } from '../../utils/helpers';
import { FiTrendingUp, FiTruck, FiUsers, FiDollarSign, FiMapPin, FiActivity, FiArrowUp, FiArrowDown } from 'react-icons/fi';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.overview()
      .then(({ data }) => setData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="flex flex-col items-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full mb-4" />
          <p className="text-slate-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <div className="text-danger-600 text-lg font-semibold mb-2">⚠️ Error</div>
        <p className="text-slate-500">Failed to load dashboard data</p>
      </div>
    );
  }

  const statCards = [
    { 
      label: "Today's Earnings", 
      value: formatCurrency(data.today.earnings), 
      icon: FiDollarSign, 
      gradient: 'from-success-500 to-success-600',
      bgGradient: 'from-success-50 to-success-100',
      iconBg: 'bg-success-600',
    },
    { 
      label: "Today's Profit", 
      value: formatCurrency(data.today.profit), 
      icon: FiTrendingUp, 
      gradient: 'from-primary-500 to-primary-600',
      bgGradient: 'from-primary-50 to-primary-100',
      iconBg: 'bg-primary-600',
    },
    { 
      label: "Today's Trips", 
      value: data.today.trips, 
      icon: FiActivity, 
      gradient: 'from-accent-500 to-accent-600',
      bgGradient: 'from-accent-50 to-accent-100',
      iconBg: 'bg-accent-600',
    },
    { 
      label: "Today's KM", 
      value: formatNumber(data.today.km), 
      icon: FiMapPin, 
      gradient: 'from-warning-500 to-warning-600',
      bgGradient: 'from-warning-50 to-warning-100',
      iconBg: 'bg-warning-600',
    },
    { 
      label: 'Active Drivers', 
      value: data.activeDrivers, 
      icon: FiUsers, 
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      iconBg: 'bg-blue-600',
    },
    { 
      label: 'Active Vehicles', 
      value: data.activeVehicles, 
      icon: FiTruck, 
      gradient: 'from-cyan-500 to-cyan-600',
      bgGradient: 'from-cyan-50 to-cyan-100',
      iconBg: 'bg-cyan-600',
    },
  ];

  const monthStats = [
    { label: 'Earnings', value: data.month.earnings, icon: FiDollarSign, trend: 'up' },
    { label: 'Expenses', value: data.month.expenses, icon: FiArrowDown, trend: 'down' },
    { label: 'Net Profit', value: data.month.profit, icon: FiTrendingUp, trend: 'up' },
    { label: 'Total Trips', value: data.month.trips },
    { label: 'Total KM', value: formatNumber(data.month.km) },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header mb-8">
        <div>
          <h1 className="page-title">📊 Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back! Here's your fleet overview.</p>
        </div>
      </div>

      {/* Today's Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map((stat) => (
          <div 
            key={stat.label} 
            className={`bg-gradient-to-br ${stat.bgGradient} stat-card group hover:shadow-xl`}
          >
            <div className={`stat-card-content`}>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.iconBg} text-white mb-4 group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
              <p className="text-2xl lg:text-xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-600 mt-2 font-medium">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main monthly card */}
        <div className="lg:col-span-2 card-elevated">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title mb-0">This Month Overview</h2>
            <span className="text-xs font-semibold text-primary-600 bg-primary-100 px-3 py-1 rounded-full">Current</span>
          </div>
          <div className="divider mb-6" />
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {monthStats.map((stat, idx) => (
              <div key={idx} className="flex flex-col">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{stat.label}</p>
                <p className="text-xl lg:text-2xl font-bold text-slate-900">
                  {typeof stat.value === 'number' && stat.label.includes('Earnings', 'Expenses', 'Profit') 
                    ? formatCurrency(stat.value) 
                    : stat.value}
                </p>
                {stat.trend && (
                  <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${stat.trend === 'up' ? 'text-success-600' : 'text-danger-600'}`}>
                    {stat.trend === 'up' ? <FiArrowUp size={12} /> : <FiArrowDown size={12} />}
                    {stat.trend === 'up' ? 'Positive' : 'Recorded'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick stats card */}
        <div className="card-elevated bg-gradient-to-br from-primary-50 to-primary-100">
          <h3 className="section-title mb-0">Key Metrics</h3>
          <div className="divider my-4" />
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600 font-medium">Profit Margin</span>
                <span className="text-sm font-bold text-primary-600">
                  {data.month.earnings > 0 ? Math.round((data.month.profit / data.month.earnings) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(data.month.earnings > 0 ? (data.month.profit / data.month.earnings) * 100 : 0, 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">This Month</p>
              <p className="text-2xl font-bold text-success-600">{formatCurrency(data.month.profit)}</p>
              <p className="text-xs text-slate-600 mt-1">Net profit earned</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 flex-wrap">
        <a href="/trips" className="btn-primary btn-small">
          📝 Create New Trip
        </a>
        <a href="/drivers" className="btn-secondary btn-small">
          👥 Manage Drivers
        </a>
        <a href="/vehicles" className="btn-secondary btn-small">
          🚗 Manage Vehicles
        </a>
      </div>
    </div>
  );
}
