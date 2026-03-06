import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import store from './store';
import { loadProfile } from './store/slices/authSlice';
import { connectSocket, disconnectSocket } from './services/socket';

import LoginPage from './components/auth/LoginPage';
import Layout from './components/common/Layout';
import DashboardPage from './components/dashboard/DashboardPage';
import DriversPage from './components/drivers/DriversPage';
import VehiclesPage from './components/vehicles/VehiclesPage';
import TripsListPage from './components/trips/TripsListPage';
import TripDetailPage from './components/trips/TripDetailPage';
import AnalyticsPage from './components/analytics/AnalyticsPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useSelector((s) => s.auth);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((s) => s.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(loadProfile());
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (user?.id) {
      connectSocket(user.id);
      return () => disconnectSocket();
    }
  }, [user]);

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
      <Route path="/trips" element={<ProtectedRoute><Layout><TripsListPage /></Layout></ProtectedRoute>} />
      <Route path="/trips/:id" element={<ProtectedRoute><Layout><TripDetailPage /></Layout></ProtectedRoute>} />
      <Route path="/drivers" element={<ProtectedRoute><Layout><DriversPage /></Layout></ProtectedRoute>} />
      <Route path="/vehicles" element={<ProtectedRoute><Layout><VehiclesPage /></Layout></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Layout><AnalyticsPage /></Layout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Toaster position="top-right" />
        <AppRoutes />
      </BrowserRouter>
    </Provider>
  );
}
