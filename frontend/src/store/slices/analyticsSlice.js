import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import analyticsService from '../../services/analyticsService';

const initialState = {
  overview: null,
  trends: null,
  performance: null,
  isLoading: false,
  error: null
};

export const fetchAnalytics = createAsyncThunk(
  'analytics/fetchAnalytics',
  async (timeframe, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getAnalytics(timeframe);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch analytics');
    }
  }
);

export const fetchTrends = createAsyncThunk(
  'analytics/fetchTrends',
  async (params, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getTrends(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch trends');
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearAnalytics: (state) => {
      state.overview = null;
      state.trends = null;
      state.performance = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.overview = action.payload;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchTrends.fulfilled, (state, action) => {
        state.trends = action.payload;
      });
  }
});

export const { clearAnalytics } = analyticsSlice.actions;
export default analyticsSlice.reducer;
