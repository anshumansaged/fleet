import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import tripsReducer from './slices/tripsSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    trips: tripsReducer,
  },
});

export default store;
