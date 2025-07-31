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
        updateBadgesDisplay(badges);
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
        
        // Update badges display
        if (badges && badges.length > 0) {
            updateBadgesDisplay(badges);
        }
        
        // Update activities display
        if (activities && activities.length > 0) {
            updateActivitiesDisplay(activities);
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

function updateBadgesDisplay(badges) {
    if (!badges || badges.length === 0) return;
    
    console.log('🏆 Updating badges display:', badges);
    
    // Find badges container - match HTML structure
    let badgesContainer = document.querySelector('.badges-grid');
    
    if (!badgesContainer) {
        console.warn('❌ Badges container (.badges-grid) not found');
        return;
    }
    
    // Clear existing badges (including hardcoded ones)
    badgesContainer.innerHTML = '';
    
    badges.forEach((badge, index) => {
        const badgeElement = document.createElement('div');
        badgeElement.className = 'badge-card earned cursor-pointer hover:shadow-lg transition-all duration-200';
        badgeElement.setAttribute('data-dynamic', 'true'); // Mark as dynamic content
        badgeElement.style.animationDelay = `${index * 100}ms`;
        badgeElement.style.animation = 'fadeInUp 0.5s ease forwards';
        
        // Badge icons mapping
        const badgeIcons = {
            'first-report': '🏅',
            'resolved-issues': '🎖️', 
            'community-hero': '🏆',
            'top-reporter': '👑',
            'active-citizen': '⭐',
            'problem-solver': '🔧',
            'neighborhood-guardian': '🛡️',
            'civic-champion': '🥇'
        };
        
        const icon = badgeIcons[badge.type] || '🏆';
        const isEarned = badge.earned;
        const opacity = isEarned ? '1' : '0.4';
        const earnedClass = isEarned ? 'earned' : 'not-earned';
        
        badgeElement.className = `badge-card ${earnedClass} cursor-pointer hover:shadow-lg transition-all duration-200`;
        badgeElement.style.opacity = opacity;
        
        badgeElement.innerHTML = `
            <div class="badge-icon">
                <div style="font-size: 48px; display: flex; align-items: center; justify-content: center; width: 64px; height: 64px;">${icon}</div>
            </div>
            <div class="badge-title">${badge.title}</div>
            <div class="badge-date">${isEarned ? `Earned ${badge.earnedDate}` : (badge.description || 'Not earned yet')}</div>
            ${badge.progress ? `
                <div style="margin-top: 12px;">
                    <div style="width: 100%; background: #e5e7eb; border-radius: 9999px; height: 8px;">
                        <div style="background: #3b82f6; height: 8px; border-radius: 9999px; transition: all 0.5s ease; width: ${badge.progress}%"></div>
                    </div>
                    <p style="font-size: 12px; color: #9ca3af; margin-top: 4px;">${badge.progress}% Complete</p>
                </div>
            ` : ''}
        `;
        
        // Add click interaction
        badgeElement.addEventListener('click', () => {
            showBadgeDetails(badge);
        });
        
        badgeElement.addEventListener('mouseenter', () => {
            badgeElement.style.transform = 'translateY(-4px)';
        });
        
        badgeElement.addEventListener('mouseleave', () => {
            badgeElement.style.transform = 'translateY(0)';
        });
        
        badgesContainer.appendChild(badgeElement);
    });
    
    // Add CSS animation if not exists
    if (!document.getElementById('badge-animations')) {
        const style = document.createElement('style');
        style.id = 'badge-animations';
        style.textContent = `
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .cursor-pointer {
                cursor: pointer;
            }
            .hover\\:shadow-lg:hover {
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            }
            .transition-all {
                transition-property: all;
                transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
            }
            .duration-200 {
                transition-duration: 200ms;
            }
        `;
        document.head.appendChild(style);
    }
}

function updateActivitiesDisplay(activities) {
    if (!activities || activities.length === 0) return;
    
    console.log('📋 Updating activities display:', activities);
    
    // Find activities container - match HTML structure
    let activitiesContainer = document.querySelector('.activity-list');
    
    if (!activitiesContainer) {
        console.warn('❌ Activities container (.activity-list) not found');
        return;
    }
    
    // Clear existing activities (including hardcoded ones)
    activitiesContainer.innerHTML = '';
    
    // Sort activities by date (most recent first)
    const sortedActivities = activities
        .sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date))
        .slice(0, 10); // Show only latest 10
    
    sortedActivities.forEach((activity, index) => {
        const activityElement = document.createElement('div');
        activityElement.className = 'activity-item cursor-pointer hover:shadow-md transition-all duration-200';
        activityElement.setAttribute('data-dynamic', 'true'); // Mark as dynamic content
        activityElement.style.animationDelay = `${index * 50}ms`;
        activityElement.style.animation = 'slideInRight 0.4s ease forwards';
        
        // Activity icons mapping
        const activityIcons = {
            'pothole': '🕳️',
            'streetlight': '💡',
            'garbage': '🗑️',
            'traffic': '🚦',
            'sidewalk': '🚶',
            'water': '💧',
            'noise': '🔊',
            'park': '🌳'
        };
        
        const statusEmojis = {
            'resolved': '✅',
            'in-progress': '⏳',
            'pending': '🔄',
            'reported': '📝'
        };
        
        const icon = activityIcons[activity.type] || '📍';
        const statusIcon = statusEmojis[activity.status] || '📝';
        const timeAgo = formatTimeAgo(activity.timestamp || activity.date);
        
        activityElement.innerHTML = `
            <div class="activity-icon">
                <div style="font-size: 24px; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: #dbeafe; border-radius: 50%;">${icon}</div>
            </div>
            <div class="activity-details">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-location">${activity.location || activity.address}</div>
            </div>
            <div class="activity-time" style="display: flex; align-items: center; gap: 8px;">
                <span>${timeAgo}</span>
                <span style="font-size: 16px;" title="${activity.status}">${statusIcon}</span>
            </div>
        `;
        
        // Add click interaction
        activityElement.addEventListener('click', () => {
            showActivityDetails(activity);
        });
        
        activitiesContainer.appendChild(activityElement);
    });
    
    // Add CSS animation if not exists
    if (!document.getElementById('activity-animations')) {
        const style = document.createElement('style');
        style.id = 'activity-animations';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            .cursor-pointer {
                cursor: pointer;
            }
            .hover\\:shadow-md:hover {
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
            .transition-all {
                transition-property: all;
                transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
            }
            .duration-200 {
                transition-duration: 200ms;
            }
        `;
        document.head.appendChild(style);
    }
}

function formatTimeAgo(timestamp) {
    if (!timestamp) return 'Recently';
    
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffDays > 7) {
        return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    } else if (diffDays > 0) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
        return 'Just now';
    }
}

function showBadgeDetails(badge) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.style.animation = 'fadeIn 0.3s ease';
    
    const badgeIcons = {
        'first-report': '🏅',
        'resolved-issues': '🎖️', 
        'community-hero': '🏆',
        'top-reporter': '👑',
        'active-citizen': '⭐',
        'problem-solver': '🔧',
        'neighborhood-guardian': '🛡️',
        'civic-champion': '🥇'
    };
    
    const icon = badgeIcons[badge.type] || '🏆';
    
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-md mx-4 text-center" style="animation: slideInUp 0.3s ease;">
            <div style="font-size: 80px; margin-bottom: 20px;">${icon}</div>
            <h2 class="text-2xl font-bold text-gray-900 mb-4">${badge.title}</h2>
            <p class="text-gray-600 mb-6">${badge.description || 'Achievement unlocked!'}</p>
            
            ${badge.earned ? `
                <p class="text-green-600 font-semibold mb-4">✅ Earned ${badge.earnedDate}</p>
            ` : badge.progress ? `
                <div class="mb-4">
                    <div class="w-full bg-gray-200 rounded-full h-3 mb-2">
                        <div class="bg-blue-600 h-3 rounded-full transition-all duration-500" 
                             style="width: ${badge.progress}%"></div>
                    </div>
                    <p class="text-sm text-gray-600">${badge.progress}% Complete</p>
                    <p class="text-xs text-gray-500 mt-1">${badge.progressText || ''}</p>
                </div>
            ` : `
                <p class="text-gray-500 mb-4">Keep contributing to unlock this badge!</p>
            `}
            
            <button onclick="this.closest('.fixed').remove()" 
                    class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Close
            </button>
        </div>
    `;
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    document.body.appendChild(modal);
    
    // Add animations
    if (!document.getElementById('modal-animations')) {
        const style = document.createElement('style');
        style.id = 'modal-animations';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

function showActivityDetails(activity) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.style.animation = 'fadeIn 0.3s ease';
    
    const activityIcons = {
        'pothole': '🕳️',
        'streetlight': '💡',
        'garbage': '🗑️',
        'traffic': '🚦',
        'sidewalk': '🚶',
        'water': '💧',
        'noise': '🔊',
        'park': '🌳'
    };
    
    const statusColors = {
        'resolved': '#10B981',
        'in-progress': '#F59E0B', 
        'pending': '#EF4444',
        'reported': '#3B82F6'
    };
    
    const icon = activityIcons[activity.type] || '📍';
    const statusColor = statusColors[activity.status] || statusColors.reported;
    
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-lg mx-4" style="animation: slideInUp 0.3s ease;">
            <div class="flex items-center gap-4 mb-6">
                <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <span style="font-size: 32px;">${icon}</span>
                </div>
                <div>
                    <h2 class="text-xl font-bold text-gray-900">${activity.title}</h2>
                    <p class="text-gray-600">📍 ${activity.location || activity.address}</p>
                </div>
            </div>
            
            <div class="mb-4">
                <span style="background: ${statusColor}; color: white; padding: 6px 12px; border-radius: 20px; font-size: 14px;">
                    ${(activity.status || 'reported').toUpperCase()}
                </span>
            </div>
            
            ${activity.description ? `
                <p class="text-gray-700 mb-4">${activity.description}</p>
            ` : ''}
            
            <div class="text-sm text-gray-500 mb-6">
                🕒 ${formatTimeAgo(activity.timestamp || activity.date)}
            </div>
            
            <div class="flex gap-3">
                ${activity.lat && activity.lng ? `
                    <button onclick="focusOnLocation(${activity.lat}, ${activity.lng}); this.closest('.fixed').remove();" 
                            class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex-1">
                        🎯 Show on Map
                    </button>
                ` : ''}
                <button onclick="shareActivity('${(activity.title || '').replace(/'/g, "\\'")}', '${(activity.location || '').replace(/'/g, "\\'")}')" 
                        class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex-1">
                    📤 Share
                </button>
                <button onclick="this.closest('.fixed').remove()" 
                        class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                    Close
                </button>
            </div>
        </div>
    `;
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    document.body.appendChild(modal);
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
        clearBadgesDisplay();
        clearActivitiesDisplay();
        
        // Hide existing hardcoded content immediately
        hideHardcodedContent();
        
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
        
        // Show immediate notification that we're waiting for backend
        showNotification('⏳ Loading data from backend...', 'info', 2000);
        
        // Load backend data (non-blocking)
        loadAllDataFromBackend().catch(() => {
            console.log('📱 Backend not available');
            showNotification('⚠️ Unable to connect to backend. All data will load from backend only.', 'warning', 5000);
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

// Hide hardcoded content immediately
function hideHardcodedContent() {
    console.log('🔄 Hiding hardcoded content...');
    
    // Hide hardcoded badges
    const badgeCards = document.querySelectorAll('.badge-card:not([data-dynamic]):not([data-loading])');
    badgeCards.forEach(card => {
        card.style.display = 'none';
    });
    
    // Hide hardcoded activities
    const activityItems = document.querySelectorAll('.activity-item:not([data-dynamic]):not([data-loading])');
    activityItems.forEach(item => {
        item.style.display = 'none';
    });
}

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

// Clear badges and show loading state
function clearBadgesDisplay() {
    // Find badges container - match HTML structure
    let badgesContainer = document.querySelector('.badges-grid');
    
    if (!badgesContainer) {
        console.warn('❌ Badges container (.badges-grid) not found for clearing');
        return;
    }
    
    console.log('🔄 Clearing badges display...');
    
    // Remove all existing content (including hardcoded badges)
    badgesContainer.innerHTML = '';
    
    // Add 4 loading placeholders
    for (let i = 0; i < 4; i++) {
        const placeholder = document.createElement('div');
        placeholder.className = 'badge-card';
        placeholder.setAttribute('data-loading', 'true');
        placeholder.innerHTML = `
            <div class="badge-icon">
                <div style="width: 64px; height: 64px; background: #e5e7eb; border-radius: 50%; margin: 0 auto; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
            </div>
            <div class="badge-title" style="background: #e5e7eb; height: 20px; border-radius: 4px; margin: 12px 0; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
            <div class="badge-date" style="background: #e5e7eb; height: 16px; border-radius: 4px; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
        `;
        badgesContainer.appendChild(placeholder);
    }
    
    // Add pulse animation if not exists
    if (!document.getElementById('pulse-animation')) {
        const style = document.createElement('style');
        style.id = 'pulse-animation';
        style.textContent = `
            @keyframes pulse {
                0%, 100% {
                    opacity: 1;
                }
                50% {
                    opacity: 0.5;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Clear activities and show loading state
function clearActivitiesDisplay() {
    // Find activities container - match HTML structure
    let activitiesContainer = document.querySelector('.activity-list');
    
    if (!activitiesContainer) {
        console.warn('❌ Activities container (.activity-list) not found for clearing');
        return;
    }
    
    console.log('🔄 Clearing activities display...');
    
    // Remove all existing content (including hardcoded activities)
    activitiesContainer.innerHTML = '';
    
    // Add 3 loading placeholders
    for (let i = 0; i < 3; i++) {
        const placeholder = document.createElement('div');
        placeholder.className = 'activity-item';
        placeholder.setAttribute('data-loading', 'true');
        placeholder.innerHTML = `
            <div class="activity-icon">
                <div style="width: 40px; height: 40px; background: #e5e7eb; border-radius: 50%; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
            </div>
            <div class="activity-details" style="flex: 1;">
                <div class="activity-title" style="background: #e5e7eb; height: 18px; border-radius: 4px; margin-bottom: 8px; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
                <div class="activity-location" style="background: #e5e7eb; height: 14px; border-radius: 4px; width: 70%; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
            </div>
            <div class="activity-time" style="background: #e5e7eb; height: 14px; width: 60px; border-radius: 4px; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
        `;
        activitiesContainer.appendChild(placeholder);
    }
}

console.log('📱 MyImpact.js loaded - Google Maps Integration Ready!');