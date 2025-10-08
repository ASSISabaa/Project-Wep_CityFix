class API {
   constructor() {
       this.baseURL = location.origin + '/api';
       this.token = localStorage.getItem('cityfix_token');
   }
   
   getHeaders() {
       const headers = {
           'Content-Type': 'application/json'
       };
       
       if (this.token) {
           headers['Authorization'] = `Bearer ${this.token}`;
       }
       
       return headers;
   }
   
   async handleResponse(response) {
       const data = await response.json();
       
       if (!response.ok) {
           throw new Error(data.message || 'Something went wrong');
       }
       
       return data;
   }
   
   async signup(userData) {
       const response = await fetch(`${this.baseURL}/auth/signup`, {
           method: 'POST',
           headers: this.getHeaders(),
           body: JSON.stringify(userData)
       });
       
       const data = await this.handleResponse(response);
       
       if (data.token) {
           this.token = data.token;
           localStorage.setItem('cityfix_token', data.token);
           localStorage.setItem('cityfix_user', JSON.stringify(data.user));
       }
       
       return data;
   }
   
   async login(credentials) {
       const response = await fetch(`${this.baseURL}/auth/login`, {
           method: 'POST',
           headers: this.getHeaders(),
           body: JSON.stringify(credentials)
       });
       
       const data = await this.handleResponse(response);
       
       if (data.token) {
           this.token = data.token;
           localStorage.setItem('cityfix_token', data.token);
           localStorage.setItem('cityfix_user', JSON.stringify(data.user));
       }
       
       return data;
   }
   
   async logout() {
       const response = await fetch(`${this.baseURL}/auth/logout`, {
           method: 'POST',
           headers: this.getHeaders()
       });
       
       localStorage.removeItem('cityfix_token');
       localStorage.removeItem('cityfix_user');
       this.token = null;
       
       return this.handleResponse(response);
   }
   
   async getReports(params = {}) {
       const queryString = new URLSearchParams(params).toString();
       const response = await fetch(`${this.baseURL}/reports?${queryString}`, {
           headers: this.getHeaders()
       });
       
       return this.handleResponse(response);
   }
   
   async getReport(id) {
       const response = await fetch(`${this.baseURL}/reports/${id}`, {
           headers: this.getHeaders()
       });
       
       return this.handleResponse(response);
   }
   
   async createReport(formData) {
       const response = await fetch(`${this.baseURL}/reports`, {
           method: 'POST',
           headers: {
               'Authorization': `Bearer ${this.token}`
           },
           body: formData
       });
       
       return this.handleResponse(response);
   }
   
   async updateReport(id, data) {
       const response = await fetch(`${this.baseURL}/reports/${id}`, {
           method: 'PATCH',
           headers: this.getHeaders(),
           body: JSON.stringify(data)
       });
       
       return this.handleResponse(response);
   }
   
   async voteReport(id, voteType) {
       const response = await fetch(`${this.baseURL}/reports/${id}/vote`, {
           method: 'POST',
           headers: this.getHeaders(),
           body: JSON.stringify({ voteType })
       });
       
       return this.handleResponse(response);
   }
   
   async addComment(reportId, text) {
       const response = await fetch(`${this.baseURL}/reports/${reportId}/comment`, {
           method: 'POST',
           headers: this.getHeaders(),
           body: JSON.stringify({ text })
       });
       
       return this.handleResponse(response);
   }
   
   async getStatistics() {
       const response = await fetch(`${this.baseURL}/reports/statistics`, {
           headers: this.getHeaders()
       });
       
       return this.handleResponse(response);
   }
   
   async getProfile() {
       const response = await fetch(`${this.baseURL}/auth/me`, {
           headers: this.getHeaders()
       });
       
       return this.handleResponse(response);
   }
   
   async updateProfile(data) {
       const response = await fetch(`${this.baseURL}/users/profile`, {
           method: 'PATCH',
           headers: this.getHeaders(),
           body: JSON.stringify(data)
       });
       
       return this.handleResponse(response);
   }
   
   isAuthenticated() {
       return !!this.token;
   }
   
   getCurrentUser() {
       const userStr = localStorage.getItem('cityfix_user');
       return userStr ? JSON.parse(userStr) : null;
   }
}

const api = new API();
window.api = api;