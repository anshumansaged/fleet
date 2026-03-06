import React from 'react';
import { FiTruck, FiUsers, FiDollarSign, FiBarChart2, FiFileText, FiLogOut, FiMenu, FiX, FiSettings } from 'react-icons/fi';
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
    <div className="flex h-screen bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar — desktop only */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto hidden lg:flex lg:flex-col ${sidebarOpen ? 'translate-x-0 !flex' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">🚕 Fleet</h1>
            <p className="text-xs text-slate-500 font-semibold">ACCOUNTING</p>
          </div>
          <button className="lg:hidden text-slate-500 hover:text-slate-700" onClick={() => setSidebarOpen(false)}>
            <FiX size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-primary text-white shadow-lg' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User profile section */}
        <div className="px-4 py-6 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900 truncate">{user?.name}</div>
              <div className="text-xs text-slate-500 truncate">{user?.businessName}</div>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 hover:text-danger-600 hover:bg-danger-50 px-3 py-2 rounded-lg transition-colors duration-200"
          >
            <FiLogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between lg:hidden shadow-sm">
          <div>
            <h1 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">🚕 Fleet</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
              <FiSettings size={18} />
            </button>
            <button 
              onClick={handleLogout} 
              className="p-2 text-slate-500 hover:text-danger-600 hover:bg-danger-50 rounded-lg"
            >
              <FiLogOut size={18} />
            </button>
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              <FiMenu size={18} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8 pb-20 lg:pb-6">
          {children}
        </main>

        {/* Bottom Navigation — mobile only */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 lg:hidden z-30 shadow-lg safe-area-bottom">
          <div className="flex items-center justify-around h-16">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 h-full text-xs font-semibold transition-colors duration-200 ${
                    isActive 
                      ? 'text-primary-600 bg-primary-50' 
                      : 'text-slate-600 hover:text-primary-600'
                  }`
                }
              >
                <item.icon size={20} />
                <span className="mt-1 text-xs">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
