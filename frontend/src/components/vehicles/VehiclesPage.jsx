import React, { useEffect, useState } from 'react';
import { vehiclesAPI, driversAPI } from '../../services/api';
import { FiPlus, FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ registrationNumber: '', model: '', year: '', fuelType: 'cng', currentDriver: '' });

  useEffect(() => {
    Promise.all([vehiclesAPI.list(), driversAPI.list()])
      .then(([v, d]) => { setVehicles(v.data.vehicles); setDrivers(d.data.drivers); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const reload = () => vehiclesAPI.list().then(({ data }) => setVehicles(data.vehicles));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, year: form.year ? Number(form.year) : undefined, currentDriver: form.currentDriver || undefined };
    try {
      if (editing) {
        await vehiclesAPI.update(editing.id, payload);
        toast.success('Vehicle updated');
      } else {
        await vehiclesAPI.create(payload);
        toast.success('Vehicle added');
      }
      setShowForm(false); setEditing(null); reload();
      setForm({ registrationNumber: '', model: '', year: '', fuelType: 'cng', currentDriver: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const startEdit = (v) => {
    setEditing(v);
    setForm({ registrationNumber: v.registrationNumber, model: v.model || '', year: v.year || '', fuelType: v.fuelType, currentDriver: v.currentDriver?.id || '' });
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ registrationNumber: '', model: '', year: '', fuelType: 'cng', currentDriver: '' }); }} className="btn-primary flex items-center gap-2"><FiPlus size={16} /> Add Vehicle</button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Vehicle' : 'New Vehicle'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registration</label>
              <input value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} className="input-field" placeholder="WB XX AB 1234" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input type="number" min="2000" max="2030" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
              <select value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value })} className="input-field">
                {['petrol', 'diesel', 'cng', 'electric', 'hybrid'].map((f) => <option key={f} value={f}>{f.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Driver</label>
              <select value={form.currentDriver} onChange={(e) => setForm({ ...form, currentDriver: e.target.value })} className="input-field">
                <option value="">None</option>
                {drivers.filter((d) => d.isActive).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="lg:col-span-5 flex gap-2">
              <button type="submit" className="btn-primary">{editing ? 'Update' : 'Add'} Vehicle</button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn-outline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="grid gap-4">
          {vehicles.map((v) => (
            <div key={v.id} className="card flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{v.registrationNumber}</p>
                <p className="text-sm text-gray-500">{v.model} {v.year ? `(${v.year})` : ''} • {v.fuelType?.toUpperCase()}</p>
                {v.currentDriver && <p className="text-sm text-gray-500">Driver: {v.currentDriver.name}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${v.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {v.isActive ? 'Active' : 'Inactive'}
                </span>
                <button onClick={() => startEdit(v)} className="p-2 hover:bg-gray-100 rounded-lg"><FiEdit2 size={16} /></button>
              </div>
            </div>
          ))}
          {vehicles.length === 0 && <p className="text-center text-gray-500 py-10">No vehicles yet. Add your first vehicle.</p>}
        </div>
      )}
    </div>
  );
}
