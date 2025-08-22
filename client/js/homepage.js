'use strict';

const API_BASE = `${location.origin}/api`;

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

function decodeJwtPayload(token) {
    try {
        const payload = token.split('.')[1];
        const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decodeURIComponent(escape(json)));
    } catch {
        return null;
    }
}

function dateToISO(dateStr) {
    if (!dateStr || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return '';
    const [mm, dd, yyyy] = dateStr.split('/');
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}

function isoToDisplay(isoDate) {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
}

function addSkeleton(el) {
    if (el) el.classList.add('skeleton');
}

function removeSkeleton(el) {
    if (el) el.classList.remove('skeleton');
}

function normalizeReport(report) {
    return {
        _id: report._id || report.id,
        title: report.title || report.issueType || 'Report',
        description: report.description || '',
        type: String(report.issueType || report.type || report.category || 'other').toLowerCase(),
        status: String(report.status || 'pending').toLowerCase(),
        lat: Number(report.coordinates?.lat || report.location?.coordinates?.[1] || report.lat || 0),
        lng: Number(report.coordinates?.lng || report.location?.coordinates?.[0] || report.lng || 0),
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
        else if (status === 'in-progress' || status === 'processing') stats.inProgress++;
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
        const timeout = setTimeout(() => controller.abort(), options.timeout || 10000);

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
                if (response.status === 401) {
                    this.handleUnauthorized();
                }
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

    handleUnauthorized() {
        localStorage.removeItem('cityfix_token');
        sessionStorage.removeItem('cityfix_token');
        AppState.user = null;
        const authSection = document.querySelector('.auth-section');
        if (authSection) {
            authSection.innerHTML = `
                <a href="login.html" class="login-btn">Login</a>
                <a href="signup.html" class="signup-btn">Sign Up</a>
            `;
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
            // Check if the /auth/me endpoint exists
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
            // Silently fall back to JWT parsing
        }

        // Fall back to JWT decoding if endpoint fails
        const payload = decodeJwtPayload(token);
        if (payload) {
            return {
                id: payload.id || payload.sub,
                role: payload.role || 'citizen',
                name: payload.name || '',
                email: payload.email || ''
            };
        }
        
        return null;
    }

    async getDashboardStats(params = {}) {
        const query = new URLSearchParams(params).toString();
        const endpoint = `${API_ENDPOINTS.DASHBOARD_STATS}${query ? `?${query}` : ''}`;
        
        const response = await this.request(endpoint);
        if (response.success && response.data) {
            return response.data;
        }
        return {
            totalReports: 0,
            resolved: 0,
            inProgress: 0,
            resolutionRate: 0,
            weeklyTrend: null
        };
    }

    async getReports(filters = {}) {
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
        return [];
    }

    async getDistricts() {
        if (this.cache.has('districts')) {
            const cached = this.cache.get('districts');
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        const response = await this.request(API_ENDPOINTS.DISTRICTS);
        const districts = response.success ? response.data : [];
        
        this.cache.set('districts', {
            data: districts,
            timestamp: Date.now()
        });
        
        return districts;
    }

    async getReportTypes() {
        if (this.cache.has('reportTypes')) {
            const cached = this.cache.get('reportTypes');
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        const response = await this.request(API_ENDPOINTS.REPORT_TYPES);
        const types = response.success ? response.data : [];
        
        this.cache.set('reportTypes', {
            data: types,
            timestamp: Date.now()
        });
        
        return types;
    }
}

const api = new ApiService(API_BASE);

class GoogleMapsController {
    constructor() {
        this.map = null;
        this.markers = [];
        this.markerCluster = null;
        this.infoWindow = null;
        this.isInitialized = false;
        this.heatmap = null;
    }

    async initializeMap() {
        if (typeof google === 'undefined' || !google.maps) {
            return this.showMapFallback();
        }

        const mapElement = document.getElementById('google-map');
        if (!mapElement) return;

        mapElement.innerHTML = '';
        mapElement.style.height = '400px';

        this.map = new google.maps.Map(mapElement, {
            center: GOOGLE_MAPS_CONFIG.DEFAULT_CENTER,
            zoom: GOOGLE_MAPS_CONFIG.DEFAULT_ZOOM,
            styles: GOOGLE_MAPS_CONFIG.MAP_STYLES,
            mapTypeControl: false,
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
            
            // Add markers for each report
            reports.forEach(report => this.addMarker(report));
            
            if (this.markers.length > 0) {
                this.fitBounds();
            } else {
                // Show no data message on map if no markers
                this.showNoDataOnMap();
            }
            
            // Update issue cards with the latest data
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
            background: rgba(255, 255, 255, 0.95);
            padding: 24px 32px;
            border-radius: 12px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            z-index: 100;
            text-align: center;
        `;
        overlay.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 12px;">📍</div>
            <h3 style="margin: 0 0 8px; color: #111827; font-size: 18px;">No Reports Available</h3>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Adjust your filters to see report markers</p>
        `;
        
        const mapElement = document.getElementById('google-map');
        if (mapElement) {
            mapElement.style.position = 'relative';
            mapElement.appendChild(overlay);
        }
    }

    addMarker(report) {
        if (!this.map || !report || !isFinite(report.lat) || !isFinite(report.lng)) return;

        const marker = new google.maps.Marker({
            position: { lat: report.lat, lng: report.lng },
            map: this.map,
            title: report.title,
            icon: this.getMarkerIcon(report.type, report.status),
            animation: google.maps.Animation.DROP
        });

        marker.addListener('click', () => this.showInfoWindow(marker, report));
        this.markers.push(marker);
    }

    getMarkerIcon(type, status) {
        const colors = {
            pothole: '#ff6b35',
            lighting: '#ffd23f',
            drainage: '#4dabf7',
            traffic: '#28a745',
            other: '#868e96'
        };

        const sizes = {
            new: 12,
            pending: 10,
            'in-progress': 8,
            resolved: 6
        };

        const color = colors[type] || colors.other;
        const scale = sizes[status] || 8;

        return {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: color,
            fillOpacity: 0.85,
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
            resolved: '#198754',
            rejected: '#6c757d'
        };

        const color = statusColors[report.status] || '#6c757d';
        const content = `
            <div style="max-width:320px;font-family:'Inter',sans-serif">
                <h4 style="margin:0 0 8px;font-size:16px;color:#111827">${report.title}</h4>
                ${report.description ? `<p style="margin:0 0 8px;color:#6b7280;font-size:14px">${report.description}</p>` : ''}
                <div style="margin:8px 0">
                    <span style="display:inline-block;padding:3px 10px;border-radius:12px;background:${color};color:#fff;font-size:12px;font-weight:600;text-transform:uppercase">
                        ${report.status}
                    </span>
                </div>
                <div style="margin-top:8px;font-size:13px;color:#374151">
                    <p style="margin:4px 0"><strong>Type:</strong> ${this.formatType(report.type)}</p>
                    <p style="margin:4px 0"><strong>Location:</strong> ${report.address || `${report.lat.toFixed(4)}, ${report.lng.toFixed(4)}`}</p>
                    <p style="margin:4px 0"><strong>Reported:</strong> ${this.formatTimeAgo(report.createdAt)}</p>
                    <p style="margin:4px 0"><strong>Priority:</strong> ${this.formatPriority(report.priority)}</p>
                </div>
                ${report.images?.length ? `
                    <div style="margin-top:10px">
                        <img src="${report.images[0]}" alt="Report image" style="width:100%;max-height:150px;object-fit:cover;border-radius:8px">
                    </div>
                ` : ''}
            </div>
        `;

        this.infoWindow.setContent(content);
        this.infoWindow.open(this.map, marker);
    }

    formatType(type) {
        return type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ');
    }

    formatPriority(priority) {
        const priorityColors = {
            high: '#dc3545',
            medium: '#fd7e14',
            low: '#28a745'
        };
        const color = priorityColors[priority] || '#6c757d';
        return `<span style="color:${color};font-weight:600">${priority.charAt(0).toUpperCase() + priority.slice(1)}</span>`;
    }

    formatTimeAgo(dateString) {
        if (!dateString) return 'Unknown';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
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
        // Remove any no-data overlay when clearing markers
        const overlay = document.querySelector('.no-data-overlay');
        if (overlay) overlay.remove();
        
        this.markers.forEach(marker => marker.setMap(null));
        this.markers = [];
        if (this.markerCluster) {
            this.markerCluster.clearMarkers();
        }
    }

    showMapFallback() {
        const mapElement = document.getElementById('google-map');
        if (!mapElement) return;

        mapElement.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;height:400px;background:#f3f4f6;border-radius:12px;border:2px dashed #e5e7eb">
                <div style="text-align:center;color:#6b7280">
                    <div style="font-size:48px;margin-bottom:12px">🗺️</div>
                    <div style="font-size:16px;font-weight:500">Loading Google Maps...</div>
                    <div style="font-size:14px;margin-top:8px">Please wait</div>
                </div>
            </div>
        `;
    }

    showMapError(message) {
        const mapElement = document.getElementById('google-map');
        if (!mapElement) return;

        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#dc3545;color:#fff;padding:12px 20px;border-radius:8px;z-index:1000;font-size:14px;font-weight:500';
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
            this.updateUIForUser(AppState.user);

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
            this.showError('Unable to connect to server. Please check if the backend is running.');
            // Initialize cards with zero values when offline
            this.initializeIssueCards();
        }
    }

    initializeIssueCards() {
        // Initialize all issue cards with proper structure
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
                    countEl.style.cssText = 'display:block;font-size:24px;font-weight:700;color:#111827;margin-bottom:4px;';
                    stats.appendChild(countEl);
                }
                
                let statusEl = stats.querySelector('.issue-status');
                if (!statusEl) {
                    statusEl = document.createElement('span');
                    statusEl.className = 'issue-status';
                    statusEl.style.cssText = 'display:block;font-size:14px;color:#6b7280;';
                    stats.appendChild(statusEl);
                }
                
                // Set initial values
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
        this.observeStatCounters();
    }

    setupDateInputs() {
        const dateInputs = document.querySelectorAll('.date-input');
        dateInputs.forEach((input, index) => {
            input.type = 'text';
            input.maxLength = 10;
            input.placeholder = index === 0 ? 'MM/DD/YYYY' : 'MM/DD/YYYY';

            // Format input as user types
            input.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                    value = value.slice(0, 2) + '/' + value.slice(2);
                }
                if (value.length >= 5) {
                    value = value.slice(0, 5) + '/' + value.slice(5, 9);
                }
                e.target.value = value;
            });

            // Validate and apply filter on change
            input.addEventListener('change', async (e) => {
                const isValid = /^\d{2}\/\d{2}\/\d{4}$/.test(e.target.value);
                
                if (!isValid && e.target.value !== '') {
                    this.showToast('Please enter a valid date (MM/DD/YYYY)', 'error');
                    e.target.style.borderColor = '#ef4444';
                    return;
                }
                
                e.target.style.borderColor = '';
                
                if (isValid) {
                    // Validate date range
                    const dateValue = e.target.value;
                    const [mm, dd, yyyy] = dateValue.split('/').map(Number);
                    const inputDate = new Date(yyyy, mm - 1, dd);
                    const today = new Date();
                    
                    // Check if date is valid
                    if (inputDate.getMonth() !== mm - 1 || inputDate.getDate() !== dd) {
                        this.showToast('Invalid date entered', 'error');
                        e.target.style.borderColor = '#ef4444';
                        return;
                    }
                    
                    // Check if future date
                    if (inputDate > today) {
                        this.showToast('Cannot select future dates', 'warning');
                        e.target.style.borderColor = '#f59e0b';
                        return;
                    }
                    
                    // Apply filter
                    if (index === 0) {
                        currentFilters.startDate = e.target.value;
                    } else {
                        currentFilters.endDate = e.target.value;
                    }
                    
                    // Validate date range
                    if (currentFilters.startDate && currentFilters.endDate) {
                        const start = new Date(dateToISO(currentFilters.startDate));
                        const end = new Date(dateToISO(currentFilters.endDate));
                        
                        if (start > end) {
                            this.showToast('Start date must be before end date', 'error');
                            e.target.style.borderColor = '#ef4444';
                            return;
                        }
                    }
                    
                    // Check if data exists for this date range
                    await this.applyFiltersWithValidation();
                } else if (e.target.value === '') {
                    // Clear filter
                    if (index === 0) {
                        currentFilters.startDate = '';
                    } else {
                        currentFilters.endDate = '';
                    }
                    await this.applyFiltersWithValidation();
                }
            });

            // Add visual feedback on focus
            input.addEventListener('focus', (e) => {
                e.target.style.borderColor = '#3b82f6';
            });

            input.addEventListener('blur', (e) => {
                if (!e.target.style.borderColor || e.target.style.borderColor === '#3b82f6') {
                    e.target.style.borderColor = '';
                }
            });
        });
    }

    setupFilters() {
        // District filter
        const districtSelect = document.querySelector('.district-select');
        if (districtSelect) {
            districtSelect.addEventListener('change', async (e) => {
                currentFilters.district = e.target.value;
                await this.applyFiltersWithValidation();
            });
        }

        // Issue type checkboxes
        const checkboxes = document.querySelectorAll('input[name="issue-type"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', async () => {
                const checkedTypes = Array.from(checkboxes)
                    .filter(cb => cb.checked)
                    .map(cb => cb.value);
                
                if (checkedTypes.length === 0) {
                    // At least one type must be selected
                    checkbox.checked = true;
                    this.showToast('At least one issue type must be selected', 'warning');
                    return;
                }
                
                currentFilters.issueTypes = checkedTypes;
                await this.applyFiltersWithValidation();
            });
        });

        // Add traffic checkbox if missing
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

            // Add other checkbox if missing
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
            el.style.color = '#6b7280';
        });
    }

    async loadDashboardStats() {
        try {
            const stats = await api.getDashboardStats();
            AppState.dashboardStats = stats;
            this.renderDashboardStats(stats);
            
            // Load reports if not already loaded
            if (AppState.reports.length === 0) {
                AppState.reports = await api.getReports(currentFilters);
            }
            
            // Update issue cards with real data
            this.updateIssueCards();
        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
            this.renderDashboardStats({
                totalReports: 0,
                resolved: 0,
                inProgress: 0,
                resolutionRate: 0
            });
            // Still update issue cards with empty data
            this.updateIssueCards();
        }
    }

    renderDashboardStats(stats) {
        const elements = document.querySelectorAll('.stat-number');
        const values = [stats.totalReports, stats.resolved, stats.inProgress];

        elements.forEach((el, index) => {
            if (values[index] !== undefined) {
                this.animateNumber(el, values[index]);
                el.style.color = '#111827';
            }
        });

        this.updateMapStats(stats);
    }

    updateMapStats(stats) {
        const statCards = document.querySelectorAll('.map-stat-card .resolution-percentage');
        
        if (statCards[0] && AppState.districts.length > 0) {
            const activeDistrict = currentFilters.district || AppState.districts[0].value;
            const districtName = AppState.districts.find(d => d.value === activeDistrict)?.name || activeDistrict;
            statCards[0].textContent = districtName;
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
            const trend = stats.weeklyTrend;
            if (trend > 0) {
                statCards[3].textContent = `↑ +${trend}%`;
                statCards[3].style.color = '#10b981';
            } else if (trend < 0) {
                statCards[3].textContent = `↓ ${trend}%`;
                statCards[3].style.color = '#ef4444';
            } else {
                statCards[3].textContent = '→ 0%';
                statCards[3].style.color = '#6b7280';
            }
        }

        this.updateIssueCards();
    }

    updateIssueCards() {
        const stats = buildStatsFromReports(AppState.reports);
        const types = ['pothole', 'lighting', 'drainage', 'traffic', 'other'];

        types.forEach(type => {
            const typeStats = stats.byType[type] || { count: 0, resolved: 0 };
            const card = document.querySelector(`.issue-card[data-type="${type}"]`);
            
            if (card) {
                const countEl = card.querySelector('.issue-count');
                const statusEl = card.querySelector('.issue-status');
                
                if (countEl) {
                    // Update count with proper formatting
                    const count = typeStats.count || 0;
                    countEl.textContent = count > 0 ? count.toLocaleString() : '0';
                    countEl.style.fontSize = '24px';
                    countEl.style.fontWeight = '700';
                    countEl.style.color = '#111827';
                    countEl.style.display = 'block';
                    countEl.style.marginBottom = '4px';
                }
                
                if (statusEl) {
                    const percentage = typeStats.count > 0 
                        ? Math.round((typeStats.resolved / typeStats.count) * 100)
                        : 0;
                    statusEl.textContent = `${percentage}% resolved`;
                    statusEl.style.fontSize = '14px';
                    statusEl.style.color = '#6b7280';
                    statusEl.style.display = 'block';
                }
            }
        });

        // Update the text content for consistency
        this.updateIssueCardDescriptions();
    }

    updateIssueCardDescriptions() {
        // Fix the card structure if needed
        const cards = document.querySelectorAll('.issue-card');
        
        cards.forEach(card => {
            const stats = card.querySelector('.issue-stats');
            if (stats) {
                // Ensure we have both count and status elements
                let countEl = stats.querySelector('.issue-count');
                let statusEl = stats.querySelector('.issue-status');
                
                if (!countEl) {
                    countEl = document.createElement('span');
                    countEl.className = 'issue-count';
                    stats.appendChild(countEl);
                }
                
                if (!statusEl) {
                    statusEl = document.createElement('span');
                    statusEl.className = 'issue-status';
                    stats.appendChild(statusEl);
                }
                
                // Set default values if empty
                if (!countEl.textContent || countEl.textContent === 'Loading...') {
                    countEl.textContent = '0';
                }
                
                if (!statusEl.textContent || statusEl.textContent === 'Loading...') {
                    statusEl.textContent = '0% resolved';
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

        try {
            // Show loading state
            this.showFilterLoadingState();
            
            // Apply filters and get reports
            const reports = await api.getReports(currentFilters);
            
            // Check if we have data for the selected filters
            if (reports.length === 0) {
                // Check if it's a date issue
                if (currentFilters.startDate || currentFilters.endDate) {
                    this.showToast('No data found for the selected date range', 'info');
                    
                    // Show message on map
                    const mapElement = document.getElementById('google-map');
                    if (mapElement && !mapElement.querySelector('.no-data-message')) {
                        const noDataMsg = document.createElement('div');
                        noDataMsg.className = 'no-data-message';
                        noDataMsg.style.cssText = `
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            background: rgba(255, 255, 255, 0.95);
                            padding: 20px 30px;
                            border-radius: 12px;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                            z-index: 100;
                            text-align: center;
                        `;
                        noDataMsg.innerHTML = `
                            <div style="font-size: 48px; margin-bottom: 10px;">📅</div>
                            <h3 style="margin: 0 0 10px; color: #111827;">No Data Available</h3>
                            <p style="margin: 0; color: #6b7280;">No reports found for the selected date range.<br>Try adjusting your filters.</p>
                        `;
                        mapElement.style.position = 'relative';
                        mapElement.appendChild(noDataMsg);
                        
                        // Remove message after 3 seconds
                        setTimeout(() => noDataMsg.remove(), 3000);
                    }
                } else if (currentFilters.district) {
                    this.showToast(`No reports found in ${currentFilters.district}`, 'info');
                } else {
                    this.showToast('No reports match the selected filters', 'info');
                }
            }
            
            // Update state and UI
            AppState.reports = reports;
            await mapsController.refreshWithFilters();
            this.updateMapStats(AppState.dashboardStats);
            
            // Update filter indicators
            this.updateFilterIndicators();
            
        } catch (error) {
            console.error('Failed to apply filters:', error);
            this.showToast('Failed to apply filters. Please try again.', 'error');
        } finally {
            this.hideFilterLoadingState();
        }
    }

    async applyFilters() {
        return this.applyFiltersWithValidation();
    }

    showFilterLoadingState() {
        // Add loading class to map
        const mapElement = document.getElementById('google-map');
        if (mapElement) {
            mapElement.style.opacity = '0.7';
            mapElement.style.pointerEvents = 'none';
        }
        
        // Show loading on stats
        document.querySelectorAll('.map-stat-card').forEach(card => {
            card.style.opacity = '0.6';
        });
    }

    hideFilterLoadingState() {
        // Remove loading state
        const mapElement = document.getElementById('google-map');
        if (mapElement) {
            mapElement.style.opacity = '1';
            mapElement.style.pointerEvents = 'auto';
        }
        
        document.querySelectorAll('.map-stat-card').forEach(card => {
            card.style.opacity = '1';
        });
    }

    updateFilterIndicators() {
        // Show active filters count
        let activeFilters = 0;
        if (currentFilters.startDate) activeFilters++;
        if (currentFilters.endDate) activeFilters++;
        if (currentFilters.district) activeFilters++;
        if (currentFilters.issueTypes.length < 5) activeFilters++;
        
        const filterTitle = document.querySelector('.filters-title');
        if (filterTitle && activeFilters > 0) {
            // Add badge if not exists
            let badge = filterTitle.querySelector('.filter-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'filter-badge';
                badge.style.cssText = `
                    background: #3b82f6;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    margin-left: 8px;
                    font-weight: 600;
                `;
                filterTitle.appendChild(badge);
            }
            badge.textContent = activeFilters;
        } else {
            const badge = document.querySelector('.filter-badge');
            if (badge) badge.remove();
        }
    }

    updateUIForUser(user) {
        // Don't modify the header - keep it as is
        // The header should remain unchanged with Login/Sign Up buttons
        return;
    }

    logout() {
        localStorage.removeItem('cityfix_token');
        sessionStorage.removeItem('cityfix_token');
        AppState.user = null;
        this.updateUIForUser(null);
        this.showToast('Logged out successfully', 'success');
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
            await this.loadPDFLibraries();

            const stats = AppState.dashboardStats || await api.getDashboardStats();
            const reportStats = buildStatsFromReports(AppState.reports);

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');

            let y = 20;

            pdf.setFontSize(24);
            pdf.setTextColor(79, 70, 229);
            pdf.text('CityFix', 20, y);

            pdf.setFontSize(16);
            pdf.setTextColor(124, 58, 237);
            pdf.text('Community Report Dashboard', 20, y + 10);
            y += 30;

            pdf.setFontSize(12);
            pdf.setTextColor(100, 116, 139);
            pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, y);
            y += 20;

            pdf.setFontSize(18);
            pdf.setTextColor(30, 41, 59);
            pdf.text('Dashboard Statistics', 20, y);
            y += 15;

            pdf.setFontSize(12);
            pdf.setTextColor(55, 65, 81);

            const statsData = [
                ['Total Reports', stats.totalReports.toLocaleString()],
                ['Resolved Issues', stats.resolved.toLocaleString()],
                ['In Progress', stats.inProgress.toLocaleString()],
                ['Resolution Rate', `${stats.resolutionRate}%`]
            ];

            statsData.forEach(([label, value]) => {
                pdf.text(label + ':', 20, y);
                pdf.text(value, 80, y);
                y += 8;
            });

            y += 10;
            pdf.setFontSize(18);
            pdf.setTextColor(30, 41, 59);
            pdf.text('Issue Types Breakdown', 20, y);
            y += 15;

            pdf.setFontSize(12);
            pdf.setTextColor(55, 65, 81);

            Object.values(reportStats.byType).forEach(type => {
                const percentage = type.count > 0 
                    ? Math.round((type.resolved / type.count) * 100)
                    : 0;
                pdf.text(`${this.formatType(type.name)}: ${type.count} reports (${percentage}% resolved)`, 20, y);
                y += 8;
            });

            if (Object.keys(reportStats.byDistrict).length > 0) {
                y += 10;
                pdf.setFontSize(18);
                pdf.setTextColor(30, 41, 59);
                pdf.text('District Performance', 20, y);
                y += 15;

                pdf.setFontSize(12);
                pdf.setTextColor(55, 65, 81);

                Object.values(reportStats.byDistrict).forEach(district => {
                    const percentage = district.count > 0 
                        ? Math.round((district.resolved / district.count) * 100)
                        : 0;
                    pdf.text(`${this.formatType(district.name)}: ${district.count} reports (${percentage}% resolved)`, 20, y);
                    y += 8;

                    if (y > 250) {
                        pdf.addPage();
                        y = 20;
                    }
                });
            }

            const mapElement = document.getElementById('google-map');
            if (mapElement && window.html2canvas) {
                if (y > 150) {
                    pdf.addPage();
                    y = 20;
                }

                pdf.setFontSize(18);
                pdf.setTextColor(30, 41, 59);
                pdf.text('Issue Distribution Map', 20, y);
                y += 15;

                try {
                    const canvas = await window.html2canvas(mapElement, {
                        useCORS: true,
                        backgroundColor: '#ffffff',
                        scale: 2
                    });

                    const imgData = canvas.toDataURL('image/png');
                    const imgWidth = 170;
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;

                    pdf.addImage(imgData, 'PNG', 20, y, imgWidth, Math.min(imgHeight, 150));
                } catch (error) {
                    console.error('Failed to capture map:', error);
                }
            }

            pdf.setFontSize(10);
            pdf.setTextColor(156, 163, 175);
            pdf.text('Generated by CityFix', 105, 285, { align: 'center' });

            const filename = `CityFix_Report_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.pdf`;
            pdf.save(filename);

            this.showToast('PDF exported successfully', 'success');
        } catch (error) {
            console.error('PDF export error:', error);
            this.showToast('Failed to export PDF', 'error');
        }
    }

    async loadPDFLibraries() {
        if (!window.jspdf) {
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        }
        if (!window.html2canvas) {
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    observeStatCounters() {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && AppState.dashboardStats) {
                        const element = entry.target;
                        const index = Array.from(document.querySelectorAll('.stat-number')).indexOf(element);
                        const values = [
                            AppState.dashboardStats.totalReports,
                            AppState.dashboardStats.resolved,
                            AppState.dashboardStats.inProgress
                        ];
                        
                        if (values[index] !== undefined) {
                            this.animateNumber(element, values[index]);
                            observer.unobserve(element);
                        }
                    }
                });
            },
            { threshold: 0.5 }
        );

        document.querySelectorAll('.stat-number').forEach(el => {
            observer.observe(el);
        });
    }

    animateNumber(element, target, duration = 1200) {
        if (!element) return;

        const start = 0;
        const increment = target / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
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
        }, 30000);
    }

    formatType(type) {
        if (!type) return 'Unknown';
        return type.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    showToast(message, type = 'info') {
        if (window.toast?.show) {
            window.toast.show(message, type);
            return;
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };

        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            background: ${colors[type] || colors.info};
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    showError(message) {
        const banner = document.createElement('div');
        banner.className = 'error-banner';
        banner.textContent = message;
        
        banner.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: #fee2e2;
            color: #dc2626;
            padding: 12px 20px;
            border-radius: 10px;
            z-index: 9999;
            box-shadow: 0 6px 20px rgba(220, 38, 38, 0.25);
            font-weight: 600;
            max-width: 90%;
            text-align: center;
        `;

        document.body.appendChild(banner);

        setTimeout(() => {
            banner.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => banner.remove(), 300);
        }, 6000);
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
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }

    .skeleton {
        position: relative;
        min-width: 80px;
        min-height: 18px;
        border-radius: 8px;
        background: linear-gradient(90deg, #eef2f7 25%, #f6f7fb 37%, #eef2f7 63%);
        background-size: 400% 100%;
        animation: shimmer 1.2s ease-in-out infinite;
        color: transparent !important;
    }

    @keyframes shimmer {
        0% {
            background-position: 100% 0;
        }
        100% {
            background-position: 0 0;
        }
    }

    .user-menu {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .user-name {
        color: #374151;
        font-weight: 500;
    }

    .logout-btn {
        padding: 8px 16px;
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        transition: background 0.2s;
    }

    .logout-btn:hover {
        background: #dc2626;
    }

    .mobile-nav.active {
        display: flex;
        flex-direction: column;
        position: fixed;
        top: 60px;
        left: 0;
        right: 0;
        background: white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        padding: 20px;
        z-index: 1000;
    }

    .mobile-menu-btn.active span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
    }

    .mobile-menu-btn.active span:nth-child(2) {
        opacity: 0;
    }

    .mobile-menu-btn.active span:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -6px);
    }
`;
document.head.appendChild(style);