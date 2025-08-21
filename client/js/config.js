// client/js/config.js
// Centralized configuration for all frontend files

const CONFIG = {
    // API Configuration
    API_BASE: 'http://localhost:5000',
    
    // API Endpoints
    ENDPOINTS: {
        // Auth
        LOGIN: '/api/auth/login',
        SIGNUP: '/api/auth/signup',
        LOGOUT: '/api/auth/logout',
        VERIFY: '/api/auth/verify',
        FORGOT_PASSWORD: '/api/auth/forgotpassword',
        
        // Reports
        REPORTS: '/api/reports',
        REPORT_STATS: '/api/reports/statistics',
        REPORT_COUNT: '/api/reports/count',
        
        // Users
        USER_PROFILE: '/api/users/profile',
        USER_UPDATE: '/api/users/update',
        
        // Admin
        ADMIN_DASHBOARD: '/api/admin/dashboard',
        ADMIN_USERS: '/api/admin/users',
        
        // Misc
        HEALTH: '/api/health',
        DISTRICTS: '/api/districts'
    },
    
    // Storage Keys
    STORAGE: {
        TOKEN: 'cityfix_token',
        USER: 'cityfix_user',
        REMEMBER: 'cityfix_remember',
        THEME: 'cityfix_theme'
    },
    
    // Google Maps
    GOOGLE_MAPS_KEY: 'AIzaSyC6jZx_eYnWWpBMMGEIVdNwmlNgWbfDqtM',
    
    // File Upload
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_FILE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    
    // UI Settings
    TOAST_DURATION: 3000,
    LOADING_DELAY: 300,
    
    // Validation
    MIN_PASSWORD_LENGTH: 6,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

// Helper function to get full API URL
function getApiUrl(endpoint) {
    return CONFIG.API_BASE + endpoint;
}

// Helper function to get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem(CONFIG.STORAGE.TOKEN) || 
                  sessionStorage.getItem(CONFIG.STORAGE.TOKEN);
    
    return token ? {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    } : {
        'Content-Type': 'application/json'
    };
}

// Check if user is authenticated
function isAuthenticated() {
    const token = localStorage.getItem(CONFIG.STORAGE.TOKEN) || 
                  sessionStorage.getItem(CONFIG.STORAGE.TOKEN);
    return !!token;
}

// Get current user
function getCurrentUser() {
    const userStr = localStorage.getItem(CONFIG.STORAGE.USER) || 
                    sessionStorage.getItem(CONFIG.STORAGE.USER);
    try {
        return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        return null;
    }
}

// Make API request with error handling
async function apiRequest(endpoint, options = {}) {
    try {
        const url = getApiUrl(endpoint);
        const response = await fetch(url, {
            ...options,
            headers: {
                ...getAuthHeaders(),
                ...options.headers
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || `Request failed: ${response.status}`);
        }
        
        return data;
        
    } catch (error) {
        console.error('API Request Error:', error);
        
        // Handle network errors
        if (error.message.includes('fetch')) {
            throw new Error('Cannot connect to server. Please check if backend is running.');
        }
        
        throw error;
    }
}

// Export for use in other files
window.CityFixConfig = CONFIG;
window.getApiUrl = getApiUrl;
window.getAuthHeaders = getAuthHeaders;
window.isAuthenticated = isAuthenticated;
window.getCurrentUser = getCurrentUser;
window.apiRequest = apiRequest;