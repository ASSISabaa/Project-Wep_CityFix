import api from './api';

const reportService = {
  async getReports(params = {}) {
    const response = await api.get('/reports', { params });
    return response.data;
  },

  async getMyReports() {
    const response = await api.get('/reports/my');
    return response.data;
  },

  async getReportById(id) {
    const response = await api.get(`/reports/${id}`);
    return response.data;
  },

  async createReport(reportData) {
    const formData = new FormData();

    Object.keys(reportData).forEach(key => {
      if (key === 'images' && Array.isArray(reportData[key])) {
        reportData[key].forEach(image => {
          formData.append('images', image);
        });
      } else if (key === 'location' && typeof reportData[key] === 'object') {
        formData.append('location', JSON.stringify(reportData[key]));
      } else {
        formData.append(key, reportData[key]);
      }
    });

    const response = await api.post('/reports', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async updateReport(id, data) {
    const response = await api.put(`/reports/${id}`, data);
    return response.data;
  },

  async deleteReport(id) {
    const response = await api.delete(`/reports/${id}`);
    return response.data;
  },

  async updateStatus(id, status) {
    const response = await api.patch(`/reports/${id}/status`, { status });
    return response.data;
  },

  async addComment(id, comment) {
    const response = await api.post(`/reports/${id}/comments`, { comment });
    return response.data;
  },

  async assignReport(id, assignedTo) {
    const response = await api.patch(`/reports/${id}/assign`, { assignedTo });
    return response.data;
  },

  async analyzeImage(image) {
    const formData = new FormData();
    formData.append('image', image);

    const response = await api.post('/ai/analyze-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

export default reportService;
