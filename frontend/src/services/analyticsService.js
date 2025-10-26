import api from './api';

const analyticsService = {
  async getAnalytics(timeframe = '30days') {
    const response = await api.get('/analytics', {
      params: { timeframe }
    });
    return response.data;
  },

  async getTrends(params = {}) {
    const response = await api.get('/analytics/trends', { params });
    return response.data;
  },

  async getPerformance() {
    const response = await api.get('/analytics/performance');
    return response.data;
  },

  async getMyImpact() {
    const response = await api.get('/analytics/my-impact');
    return response.data;
  },

  async getLeaderboard(limit = 10) {
    const response = await api.get('/analytics/leaderboard', {
      params: { limit }
    });
    return response.data;
  },

  async exportData(format = 'csv', params = {}) {
    const response = await api.get('/analytics/export', {
      params: { format, ...params },
      responseType: 'blob'
    });
    return response;
  }
};

export default analyticsService;
