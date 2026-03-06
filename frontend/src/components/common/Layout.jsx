import React from 'react';
import { FiTruck, FiUsers, FiDollarSign, FiBarChart2, FiFileText, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: FiBarChart2 },
  { to: '/trips', label: 'Trips', icon: FiFileText },
  { to: '/drivers', label: 'Drivers', icon: FiUsers },
  { to: '/vehicles', label: 'Vehicles', icon: FiTruck },
  { to: '/analytics', label: 'Analytics', icon: FiDollarSign },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const handleLogout = () => dispatch(logout());

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar — desktop only */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform lg:translate-x-0 lg:static lg:z-auto hidden lg:flex lg:flex-col ${sidebarOpen ? 'translate-x-0 !flex' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-900">🚕 Fleet Accounting</h1>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}><FiX size={20} /></button>
        </div>

        <nav className="p-4 space-y-1 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="text-sm font-medium text-gray-900 truncate">{user?.name}</div>
          <div className="text-xs text-gray-500 truncate">{user?.businessName}</div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-danger-600 mt-3">
            <FiLogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop-only top header on mobile replaced by nothing — bottom nav handles it */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between lg:hidden">
          <span className="font-semibold text-gray-900">🚕 Fleet Accounting</span>
          <button onClick={handleLogout} className="text-gray-500 hover:text-danger-600">
            <FiLogOut size={18} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6">
          {children}
        </main>

        {/* Bottom Navigation — mobile only */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-30 safe-area-bottom">
          <div className="flex items-center justify-around h-16">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 h-full text-xs font-medium transition-colors ${
                    isActive ? 'text-primary-600' : 'text-gray-500'
                  }`
                }
              >
                <item.icon size={20} />
                <span className="mt-1">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
