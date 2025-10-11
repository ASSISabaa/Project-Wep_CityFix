'use strict';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : `${location.origin}/api`;
    
const API_ENDPOINTS = {
    HEALTH: '/health',
    ME: '/auth/me',
    DASHBOARD_STATS: '/dashboard/stats',
    REPORTS: '/reports',
    DISTRICTS: '/districts',
    REPORT_TYPES: '/report-types'
};

const GOOGLE_MAPS_CONFIG = {
    DEFAULT_CENTER: { lat: 32.0853, lng: 34.7818 },
    DEFAULT_ZOOM: 12,
    MAP_STYLES: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] }
    ]
};

const AppState = {
    user: null,
    backendAvailable: false,
    dashboardStats: null,
    reports: [],
    districts: [],
    reportTypes: [],
    googleMap: null,
    mapMarkers: []
};

let currentFilters = {
    startDate: '',
    endDate: '',
    district: '',
    issueTypes: ['pothole', 'lighting', 'drainage', 'traffic', 'other'],
    status: []
};

function getToken() {
    return localStorage.getItem('cityfix_token') || 
           sessionStorage.getItem('cityfix_token') || 
           '';
}

function authHeaders() {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function dateToISO(dateStr) {
    if (!dateStr || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return '';
    const [mm, dd, yyyy] = dateStr.split('/');
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}

function isValidDate(dateString) {
    if (!dateString || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return false;
    
    const [mm, dd, yyyy] = dateString.split('/').map(Number);
    
    if (mm < 1 || mm > 12) return false;
    if (dd < 1 || dd > 31) return false;
    if (yyyy < 2000 || yyyy > 2100) return false;
    
    const date = new Date(yyyy, mm - 1, dd);
    
    if (date.getFullYear() !== yyyy || date.getMonth() !== mm - 1 || date.getDate() !== dd) {
        return false;
    }
    
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (date > today) {
        return false;
    }
    
    return true;
}

function validateDateRange(startDate, endDate) {
    if (!startDate && !endDate) {
        return { valid: true };
    }
    
    if (startDate && !isValidDate(startDate)) {
        return { valid: false, error: 'Start date is invalid or in the future' };
    }
    
    if (endDate && !isValidDate(endDate)) {
        return { valid: false, error: 'End date is invalid or in the future' };
    }
    
    if (startDate && endDate) {
        const start = new Date(dateToISO(startDate));
        const end = new Date(dateToISO(endDate));
        
        if (start > end) {
            return { valid: false, error: 'Start date must be before end date' };
        }
        
        const diffDays = (end - start) / (1000 * 60 * 60 * 24);
        if (diffDays > 365) {
            return { valid: false, error: 'Date range cannot exceed 1 year' };
        }
    }
    
    return { valid: true };
}

function normalizeReport(report) {
    let lat = 0;
    let lng = 0;

    if (report.location?.coordinates) {
        if (typeof report.location.coordinates.lat === 'number') {
            lat = report.location.coordinates.lat;
            lng = report.location.coordinates.lng;
        } else if (Array.isArray(report.location.coordinates)) {
            lng = report.location.coordinates[0];
            lat = report.location.coordinates[1];
        }
    }

    if (report.coordinates) {
        if (typeof report.coordinates.lat === 'number') {
            lat = report.coordinates.lat;
            lng = report.coordinates.lng;
        }
    }

    if (report.lat && report.lng) {
        lat = Number(report.lat);
        lng = Number(report.lng);
    }

    return {
        _id: report._id || report.id,
        title: report.title || report.issueType || 'Report',
        description: report.description || '',
        type: String(report.issueType || report.type || report.category || 'other').toLowerCase(),
        status: String(report.status || 'pending').toLowerCase(),
        lat: lat,
        lng: lng,
        address: report.location?.address || report.address || '',
        district: String(report.location?.district || report.district || '').toLowerCase(),
        createdAt: report.createdAt || report.created_at || report.date,
        userId: report.userId || report.user?._id || report.user,
        priority: report.priority || 'medium',
        images: report.images || []
    };
}

function filterReportsLocally(reports, filters) {
    const startDate = dateToISO(filters.startDate);
    const endDate = dateToISO(filters.endDate);
    const startMs = startDate ? Date.parse(startDate) : null;
    const endMs = endDate ? Date.parse(endDate) + 86400000 - 1 : null;
    const district = filters.district?.toLowerCase();
    const types = filters.issueTypes?.map(t => t.toLowerCase());
    const statuses = filters.status?.map(s => s.toLowerCase());

    return reports.filter(report => {
        if (!isFinite(report.lat) || !isFinite(report.lng)) return false;
        if (report.lat === 0 && report.lng === 0) return false;
        if (types?.length && !types.includes(report.type)) return false;
        if (district && report.district !== district) return false;
        if (statuses?.length && !statuses.includes(report.status)) return false;
        
        const createdMs = report.createdAt ? Date.parse(report.createdAt) : null;
        if (startMs && createdMs && createdMs < startMs) return false;
        if (endMs && createdMs && createdMs > endMs) return false;
        
        return true;
    });
}

function buildStatsFromReports(reports) {
    const stats = {
        total: reports.length,
        resolved: 0,
        inProgress: 0,
        pending: 0,
        byType: {},
        byDistrict: {},
        byPriority: { high: 0, medium: 0, low: 0 }
    };

    reports.forEach(report => {
        const status = report.status;
        if (status === 'resolved' || status === 'closed') stats.resolved++;
        else if (status === 'in-progress' || status === 'processing' || status === 'inprogress') stats.inProgress++;
        else stats.pending++;

        const type = report.type;
        if (!stats.byType[type]) {
            stats.byType[type] = { name: type, count: 0, resolved: 0 };
        }
        stats.byType[type].count++;
        if (status === 'resolved') stats.byType[type].resolved++;

        const district = report.district;
        if (district) {
            if (!stats.byDistrict[district]) {
                stats.byDistrict[district] = { name: district, count: 0, resolved: 0 };
            }
            stats.byDistrict[district].count++;
            if (status === 'resolved') stats.byDistrict[district].resolved++;
        }

        const priority = report.priority || 'medium';
        stats.byPriority[priority]++;
    });

    stats.resolutionRate = stats.total ? Math.round((stats.resolved / stats.total) * 100) : 0;
    return stats;
}

class ApiService {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.cache = new Map();
        this.cacheTimeout = 60000;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), options.timeout || 15000);

        try {
            const response = await fetch(url, {
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders(),
                    ...options.headers
                },
                body: options.body ? JSON.stringify(options.body) : undefined,
                credentials: 'include',
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                return await response.json();
            }
            return await response.text();
        } catch (error) {
            clearTimeout(timeout);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }

    async checkHealth() {
        try {
            await this.request(API_ENDPOINTS.HEALTH);
            AppState.backendAvailable = true;
            return true;
        } catch {
            AppState.backendAvailable = false;
            return false;
        }
    }

    async getMe() {
        const token = getToken();
        if (!token) return null;

        try {
            const response = await fetch(`${this.baseUrl}/auth/me`, {
                headers: authHeaders(),
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.user) {
                    return {
                        id: data.user._id || data.user.id,
                        role: data.user.role || 'citizen',
                        name: data.user.name || '',
                        email: data.user.email || ''
                    };
                }
            }
        } catch {
        }
        
        return null;
    }

    async getDashboardStats(params = {}) {
        const query = new URLSearchParams(params).toString();
        const endpoint = `${API_ENDPOINTS.DASHBOARD_STATS}${query ? `?${query}` : ''}`;
        
        try {
            const response = await this.request(endpoint);
            if (response.success && response.data) {
                return response.data;
            }
        } catch (error) {
            console.error('Stats error:', error);
        }
        
        return {
            totalReports: 0,
            resolved: 0,
            inProgress: 0,
            resolutionRate: 0,
            weeklyTrend: 0
        };
    }

    async getReports(filters = {}) {
        try {
            const params = new URLSearchParams();
            
            if (filters.startDate) params.append('startDate', dateToISO(filters.startDate));
            if (filters.endDate) params.append('endDate', dateToISO(filters.endDate));
            if (filters.district) params.append('district', filters.district);
            if (filters.issueTypes?.length) {
                filters.issueTypes.forEach(type => params.append('type', type));
            }
            if (filters.status?.length) {
                filters.status.forEach(status => params.append('status', status));
            }

            const query = params.toString();
            const endpoint = `${API_ENDPOINTS.REPORTS}${query ? `?${query}` : ''}`;
            
            const response = await this.request(endpoint);
            if (response.success) {
                const reports = Array.isArray(response.data) ? response.data : response.reports || [];
                return reports.map(normalizeReport);
            }
        } catch (error) {
            console.error('Get reports error:', error);
        }
        
        return [];
    }

    async getDistricts() {
        if (this.cache.has('districts')) {
            const cached = this.cache.get('districts');
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const response = await this.request(API_ENDPOINTS.DISTRICTS);
            const districts = response.success ? response.data : [];
            
            this.cache.set('districts', {
                data: districts,
                timestamp: Date.now()
            });
            
            return districts;
        } catch (error) {
            return [];
        }
    }

    async getReportTypes() {
        if (this.cache.has('reportTypes')) {
            const cached = this.cache.get('reportTypes');
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const response = await this.request(API_ENDPOINTS.REPORT_TYPES);
            const types = response.success ? response.data : [];
            
            this.cache.set('reportTypes', {
                data: types,
                timestamp: Date.now()
            });
            
            return types;
        } catch (error) {
            return [];
        }
    }
}

const api = new ApiService(API_BASE);

class GoogleMapsController {
    constructor() {
        this.map = null;
        this.markers = [];
        this.infoWindow = null;
        this.isInitialized = false;
    }

    async initializeMap() {
        if (typeof google === 'undefined' || !google.maps) {
            return this.showMapFallback();
        }

        const mapElement = document.getElementById('google-map');
        if (!mapElement) return;

        mapElement.innerHTML = '';
        mapElement.style.height = '500px';

        this.map = new google.maps.Map(mapElement, {
            center: GOOGLE_MAPS_CONFIG.DEFAULT_CENTER,
            zoom: GOOGLE_MAPS_CONFIG.DEFAULT_ZOOM,
            styles: GOOGLE_MAPS_CONFIG.MAP_STYLES,
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true
        });

        this.infoWindow = new google.maps.InfoWindow();
        this.isInitialized = true;
        AppState.googleMap = this.map;

        await this.loadMarkers();
    }

    async loadMarkers() {
        if (!this.isInitialized) return;

        try {
            const reports = AppState.reports.length > 0 
                ? AppState.reports 
                : await api.getReports(currentFilters);
            
            AppState.reports = reports;
            this.clearMarkers();
            
            const validReports = reports.filter(r => r.lat !== 0 && r.lng !== 0);
            
            if (validReports.length === 0) {
                this.showNoDataOnMap();
                return;
            }

            validReports.forEach(report => this.addMarker(report));
            this.fitBounds();
            
            if (window.homepage) {
                window.homepage.updateIssueCards();
            }
        } catch (error) {
            console.error('Failed to load markers:', error);
            this.showMapError('Failed to load map data');
        }
    }

    showNoDataOnMap() {
        const existingMsg = document.querySelector('.no-data-overlay');
        if (existingMsg) existingMsg.remove();
        
        const overlay = document.createElement('div');
        overlay.className = 'no-data-overlay';
        overlay.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 255, 255, 0.98);
            padding: 32px 48px;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            z-index: 100;
            text-align: center;
            border: 2px solid #e5e7eb;
        `;
        overlay.innerHTML = `
            <div style="font-size: 64px; margin-bottom: 16px;">📍</div>
            <h3 style="margin: 0 0 12px; color: #111827; font-size: 20px; font-weight: 700;">No Reports Found</h3>
            <p style="margin: 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                Try adjusting your filters or date range<br>to see available reports
            </p>
            <button onclick="window.homepage.resetFilters()" style="margin-top: 20px; padding: 10px 24px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px;">
                Reset Filters
            </button>
        `;
        
        const mapElement = document.getElementById('google-map');
        if (mapElement) {
            mapElement.style.position = 'relative';
            mapElement.appendChild(overlay);
        }
    }

    addMarker(report) {
        if (!this.map || !report || !isFinite(report.lat) || !isFinite(report.lng)) return;
        if (report.lat === 0 && report.lng === 0) return;

        const marker = new google.maps.Marker({
            position: { lat: report.lat, lng: report.lng },
            map: this.map,
            title: report.title,
            icon: this.getMarkerIcon(report.type, report.status, report.priority),
            animation: google.maps.Animation.DROP
        });

        marker.addListener('click', () => this.showInfoWindow(marker, report));
        this.markers.push(marker);
    }

    getMarkerIcon(type, status, priority) {
        const colors = {
            pothole: '#ef4444',
            lighting: '#f59e0b',
            drainage: '#3b82f6',
            traffic: '#10b981',
            other: '#6b7280'
        };

        const scales = {
            urgent: 14,
            high: 12,
            medium: 10,
            low: 8
        };

        const color = colors[type] || colors.other;
        const scale = scales[priority] || 10;

        return {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: color,
            fillOpacity: status === 'resolved' ? 0.4 : 0.9,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: scale
        };
    }

    showInfoWindow(marker, report) {
        const statusColors = {
            new: '#dc3545',
            pending: '#fd7e14',
            'in-progress': '#0d6efd',
            inprogress: '#0d6efd',
            resolved: '#198754',
            rejected: '#6c757d'
        };

        const color = statusColors[report.status] || '#6c757d';
        
        const content = `
            <div style="max-width:320px;font-family:'Inter',sans-serif;padding:8px">
                <h4 style="margin:0 0 8px;font-size:17px;color:#111827;font-weight:700">${report.title}</h4>
                ${report.description ? `<p style="margin:0 0 12px;color:#4b5563;font-size:14px">${report.description}</p>` : ''}
                <div style="margin:12px 0">
                    <span style="display:inline-block;padding:5px 14px;border-radius:14px;background:${color};color:#fff;font-size:12px;font-weight:700;text-transform:uppercase">
                        ${report.status.replace('-', ' ')}
                    </span>
                </div>
                <div style="font-size:13px;color:#374151">
                    <p style="margin:4px 0"><strong>Type:</strong> ${this.formatType(report.type)}</p>
                    <p style="margin:4px 0"><strong>Location:</strong> ${report.address || `${report.lat.toFixed(4)}, ${report.lng.toFixed(4)}`}</p>
                    <p style="margin:4px 0"><strong>Reported:</strong> ${this.formatTimeAgo(report.createdAt)}</p>
                </div>
            </div>
        `;

        this.infoWindow.setContent(content);
        this.infoWindow.open(this.map, marker);
    }

    formatType(type) {
        return type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ');
    }

    formatTimeAgo(dateString) {
        if (!dateString) return 'Unknown';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `${diffDays}d ago`;
        if (diffHours > 0) return `${diffHours}h ago`;
        if (diffMins > 0) return `${diffMins}m ago`;
        return 'Just now';
    }

    fitBounds() {
        if (!this.map || this.markers.length === 0) return;

        const bounds = new google.maps.LatLngBounds();
        this.markers.forEach(marker => bounds.extend(marker.getPosition()));
        this.map.fitBounds(bounds);

        google.maps.event.addListenerOnce(this.map, 'bounds_changed', () => {
            if (this.map.getZoom() > 15) {
                this.map.setZoom(15);
            }
        });
    }

    clearMarkers() {
        const overlay = document.querySelector('.no-data-overlay');
        if (overlay) overlay.remove();
        
        this.markers.forEach(marker => marker.setMap(null));
        this.markers = [];
    }

    showMapFallback() {
        const mapElement = document.getElementById('google-map');
        if (!mapElement) return;

        mapElement.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;height:500px;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);border-radius:16px;">
                <div style="text-align:center;color:white">
                    <div style="font-size:64px;margin-bottom:16px">🗺️</div>
                    <div style="font-size:20px;font-weight:600;margin-bottom:8px">Loading Google Maps...</div>
                    <div style="font-size:15px;opacity:0.9">Please wait</div>
                </div>
            </div>
        `;
    }

    showMapError(message) {
        const mapElement = document.getElementById('google-map');
        if (!mapElement) return;

        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#dc3545;color:#fff;padding:16px 24px;border-radius:10px;z-index:1000;font-size:15px;font-weight:600';
        overlay.textContent = message;
        
        mapElement.style.position = 'relative';
        mapElement.appendChild(overlay);
        
        setTimeout(() => overlay.remove(), 5000);
    }

    async refreshWithFilters() {
        if (!this.isInitialized) return;
        await this.loadMarkers();
    }
}

const mapsController = new GoogleMapsController();

class HomepageController {
    constructor() {
        this.refreshInterval = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            this.setupEventListeners();
            this.clearStats();
            this.initializeIssueCards();

            const healthCheck = await api.checkHealth();
            if (!healthCheck) {
                throw new Error('Backend unavailable');
            }

            AppState.user = await api.getMe();

            await Promise.all([
                this.loadDashboardStats(),
                this.loadDistricts(),
                this.loadReportTypes(),
                this.loadReportsData()
            ]);

            this.initializeMap();
            this.startAutoRefresh();
            this.isInitialized = true;

        } catch (error) {
            console.error('Initialization error:', error);
            this.showToast('Unable to connect to server', 'error');
            this.initializeIssueCards();
        }
    }

    initializeIssueCards() {
        const types = ['pothole', 'lighting', 'drainage'];
        
        types.forEach(type => {
            const card = document.querySelector(`.issue-card[data-type="${type}"]`);
            if (card) {
                let stats = card.querySelector('.issue-stats');
                if (!stats) {
                    stats = document.createElement('div');
                    stats.className = 'issue-stats';
                    card.appendChild(stats);
                }
                
                let countEl = stats.querySelector('.issue-count');
                if (!countEl) {
                    countEl = document.createElement('span');
                    countEl.className = 'issue-count';
                    countEl.style.cssText = 'display:block;font-size:28px;font-weight:800;color:#111827;margin-bottom:4px;';
                    stats.appendChild(countEl);
                }
                
                let statusEl = stats.querySelector('.issue-status');
                if (!statusEl) {
                    statusEl = document.createElement('span');
                    statusEl.className = 'issue-status';
                    statusEl.style.cssText = 'display:block;font-size:14px;color:#6b7280;font-weight:500;';
                    stats.appendChild(statusEl);
                }
                
                countEl.textContent = '0';
                statusEl.textContent = '0% resolved';
            }
        });
    }

    async loadReportsData() {
        try {
            const reports = await api.getReports(currentFilters);
            AppState.reports = reports;
            this.updateIssueCards();
            return reports;
        } catch (error) {
            console.error('Failed to load reports:', error);
            AppState.reports = [];
            this.updateIssueCards();
            return [];
        }
    }

    setupEventListeners() {
        this.setupDateInputs();
        this.setupFilters();
        this.setupActionButtons();
        this.setupMobileMenu();
    }

    setupDateInputs() {
        const dateInputs = document.querySelectorAll('.date-input');
        const today = new Date();
        
        dateInputs.forEach((input, index) => {
            input.type = 'text';
            input.maxLength = 10;
            input.placeholder = 'MM/DD/YYYY';
            
            const todayStr = `${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}/${today.getFullYear()}`;
            input.setAttribute('data-max-date', todayStr);

            input.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                    value = value.slice(0, 2) + '/' + value.slice(2);
                }
                if (value.length >= 5) {
                    value = value.slice(0, 5) + '/' + value.slice(5, 9);
                }
                e.target.value = value;
                
                e.target.style.borderColor = '';
                const errorMsg = e.target.nextElementSibling;
                if (errorMsg?.classList.contains('date-error')) {
                    errorMsg.remove();
                }
            });

            input.addEventListener('blur', async (e) => {
                const value = e.target.value;
                
                if (value === '') {
                    if (index === 0) {
                        currentFilters.startDate = '';
                    } else {
                        currentFilters.endDate = '';
                    }
                    await this.applyFiltersWithValidation();
                    return;
                }
                
                if (!isValidDate(value)) {
                    this.showInputError(e.target, 'Invalid date or future date not allowed');
                    e.target.value = '';
                    return;
                }
                
                if (index === 0) {
                    currentFilters.startDate = value;
                } else {
                    currentFilters.endDate = value;
                }
                
                const validation = validateDateRange(currentFilters.startDate, currentFilters.endDate);
                
                if (!validation.valid) {
                    this.showInputError(e.target, validation.error);
                    e.target.value = '';
                    if (index === 0) {
                        currentFilters.startDate = '';
                    } else {
                        currentFilters.endDate = '';
                    }
                    return;
                }
                
                e.target.style.borderColor = '#10b981';
                setTimeout(() => {
                    e.target.style.borderColor = '';
                }, 1500);
                
                await this.applyFiltersWithValidation();
            });
        });
    }

    showInputError(input, message) {
        input.style.borderColor = '#ef4444';
        input.style.animation = 'shake 0.5s';
        
        const existingError = input.nextElementSibling;
        if (existingError?.classList.contains('date-error')) {
            existingError.remove();
        }
        
        const errorMsg = document.createElement('div');
        errorMsg.className = 'date-error';
        errorMsg.style.cssText = 'color:#ef4444;font-size:12px;margin-top:4px;font-weight:600;';
        errorMsg.textContent = message;
        input.parentElement.appendChild(errorMsg);
        
        setTimeout(() => {
            input.style.animation = '';
        }, 500);
        
        this.showToast(message, 'error');
    }

    setupFilters() {
        const districtSelect = document.querySelector('.district-select');
        if (districtSelect) {
            districtSelect.addEventListener('change', async (e) => {
                currentFilters.district = e.target.value;
                await this.applyFiltersWithValidation();
            });
        }

        const checkboxes = document.querySelectorAll('input[name="issue-type"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', async () => {
                const checkedTypes = Array.from(checkboxes)
                    .filter(cb => cb.checked)
                    .map(cb => cb.value);
                
                if (checkedTypes.length === 0) {
                    checkbox.checked = true;
                    this.showToast('At least one issue type must be selected', 'warning');
                    return;
                }
                
                currentFilters.issueTypes = checkedTypes;
                await this.applyFiltersWithValidation();
            });
        });

        this.addTrafficCheckbox();
    }

    addTrafficCheckbox() {
        const checkboxGroup = document.querySelector('.checkbox-group');
        if (checkboxGroup && !document.getElementById('traffic')) {
            const trafficCheckbox = document.createElement('div');
            trafficCheckbox.className = 'checkbox-item';
            trafficCheckbox.innerHTML = `
                <input type="checkbox" id="traffic" name="issue-type" value="traffic" checked>
                <label for="traffic" class="checkbox-label">
                    <span class="checkbox-icon"></span>
                    Traffic
                </label>
            `;
            checkboxGroup.appendChild(trafficCheckbox);

            if (!document.getElementById('other')) {
                const otherCheckbox = document.createElement('div');
                otherCheckbox.className = 'checkbox-item';
                otherCheckbox.innerHTML = `
                    <input type="checkbox" id="other" name="issue-type" value="other" checked>
                    <label for="other" class="checkbox-label">
                        <span class="checkbox-icon"></span>
                        Other
                    </label>
                `;
                checkboxGroup.appendChild(otherCheckbox);
            }
        }
    }

    setupActionButtons() {
        const shareBtn = document.querySelector('.share-report-btn');
        const exportBtn = document.querySelector('.export-pdf-btn');

        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareReport());
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportPDF());
        }
    }

    setupMobileMenu() {
        const menuBtn = document.querySelector('.mobile-menu-btn');
        const mobileNav = document.querySelector('.mobile-nav');

        if (menuBtn && mobileNav) {
            menuBtn.addEventListener('click', () => {
                mobileNav.classList.toggle('active');
                menuBtn.classList.toggle('active');
            });

            document.addEventListener('click', (e) => {
                if (!menuBtn.contains(e.target) && !mobileNav.contains(e.target)) {
                    mobileNav.classList.remove('active');
                    menuBtn.classList.remove('active');
                }
            });
        }
    }

    clearStats() {
        document.querySelectorAll('.stat-number').forEach(el => {
            el.textContent = '0';
        });
    }

    async loadDashboardStats() {
        try {
            const stats = await api.getDashboardStats();
            AppState.dashboardStats = stats;
            this.renderDashboardStats(stats);
            
            if (AppState.reports.length === 0) {
                AppState.reports = await api.getReports(currentFilters);
            }
            
            this.updateIssueCards();
        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
        }
    }

    renderDashboardStats(stats) {
        const elements = document.querySelectorAll('.stat-number');
        const values = [stats.totalReports || 0, stats.resolved || 0, stats.inProgress || 0];

        elements.forEach((el, index) => {
            if (values[index] !== undefined) {
                this.animateNumber(el, values[index]);
            }
        });

        this.updateMapStats(stats);
    }

    updateMapStats(stats) {
        const statCards = document.querySelectorAll('.map-stat-card .resolution-percentage');
        
        if (statCards[0] && AppState.reports.length > 0) {
            const districtStats = buildStatsFromReports(AppState.reports).byDistrict;
            let topDistrict = { name: 'None', count: 0 };
            
            Object.values(districtStats).forEach(district => {
                if (district.count > topDistrict.count) {
                    topDistrict = district;
                }
            });
            
            statCards[0].textContent = this.formatType(topDistrict.name);
        }

        if (statCards[1] && AppState.reports.length > 0) {
            const typeStats = buildStatsFromReports(AppState.reports).byType;
            let topType = { name: 'None', count: 0 };
            
            Object.values(typeStats).forEach(type => {
                if (type.count > topType.count) {
                    topType = type;
                }
            });
            
            statCards[1].textContent = this.formatType(topType.name);
        }

        if (statCards[2]) {
            statCards[2].textContent = `${stats.resolutionRate || 0}%`;
        }

        if (statCards[3]) {
            const trend = stats.weeklyTrend || 0;
            if (trend > 0) {
                statCards[3].textContent = `↗ +${trend}%`;
                statCards[3].style.color = '#10b981';
            } else if (trend < 0) {
                statCards[3].textContent = `↘ ${trend}%`;
                statCards[3].style.color = '#ef4444';
            } else {
                statCards[3].textContent = '→ 0%';
                statCards[3].style.color = '#6b7280';
            }
        }
    }

    updateIssueCards() {
        const stats = buildStatsFromReports(AppState.reports);
        const types = ['pothole', 'lighting', 'drainage'];

        types.forEach(type => {
            const typeStats = stats.byType[type] || { count: 0, resolved: 0 };
            const card = document.querySelector(`.issue-card[data-type="${type}"]`);
            
            if (card) {
                const countEl = card.querySelector('.issue-count');
                const statusEl = card.querySelector('.issue-status');
                
                if (countEl) {
                    const count = typeStats.count || 0;
                    this.animateNumber(countEl, count);
                }
                
                if (statusEl) {
                    const percentage = typeStats.count > 0 
                        ? Math.round((typeStats.resolved / typeStats.count) * 100)
                        : 0;
                    statusEl.textContent = `${percentage}% resolved`;
                    statusEl.style.color = percentage > 70 ? '#10b981' : percentage > 40 ? '#f59e0b' : '#6b7280';
                }
            }
        });
    }

    async loadDistricts() {
        try {
            const districts = await api.getDistricts();
            AppState.districts = districts;
            
            const select = document.querySelector('.district-select');
            if (select && districts.length > 0) {
                select.innerHTML = '<option value="">All Districts</option>';
                districts.forEach(district => {
                    const option = document.createElement('option');
                    option.value = district.value;
                    option.textContent = district.name;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Failed to load districts:', error);
        }
    }

    async loadReportTypes() {
        try {
            const types = await api.getReportTypes();
            AppState.reportTypes = types;
        } catch (error) {
            console.error('Failed to load report types:', error);
        }
    }

    initializeMap() {
        let retries = 0;
        const maxRetries = 10;

        const tryInitMap = () => {
            if (typeof google !== 'undefined' && google.maps) {
                mapsController.initializeMap();
            } else if (retries < maxRetries) {
                retries++;
                setTimeout(tryInitMap, 1000);
            } else {
                mapsController.showMapFallback();
            }
        };

        tryInitMap();
    }

    async applyFiltersWithValidation() {
        if (!this.isInitialized) return;

        const validation = validateDateRange(currentFilters.startDate, currentFilters.endDate);
        
        if (!validation.valid) {
            this.showToast(validation.error, 'error');
            return;
        }

        try {
            this.showFilterLoadingState();
            
            const reports = await api.getReports(currentFilters);
            
            if (reports.length === 0) {
                let message = 'No reports found for selected filters';
                this.showToast(message, 'info');
            } else {
                this.showToast(`Found ${reports.length} report${reports.length > 1 ? 's' : ''}`, 'success');
            }
            
            AppState.reports = reports;
            await mapsController.refreshWithFilters();
            this.updateMapStats(AppState.dashboardStats);
            this.updateFilterIndicators();
            
        } catch (error) {
            console.error('Failed to apply filters:', error);
            this.showToast('Failed to apply filters. Please try again.', 'error');
        } finally {
            this.hideFilterLoadingState();
        }
    }

    resetFilters() {
        currentFilters = {
            startDate: '',
            endDate: '',
            district: '',
            issueTypes: ['pothole', 'lighting', 'drainage', 'traffic', 'other'],
            status: []
        };
        
        document.querySelectorAll('.date-input').forEach(input => {
            input.value = '';
            input.style.borderColor = '';
            const errorMsg = input.nextElementSibling;
            if (errorMsg?.classList.contains('date-error')) {
                errorMsg.remove();
            }
        });
        
        const districtSelect = document.querySelector('.district-select');
        if (districtSelect) districtSelect.value = '';
        
        document.querySelectorAll('input[name="issue-type"]').forEach(cb => {
            cb.checked = true;
        });
        
        this.applyFiltersWithValidation();
        this.showToast('Filters reset successfully', 'success');
    }

    showFilterLoadingState() {
        const mapElement = document.getElementById('google-map');
        if (mapElement) {
            mapElement.style.opacity = '0.6';
            mapElement.style.filter = 'blur(2px)';
        }
    }

    hideFilterLoadingState() {
        const mapElement = document.getElementById('google-map');
        if (mapElement) {
            mapElement.style.opacity = '1';
            mapElement.style.filter = 'none';
        }
    }

    updateFilterIndicators() {
        let activeFilters = 0;
        if (currentFilters.startDate) activeFilters++;
        if (currentFilters.endDate) activeFilters++;
        if (currentFilters.district) activeFilters++;
        if (currentFilters.issueTypes.length < 5) activeFilters++;
        
        const filterTitle = document.querySelector('.filters-title');
        if (filterTitle) {
            let badge = filterTitle.querySelector('.filter-badge');
            if (activeFilters > 0) {
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'filter-badge';
                    badge.style.cssText = `
                        background: #3b82f6;
                        color: white;
                        padding: 4px 10px;
                        border-radius: 12px;
                        font-size: 12px;
                        margin-left: 10px;
                        font-weight: 700;
                    `;
                    filterTitle.appendChild(badge);
                }
                badge.textContent = activeFilters;
            } else {
                if (badge) badge.remove();
            }
        }
    }

    shareReport() {
        const url = window.location.href;
        
        if (navigator.share) {
            navigator.share({
                title: 'CityFix Dashboard',
                text: 'Check out the CityFix community report dashboard',
                url: url
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(url)
                .then(() => this.showToast('Link copied to clipboard', 'success'))
                .catch(() => this.showToast('Failed to copy link', 'error'));
        }
    }

    async exportPDF() {
    try {
        this.showToast('Preparing PDF report...', 'info');
        
        if (typeof window.jspdf === 'undefined') {
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        }
        
        if (typeof html2canvas === 'undefined') {
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
        }

        const stats = AppState.dashboardStats || await api.getDashboardStats();
        const reportStats = buildStatsFromReports(AppState.reports);

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;
        let y = 0;

        // ===== PAGE 1: COVER PAGE =====
        
        // Header Background
        pdf.setFillColor(102, 126, 234);
        pdf.rect(0, 0, pageWidth, 100, 'F');
        
        // Logo/Title
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(40);
        pdf.setFont('helvetica', 'bold');
        pdf.text('CityFix', pageWidth / 2, 45, { align: 'center' });
        
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Community Report Dashboard', pageWidth / 2, 58, { align: 'center' });
        
        pdf.setFontSize(12);
        pdf.text('Professional Analytics Report', pageWidth / 2, 68, { align: 'center' });

        y = 120;

        // Report Information Box
        pdf.setFillColor(245, 247, 250);
        pdf.roundedRect(margin, y, pageWidth - (2 * margin), 60, 5, 5, 'F');
        
        y += 12;
        pdf.setTextColor(30, 41, 59);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Report Information', margin + 5, y);
        
        y += 10;
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(71, 85, 105);
        
        const reportInfo = [
            { label: 'Generated Date:', value: new Date().toLocaleDateString('en-US', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            })},
            { label: 'Generated Time:', value: new Date().toLocaleTimeString('en-US') },
            { label: 'Total Reports:', value: stats.totalReports.toLocaleString() },
            { label: 'Date Range:', value: currentFilters.startDate && currentFilters.endDate 
                ? `${currentFilters.startDate} to ${currentFilters.endDate}` 
                : 'All Time' },
            { label: 'District Filter:', value: currentFilters.district 
                ? this.formatType(currentFilters.district) 
                : 'All Districts' }
        ];

        reportInfo.forEach(info => {
            pdf.setFont('helvetica', 'bold');
            pdf.text(info.label, margin + 10, y);
            pdf.setFont('helvetica', 'normal');
            pdf.text(info.value, margin + 60, y);
            y += 8;
        });

        y += 10;

        // Key Metrics Overview
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(margin, y, pageWidth - (2 * margin), 70, 5, 5, 'F');
        pdf.setDrawColor(229, 231, 235);
        pdf.roundedRect(margin, y, pageWidth - (2 * margin), 70, 5, 5, 'S');
        
        y += 12;
        pdf.setTextColor(30, 41, 59);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Key Metrics Summary', margin + 5, y);
        
        y += 15;

        // Metrics Cards
        const metrics = [
            { 
                label: 'Total Reports', 
                value: stats.totalReports.toLocaleString(), 
                color: [59, 130, 246]
            },
            { 
                label: 'Resolved', 
                value: stats.resolved.toLocaleString(), 
                color: [16, 185, 129]
            },
            { 
                label: 'In Progress', 
                value: stats.inProgress.toLocaleString(), 
                color: [245, 158, 11]
            },
            { 
                label: 'Resolution Rate', 
                value: `${stats.resolutionRate}%`, 
                color: [139, 92, 246]
            }
        ];

        const cardWidth = (pageWidth - (2 * margin) - 15) / 4;
        let xPos = margin + 5;

        metrics.forEach((metric) => {
            // Card background
            pdf.setFillColor(249, 250, 251);
            pdf.roundedRect(xPos, y - 5, cardWidth, 35, 3, 3, 'F');
            
            // Value
            pdf.setFontSize(18);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
            pdf.text(metric.value, xPos + cardWidth / 2, y + 8, { align: 'center' });
            
            // Label
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(107, 114, 128);
            pdf.text(metric.label, xPos + cardWidth / 2, y + 15, { align: 'center' });
            
            xPos += cardWidth + 5;
        });

        // Footer
        y = pageHeight - 20;
        pdf.setDrawColor(229, 231, 235);
        pdf.line(margin, y, pageWidth - margin, y);
        pdf.setTextColor(156, 163, 175);
        pdf.setFontSize(9);
        pdf.text('CityFix © 2025 - All Rights Reserved', pageWidth / 2, y + 6, { align: 'center' });

        // ===== PAGE 2: DETAILED STATISTICS =====
        pdf.addPage();
        y = margin;

        // Page Header
        pdf.setFillColor(249, 250, 251);
        pdf.rect(0, 0, pageWidth, 25, 'F');
        pdf.setTextColor(30, 41, 59);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Detailed Statistics', margin, 16);
        
        y = 35;

        // Issue Types Breakdown
        if (Object.keys(reportStats.byType).length > 0) {
            pdf.setFillColor(255, 255, 255);
            const sectionHeight = 15 + (Object.keys(reportStats.byType).length * 14);
            pdf.roundedRect(margin, y, pageWidth - (2 * margin), sectionHeight, 5, 5, 'F');
            pdf.setDrawColor(229, 231, 235);
            pdf.roundedRect(margin, y, pageWidth - (2 * margin), sectionHeight, 5, 5, 'S');
            
            y += 10;
            pdf.setTextColor(30, 41, 59);
            pdf.setFontSize(13);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Issue Types Breakdown', margin + 5, y);
            
            y += 8;
            pdf.setFontSize(10);

            Object.values(reportStats.byType).sort((a, b) => b.count - a.count).forEach(type => {
                const percentage = type.count > 0 
                    ? Math.round((type.resolved / type.count) * 100)
                    : 0;
                
                // Type icon
                const iconColor = this.getTypeColor(type.name);
                pdf.setFillColor(iconColor.r, iconColor.g, iconColor.b);
                pdf.circle(margin + 8, y - 1.5, 2, 'F');
                
                // Type name
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(55, 65, 81);
                pdf.text(this.formatType(type.name), margin + 14, y);
                
                // Count
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(107, 114, 128);
                pdf.text(`${type.count} reports`, margin + 70, y);
                
                // Progress bar background
                const barX = margin + 110;
                const barY = y - 3;
                const barWidth = 50;
                const barHeight = 4;
                
                pdf.setFillColor(229, 231, 235);
                pdf.roundedRect(barX, barY, barWidth, barHeight, 1, 1, 'F');
                
                // Progress bar fill
                const fillWidth = (barWidth * percentage) / 100;
                const barColor = percentage > 70 ? [16, 185, 129] : percentage > 40 ? [245, 158, 11] : [239, 68, 68];
                pdf.setFillColor(barColor[0], barColor[1], barColor[2]);
                pdf.roundedRect(barX, barY, fillWidth, barHeight, 1, 1, 'F');
                
                // Percentage text
                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(barColor[0], barColor[1], barColor[2]);
                pdf.text(`${percentage}%`, barX + barWidth + 3, y);
                
                y += 10;
            });
            
            y += 10;
        }

        // District Performance
        if (Object.keys(reportStats.byDistrict).length > 0) {
            if (y > pageHeight - 80) {
                pdf.addPage();
                y = margin;
            }
            
            pdf.setFillColor(255, 255, 255);
            const sectionHeight = 15 + (Object.keys(reportStats.byDistrict).length * 14);
            pdf.roundedRect(margin, y, pageWidth - (2 * margin), sectionHeight, 5, 5, 'F');
            pdf.setDrawColor(229, 231, 235);
            pdf.roundedRect(margin, y, pageWidth - (2 * margin), sectionHeight, 5, 5, 'S');
            
            y += 10;
            pdf.setTextColor(30, 41, 59);
            pdf.setFontSize(13);
            pdf.setFont('helvetica', 'bold');
            pdf.text('District Performance', margin + 5, y);
            
            y += 8;
            pdf.setFontSize(10);

            Object.values(reportStats.byDistrict).sort((a, b) => b.count - a.count).forEach((district, index) => {
                const percentage = district.count > 0 
                    ? Math.round((district.resolved / district.count) * 100)
                    : 0;
                
                // Rank badge
                pdf.setFillColor(59, 130, 246);
                pdf.circle(margin + 8, y - 1.5, 2.5, 'F');
                pdf.setFontSize(7);
                pdf.setTextColor(255, 255, 255);
                pdf.setFont('helvetica', 'bold');
                pdf.text(`${index + 1}`, margin + 8, y, { align: 'center' });
                
                // District name
                pdf.setFontSize(10);
                pdf.setTextColor(55, 65, 81);
                pdf.text(this.formatType(district.name), margin + 14, y);
                
                // Count
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(107, 114, 128);
                pdf.text(`${district.count} reports`, margin + 70, y);
                
                // Progress bar
                const barX = margin + 110;
                const barY = y - 3;
                const barWidth = 50;
                const barHeight = 4;
                
                pdf.setFillColor(229, 231, 235);
                pdf.roundedRect(barX, barY, barWidth, barHeight, 1, 1, 'F');
                
                const fillWidth = (barWidth * percentage) / 100;
                pdf.setFillColor(59, 130, 246);
                pdf.roundedRect(barX, barY, fillWidth, barHeight, 1, 1, 'F');
                
                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(59, 130, 246);
                pdf.text(`${percentage}%`, barX + barWidth + 3, y);
                
                y += 10;
            });
        }

        // ===== PAGE 3: MAP =====
        const mapElement = document.getElementById('google-map');
        if (mapElement && html2canvas) {
            pdf.addPage();
            y = margin;

            // Page Header
            pdf.setFillColor(249, 250, 251);
            pdf.rect(0, 0, pageWidth, 25, 'F');
            pdf.setTextColor(30, 41, 59);
            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Issue Distribution Map', margin, 16);
            
            y = 35;

            try {
                this.showToast('Capturing map...', 'info');
                
                // Hide overlay temporarily
                const overlay = document.querySelector('.no-data-overlay');
                const overlayDisplay = overlay ? overlay.style.display : null;
                if (overlay) overlay.style.display = 'none';
                
                const canvas = await html2canvas(mapElement, {
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    scale: 2,
                    logging: false,
                    width: mapElement.offsetWidth,
                    height: mapElement.offsetHeight
                });

                // Restore overlay
                if (overlay && overlayDisplay) overlay.style.display = overlayDisplay;

                const imgData = canvas.toDataURL('image/png', 0.95);
                const imgWidth = pageWidth - (2 * margin);
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                const maxHeight = pageHeight - y - 30;

                pdf.addImage(
                    imgData, 
                    'PNG', 
                    margin, 
                    y, 
                    imgWidth, 
                    Math.min(imgHeight, maxHeight)
                );
                
                y += Math.min(imgHeight, maxHeight) + 10;
                
                // Map legend
                pdf.setFontSize(9);
                pdf.setTextColor(107, 114, 128);
                pdf.text('Map shows real-time distribution of reported issues', margin, y);

            } catch (error) {
                console.error('Map capture failed:', error);
                pdf.setFillColor(254, 226, 226);
                pdf.roundedRect(margin, y, pageWidth - (2 * margin), 40, 5, 5, 'F');
                y += 15;
                pdf.setTextColor(220, 38, 38);
                pdf.setFontSize(11);
                pdf.text('Map capture unavailable', margin + 5, y);
            }
        }

        // Final Footer on all pages
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            const footerY = pageHeight - 10;
            pdf.setFontSize(8);
            pdf.setTextColor(156, 163, 175);
            pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
            pdf.text('Generated by CityFix', margin, footerY);
        }

        // Save
        const date = new Date();
        const filename = `CityFix_Report_${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}.pdf`;
        pdf.save(filename);

        this.showToast('PDF exported successfully! 📄', 'success');
        
    } catch (error) {
        console.error('PDF export error:', error);
        this.showToast('Failed to export PDF: ' + error.message, 'error');
    }
}

getTypeColor(type) {
    const colors = {
        pothole: { r: 239, g: 68, b: 68 },
        lighting: { r: 245, g: 158, b: 11 },
        drainage: { r: 59, g: 130, b: 246 },
        traffic: { r: 16, g: 185, b: 129 },
        other: { r: 107, g: 114, b: 128 }
    };
    return colors[type] || colors.other;
}

loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
    });
}

    animateNumber(element, target, duration = 1000) {
        if (!element) return;

        const start = parseInt(element.textContent) || 0;
        const increment = (target - start) / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current).toLocaleString();
        }, 16);
    }

    startAutoRefresh() {
        if (!AppState.backendAvailable) return;

        this.refreshInterval = setInterval(async () => {
            try {
                await this.loadDashboardStats();
                await mapsController.refreshWithFilters();
            } catch (error) {
                console.error('Auto-refresh error:', error);
            }
        }, 60000);
    }

    formatType(type) {
        if (!type || type === 'None') return 'None';
        return type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ');
    }

    showToast(message, type = 'info') {
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };
        
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };

        toast.style.cssText = `
            position: fixed;
            top: 24px;
            right: 24px;
            padding: 16px 24px;
            border-radius: 12px;
            background: ${colors[type] || colors.info};
            color: white;
            font-weight: 600;
            font-size: 15px;
            z-index: 10000;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            gap: 12px;
            max-width: 400px;
            animation: slideIn 0.3s ease;
        `;
        
        toast.innerHTML = `
            <span style="font-size:20px">${icons[type] || icons.info}</span>
            <span>${message}</span>
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
}

const homepage = new HomepageController();

window.initializeGoogleMap = () => mapsController.initializeMap();
window.initMap = window.initializeGoogleMap;

document.addEventListener('DOMContentLoaded', () => {
    homepage.initialize();
});

window.homepage = homepage;
window.mapsController = mapsController;
window.apiService = api;

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }

    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }

    .date-input:focus, .district-select:focus {
        border-color: #3b82f6 !important;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
`;
document.head.appendChild(style);