// CityFix Dashboard - Backend Ready Frontend

// 🔧 API Configuration
const API_CONFIG = {
    BASE_URL: 'http://localhost:3000/api', // Change to your server URL
    ENDPOINTS: {
        DASHBOARD_STATS: '/dashboard/stats',
        RECENT_REPORTS: '/reports/recent',
        REPORTS: '/reports',
        REPORT_BY_ID: '/reports/:id',
        UPDATE_REPORT: '/reports/:id',
        DELETE_REPORT: '/reports/:id',
        DISTRICTS: '/districts',
        REPORT_TYPES: '/report-types',
        ANALYTICS: '/analytics',
        USERS: '/users',
        NOTIFICATIONS: '/notifications'
    }
};

// 🌍 Global State Management
const AppState = {
    currentUser: null,
    dashboardStats: null,
    recentReports: [],
    isLoading: false,
    notifications: [],
    lastUpdate: null
};

// 🔄 API Service Class
class ApiService {
    constructor() {
        this.baseUrl = API_CONFIG.BASE_URL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                // Add Authentication token if required
                // 'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        };

        const config = { ...defaultOptions, ...options };

        try {
            console.log(`🔄 API Request: ${config.method || 'GET'} ${url}`);
            
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('✅ API Response:', data);
            
            return data;
        } catch (error) {
            console.error('❌ API Error:', error);
            this.handleApiError(error);
            throw error;
        }
    }

    handleApiError(error) {
        let message = 'An unexpected error occurred';
        
        if (error.message.includes('Failed to fetch')) {
            message = 'Failed to connect to server. Make sure the server is running.';
        } else if (error.message.includes('404')) {
            message = 'Requested resource not found.';
        } else if (error.message.includes('401')) {
            message = 'Unauthorized access. Please login again.';
        } else if (error.message.includes('500')) {
            message = 'Server error. Please try again later.';
        }
        
        showNotification(message, 'error');
    }

    // Dashboard Stats
    async getDashboardStats() {
        return await this.request(API_CONFIG.ENDPOINTS.DASHBOARD_STATS);
    }

    // Recent Reports
    async getRecentReports(limit = 5) {
        return await this.request(`${API_CONFIG.ENDPOINTS.RECENT_REPORTS}?limit=${limit}`);
    }

    // All Reports with filters
    async getReports(filters = {}) {
        const queryParams = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key]) queryParams.append(key, filters[key]);
        });
        return await this.request(`${API_CONFIG.ENDPOINTS.REPORTS}?${queryParams.toString()}`);
    }

    // Single Report
    async getReportById(id) {
        const endpoint = API_CONFIG.ENDPOINTS.REPORT_BY_ID.replace(':id', id);
        return await this.request(endpoint);
    }

    // Update Report
    async updateReport(id, data) {
        const endpoint = API_CONFIG.ENDPOINTS.UPDATE_REPORT.replace(':id', id);
        return await this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // Delete Report
    async deleteReport(id) {
        const endpoint = API_CONFIG.ENDPOINTS.DELETE_REPORT.replace(':id', id);
        return await this.request(endpoint, { method: 'DELETE' });
    }

    // Notifications
    async getNotifications() {
        return await this.request(API_CONFIG.ENDPOINTS.NOTIFICATIONS);
    }

    // Analytics
    async getAnalytics(timeRange = '7d') {
        return await this.request(`${API_CONFIG.ENDPOINTS.ANALYTICS}?range=${timeRange}`);
    }
}

// Initialize API service
const apiService = new ApiService();

// 🎛️ Dashboard Controller
class DashboardController {
    constructor() {
        this.isInitialized = false;
        this.refreshInterval = null;
    }

    async initialize() {
        console.log('🚀 Initializing CityFix Dashboard');
        
        try {
            showLoading();
            
            // Load initial data
            await this.loadDashboardData();
            
            // Setup UI interactions
            this.setupInteractions();
            
            // Setup auto-refresh
            this.setupAutoRefresh();
            
            // Setup real-time updates (if WebSocket available)
            this.setupRealTimeUpdates();
            
            this.isInitialized = true;
            console.log('✅ Dashboard initialized successfully');
            
        } catch (error) {
            console.error('❌ Dashboard initialization failed:', error);
            showErrorState('Failed to connect to backend server');
        } finally {
            hideLoading();
        }
    }

    async loadDashboardData() {
        console.log('📊 Loading dashboard data from backend...');
        
        // Load data in parallel for better performance
        const [statsResponse, reportsResponse] = await Promise.all([
            this.loadStats(),
            this.loadRecentReports()
        ]);

        AppState.lastUpdate = new Date();
        console.log('✅ Dashboard data loaded successfully from backend');
    }

    async loadStats() {
        try {
            const stats = await apiService.getDashboardStats();
            AppState.dashboardStats = stats.data || stats;
            this.renderStats();
            return stats;
        } catch (error) {
            console.error('❌ Error loading stats:', error);
            showErrorState('Failed to load dashboard statistics');
            throw error;
        }
    }

    async loadRecentReports() {
        try {
            const reports = await apiService.getRecentReports();
            AppState.recentReports = reports.data || reports;
            this.renderRecentReports();
            return reports;
        } catch (error) {
            console.error('❌ Error loading recent reports:', error);
            showErrorState('Failed to load recent reports');
            throw error;
        }
    }

    renderStats() {
        const stats = AppState.dashboardStats;
        if (!stats) return;

        // Update stat cards
        this.updateStatCard('total-reports', stats.totalReports || 0, '+15% from last month');
        this.updateStatCard('in-progress', stats.inProgress || 0, 'Active cases');
        this.updateStatCard('resolved', stats.resolved || 0, `${stats.resolutionRate || 0}% resolution rate`);
        this.updateStatCard('avg-response', stats.avgResponseTime || '0h', `${stats.responseImprovement || 0}min from target`);
    }

    renderRecentReports() {
        const reports = AppState.recentReports;
        if (!reports || !reports.length) return;

        const container = document.querySelector('.reports-list') || 
                         document.querySelector('[data-recent-reports]');
        
        if (!container) {
            console.warn('Recent reports container not found');
            return;
        }

        container.innerHTML = reports.map(report => this.createReportItem(report)).join('');
        
        // Add interactions to new items
        this.addReportInteractions();
    }

    createReportItem(report) {
        const timeAgo = this.formatTimeAgo(report.createdAt || report.date);
        const statusClass = this.getStatusClass(report.status);
        
        return `
            <div class="report-item" data-report-id="${report.id}" data-clickable="true">
                <div class="report-info">
                    <h4>${report.title}</h4>
                    <p>${report.location || report.address}</p>
                    <div class="report-time">${timeAgo}</div>
                </div>
                <span class="report-status ${statusClass}">${this.formatStatus(report.status)}</span>
            </div>
        `;
    }

    updateStatCard(cardId, value, subtitle) {
        // Try multiple selectors to find the stat card
        const selectors = [
            `[data-stat="${cardId}"]`,
            `#${cardId}`,
            `.stat-card:nth-child(${this.getCardIndex(cardId)})`
        ];
        
        let card = null;
        for (const selector of selectors) {
            card = document.querySelector(selector);
            if (card) break;
        }
        
        if (!card) {
            console.warn(`Stat card not found: ${cardId}`);
            return;
        }

        const numberElement = card.querySelector('.stat-number');
        const trendElement = card.querySelector('.stat-trend');

        if (numberElement) {
            this.animateNumber(numberElement, value);
        }
        
        if (trendElement && subtitle) {
            trendElement.textContent = subtitle;
        }
    }

    getCardIndex(cardId) {
        const cardMapping = {
            'total-reports': 1,
            'in-progress': 2,
            'resolved': 3,
            'avg-response': 4
        };
        return cardMapping[cardId] || 1;
    }

    animateNumber(element, targetValue) {
        const currentValue = parseFloat(element.textContent.replace(/[^\d.]/g, '')) || 0;
        const isNumeric = !isNaN(targetValue);
        
        if (!isNumeric) {
            element.textContent = targetValue;
            return;
        }

        const suffix = element.textContent.replace(/[\d.,]/g, '');
        const duration = 1000;
        const steps = 20;
        const increment = (targetValue - currentValue) / steps;
        let current = currentValue;
        let step = 0;

        const animate = () => {
            if (step < steps) {
                current += increment;
                element.textContent = Math.floor(current).toLocaleString() + suffix;
                step++;
                setTimeout(animate, duration / steps);
            } else {
                element.textContent = targetValue.toLocaleString() + suffix;
            }
        };

        animate();
    }

    // 🎭 Interactions
    setupInteractions() {
        this.addStatsInteractions();
        this.addReportInteractions();
        this.addNavigationInteractions();
        this.addGeneralInteractions();
    }

    addStatsInteractions() {
        const statCards = document.querySelectorAll('.stat-card');
        
        statCards.forEach((card, index) => {
            // Add data attribute for identification
            if (!card.dataset.stat) {
                const cardTypes = ['total-reports', 'in-progress', 'resolved', 'avg-response'];
                card.dataset.stat = cardTypes[index] || 'general';
            }

            // Entrance animation
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
            
            // Hover effects
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px) scale(1.02)';
                card.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
                card.style.boxShadow = '';
            });
            
            // Click for detailed view
            card.addEventListener('click', () => {
                this.showStatDetails(card);
            });
        });
    }

    addReportInteractions() {
        const reportItems = document.querySelectorAll('.report-item');
        
        reportItems.forEach((item, index) => {
            // Entrance animation
            item.style.opacity = '0';
            item.style.transform = 'translateX(-20px)';
            
            setTimeout(() => {
                item.style.transition = 'all 0.4s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateX(0)';
            }, 300 + (index * 100));
            
            // Hover effects
            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = '#f8fafc';
                item.style.transform = 'translateX(5px)';
                item.style.cursor = 'pointer';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = '';
                item.style.transform = 'translateX(0)';
            });
            
            // Click to view details
            item.addEventListener('click', () => {
                const reportId = item.dataset.reportId;
                if (reportId) {
                    this.viewReport(reportId);
                }
            });
        });
    }

    addNavigationInteractions() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.icon || 
                            item.getAttribute('href')?.replace('.html', '') ||
                            item.textContent.toLowerCase().trim();
                
                this.handleNavigation(page, item);
            });
        });
    }

    addGeneralInteractions() {
        // Smooth scrolling
        document.documentElement.style.scrollBehavior = 'smooth';
        
        // Button animations
        const buttons = document.querySelectorAll('button, .btn, [onclick]');
        buttons.forEach(button => {
            button.addEventListener('click', function() {
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 150);
            });
        });
        
        // Add entrance animation for main content
        const mainContent = document.querySelector('.content-wrapper, .main-content');
        if (mainContent) {
            mainContent.style.opacity = '0';
            mainContent.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                mainContent.style.transition = 'all 0.6s ease';
                mainContent.style.opacity = '1';
                mainContent.style.transform = 'translateY(0)';
            }, 100);
        }
    }

    // 🚀 Actions
    async viewReport(reportId) {
        try {
            console.log(`🔍 Viewing report: ${reportId}`);
            
            // Navigate to report details page
            window.location.href = `ReportsDetails.html?id=${reportId}`;
            
        } catch (error) {
            console.error('Error viewing report:', error);
            showNotification('Error loading report details', 'error');
        }
    }

    async editReport(reportId) {
        try {
            console.log(`✏️ Editing report: ${reportId}`);
            
            // Navigate to edit page or show modal
            window.location.href = `ReportsDetails.html?id=${reportId}&mode=edit`;
            
        } catch (error) {
            console.error('Error editing report:', error);
            showNotification('Error opening report editor', 'error');
        }
    }

    async showStatDetails(card) {
        const statType = card.dataset.stat || 'general';
        
        try {
            // Load detailed analytics for this stat
            const analytics = await apiService.getAnalytics();
            console.log(`📊 Loading detailed ${statType} analytics:`, analytics);
            
            // Navigate to analytics page with filter
            window.location.href = `analytics.html?filter=${statType}`;
            
        } catch (error) {
            console.error('Error loading stat details:', error);
            showNotification('Error loading detailed analytics', 'error');
        }
    }

    handleNavigation(page, navItem) {
        // Update active navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        navItem.classList.add('active');

        // Navigate based on page
        const pageUrls = {
            'dashboard': 'dashboard.html',
            'reports': 'Reports.html',
            'analytics': 'analytics.html',
            'team': 'team.html',
            'notifications': 'notifications.html',
            'settings': 'settings.html'
        };

        const url = pageUrls[page];
        if (url) {
            window.location.href = url;
        } else {
            showNotification(`${page} section coming soon!`, 'info');
        }
    }

    // 🔄 Auto Refresh
    setupAutoRefresh() {
        // Refresh dashboard data every 30 seconds
        this.refreshInterval = setInterval(async () => {
            try {
                await this.loadDashboardData();
                console.log('🔄 Dashboard data refreshed');
            } catch (error) {
                console.error('Error refreshing dashboard:', error);
            }
        }, 30000);
    }

    // 📡 Real-time Updates (WebSocket)
    setupRealTimeUpdates() {
        // WebSocket connection for real-time updates
        try {
            const wsUrl = API_CONFIG.BASE_URL.replace('http', 'ws') + '/ws';
            const ws = new WebSocket(wsUrl);
            
            ws.onopen = () => {
                console.log('📡 WebSocket connected');
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleRealTimeUpdate(data);
            };
            
            ws.onerror = () => {
                console.warn('⚠️ WebSocket connection failed - using polling instead');
            };
            
        } catch (error) {
            console.warn('⚠️ WebSocket not available - using polling instead');
        }
    }

    handleRealTimeUpdate(data) {
        switch (data.type) {
            case 'new_report':
                this.addNewReport(data.report);
                break;
            case 'report_updated':
                this.updateReport(data.report);
                break;
            case 'stats_updated':
                this.updateStats(data.stats);
                break;
        }
    }

    addNewReport(report) {
        const container = document.querySelector('.reports-list');
        if (!container) return;
        
        const reportHTML = this.createReportItem(report);
        container.insertAdjacentHTML('afterbegin', reportHTML);
        
        // Add interactions to new item
        const newItem = container.firstElementChild;
        this.addReportInteractions();
        
        // Show notification
        showNotification('New report received!', 'info');
    }

    // 🔧 Utility Functions
    formatTimeAgo(date) {
        const now = new Date();
        const reportDate = new Date(date);
        const diffMs = now - reportDate;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }

    getStatusClass(status) {
        const statusClasses = {
            'new': 'new',
            'in-progress': 'progress', 
            'pending': 'pending',
            'resolved': 'resolved',
            'closed': 'closed'
        };
        return statusClasses[status] || 'new';
    }

    formatStatus(status) {
        const statusNames = {
            'new': 'New',
            'in-progress': 'In Progress',
            'pending': 'Pending', 
            'resolved': 'Resolved',
            'closed': 'Closed'
        };
        return statusNames[status] || 'New';
    }

    // 🧹 Cleanup
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
}

// 🔧 UI Helper Functions
function showLoading() {
    const loader = document.createElement('div');
    loader.className = 'dashboard-loading';
    loader.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
                    background: rgba(255,255,255,0.9); display: flex; 
                    align-items: center; justify-content: center; z-index: 2000;">
            <div style="text-align: center;">
                <div class="spinner"></div>
                <div style="margin-top: 15px; color: #666;">Loading dashboard...</div>
            </div>
        </div>
    `;
    document.body.appendChild(loader);
}

function hideLoading() {
    const loader = document.querySelector('.dashboard-loading');
    if (loader) {
        loader.remove();
    }
}

function showErrorState(message) {
    const mainContent = document.querySelector('.content-wrapper, .main-content');
    if (!mainContent) return;
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-state';
    errorDiv.innerHTML = `
        <div style="text-align: center; padding: 50px; color: #666;">
            <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
            <h3 style="color: #dc2626; margin-bottom: 10px;">Backend Connection Error</h3>
            <p style="margin-bottom: 20px;">${message}</p>
            <div style="margin-bottom: 20px; padding: 15px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; text-align: left;">
                <h4 style="color: #991b1b; margin-bottom: 10px;">Required Backend Endpoints:</h4>
                <ul style="color: #7f1d1d; font-family: monospace; font-size: 14px;">
                    <li>GET ${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DASHBOARD_STATS}</li>
                    <li>GET ${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RECENT_REPORTS}</li>
                    <li>GET ${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REPORTS}</li>
                </ul>
            </div>
            <button onclick="dashboard.initialize()" style="
                margin-top: 20px; padding: 12px 24px; background: #dc2626; 
                color: white; border: none; border-radius: 6px; cursor: pointer;
                font-weight: 500; transition: all 0.2s ease;
            " onmouseover="this.style.background='#b91c1c'" 
               onmouseout="this.style.background='#dc2626'">🔄 Retry Connection</button>
        </div>
    `;
    
    // Clear existing content and show error
    mainContent.innerHTML = '';
    mainContent.appendChild(errorDiv);
}

function showNotification(message, type = 'info') {
    const colors = {
        success: '#10b981',
        info: '#3b82f6', 
        warning: '#f59e0b',
        error: '#ef4444'
    };
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; background: ${colors[type]};
        color: white; padding: 15px 20px; border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2); z-index: 10001;
        opacity: 0; transform: translateX(100%); transition: all 0.3s ease;
        max-width: 350px;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// 🎨 Add Dashboard Styles
function addDashboardStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3b82f6;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        
        .stat-card, .report-item, .nav-item {
            transition: all 0.3s ease;
        }
        
        button, .btn {
            transition: transform 0.15s ease;
        }
        
        .report-item:hover {
            cursor: pointer;
        }
        
        .stat-card:hover {
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);
}

// 🔧 Legacy Functions (for compatibility with existing HTML)
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    if (sidebar && overlay) {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    if (sidebar && overlay) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }
}

function setActive(element) {
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to clicked item
    element.classList.add('active');
}

// 🚀 Initialize Dashboard
const dashboard = new DashboardController();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    addDashboardStyles();
    dashboard.initialize();
});

// Global access for debugging and HTML compatibility
window.dashboard = dashboard;
window.apiService = apiService;
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.setActive = setActive;

console.log('✨ CityFix Dashboard - Backend Ready Version Loaded!');