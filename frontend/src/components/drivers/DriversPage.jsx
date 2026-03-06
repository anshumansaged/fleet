import React, { useEffect, useState } from 'react';
import { driversAPI } from '../../services/api';
import { formatCurrency } from '../../utils/helpers';
import { FiPlus, FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', commissionPercentage: 30, licenseNumber: '' });

  const loadDrivers = () => {
    driversAPI.list().then(({ data }) => setDrivers(data.drivers)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { loadDrivers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDriver) {
        await driversAPI.update(editingDriver.id, form);
        toast.success('Driver updated');
      } else {
        await driversAPI.create(form);
        toast.success('Driver added');
      }
      setShowForm(false);
      setEditingDriver(null);
      setForm({ name: '', phone: '', commissionPercentage: 30, licenseNumber: '' });
      loadDrivers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const startEdit = (driver) => {
    setEditingDriver(driver);
    setForm({ name: driver.name, phone: driver.phone, commissionPercentage: driver.commissionPercentage, licenseNumber: driver.licenseNumber || '' });
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingDriver(null); setForm({ name: '', phone: '', commissionPercentage: 30, licenseNumber: '' }); }} className="btn-primary flex items-center gap-2">
          <FiPlus size={16} /> Add Driver
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">{editingDriver ? 'Edit Driver' : 'New Driver'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commission %</label>
              <input type="number" min="0" max="100" value={form.commissionPercentage} onChange={(e) => setForm({ ...form, commissionPercentage: Number(e.target.value) })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License</label>
              <input value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} className="input-field" />
            </div>
            <div className="md:col-span-2 lg:col-span-4 flex gap-2">
              <button type="submit" className="btn-primary">{editingDriver ? 'Update' : 'Add'} Driver</button>
              <button type="button" onClick={() => { setShowForm(false); setEditingDriver(null); }} className="btn-outline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="grid gap-4">
          {drivers.map((d) => (
            <div key={d.id} className="card flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{d.name}</p>
                <p className="text-sm text-gray-500">{d.phone} • Commission: {d.commissionPercentage}%</p>
                {d.pendingSalary > 0 && <p className="text-sm text-warning-600">Pending Salary: {formatCurrency(d.pendingSalary)}</p>}
                {d.assignedVehicle && <p className="text-sm text-gray-500">Vehicle: {d.assignedVehicle.registrationNumber}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${d.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {d.isActive ? 'Active' : 'Inactive'}
                </span>
                <button onClick={() => startEdit(d)} className="p-2 hover:bg-gray-100 rounded-lg"><FiEdit2 size={16} /></button>
              </div>
            </div>
          ))}
          {drivers.length === 0 && <p className="text-center text-gray-500 py-10">No drivers yet. Add your first driver.</p>}
        </div>
      )}
    </div>
  );
}
