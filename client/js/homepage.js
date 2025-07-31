// CityFix Homepage - Backend Only (No Fallback Data)

// ==========================================
// BACKEND DATA REQUIREMENTS DOCUMENTATION
// ==========================================

/*
REQUIRED BACKEND ENDPOINTS AND RESPONSE FORMATS:

1. GET /api/health
   Response: { "status": "ok", "timestamp": "2025-01-15T10:30:00Z" }

2. GET /api/dashboard/stats
   Response: {
     "success": true,
     "data": {
       "totalReports": 15234,
       "resolved": 12847,
       "inProgress": 2387,
       "resolutionRate": 84,
       "avgResponseTime": "4.2h",
       "weeklyTrend": "+12%"
     }
   }

3. GET /api/reports/markers?startDate=01/01/2025&endDate=01/15/2025&district=downtown&issueTypes=potholes,lighting
   Response: {
     "success": true,
     "data": [
       {
         "id": 1,
         "lat": 32.0853,
         "lng": 34.7818,
         "title": "Broken Streetlight",
         "description": "Street light not working on main road",
         "type": "lighting",
         "status": "new", // new, in-progress, pending, resolved
         "createdAt": "2025-01-15T10:30:00Z",
         "address": "Main St & 5th Ave"
       }
     ]
   }

4. GET /api/districts/stats
   Response: {
     "success": true,
     "data": {
       "downtown": { "name": "Downtown", "reports": 4521, "resolved": 3846, "pending": 675 },
       "north": { "name": "North District", "reports": 2834, "resolved": 2456, "pending": 378 }
     }
   }

5. GET /api/issues/stats
   Response: {
     "success": true,
     "data": {
       "potholes": { "name": "Potholes", "count": 5423, "resolved": 4230, "pending": 1193 },
       "lighting": { "name": "Street Lighting", "count": 3891, "resolved": 3579, "pending": 312 }
     }
   }

ALL ENDPOINTS MUST RETURN REAL DATA - NO FALLBACK DATA IS USED.
IF BACKEND IS NOT AVAILABLE, ERROR MESSAGES WILL BE SHOWN.
*/
const API_CONFIG = {
    BASE_URL: 'http://localhost:3000/api', // Change to your server URL
    ENDPOINTS: {
        DASHBOARD_STATS: '/dashboard/stats',
        RECENT_REPORTS: '/reports/recent',
        REPORTS: '/reports',
        REPORTS_BY_LOCATION: '/reports/location',
        DISTRICT_STATS: '/districts/stats',
        ISSUE_TYPE_STATS: '/issues/stats',
        MAP_MARKERS: '/reports/markers',
        SUBMIT_REPORT: '/reports',
        HEALTH: '/health'
    }
};

// 🗺️ Google Maps Configuration
const GOOGLE_MAPS_CONFIG = {
    API_KEY: 'AIzaSyC6jZx_eYnWWpBMMGEIVdNwmlNgWbfDqtM', // Your API key
    DEFAULT_CENTER: { lat: 32.0853, lng: 34.7818 }, // Rosh HaAyin coordinates
    DEFAULT_ZOOM: 13,
    MAP_STYLES: [
        {
            "featureType": "poi",
            "elementType": "labels",
            "stylers": [{"visibility": "off"}]
        },
        {
            "featureType": "transit",
            "elementType": "labels",
            "stylers": [{"visibility": "off"}]
        }
    ]
};

// 🌍 Global State Management
const AppState = {
    currentUser: null,
    dashboardStats: null,
    recentReports: [],
    mapMarkers: [],
    isLoading: false,
    notifications: [],
    lastUpdate: null,
    googleMap: null,
    markersArray: [],
    backendAvailable: false
};

// Global variables for filters
let isFilterApplied = false;
let currentFilters = {
    startDate: '',
    endDate: '',
    district: '',
    issueTypes: ['potholes', 'lighting', 'drainage']
};

// 📄 PDF Export Utilities
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function loadPDFLibrary() {
    if (typeof window.jspdf === 'undefined') {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    }
    if (typeof html2canvas === 'undefined') {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    }
}

// 🔄 API Service Class
class ApiService {
    constructor() {
        this.baseUrl = API_CONFIG.BASE_URL;
        this.backendAvailable = false;
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
            
            this.backendAvailable = true;
            AppState.backendAvailable = true;
            
            return data;
        } catch (error) {
            console.error('❌ Backend connection failed:', error.message);
            this.backendAvailable = false;
            AppState.backendAvailable = false;
            throw error;
        }
    }

    // API Methods
    async getDashboardStats() {
        return await this.request(API_CONFIG.ENDPOINTS.DASHBOARD_STATS);
    }

    async getMapMarkers(filters = {}) {
        const queryParams = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                if (Array.isArray(filters[key])) {
                    filters[key].forEach(value => queryParams.append(key, value));
                } else {
                    queryParams.append(key, filters[key]);
                }
            }
        });
        return await this.request(`${API_CONFIG.ENDPOINTS.MAP_MARKERS}?${queryParams.toString()}`);
    }

    async getDistrictStats() {
        return await this.request(API_CONFIG.ENDPOINTS.DISTRICT_STATS);
    }

    async getIssueTypeStats() {
        return await this.request(API_CONFIG.ENDPOINTS.ISSUE_TYPE_STATS);
    }

    async submitReport(reportData) {
        return await this.request(API_CONFIG.ENDPOINTS.SUBMIT_REPORT, {
            method: 'POST',
            body: JSON.stringify(reportData)
        });
    }

    // Check backend availability
    async checkBackendHealth() {
        try {
            const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.HEALTH}`, { 
                method: 'GET',
                timeout: 5000 
            });
            this.backendAvailable = response.ok;
            AppState.backendAvailable = response.ok;
            return response.ok;
        } catch (error) {
            this.backendAvailable = false;
            AppState.backendAvailable = false;
            return false;
        }
    }
}

// Initialize API service
const apiService = new ApiService();

// 🗺️ Google Maps Integration
class GoogleMapsController {
    constructor() {
        this.map = null;
        this.markers = [];
        this.infoWindow = null;
        this.isInitialized = false;
    }

    async initializeMap() {
        try {
            // Wait for Google Maps to be available
            if (typeof google === 'undefined' || !google.maps) {
                console.warn('Google Maps API not loaded yet, retrying...');
                setTimeout(() => this.initializeMap(), 1000);
                return;
            }

            const mapContainer = document.querySelector('.map-container');
            if (!mapContainer) {
                console.warn('Map container not found');
                return;
            }

            console.log('🗺️ Initializing Google Maps...');

            // Replace placeholder image with Google Maps
            mapContainer.innerHTML = '';
            mapContainer.style.height = '320px';
            mapContainer.style.width = '100%';

            // Initialize Google Map
            const mapOptions = {
                center: GOOGLE_MAPS_CONFIG.DEFAULT_CENTER,
                zoom: GOOGLE_MAPS_CONFIG.DEFAULT_ZOOM,
                styles: GOOGLE_MAPS_CONFIG.MAP_STYLES,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true,
                zoomControl: true,
                scrollwheel: true,
                disableDoubleClickZoom: false
            };

            this.map = new google.maps.Map(mapContainer, mapOptions);
            this.infoWindow = new google.maps.InfoWindow();

            AppState.googleMap = this.map;
            this.isInitialized = true;

            // Load markers from backend only
            await this.loadMapMarkers();

            console.log('✅ Google Maps initialized successfully');
            
        } catch (error) {
            console.error('❌ Error initializing Google Maps:', error);
            this.showMapFallback();
        }
    }

    async loadMapMarkers() {
        try {
            console.log('📍 Loading map markers from backend...');
            const response = await apiService.getMapMarkers(currentFilters);
            
            if (response && response.data && Array.isArray(response.data)) {
                const markers = response.data;

                // Clear existing markers
                this.clearMarkers();

                // Add new markers
                markers.forEach(markerData => {
                    this.addMarker(markerData);
                });

                AppState.mapMarkers = markers;
                console.log(`📍 Loaded ${markers.length} markers from backend`);

                // Fit map to markers if we have any
                if (markers.length > 0 && this.map) {
                    this.fitMapToMarkers();
                }
            } else {
                throw new Error('Invalid markers response from backend');
            }

        } catch (error) {
            console.error('❌ Failed to load map markers from backend:', error);
            // Clear markers and show error state
            this.clearMarkers();
            this.showMapError();
        }
    }

    addMarker(markerData) {
        if (!this.map) return;

        const marker = new google.maps.Marker({
            position: { lat: markerData.lat, lng: markerData.lng },
            map: this.map,
            title: markerData.title,
            icon: this.getMarkerIcon(markerData.type, markerData.status),
            animation: google.maps.Animation.DROP
        });

        // Add click listener to show info
        marker.addListener('click', () => {
            this.showMarkerInfo(marker, markerData);
        });

        this.markers.push(marker);
    }

    getMarkerIcon(type, status) {
        const colors = {
            'potholes': '#ff6b35',
            'lighting': '#ffd23f',
            'drainage': '#4dabf7',
            'traffic': '#28a745',
            'sidewalk': '#6f42c1',
            'default': '#868e96'
        };

        const statusSizes = {
            'new': 8,
            'in-progress': 6,
            'pending': 6,
            'resolved': 4
        };

        const color = colors[type] || colors.default;
        const size = statusSizes[status] || 6;

        return {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: color,
            fillOpacity: 0.8,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: size
        };
    }

    showMarkerInfo(marker, data) {
        const statusColor = {
            'new': '#dc3545',
            'in-progress': '#ffc107',
            'pending': '#fd7e14',
            'resolved': '#28a745'
        };

        const timeAgo = this.formatTimeAgo(data.createdAt);

        const content = `
            <div style="max-width: 300px; font-family: Arial, sans-serif;">
                <h4 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">${data.title}</h4>
                <p style="margin: 0 0 6px 0; color: #666; font-size: 14px;">${data.description || ''}</p>
                <div style="margin: 8px 0;">
                    <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; 
                                 background: ${statusColor[data.status] || '#6c757d'}; color: white; 
                                 font-size: 12px; font-weight: bold; text-transform: uppercase;">
                        ${data.status}
                    </span>
                </div>
                <p style="margin: 4px 0; color: #666; font-size: 13px;">
                    <strong>Type:</strong> ${data.type.charAt(0).toUpperCase() + data.type.slice(1)}
                </p>
                <p style="margin: 4px 0; color: #666; font-size: 13px;">
                    <strong>Location:</strong> ${data.address || `${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}`}
                </p>
                <p style="margin: 4px 0 0 0; color: #999; font-size: 12px;">
                    <strong>Reported:</strong> ${timeAgo}
                </p>
            </div>
        `;

        this.infoWindow.setContent(content);
        this.infoWindow.open(this.map, marker);
    }

    formatTimeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else if (diffHours > 0) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else {
            const diffMins = Math.floor(diffMs / (1000 * 60));
            return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        }
    }

    fitMapToMarkers() {
        if (this.markers.length === 0 || !this.map) return;

        const bounds = new google.maps.LatLngBounds();
        this.markers.forEach(marker => {
            bounds.extend(marker.getPosition());
        });

        this.map.fitBounds(bounds);

        // Don't zoom in too much for a single marker
        google.maps.event.addListenerOnce(this.map, 'bounds_changed', () => {
            if (this.map.getZoom() > 15) {
                this.map.setZoom(15);
            }
        });
    }

    clearMarkers() {
        this.markers.forEach(marker => {
            marker.setMap(null);
        });
        this.markers = [];
    }

    showMapFallback() {
        const mapContainer = document.querySelector('.map-container');
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; 
                           height: 320px; background: #f8f9fa; border-radius: 8px; 
                           border: 2px dashed #dee2e6;">
                    <div style="text-align: center; color: #6c757d;">
                        <div style="font-size: 48px; margin-bottom: 16px;">🗺️</div>
                        <h3 style="margin: 0 0 8px 0;">Google Maps Loading...</h3>
                        <p style="margin: 0;">Please wait for the map to initialize</p>
                        <button onclick="mapsController.retryMapInitialization()" 
                                style="margin-top: 12px; padding: 8px 16px; background: #007bff; 
                                       color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Retry
                        </button>
                    </div>
                </div>
            `;
        }
    }

    showMapError() {
        const mapContainer = document.querySelector('.map-container');
        if (mapContainer) {
            const errorOverlay = document.createElement('div');
            errorOverlay.className = 'map-error-overlay';
            errorOverlay.innerHTML = `
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                           background: rgba(220, 53, 69, 0.9); color: white; padding: 12px 20px;
                           border-radius: 8px; text-align: center; z-index: 1000;">
                    <div style="font-size: 24px; margin-bottom: 8px;">⚠️</div>
                    <div>Failed to load markers from backend</div>
                </div>
            `;
            
            // Remove existing error overlay if any
            const existingOverlay = mapContainer.querySelector('.map-error-overlay');
            if (existingOverlay) {
                existingOverlay.remove();
            }
            
            mapContainer.appendChild(errorOverlay);
            
            // Remove overlay after 5 seconds
            setTimeout(() => {
                if (errorOverlay.parentNode) {
                    errorOverlay.remove();
                }
            }, 5000);
        }
    }

    retryMapInitialization() {
        console.log('🔄 Retrying Google Maps initialization...');
        setTimeout(() => {
            this.initializeMap();
        }, 1000);
    }

    updateMapWithFilters() {
        if (this.map && this.isInitialized) {
            this.loadMapMarkers();
        }
    }
}

// Initialize Maps Controller
const mapsController = new GoogleMapsController();

// 🎛️ Homepage Controller
class HomepageController {
    constructor() {
        this.isInitialized = false;
        this.refreshInterval = null;
    }

    async initialize() {
        console.log('🚀 Initializing CityFix Homepage');
        
        try {
            // Load PDF library early
            await loadPDFLibrary();
            console.log('✅ PDF library loaded');
            
            // Clear all hardcoded values first
            this.clearAllMapStats();
            
            // Setup UI interactions first
            this.setupInteractions();
            
            // Check backend availability first
            const backendHealthy = await apiService.checkBackendHealth();
            
            if (!backendHealthy) {
                throw new Error('Backend health check failed');
            }
            
            console.log('✅ Backend is healthy');
            
            // Load data from backend only
            await this.loadDashboardData();
            
            // Initialize Google Maps
            this.initializeGoogleMapsWithRetry();
            
            // Setup auto-refresh since backend is available
            this.setupAutoRefresh();
            
            this.isInitialized = true;
            console.log('✅ Homepage initialized successfully with backend data');
            
        } catch (error) {
            console.error('❌ Homepage initialization failed:', error);
            this.showBackendError();
            
            // Still try to initialize maps without data
            this.initializeGoogleMapsWithRetry();
        }
    }

    async initializeGoogleMapsWithRetry() {
        let retries = 0;
        const maxRetries = 10;
        
        const tryInitialize = async () => {
            if (typeof google !== 'undefined' && google.maps) {
                await mapsController.initializeMap();
                return;
            }
            
            retries++;
            if (retries < maxRetries) {
                console.log(`⏳ Waiting for Google Maps API... (${retries}/${maxRetries})`);
                setTimeout(tryInitialize, 1000);
            } else {
                console.warn('❌ Google Maps API failed to load, showing fallback');
                mapsController.showMapFallback();
            }
        };
        
        tryInitialize();
    }

    async loadDashboardData() {
        try {
            console.log('📊 Loading data from backend...');
            
            // Only load data from backend - no fallback
            const statsResponse = await apiService.getDashboardStats();
            if (statsResponse && statsResponse.success && statsResponse.data) {
                AppState.dashboardStats = statsResponse.data;
                this.updateStatsDisplay();
                console.log('✅ Dashboard stats loaded from backend');
            } else {
                throw new Error('Invalid stats response from backend');
            }

            // Load map stats from backend
            await this.loadMapStats();

            AppState.lastUpdate = new Date();
            console.log('✅ All dashboard data loaded from backend');

        } catch (error) {
            console.error('❌ Failed to load data from backend:', error);
            this.showBackendError();
        }
    }

    showBackendError() {
        // Show backend connection error
        const statsCards = document.querySelectorAll('.stat-card .stat-number');
        statsCards.forEach(card => {
            card.textContent = '--';
            card.style.color = '#dc3545';
        });

        // Show error message
        this.showNotification('⚠️ Backend connection failed. Please ensure the server is running.', 'error');
    }

    clearMapStats() {
        // Clear map stats to show loading state
        const mapStatCards = document.querySelectorAll('.map-stat-card .map-stat-content');
        mapStatCards.forEach(card => {
            card.innerHTML = '<div class="resolution-percentage">--</div>';
        });
    }

    updateStatsDisplay() {
        const stats = AppState.dashboardStats;
        
        if (!stats) {
            console.warn('No stats data available');
            return;
        }
        
        // Update stat numbers with animation - only if data exists
        if (stats.totalReports !== undefined) {
            this.animateCounter('.stat-card:nth-child(1) .stat-number', stats.totalReports);
        }
        if (stats.resolved !== undefined) {
            this.animateCounter('.stat-card:nth-child(2) .stat-number', stats.resolved);
        }
        if (stats.inProgress !== undefined) {
            this.animateCounter('.stat-card:nth-child(3) .stat-number', stats.inProgress);
        }
        
        console.log('📊 Stats display updated with backend data');
    }

    async loadMapStats() {
        try {
            console.log('📊 Loading map stats from backend...');
            
            const [districtStats, issueStats] = await Promise.all([
                apiService.getDistrictStats(),
                apiService.getIssueTypeStats()
            ]);

            if (districtStats && districtStats.success && districtStats.data && 
                issueStats && issueStats.success && issueStats.data) {
                this.updateMapStatsDisplay(districtStats.data, issueStats.data);
                console.log('✅ Map stats loaded from backend');
            } else {
                throw new Error('Invalid map stats response from backend');
            }
            
        } catch (error) {
            console.error('❌ Failed to load map stats from backend:', error);
            // Clear map stats to show loading state
            this.clearMapStats();
        }
    }

    updateMapStatsDisplay(districtData, issueData) {
        const mapStatCards = document.querySelectorAll('.map-stat-card .map-stat-content');
        
        if (mapStatCards.length >= 4 && districtData && issueData) {
            // Active district - only show if data exists
            const activeDistrict = currentFilters.district || 'downtown';
            if (districtData[activeDistrict]) {
                const districtName = districtData[activeDistrict].name;
                mapStatCards[0].innerHTML = `<div class="resolution-percentage">${districtName}</div>`;
            }

            // Top issue type - calculate from real data
            let topIssue = '';
            let maxCount = 0;
            Object.keys(issueData).forEach(issueType => {
                if (currentFilters.issueTypes.includes(issueType) && issueData[issueType].count > maxCount) {
                    maxCount = issueData[issueType].count;
                    topIssue = issueData[issueType].name;
                }
            });
            
            if (topIssue) {
                mapStatCards[1].innerHTML = `<div class="resolution-percentage">${topIssue}</div>`;
            }

            // Calculate real resolution rate from data
            let totalCount = 0;
            let totalResolved = 0;
            Object.keys(issueData).forEach(issueType => {
                if (currentFilters.issueTypes.includes(issueType)) {
                    totalCount += issueData[issueType].count || 0;
                    totalResolved += issueData[issueType].resolved || 0;
                }
            });
            
            if (totalCount > 0) {
                const resolutionRate = Math.round((totalResolved / totalCount) * 100);
                mapStatCards[2].innerHTML = `<div class="resolution-percentage">${resolutionRate}%</div>`;
            }

            // Weekly trend - use backend data if available
            if (AppState.dashboardStats && AppState.dashboardStats.weeklyTrend) {
                mapStatCards[3].innerHTML = `<div class="resolution-percentage">${AppState.dashboardStats.weeklyTrend}</div>`;
            }
        }
        
        console.log('📊 Map stats updated with backend data');
    }

    // Clear all map stats on initialization to remove hardcoded values
    clearAllMapStats() {
        const mapStatCards = document.querySelectorAll('.map-stat-card .map-stat-content, .resolution-percentage');
        mapStatCards.forEach(card => {
            card.innerHTML = '--';
            card.style.color = '#dc3545';
        });
        
        // Also clear any hardcoded text in HTML
        const resolutionCards = document.querySelectorAll('.map-stat-card');
        resolutionCards.forEach(card => {
            const content = card.querySelector('.map-stat-content') || card.querySelector('.resolution-percentage');
            if (content) {
                content.innerHTML = '--';
                content.style.color = '#dc3545';
            }
        });
        
        console.log('🗑️ Cleared all hardcoded map stats');
    }

    setupInteractions() {
        this.initializeDateValidation();
        this.initializeFilters();
        this.initializeMobileMenu();
        this.initializeIssueCards();
        this.initializeMapActions();
        this.initializeCounterAnimations();
    }

    initializeDateValidation() {
        const dateInputs = document.querySelectorAll('.date-input');
        dateInputs.forEach((input, index) => {
            input.type = 'text';
            input.maxLength = 10;
            input.placeholder = index === 0 ? 'Start Date (mm/dd/yyyy)' : 'End Date (mm/dd/yyyy)';
            
            input.addEventListener('input', this.handleDateInput.bind(this));
            input.addEventListener('blur', this.handleDateBlur.bind(this));
        });
    }

    handleDateInput(event) {
        const input = event.target;
        let value = input.value.replace(/\D/g, '');
        
        // Format as mm/dd/yyyy
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2);
        }
        if (value.length >= 5) {
            value = value.substring(0, 5) + '/' + value.substring(5, 9);
        }
        
        input.value = value;
        
        // Validate if complete
        if (value.length === 10) {
            this.validateDate(input);
        }
    }

    handleDateBlur(event) {
        const input = event.target;
        if (input.value && input.value.length === 10) {
            if (this.validateDate(input)) {
                this.updateFilters();
            }
        }
    }

    validateDate(input) {
        const value = input.value;
        const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
        
        if (!dateRegex.test(value)) {
            this.showValidationError(input, 'Invalid date format');
            return false;
        }

        const [month, day, year] = value.split('/').map(Number);
        const date = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        if (date > today) {
            this.showValidationError(input, 'Date cannot be in the future');
            return false;
        }

        this.clearValidationError(input);
        return true;
    }

    showValidationError(input, message) {
        this.clearValidationError(input);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'date-validation error';
        errorDiv.textContent = message;
        errorDiv.style.color = '#ef4444';
        errorDiv.style.fontSize = '12px';
        errorDiv.style.marginTop = '4px';
        
        input.style.borderColor = '#ef4444';
        input.parentNode.appendChild(errorDiv);
    }

    clearValidationError(input) {
        const error = input.parentNode.querySelector('.date-validation');
        if (error) error.remove();
        input.style.borderColor = '';
    }

    initializeFilters() {
        const districtSelect = document.querySelector('.district-select');
        const checkboxes = document.querySelectorAll('input[name="issue-type"]');
        
        if (districtSelect) {
            districtSelect.addEventListener('change', () => this.updateFilters());
        }
        
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateFilters());
        });
    }

    updateFilters() {
        // Update current filters
        const dateInputs = document.querySelectorAll('.date-input');
        const districtSelect = document.querySelector('.district-select');
        const checkedBoxes = document.querySelectorAll('input[name="issue-type"]:checked');
        
        currentFilters.startDate = dateInputs[0]?.value || '';
        currentFilters.endDate = dateInputs[1]?.value || '';
        currentFilters.district = districtSelect?.value || '';
        currentFilters.issueTypes = Array.from(checkedBoxes).map(cb => cb.value);

        // Update map and stats
        if (mapsController.map && mapsController.isInitialized) {
            mapsController.updateMapWithFilters();
        }
        
        this.loadMapStats();
        
        console.log('🔄 Filters updated:', currentFilters);
    }

    initializeMobileMenu() {
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const mobileNav = document.querySelector('.mobile-nav');
        
        if (mobileMenuBtn && mobileNav) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileNav.classList.toggle('active');
                mobileMenuBtn.classList.toggle('active');
            });

            // Close mobile menu when clicking outside
            document.addEventListener('click', (event) => {
                if (!mobileMenuBtn.contains(event.target) && !mobileNav.contains(event.target)) {
                    mobileNav.classList.remove('active');
                    mobileMenuBtn.classList.remove('active');
                }
            });
        }
    }

    initializeIssueCards() {
        const issueCards = document.querySelectorAll('.issue-card');
        issueCards.forEach(card => {
            card.addEventListener('click', () => {
                const issueType = card.classList.contains('pothole-card') ? 'potholes' :
                                card.classList.contains('lighting-card') ? 'lighting' :
                                card.classList.contains('drainage-card') ? 'drainage' : 'general';
                
                // Navigate to submit report page with pre-selected issue type
                window.location.href = `SubmitReport.html?type=${issueType}`;
            });

            // Add hover effects
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px)';
                card.style.cursor = 'pointer';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });
        });
    }

    initializeMapActions() {
        const shareBtn = document.querySelector('.share-report-btn');
        const exportBtn = document.querySelector('.export-pdf-btn');
        
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.handleShareReport());
        }
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.handleExportPDF());
        }
    }

    handleShareReport() {
        const shareUrl = window.location.href;
        if (navigator.share) {
            navigator.share({
                title: 'CityFix Community Report',
                text: 'Check out this community report on CityFix!',
                url: shareUrl
            });
        } else {
            // Fallback - copy to clipboard
            navigator.clipboard.writeText(shareUrl).then(() => {
                this.showNotification('Report link copied to clipboard!', 'success');
            }).catch(() => {
                this.showNotification('Unable to copy link', 'error');
            });
        }
    }

    // 📄 Backend-Only PDF Export Function
    async handleExportPDF() {
        try {
            this.showNotification('Preparing PDF export...', 'info');
            
            // Check backend availability first
            const backendHealthy = await apiService.checkBackendHealth();
            if (!backendHealthy) {
                throw new Error('Backend server is not available');
            }
            
            // Ensure PDF library is loaded
            await loadPDFLibrary();
            
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            let yPosition = 20;
            
            // Add header
            pdf.setFontSize(24);
            pdf.setTextColor(79, 70, 229);
            pdf.text('CityFix', 20, yPosition);
            
            pdf.setFontSize(16);
            pdf.setTextColor(124, 58, 237);
            pdf.text('Community Report Dashboard', 20, yPosition + 10);
            
            yPosition += 25;
            
            // Add report metadata
            pdf.setFontSize(12);
            pdf.setTextColor(100, 116, 139);
            pdf.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, yPosition);
            pdf.text(`Location: Rosh HaAyin, Central District, IL`, 20, yPosition + 6);
            
            yPosition += 20;
            
            // Get stats from backend ONLY
            this.showNotification('Loading statistics from backend...', 'info');
            const statsResponse = await apiService.getDashboardStats();
            if (!statsResponse || !statsResponse.success || !statsResponse.data) {
                throw new Error('Failed to load statistics from backend');
            }
            
            const stats = statsResponse.data;
            console.log('✅ PDF using backend statistics data');
            
            // Add main statistics section
            pdf.setFontSize(18);
            pdf.setTextColor(30, 41, 59);
            pdf.text('Issue Statistics Overview', 20, yPosition);
            yPosition += 15;
            
            pdf.setFontSize(12);
            pdf.setTextColor(30, 41, 59);
            
            // Draw stats from backend data
            const statData = [
                ['Total Reports Filed:', stats.totalReports.toLocaleString()],
                ['Issues Successfully Resolved:', stats.resolved.toLocaleString()],
                ['Currently In Progress:', stats.inProgress.toLocaleString()],
                ['Overall Resolution Rate:', `${stats.resolutionRate || Math.round((stats.resolved / stats.totalReports) * 100)}%`],
                ['Average Response Time:', stats.avgResponseTime || 'N/A'],
                ['Weekly Trend:', stats.weeklyTrend || 'N/A']
            ];
            
            statData.forEach(([label, value]) => {
                pdf.text(label, 25, yPosition);
                pdf.setTextColor(79, 70, 229);
                pdf.text(value, 120, yPosition);
                pdf.setTextColor(30, 41, 59);
                yPosition += 8;
            });
            
            yPosition += 15;
            
            // Get issue types from backend ONLY
            this.showNotification('Loading issue categories from backend...', 'info');
            const issueResponse = await apiService.getIssueTypeStats();
            if (!issueResponse || !issueResponse.success || !issueResponse.data) {
                throw new Error('Failed to load issue categories from backend');
            }
            
            const issueData = issueResponse.data;
            console.log('✅ PDF using backend issue categories data');
            
            // Add issue types breakdown
            pdf.setFontSize(18);
            pdf.text('Issue Categories Breakdown', 20, yPosition);
            yPosition += 15;
            
            const issueColors = {
                'potholes': [255, 107, 53],
                'lighting': [255, 210, 63],
                'drainage': [77, 171, 247],
                'traffic': [40, 167, 69],
                'sidewalk': [111, 66, 193]
            };
            
            pdf.setFontSize(12);
            Object.keys(issueData).forEach(issueKey => {
                const issue = issueData[issueKey];
                const resolutionPercent = Math.round((issue.resolved / issue.count) * 100);
                const color = issueColors[issueKey] || [128, 128, 128];
                
                // Color bullet point
                pdf.setTextColor(...color);
                pdf.text('●', 25, yPosition);
                
                // Issue details
                pdf.setTextColor(30, 41, 59);
                pdf.text(`${issue.name}:`, 32, yPosition);
                pdf.text(`${issue.count.toLocaleString()} total`, 85, yPosition);
                pdf.text(`(${resolutionPercent}% resolved)`, 120, yPosition);
                
                yPosition += 8;
            });
            
            yPosition += 15;
            
            // Get district performance from backend ONLY
            this.showNotification('Loading district performance from backend...', 'info');
            const districtResponse = await apiService.getDistrictStats();
            if (!districtResponse || !districtResponse.success || !districtResponse.data) {
                throw new Error('Failed to load district performance from backend');
            }
            
            const districtData = districtResponse.data;
            console.log('✅ PDF using backend district performance data');
            
            // Add district performance
            pdf.setFontSize(18);
            pdf.text('District Performance', 20, yPosition);
            yPosition += 15;
            
            pdf.setFontSize(12);
            Object.keys(districtData).forEach(districtKey => {
                const district = districtData[districtKey];
                const resolutionRate = Math.round((district.resolved / district.reports) * 100);
                pdf.text(`${district.name}:`, 25, yPosition);
                pdf.text(`${district.reports.toLocaleString()} reports`, 70, yPosition);
                pdf.text(`${resolutionRate}% resolved`, 120, yPosition);
                yPosition += 8;
            });
            
            // Add new page if needed
            if (yPosition > 250) {
                pdf.addPage();
                yPosition = 20;
            }
            
            // Add current filters information
            yPosition += 10;
            pdf.setFontSize(16);
            pdf.setTextColor(30, 41, 59);
            pdf.text('Current Filter Settings', 20, yPosition);
            yPosition += 12;
            
            pdf.setFontSize(11);
            pdf.setTextColor(100, 116, 139);
            
            if (currentFilters.startDate || currentFilters.endDate) {
                pdf.text(`Date Range: ${currentFilters.startDate || 'All'} to ${currentFilters.endDate || 'All'}`, 25, yPosition);
                yPosition += 7;
            }
            
            if (currentFilters.district) {
                pdf.text(`District: ${currentFilters.district}`, 25, yPosition);
                yPosition += 7;
            }
            
            if (currentFilters.issueTypes.length > 0) {
                pdf.text(`Issue Types: ${currentFilters.issueTypes.join(', ')}`, 25, yPosition);
                yPosition += 7;
            }
            
            // Map section
            if (yPosition > 200) {
                pdf.addPage();
                yPosition = 20;
            }
            
            pdf.setFontSize(16);
            pdf.setTextColor(30, 41, 59);
            pdf.text('Issue Distribution Map', 20, yPosition);
            yPosition += 15;
            
            // Try to capture map (this doesn't require backend data)
            try {
                const mapContainer = document.querySelector('.map-container');
                if (mapContainer && typeof html2canvas !== 'undefined') {
                    this.showNotification('Capturing map image...', 'info');
                    
                    const canvas = await html2canvas(mapContainer, {
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#f8fafc',
                        scale: 1
                    });
                    
                    const imgData = canvas.toDataURL('image/png');
                    const imgWidth = 170;
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;
                    
                    if (imgHeight > 0 && imgHeight < 200) {
                        pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
                        yPosition += imgHeight + 10;
                    } else {
                        pdf.setFontSize(12);
                        pdf.setTextColor(156, 163, 175);
                        pdf.text('Map image too large for PDF export', 25, yPosition);
                        yPosition += 15;
                    }
                } else {
                    pdf.setFontSize(12);
                    pdf.setTextColor(156, 163, 175);
                    pdf.text('Map visualization not available - Google Maps not loaded', 25, yPosition);
                    yPosition += 15;
                }
            } catch (mapError) {
                console.warn('Could not capture map for PDF:', mapError);
                pdf.setFontSize(12);
                pdf.setTextColor(156, 163, 175);
                pdf.text('Map capture failed', 25, yPosition);
                yPosition += 15;
            }
            
            // Add footer
            const footerY = 280;
            pdf.setFontSize(10);
            pdf.setTextColor(156, 163, 175);
            pdf.text('Generated by CityFix Community Platform', 105, footerY, { align: 'center' });
            pdf.text(`Report Date: ${new Date().toISOString().split('T')[0]}`, 105, footerY + 5, { align: 'center' });
            
            // Save the PDF
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const fileName = `CityFix_Community_Report_${timestamp}.pdf`;
            
            pdf.save(fileName);
            
            this.showNotification('PDF report downloaded successfully!', 'success');
            console.log('✅ PDF generated successfully using backend data only');
            
        } catch (error) {
            console.error('❌ PDF export failed:', error);
            
            // Show specific error messages
            if (error.message.includes('Backend server is not available')) {
                this.showNotification('❌ PDF Export Failed: Backend server is not running', 'error');
            } else if (error.message.includes('Failed to load statistics')) {
                this.showNotification('❌ PDF Export Failed: Could not load statistics from backend', 'error');
            } else if (error.message.includes('Failed to load issue categories')) {
                this.showNotification('❌ PDF Export Failed: Could not load issue categories from backend', 'error');
            } else if (error.message.includes('Failed to load district performance')) {
                this.showNotification('❌ PDF Export Failed: Could not load district performance from backend', 'error');
            } else {
                this.showNotification('❌ PDF Export Failed: Backend connection error', 'error');
            }
        }
    }

    initializeCounterAnimations() {
        const observerOptions = {
            threshold: 0.5,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    // Only animate if we have actual data from backend
                    if (AppState.dashboardStats) {
                        const stats = AppState.dashboardStats;
                        const cardIndex = Array.from(document.querySelectorAll('.stat-number')).indexOf(element);
                        const values = [stats.totalReports, stats.resolved, stats.inProgress];
                        if (values[cardIndex]) {
                            this.animateCounter(element, values[cardIndex]);
                        }
                    }
                    observer.unobserve(element);
                }
            });
        }, observerOptions);
        
        const statNumbers = document.querySelectorAll('.stat-number');
        statNumbers.forEach(element => {
            observer.observe(element);
        });
    }

    animateCounter(element, targetValue, duration = 2000) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        
        if (!element || !targetValue) return;
        
        const startValue = 0;
        const increment = targetValue / (duration / 16);
        let currentValue = startValue;
        
        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= targetValue) {
                currentValue = targetValue;
                clearInterval(timer);
            }
            
            element.textContent = Math.floor(currentValue).toLocaleString();
        }, 16);
    }

    setupAutoRefresh() {
        // Only setup refresh if backend is available
        if (!AppState.backendAvailable) {
            console.log('ℹ️ Auto-refresh disabled - backend not available');
            return;
        }

        console.log('🔄 Setting up auto-refresh for backend data');

        // Refresh data every 30 seconds
        this.refreshInterval = setInterval(async () => {
            try {
                console.log('🔄 Auto-refreshing data from backend...');
                await this.loadDashboardData();
                
                if (mapsController.map && mapsController.isInitialized) {
                    await mapsController.updateMapWithFilters();
                }
                
                console.log('✅ Data refreshed from backend');
            } catch (error) {
                console.error('❌ Auto-refresh failed:', error);
                this.showNotification('Failed to refresh data from backend', 'error');
                
                // Stop auto-refresh if backend is consistently failing
                clearInterval(this.refreshInterval);
                AppState.backendAvailable = false;
            }
        }, 30000);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; padding: 12px 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white; border-radius: 8px; z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
        `;
        
        // Add slide animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 4000);
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
}

// Initialize Homepage Controller
const homepage = new HomepageController();

// Google Maps callback function
window.initMap = function() {
    console.log('📍 Google Maps API loaded successfully');
    // Maps will be initialized in homepage.initialize()
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 CityFix Homepage Loading...');
    
    // Load PDF library early
    const pdfScript = document.createElement('script');
    pdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    document.head.appendChild(pdfScript);
    
    const canvasScript = document.createElement('script');
    canvasScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    document.head.appendChild(canvasScript);
    
    homepage.initialize();
});

// Global access for debugging and HTML compatibility
window.homepage = homepage;
window.mapsController = mapsController;
window.apiService = apiService;

// Legacy functions for compatibility
window.retryMapInitialization = function() {
    mapsController.retryMapInitialization();
};

console.log('✨ CityFix Homepage - Backend Only (No Fallback Data)!');