import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${API_BASE}/auth/refresh-token`, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// Drivers
export const driversAPI = {
  list: (params) => api.get('/drivers', { params }),
  getById: (id) => api.get(`/drivers/${id}`),
  create: (data) => api.post('/drivers', data),
  update: (id, data) => api.put(`/drivers/${id}`, data),
};

// Vehicles
export const vehiclesAPI = {
  list: (params) => api.get('/vehicles', { params }),
  getById: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
};

// Trips
export const tripsAPI = {
  list: (params) => api.get('/trips', { params }),
  getById: (id) => api.get(`/trips/${id}`),
  create: (data) => api.post('/trips', data),
  update: (id, data) => api.put(`/trips/${id}`, data),
  finalize: (id) => api.post(`/trips/${id}/finalize`),
  addEarning: (tripId, data) => api.post(`/trips/${tripId}/earnings`, data),
  addExpense: (tripId, data) => api.post(`/trips/${tripId}/expenses`, data),
  removeExpense: (tripId, expenseId) => api.delete(`/trips/${tripId}/expenses/${expenseId}`),
  settle: (tripId, data) => api.post(`/trips/${tripId}/settlement`, data),
};

// Analytics
export const analyticsAPI = {
  overview: () => api.get('/analytics/overview'),
  dailySummary: (params) => api.get('/analytics/daily-summary', { params }),
  driverPerformance: (params) => api.get('/analytics/driver-performance', { params }),
  vehicleStats: (params) => api.get('/analytics/vehicle-stats', { params }),
  profitLoss: (params) => api.get('/analytics/profit-loss', { params }),
  cashFlow: (params) => api.get('/analytics/cash-flow', { params }),
};

// Reconciliation
export const reconciliationAPI = {
  runDaily: (date) => api.post('/reconciliation/daily', { date }),
  getByDate: (date) => api.get(`/reconciliation/${date}`),
  list: (params) => api.get('/reconciliation/list', { params }),
  getAuditLogs: (params) => api.get('/reconciliation/audit-logs', { params }),
};

export default api;
