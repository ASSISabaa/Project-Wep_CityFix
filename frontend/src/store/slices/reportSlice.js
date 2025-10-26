import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import reportService from '../../services/reportService';

const initialState = {
  reports: [],
  currentReport: null,
  myReports: [],
  filters: {
    status: 'all',
    type: 'all',
    priority: 'all',
    search: ''
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0
  },
  isLoading: false,
  error: null
};

export const fetchReports = createAsyncThunk(
  'reports/fetchReports',
  async (params, { rejectWithValue }) => {
    try {
      const response = await reportService.getReports(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch reports');
    }
  }
);

export const fetchMyReports = createAsyncThunk(
  'reports/fetchMyReports',
  async (_, { rejectWithValue }) => {
    try {
      const response = await reportService.getMyReports();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch my reports');
    }
  }
);

export const fetchReportById = createAsyncThunk(
  'reports/fetchReportById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await reportService.getReportById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch report');
    }
  }
);

export const createReport = createAsyncThunk(
  'reports/createReport',
  async (reportData, { rejectWithValue }) => {
    try {
      const response = await reportService.createReport(reportData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create report');
    }
  }
);

export const updateReport = createAsyncThunk(
  'reports/updateReport',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await reportService.updateReport(id, data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update report');
    }
  }
);

export const deleteReport = createAsyncThunk(
  'reports/deleteReport',
  async (id, { rejectWithValue }) => {
    try {
      await reportService.deleteReport(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete report');
    }
  }
);

const reportSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setCurrentReport: (state, action) => {
      state.currentReport = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReports.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reports = action.payload.reports;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchMyReports.fulfilled, (state, action) => {
        state.myReports = action.payload.reports;
      })
      .addCase(fetchReportById.fulfilled, (state, action) => {
        state.currentReport = action.payload.report;
      })
      .addCase(createReport.fulfilled, (state, action) => {
        state.reports.unshift(action.payload.report);
        state.myReports.unshift(action.payload.report);
      })
      .addCase(updateReport.fulfilled, (state, action) => {
        const index = state.reports.findIndex(r => r._id === action.payload.report._id);
        if (index !== -1) {
          state.reports[index] = action.payload.report;
        }
        if (state.currentReport?._id === action.payload.report._id) {
          state.currentReport = action.payload.report;
        }
      })
      .addCase(deleteReport.fulfilled, (state, action) => {
        state.reports = state.reports.filter(r => r._id !== action.payload);
        state.myReports = state.myReports.filter(r => r._id !== action.payload);
      });
  }
});

export const { setFilters, clearFilters, setCurrentReport, clearError } = reportSlice.actions;
export default reportSlice.reducer;
