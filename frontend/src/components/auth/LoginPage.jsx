import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, register, clearError } from '../../store/slices/authSlice';

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🚕 Fleet Accounting</h1>
          <p className="text-gray-500 mt-2">Manage your fleet finances</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-6">{isRegister ? 'Create Account' : 'Sign In'}</h2>

          {error && <div className="bg-danger-50 text-danger-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input name="name" value={form.name} onChange={handleChange} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input name="phone" value={form.phone} onChange={handleChange} className="input-field" placeholder="10-digit number" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                  <input name="businessName" value={form.businessName} onChange={handleChange} className="input-field" />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} className="input-field" minLength={8} required />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => { setIsRegister(!isRegister); dispatch(clearError()); }} className="text-primary-600 font-medium hover:underline">
              {isRegister ? 'Sign In' : 'Register'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
