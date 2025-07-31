/**
 * ===================================
 * MY IMPACT PAGE - GOOGLE MAPS FIXED
 * ===================================
 */

// Global variables and configuration
const MyImpactApp = {
    config: {
        animationDuration: 300,
        counterAnimationDuration: 2000,
        notificationTimeout: 3000,
        apiEndpoint: '/api/impact', // Change this to your backend URL
        refreshInterval: 30000, // 30 seconds
        googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY' // Replace with your actual API key
    },
    data: {
        stats: {
            totalReports: 0,
            resolvedIssues: 0,
            communityImpact: 0,
            rating: 0.0
        },
        activities: [],
        badges: [],
        userLocation: {
            lat: 32.0641, // Default: Rosh HaAyin - only for map center
            lng: 34.9550,
            city: 'Rosh HaAyin',
            district: 'Central District',
            country: 'Israel'
        }
    },
    state: {
        isLoading: false,
        lastUpdated: null,
        map: null,
        markers: [],
        infoWindows: []
    }
};

/**
 * ===================================
 * GOOGLE MAPS INTEGRATION - DIRECT
 * ===================================
 */

// Initialize Google Maps immediately without waiting
function initMap() {
    console.log('🗺️ Initializing Google Maps directly...');
    
    // Find map container and ensure proper dimensions
    let mapContainer = document.getElementById('impact-map');
    if (!mapContainer) {
        const mapPlaceholder = document.querySelector('.map-placeholder');
        if (mapPlaceholder) {
            // Preserve original CSS dimensions
            const computedStyle = window.getComputedStyle(mapPlaceholder);
            const width = computedStyle.width;
            const height = computedStyle.height;
            
            mapPlaceholder.innerHTML = `<div id="impact-map" style="width: ${width}; height: ${height}; border-radius: 8px; border: 2px solid #e5e7eb;"></div>`;
            mapContainer = document.getElementById('impact-map');
        }
    }
    
    if (!mapContainer) {
        console.error('❌ Map container not found');
        return;
    }
    
    try {
        // Create map with Google Maps
        const map = new google.maps.Map(mapContainer, {
            zoom: 11,
            center: { lat: 32.0741, lng: 34.8066 }, // Central District, Israel
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
            zoomControl: true,
            styles: [
                {
                    "featureType": "poi.business",
                    "elementType": "labels",
                    "stylers": [{"visibility": "off"}]
                }
            ]
        });

        MyImpactApp.state.map = map;
        console.log('✅ Google Maps initialized successfully');

        // Add user location marker
        addUserLocationMarker(map);
        
        // Load activities from backend and add to map
        loadActivitiesAndAddMarkers(map);
        
        showNotification('🗺️ Map loaded successfully!', 'success', 2000);
        
    } catch (error) {
        console.error('❌ Map initialization failed:', error);
        showSimpleMapFallback();
    }
}

// Add user location marker
function addUserLocationMarker(map) {
    const userMarker = new google.maps.Marker({
        position: MyImpactApp.data.userLocation,
        map: map,
        title: 'Your Location - Rosh HaAyin',
        icon: {
            url: 'data:image/svg+xml;base64,' + btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#1E40AF">
                    <circle cx="12" cy="12" r="8" fill="#3B82F6"/>
                    <circle cx="12" cy="12" r="4" fill="white"/>
                </svg>
            `),
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 16)
        }
    });

    const userInfoWindow = new google.maps.InfoWindow({
        content: `
            <div style="padding: 12px; text-align: center; font-family: Arial, sans-serif;">
                <h4 style="margin: 0 0 8px 0; color: #1F2937;">🏠 Your Location</h4>
                <p style="margin: 0; color: #6B7280; font-size: 14px;">Rosh HaAyin, Central District</p>
                <p style="margin: 8px 0 0 0; color: #10B981; font-size: 12px; font-weight: 500;">
                    ✨ Your Impact Hub
                </p>
            </div>
        `
    });

    userMarker.addListener("click", () => {
        MyImpactApp.state.infoWindows.forEach(iw => iw.close());
        userInfoWindow.open(map, userMarker);
    });
}

// Load activities from backend and add markers
async function loadActivitiesAndAddMarkers(map) {
    try {
        console.log('📍 Loading activities for map...');
        
        // Try to load from backend
        const activities = await loadActivitiesFromBackend();
        
        if (activities && activities.length > 0) {
            addMarkersToMap(map, activities);
        } else {
            // Don't add sample markers - wait for backend only
            console.log('⏳ No activities from backend, map will remain empty until data loads');
        }
        
    } catch (error) {
        console.warn('⚠️ Backend not available, map will remain empty until connection is established');
        showNotification('⚠️ Waiting for backend connection...', 'warning', 3000);
    }
}

// Add markers to map
function addMarkersToMap(map, activities) {
    console.log('📌 Adding', activities.length, 'markers to map');
    
    // Clear existing markers
    MyImpactApp.state.markers.forEach(({ marker }) => {
        if (marker) marker.setMap(null);
    });
    MyImpactApp.state.markers = [];
    MyImpactApp.state.infoWindows = [];

    activities.forEach((activity, index) => {
        if (!activity.lat || !activity.lng) return;

        const marker = new google.maps.Marker({
            position: { lat: parseFloat(activity.lat), lng: parseFloat(activity.lng) },
            map: map,
            title: activity.title || 'Community Report',
            icon: getMarkerIcon(activity.type, activity.status),
            animation: google.maps.Animation.DROP
        });

        const infoWindow = new google.maps.InfoWindow({
            content: createMarkerInfoWindow(activity),
            maxWidth: 300
        });

        marker.addListener("click", () => {
            MyImpactApp.state.infoWindows.forEach(iw => iw.close());
            infoWindow.open(map, marker);
        });

        MyImpactApp.state.markers.push({ marker, activity });
        MyImpactApp.state.infoWindows.push(infoWindow);
    });
}

// Add sample markers when backend is not available
function addSampleMarkers(map) {
    // Don't add any sample data - wait for backend only
    console.log('⏳ Waiting for backend data, no sample markers added');
    showNotification('⏳ Waiting for backend data...', 'info', 2000);
}

// Get marker icon based on status
function getMarkerIcon(type, status) {
    const colors = {
        'resolved': 'green',
        'in-progress': 'yellow',
        'pending': 'red'
    };
    
    const color = colors[status] || 'blue';
    
    return {
        url: `https://maps.google.com/mapfiles/ms/icons/${color}-dot.png`,
        scaledSize: new google.maps.Size(32, 32),
        anchor: new google.maps.Point(16, 32)
    };
}

// Create info window content for markers
function createMarkerInfoWindow(activity) {
    const statusColors = {
        'resolved': '#10B981',
        'in-progress': '#F59E0B', 
        'pending': '#EF4444'
    };
    
    const typeEmojis = {
        'pothole': '🕳️',
        'streetlight': '💡',
        'garbage': '🗑️',
        'traffic': '🚦',
        'sidewalk': '🚶',
        'water': '💧'
    };

    return `
        <div style="padding: 16px; font-family: Arial, sans-serif; max-width: 280px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                <span style="font-size: 24px;">${typeEmojis[activity.type] || '📍'}</span>
                <h4 style="margin: 0; color: #1F2937; font-size: 16px;">${activity.title}</h4>
            </div>
            
            <p style="margin: 0 0 8px 0; color: #4B5563; font-size: 14px;">
                📍 ${activity.location || activity.address}
            </p>
            
            <p style="margin: 0 0 12px 0; color: #6B7280; font-size: 13px;">
                🕒 ${activity.time || 'Recently reported'}
            </p>
            
            <div style="margin-bottom: 12px;">
                <span style="background: ${statusColors[activity.status] || statusColors.pending}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">
                    ${(activity.status || 'pending').toUpperCase()}
                </span>
            </div>
            
            ${activity.description ? `
                <p style="margin: 0 0 12px 0; color: #6B7280; font-size: 13px; font-style: italic;">
                    "${activity.description}"
                </p>
            ` : ''}
            
            <div style="display: flex; gap: 8px;">
                <button onclick="focusOnLocation(${activity.lat}, ${activity.lng})" 
                        style="background: #3B82F6; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">
                    🎯 Focus
                </button>
                <button onclick="shareActivity('${(activity.title || '').replace(/'/g, "\\'")}', '${(activity.location || '').replace(/'/g, "\\'")}')" 
                        style="background: #10B981; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">
                    📤 Share
                </button>
            </div>
        </div>
    `;
}

// Simple fallback when Google Maps fails
function showSimpleMapFallback() {
    const mapElement = document.querySelector('.map-placeholder') || document.getElementById('impact-map');
    if (!mapElement) return;
    
    // Preserve original dimensions
    const computedStyle = window.getComputedStyle(mapElement);
    const width = computedStyle.width;
    const height = computedStyle.height;
    
    mapElement.innerHTML = `
        <div style="width: ${width}; height: ${height}; border-radius: 8px; background: #f3f4f6; border: 2px dashed #d1d5db; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; color: #6b7280;">
            <div style="font-size: 48px; margin-bottom: 16px;">🗺️</div>
            <h3 style="margin: 0 0 8px 0; color: #374151;">Map Unavailable</h3>
            <p style="margin: 0 0 16px 0; font-size: 14px;">Google Maps could not be loaded</p>
            <button onclick="window.location.reload()" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                🔄 Retry
            </button>
        </div>
    `;
}

/**
 * ===================================
 * BACKEND DATA FUNCTIONS
 * ===================================
 */

// Load activities from backend
async function loadActivitiesFromBackend() {
    try {
        const response = await fetch(`${MyImpactApp.config.apiEndpoint}/activities`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const activities = await response.json();
        MyImpactApp.data.activities = activities;
        return activities;
        
    } catch (error) {
        console.warn('Backend activities not available:', error.message);
        return null;
    }
}

// Load stats from backend
async function loadStatsFromBackend() {
    try {
        const response = await fetch(`${MyImpactApp.config.apiEndpoint}/stats`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const stats = await response.json();
        MyImpactApp.data.stats = stats;
        updateStatsDisplay(stats);
        return stats;
        
    } catch (error) {
        console.warn('Backend stats not available:', error.message);
        return null;
    }
}

// Load badges from backend
async function loadBadgesFromBackend() {
    try {
        const response = await fetch(`${MyImpactApp.config.apiEndpoint}/badges`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const badges = await response.json();
        MyImpactApp.data.badges = badges;
        return badges;
        
    } catch (error) {
        console.warn('Backend badges not available:', error.message);
        return null;
    }
}

// Load all data from backend (non-blocking)
async function loadAllDataFromBackend() {
    console.log('🔄 Loading data from backend...');
    
    // Load data in parallel, don't wait for failures
    const promises = [
        loadStatsFromBackend().catch(() => null),
        loadActivitiesFromBackend().catch(() => null),
        loadBadgesFromBackend().catch(() => null)
    ];
    
    const [stats, activities, badges] = await Promise.all(promises);
    
    let successCount = 0;
    if (stats) successCount++;
    if (activities) successCount++;
    if (badges) successCount++;
    
    if (successCount > 0) {
        showNotification(`✅ Connected to backend - loaded ${successCount}/3 data sources`, 'success');
        
        // Refresh map with new activities data
        if (MyImpactApp.state.map && activities && activities.length > 0) {
            addMarkersToMap(MyImpactApp.state.map, activities);
        }
        
    } else {
        showNotification('⚠️ Backend not connected - waiting for data...', 'warning');
    }
    
    return { stats, activities, badges };
}

/**
 * ===================================
 * UI UPDATE FUNCTIONS
 * ===================================
 */

function updateStatsDisplay(stats) {
    if (!stats) return;
    
    console.log('📊 Updating stats display:', stats);
    
    const statElements = {
        totalReports: document.querySelector('.stat-card:nth-child(1) .stat-number'),
        resolvedIssues: document.querySelector('.stat-card:nth-child(2) .stat-number'),
        communityImpact: document.querySelector('.stat-card:nth-child(3) .stat-number'),
        rating: document.querySelector('.stat-card:nth-child(4) .stat-number')
    };
    
    // Also update descriptions
    const descriptionElements = {
        totalReports: document.querySelector('.stat-card:nth-child(1) .stat-change, .stat-card:nth-child(1) p:last-child'),
        resolvedIssues: document.querySelector('.stat-card:nth-child(2) .stat-change, .stat-card:nth-child(2) p:last-child'),
        communityImpact: document.querySelector('.stat-card:nth-child(3) .stat-change, .stat-card:nth-child(3) p:last-child'),
        rating: document.querySelector('.stat-card:nth-child(4) .stat-change, .stat-card:nth-child(4) p:last-child')
    };
    
    Object.keys(statElements).forEach(key => {
        const element = statElements[key];
        const descElement = descriptionElements[key];
        
        if (element && stats[key] !== undefined) {
            const newValue = formatStatValue(stats[key], key);
            element.textContent = newValue;
            
            // Update descriptions with backend data
            if (descElement && stats[key + '_description']) {
                descElement.textContent = stats[key + '_description'];
            }
            
            // Add update animation
            element.style.transform = 'scale(1.1)';
            element.style.color = '#10b981';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
                element.style.color = '';
            }, 200);
        }
    });
}

function formatStatValue(value, type) {
    if (value === null || value === undefined) return '0';
    
    switch (type) {
        case 'communityImpact':
            return value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value.toString();
        case 'rating':
            return typeof value === 'number' ? value.toFixed(1) : value.toString();
        default:
            return value.toString();
    }
}

/**
 * ===================================
 * GLOBAL MAP FUNCTIONS
 * ===================================
 */

window.focusOnLocation = function(lat, lng) {
    if (MyImpactApp.state.map) {
        MyImpactApp.state.map.setCenter({ lat: parseFloat(lat), lng: parseFloat(lng) });
        MyImpactApp.state.map.setZoom(16);
        showNotification('🎯 Map focused on location', 'info', 2000);
    }
};

window.shareActivity = function(title, location) {
    const text = `I reported: ${title} at ${location} via CityFix! 🏙️ Making Israel better together! 🇮🇱`;
    
    if (navigator.share) {
        navigator.share({
            title: 'My CityFix Activity',
            text: text,
            url: window.location.href
        }).catch(console.error);
    } else {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('📋 Activity shared to clipboard!', 'success');
        }).catch(() => {
            showNotification('Could not copy to clipboard', 'error');
        });
    }
};

/**
 * ===================================
 * NOTIFICATION SYSTEM
 * ===================================
 */

function setupNotificationSystem() {
    if (!document.getElementById('notification-container')) {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }
}

function showNotification(message, type = 'info', duration = 3000) {
    setupNotificationSystem();
    
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    const id = 'notification-' + Date.now();
    
    const colors = {
        'success': '#10b981',
        'error': '#ef4444',
        'warning': '#f59e0b',
        'info': '#3b82f6'
    };
    
    const icons = {
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'info': 'ℹ️'
    };
    
    notification.id = id;
    notification.style.cssText = `
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        margin-bottom: 8px;
        max-width: 350px;
        pointer-events: auto;
        transform: translateX(100%);
        transition: all 0.3s ease;
        opacity: 0;
        padding: 12px 16px;
        border-left: 4px solid ${colors[type]};
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 18px;">${icons[type]}</span>
            <span style="flex: 1; color: #374151; font-size: 14px;">${message}</span>
            <button onclick="closeNotification('${id}')" style="background: none; border: none; font-size: 16px; color: #9ca3af; cursor: pointer; padding: 0; width: 20px; height: 20px;">×</button>
        </div>
    `;
    
    container.appendChild(notification);
    
    requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    });
    
    setTimeout(() => closeNotification(id), duration);
    
    return id;
}

window.closeNotification = function(id) {
    const notification = document.getElementById(id);
    if (notification) {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
};

/**
 * ===================================
 * INITIALIZATION
 * ===================================
 */

// Initialize immediately when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing My Impact Page...');
    
    try {
        setupNotificationSystem();
        
        // Clear any existing hardcoded values and show loading state
        clearStatsDisplay();
        
        // Initialize map immediately if Google Maps is available
        if (typeof google !== 'undefined' && google.maps) {
            console.log('✅ Google Maps already loaded');
            initMap();
        } else {
            console.log('⏳ Waiting for Google Maps...');
            // Set up callback for when Google Maps loads
            window.initMap = function() {
                console.log('📍 Google Maps callback triggered');
                initMap();
            };
            
            // Also try to detect when Google Maps loads
            let attempts = 0;
            const checkGoogleMaps = setInterval(() => {
                attempts++;
                if (typeof google !== 'undefined' && google.maps) {
                    console.log('✅ Google Maps detected after', attempts * 500, 'ms');
                    clearInterval(checkGoogleMaps);
                    initMap();
                } else if (attempts > 20) { // 10 seconds
                    console.warn('⚠️ Google Maps failed to load');
                    clearInterval(checkGoogleMaps);
                    showSimpleMapFallback();
                }
            }, 500);
        }
        
        // Load backend data (non-blocking)
        loadAllDataFromBackend().catch(() => {
            console.log('📱 Backend not available');
            showNotification('⚠️ Unable to connect to backend. Please check your connection.', 'warning', 5000);
        });
        
        // Setup auto-refresh (every 30 seconds)
        setInterval(() => {
            if (!document.hidden) {
                loadAllDataFromBackend().catch(() => {});
            }
        }, MyImpactApp.config.refreshInterval);
        
        console.log('✅ Page initialization complete');
        
    } catch (error) {
        console.error('❌ Initialization error:', error);
        showNotification('❌ Failed to initialize page', 'error');
    }
});

// Clear hardcoded stats and show waiting state
function clearStatsDisplay() {
    const statElements = {
        totalReports: document.querySelector('.stat-card:nth-child(1) .stat-number'),
        resolvedIssues: document.querySelector('.stat-card:nth-child(2) .stat-number'),
        communityImpact: document.querySelector('.stat-card:nth-child(3) .stat-number'),
        rating: document.querySelector('.stat-card:nth-child(4) .stat-number')
    };
    
    const descriptionElements = {
        totalReports: document.querySelector('.stat-card:nth-child(1) .stat-change, .stat-card:nth-child(1) p:last-child'),
        resolvedIssues: document.querySelector('.stat-card:nth-child(2) .stat-change, .stat-card:nth-child(2) p:last-child'),
        communityImpact: document.querySelector('.stat-card:nth-child(3) .stat-change, .stat-card:nth-child(3) p:last-child'),
        rating: document.querySelector('.stat-card:nth-child(4) .stat-change, .stat-card:nth-child(4) p:last-child')
    };
    
    // Clear all stats to show loading state
    Object.values(statElements).forEach(element => {
        if (element) {
            element.textContent = '...';
            element.style.color = '#9CA3AF';
        }
    });
    
    // Clear descriptions
    Object.values(descriptionElements).forEach(element => {
        if (element) {
            element.textContent = 'Loading...';
            element.style.color = '#9CA3AF';
        }
    });
}

console.log('📱 MyImpact.js loaded - Google Maps Integration Ready!');