import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { tripsAPI } from '../../services/api';

export const fetchTrips = createAsyncThunk('trips/fetchTrips', async (params, { rejectWithValue }) => {
  try {
    const { data } = await tripsAPI.list(params);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to fetch trips');
  }
});

export const fetchTrip = createAsyncThunk('trips/fetchTrip', async (id, { rejectWithValue }) => {
  try {
    const { data } = await tripsAPI.getById(id);
    return data.trip;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to fetch trip');
  }
});

export const createTrip = createAsyncThunk('trips/createTrip', async (tripData, { rejectWithValue }) => {
  try {
    const { data } = await tripsAPI.create(tripData);
    return data.trip;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to create trip');
  }
});

export const addEarning = createAsyncThunk('trips/addEarning', async ({ tripId, earningData }, { rejectWithValue }) => {
  try {
    const { data } = await tripsAPI.addEarning(tripId, earningData);
    return data.trip;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to add earning');
  }
});

export const addExpense = createAsyncThunk('trips/addExpense', async ({ tripId, expenseData }, { rejectWithValue }) => {
  try {
    const { data } = await tripsAPI.addExpense(tripId, expenseData);
    return data.trip;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to add expense');
  }
});

export const removeExpense = createAsyncThunk('trips/removeExpense', async ({ tripId, expenseId }, { rejectWithValue }) => {
  try {
    const { data } = await tripsAPI.removeExpense(tripId, expenseId);
    return data.trip;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to remove expense');
  }
});

export const settleTrip = createAsyncThunk('trips/settleTrip', async ({ tripId, settlementData }, { rejectWithValue }) => {
  try {
    const { data } = await tripsAPI.settle(tripId, settlementData);
    return data.trip;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to settle trip');
  }
});

export const finalizeTrip = createAsyncThunk('trips/finalizeTrip', async (tripId, { rejectWithValue }) => {
  try {
    const { data } = await tripsAPI.finalize(tripId);
    return data.trip;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to finalize trip');
  }
});

const tripsSlice = createSlice({
  name: 'trips',
  initialState: {
    list: [],
    current: null,
    pagination: { total: 0, page: 1, totalPages: 0 },
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrent: (state) => { state.current = null; },
    updateTripRealtime: (state, action) => {
      const updated = action.payload;
      if (state.current && state.current.id === updated.id) {
        state.current = updated;
      }
      const idx = state.list.findIndex((t) => t.id === updated.id);
      if (idx >= 0) state.list[idx] = updated;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrips.pending, (state) => { state.loading = true; })
      .addCase(fetchTrips.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.trips;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTrips.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchTrip.pending, (state) => { state.loading = true; })
      .addCase(fetchTrip.fulfilled, (state, action) => { state.loading = false; state.current = action.payload; })
      .addCase(fetchTrip.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createTrip.fulfilled, (state, action) => { state.list.unshift(action.payload); })
      .addCase(addEarning.fulfilled, (state, action) => { state.current = action.payload; })
      .addCase(addExpense.fulfilled, (state, action) => { state.current = action.payload; })
      .addCase(removeExpense.fulfilled, (state, action) => { state.current = action.payload; })
      .addCase(settleTrip.fulfilled, (state, action) => { state.current = action.payload; })
      .addCase(finalizeTrip.fulfilled, (state, action) => { state.current = action.payload; });
  },
});

export const { clearCurrent, updateTripRealtime } = tripsSlice.actions;
export default tripsSlice.reducer;
