import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, register, clearError } from '../../store/slices/authSlice';
import { FiMail, FiLock, FiUser, FiPhone, FiBriefcase, FiArrowRight } from 'react-icons/fi';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', businessName: '' });
  const dispatch = useDispatch();
  const { loading, error } = useSelector((s) => s.auth);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(clearError());
    if (isRegister) {
      dispatch(register(form));
    } else {
      dispatch(login({ email: form.email, password: form.password }));
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-primary-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-primary text-white text-3xl font-bold">
            🚕
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Fleet Accounting</h1>
          <p className="text-slate-600 mt-2 font-medium">Manage your fleet finances with ease</p>
        </div>

        {/* Main Card */}
        <div className="card-elevated">
          {/* Tab-like header */}
          <div className="flex gap-2 mb-8 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => { setIsRegister(false); dispatch(clearError()); }}
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 ${
                !isRegister
                  ? 'bg-white text-primary-600 shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsRegister(true); dispatch(clearError()); }}
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 ${
                isRegister
                  ? 'bg-white text-primary-600 shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Register
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-danger-50 border-2 border-danger-200 text-danger-700 p-4 rounded-lg mb-6 text-sm font-semibold flex items-start gap-3">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Register-only fields */}
            {isRegister && (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Full Name</label>
                  <div className="relative">
                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      name="name" 
                      value={form.name} 
                      onChange={handleChange} 
                      className="input-field pl-12" 
                      placeholder="Your full name"
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Phone Number</label>
                  <div className="relative">
                    <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      name="phone" 
                      value={form.phone} 
                      onChange={handleChange} 
                      className="input-field pl-12" 
                      placeholder="10-digit number"
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Business Name</label>
                  <div className="relative">
                    <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      name="businessName" 
                      value={form.businessName} 
                      onChange={handleChange} 
                      className="input-field pl-12"
                      placeholder="Your fleet name"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  name="email" 
                  type="email" 
                  value={form.email} 
                  onChange={handleChange} 
                  className="input-field pl-12" 
                  placeholder="you@example.com"
                  required 
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Password</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  name="password" 
                  type="password" 
                  value={form.password} 
                  onChange={handleChange} 
                  className="input-field pl-12" 
                  placeholder={isRegister ? "Min. 8 characters" : "Enter your password"}
                  minLength={isRegister ? 8 : 1}
                  required 
                />
              </div>
              {isRegister && (
                <p className="text-xs text-slate-500 mt-1">At least 8 characters for security</p>
              )}
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading} 
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-6 font-semibold text-base"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Processing...
                </>
              ) : (
                <>
                  {isRegister ? 'Create Account' : 'Sign In'}
                  <FiArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          {!isRegister && (
            <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
              <p className="text-xs font-semibold text-primary-700 mb-2">Demo Credentials:</p>
              <p className="text-xs text-primary-600 font-mono">📧 admin@fleet.com</p>
              <p className="text-xs text-primary-600 font-mono">🔐 admin123456</p>
            </div>
          )}

          {/* Toggle Text */}
          <p className="text-center text-sm text-slate-600 mt-6">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              onClick={() => { setIsRegister(!isRegister); dispatch(clearError()); }} 
              className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
            >
              {isRegister ? 'Sign in here' : 'Register here'}
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6">
          🔒 Your data is secure and encrypted
        </p>
      </div>
    </div>
  );
}
