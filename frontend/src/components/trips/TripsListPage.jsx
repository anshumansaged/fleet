import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchTrips, createTrip } from '../../store/slices/tripsSlice';
import { driversAPI, vehiclesAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { FiPlus, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function TripsListPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list: trips, pagination, loading } = useSelector((s) => s.trips);
  const [showForm, setShowForm] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({ driver: '', vehicle: '', date: new Date().toISOString().split('T')[0], startKm: '', endKm: '' });
  const [filters, setFilters] = useState({ page: 1 });

  useEffect(() => {
    dispatch(fetchTrips(filters));
    Promise.all([driversAPI.list({ active: true }), vehiclesAPI.list({ active: true })])
      .then(([d, v]) => { setDrivers(d.data.drivers); setVehicles(v.data.vehicles); })
      .catch(console.error);
  }, [dispatch, filters]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const result = await dispatch(createTrip({
        ...form,
        startKm: Number(form.startKm),
        endKm: Number(form.endKm),
      })).unwrap();
      toast.success('Trip created');
      setShowForm(false);
      navigate(`/trips/${result.id}`);
    } catch (err) {
      toast.error(err || 'Failed to create trip');
    }
  };

  const statusColors = {
    draft: 'bg-yellow-50 text-yellow-700',
    submitted: 'bg-blue-50 text-blue-700',
    finalized: 'bg-green-50 text-green-700',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Trip Sheets</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2"><FiPlus size={16} /> New Trip</button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">New Trip Sheet</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
              <select value={form.driver} onChange={(e) => setForm({ ...form, driver: e.target.value })} className="input-field" required>
                <option value="">Select</option>
                {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
              <select value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} className="input-field" required>
                <option value="">Select</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registrationNumber}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start KM</label>
              <input type="number" value={form.startKm} onChange={(e) => setForm({ ...form, startKm: e.target.value })} className="input-field" min="0" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End KM</label>
              <input type="number" value={form.endKm} onChange={(e) => setForm({ ...form, endKm: e.target.value })} className="input-field" min="0" required />
            </div>
            <div className="lg:col-span-5 flex gap-2">
              <button type="submit" className="btn-primary">Create Trip</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>
      ) : (
        <>
          <div className="space-y-3">
            {trips.map((trip) => (
              <div key={trip.id} onClick={() => navigate(`/trips/${trip.id}`)} className="card cursor-pointer hover:shadow-md transition-shadow flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-semibold text-gray-900">{formatDate(trip.date)}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[trip.status]}`}>{trip.status}</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {trip.driver?.name} • {trip.vehicle?.registrationNumber} • {trip.totalKm} km
                  </p>
                  <div className="flex gap-4 mt-1 text-sm">
                    <span className="text-gray-600">Earnings: {formatCurrency(trip.totalEarnings)}</span>
                    <span className="text-green-600">Profit: {formatCurrency(trip.ownerProfit)}</span>
                  </div>
                </div>
                <FiChevronRight size={20} className="text-gray-400" />
              </div>
            ))}
            {trips.length === 0 && <p className="text-center text-gray-500 py-10">No trips yet. Create your first trip sheet.</p>}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: pagination.totalPages }, (_, i) => (
                <button key={i + 1} onClick={() => setFilters({ ...filters, page: i + 1 })}
                  className={`px-3 py-1 rounded text-sm ${pagination.page === i + 1 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
