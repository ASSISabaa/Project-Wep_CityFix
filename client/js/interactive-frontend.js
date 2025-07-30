// CityFix Interactive Frontend - Works with existing CSS

document.addEventListener('DOMContentLoaded', function() {
    initInteractiveFeatures();
});

function initInteractiveFeatures() {
    addStatsInteractions();
    addReportsInteractions();
    addNavigationInteractions();
    addMapInteractions();
    addGeneralInteractions();
}

// ===========================
// Google Maps Integration
// ===========================
let map;
let markers = [];
let infoWindow;

// Sample report locations (can be replaced with real data later)
const reportLocations = [
    {
        id: 'RPT-10001',
        title: 'Broken Streetlight',
        location: 'Main St. & 5th Ave',
        lat: 31.2357,
        lng: 34.5678,
        status: 'new',
        type: 'streetlight',
        time: '10 minutes ago',
        priority: 'medium'
    },
    {
        id: 'RPT-10002',
        title: 'Pothole Repair',
        location: 'West End Road',
        lat: 31.2389,
        lng: 34.5645,
        status: 'progress',
        type: 'pothole',
        time: '1 hour ago',
        priority: 'high'
    },
    {
        id: 'RPT-10003',
        title: 'Graffiti Removal',
        location: 'Central Park',
        lat: 31.2341,
        lng: 34.5712,
        status: 'pending',
        type: 'graffiti',
        time: '2 hours ago',
        priority: 'low'
    },
    {
        id: 'RPT-10004',
        title: 'Traffic Light Malfunction',
        location: 'Downtown Square',
        lat: 31.2378,
        lng: 34.5690,
        status: 'new',
        type: 'traffic',
        time: '15 minutes ago',
        priority: 'high'
    },
    {
        id: 'RPT-10005',
        title: 'Water Leak',
        location: 'Park Avenue',
        lat: 31.2365,
        lng: 34.5665,
        status: 'progress',
        type: 'water',
        time: '5 minutes ago',
        priority: 'high'
    }
];

function addMapInteractions() {
    const mapContainer = document.querySelector('.map-container');
    const mapPlaceholder = document.querySelector('.map-placeholder');
    
    if (!mapPlaceholder) return;
    
    // Check if Google Maps is loaded
    if (typeof google !== 'undefined' && google.maps) {
        // Google Maps is ready, initialize it
        initializeRealGoogleMap();
    } else {
        // Show loading and wait for Google Maps
        showGoogleMapsLoading();
        
        // Wait for Google Maps to load
        const checkGoogleMaps = setInterval(() => {
            if (typeof google !== 'undefined' && google.maps) {
                clearInterval(checkGoogleMaps);
                initializeRealGoogleMap();
            }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
            if (typeof google === 'undefined') {
                clearInterval(checkGoogleMaps);
                showGoogleMapsError();
            }
        }, 10000);
    }
}

function showGoogleMapsLoading() {
    const mapContainer = document.querySelector('.map-placeholder');
    if (!mapContainer) return;
    
    mapContainer.innerHTML = `
        <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            gap: 15px;
            background: linear-gradient(135deg, #4285f4, #34a853);
            color: white;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        ">
            <div style="
                width: 50px;
                height: 50px;
                border: 4px solid rgba(255,255,255,0.3);
                border-top: 4px solid white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            "></div>
            <div style="font-weight: 600; font-size: 16px;">Loading Google Maps...</div>
            <div style="font-size: 14px; opacity: 0.9;">Connecting to Google Maps API</div>
        </div>
    `;
    
    // Add spin animation if not exists
    if (!document.getElementById('googleMapsSpinner')) {
        const style = document.createElement('style');
        style.id = 'googleMapsSpinner';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

function initializeRealGoogleMap() {
    const mapContainer = document.querySelector('.map-placeholder');
    if (!mapContainer) return;
    
    try {
        // Clear loading content
        mapContainer.innerHTML = '';
        mapContainer.style.background = 'none';
        mapContainer.style.color = 'inherit';
        
        // Initialize real Google Maps
        map = new google.maps.Map(mapContainer, {
            zoom: 14,
            center: { lat: 31.2365, lng: 34.5678 }, // Rosh HaAyin coordinates
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            styles: [
                {
                    featureType: 'poi.business',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }]
                },
                {
                    featureType: 'poi.medical',
                    elementType: 'labels',
                    stylers: [{ visibility: 'on' }]
                },
                {
                    featureType: 'poi.government',
                    elementType: 'labels',
                    stylers: [{ visibility: 'on' }]
                }
            ],
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
            zoomControl: true,
            gestureHandling: 'greedy',
            clickableIcons: false
        });
        
        // Initialize info window
        infoWindow = new google.maps.InfoWindow({
            maxWidth: 300
        });
        
        // Add real Google Maps markers
        addRealGoogleMapMarkers();
        
        // Add custom controls
        addGoogleMapControls();
        
        // Show success notification
        showNotification('🗺️ Google Maps loaded successfully! Click markers to view reports.', 'success');
        
    } catch (error) {
        console.error('Error initializing Google Maps:', error);
        showNotification('❌ Error loading Google Maps. Switching to alternative.', 'error');
        createProfessionalMap(); // Fallback to custom map
    }
}

function addRealGoogleMapMarkers() {
    if (!map) return;
    
    // Clear existing markers
    if (markers && markers.length > 0) {
        markers.forEach(marker => marker.setMap(null));
    }
    markers = [];
    
    reportLocations.forEach((report, index) => {
        const markerColor = getMarkerColor(report.status, report.priority);
        const markerIcon = getMarkerIcon(report.type);
        
        // Create custom marker icon
        const customIcon = {
            url: createGoogleMapMarkerSVG(markerColor, markerIcon),
            scaledSize: new google.maps.Size(40, 50),
            anchor: new google.maps.Point(20, 50),
            labelOrigin: new google.maps.Point(20, 20)
        };
        
        const marker = new google.maps.Marker({
            position: { lat: report.lat, lng: report.lng },
            map: map,
            title: `${report.title} - ${report.location}`,
            icon: customIcon,
            animation: google.maps.Animation.DROP,
            optimized: false
        });
        
        // Add click listener for marker
        marker.addListener('click', () => {
            showGoogleMapMarkerInfo(report, marker);
        });
        
        // Add hover effect
        marker.addListener('mouseover', () => {
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(() => {
                marker.setAnimation(null);
            }, 750);
        });
        
        markers.push(marker);
        
        // Delay each marker appearance
        setTimeout(() => {
            marker.setMap(map);
        }, index * 200);
    });
}

function createGoogleMapMarkerSVG(color, icon) {
    const svg = `
        <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
                </filter>
            </defs>
            <path d="M20 0C8.954 0 0 8.954 0 20c0 11.046 20 30 20 30s20-18.954 20-30C40 8.954 31.046 0 20 0z" 
                  fill="${color}" filter="url(#shadow)"/>
            <circle cx="20" cy="20" r="12" fill="white"/>
            <text x="20" y="26" text-anchor="middle" font-size="14" font-weight="bold" fill="${color}">${icon}</text>
        </svg>
    `;
    
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

function showGoogleMapMarkerInfo(report, marker) {
    const markerIcon = getMarkerIcon(report.type);
    const markerColor = getMarkerColor(report.status, report.priority);
    
    const content = `
        <div style="font-family: system-ui, sans-serif; min-width: 250px; padding: 10px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                <div style="
                    width: 30px;
                    height: 30px;
                    background: ${markerColor};
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    border: 2px solid white;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                ">${markerIcon}</div>
                <h3 style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 600;">${report.title}</h3>
            </div>
            
            <div style="margin-bottom: 12px;">
                <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">
                    📍 <strong>${report.location}</strong>
                </p>
                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px;">
                    ⏰ Reported ${report.time}
                </p>
            </div>
            
            <div style="display: flex; gap: 8px; margin-bottom: 15px; flex-wrap: wrap;">
                <span style="
                    padding: 4px 10px;
                    background: ${markerColor};
                    color: white;
                    border-radius: 15px;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                ">${report.status}</span>
                <span style="
                    padding: 4px 10px;
                    background: ${getPriorityColor(report.priority)};
                    color: white;
                    border-radius: 15px;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                ">${report.priority} PRIORITY</span>
            </div>
            
            <button onclick="showReportFromMap('${report.id}')" style="
                width: 100%;
                padding: 10px 16px;
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s ease;
                box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
            " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(59, 130, 246, 0.4)'" 
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(59, 130, 246, 0.3)'">
                👁️ View Full Details
            </button>
        </div>
    `;
    
    infoWindow.setContent(content);
    infoWindow.open(map, marker);
}

function addGoogleMapControls() {
    if (!map) return;
    
    // Create custom legend control
    const legendDiv = document.createElement('div');
    legendDiv.style.cssText = `
        background: white;
        margin: 10px;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        font-family: system-ui, sans-serif;
        font-size: 13px;
        line-height: 1.4;
        min-width: 140px;
    `;
    
    legendDiv.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 10px; color: #1f2937; text-align: center;">
            📊 Report Status
        </div>
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <div style="width: 14px; height: 14px; background: #ef4444; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div>
            <span style="color: #374151; font-weight: 500;">High Priority</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <div style="width: 14px; height: 14px; background: #f59e0b; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div>
            <span style="color: #374151; font-weight: 500;">New Report</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <div style="width: 14px; height: 14px; background: #3b82f6; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div>
            <span style="color: #374151; font-weight: 500;">In Progress</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 14px; height: 14px; background: #10b981; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div>
            <span style="color: #374151; font-weight: 500;">Resolved</span>
        </div>
    `;
    
    // Add legend to bottom right
    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(legendDiv);
    
    // Create refresh button
    const refreshDiv = document.createElement('div');
    refreshDiv.innerHTML = `
        <button onclick="refreshGoogleMapData()" style="
            background: white;
            border: none;
            padding: 10px 12px;
            margin: 10px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            color: #374151;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            transition: all 0.2s ease;
        " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.3)'" 
           onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 6px rgba(0,0,0,0.2)'">
            🔄 Refresh Reports
        </button>
    `;
    
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(refreshDiv);
    
    // Make refresh function global
    window.refreshGoogleMapData = function() {
        showNotification('🔄 Refreshing Google Maps data...', 'info');
        addRealGoogleMapMarkers();
    };
}

function showGoogleMapsError() {
    const mapContainer = document.querySelector('.map-placeholder');
    if (!mapContainer) return;
    
    mapContainer.innerHTML = `
        <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            gap: 15px;
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        ">
            <div style="font-size: 48px;">⚠️</div>
            <div style="font-weight: 600; font-size: 18px;">Google Maps Failed to Load</div>
            <div style="font-size: 14px; opacity: 0.9;">Check your API key and internet connection</div>
            <button onclick="location.reload()" style="
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.3);
                color: white;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 500;
                margin-top: 10px;
            ">🔄 Retry</button>
        </div>
    `;
}

function createProfessionalMap() {
    const mapContainer = document.querySelector('.map-placeholder');
    if (!mapContainer) return;
    
    // Check if mobile
    const isMobile = window.innerWidth <= 768;
    
    mapContainer.innerHTML = `
        <div style="
            width: 100%;
            height: 100%;
            background: #f8fafc;
            border-radius: 8px;
            position: relative;
            overflow: hidden;
            border: 1px solid #e2e8f0;
            display: flex;
            flex-direction: column;
        ">
            
            <!-- Mobile Header -->
            ${isMobile ? `
            <div style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 14px;
                font-weight: 600;
            ">
                <span>📍 Rosh HaAyin Reports</span>
                <div style="display: flex; gap: 8px;">
                    <button onclick="refreshMapData()" style="
                        background: rgba(255,255,255,0.2);
                        border: 1px solid rgba(255,255,255,0.3);
                        color: white;
                        padding: 6px 10px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">🔄</button>
                    <button onclick="showMobileLegend()" style="
                        background: rgba(255,255,255,0.2);
                        border: 1px solid rgba(255,255,255,0.3);
                        color: white;
                        padding: 6px 10px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">📊</button>
                </div>
            </div>
            ` : ''}
            
            <!-- Map Area -->
            <div style="
                flex: 1;
                position: relative;
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                ${!isMobile ? 'min-height: 400px;' : ''}
            ">
                
                <!-- Street Grid Background -->
                <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-image: 
                        linear-gradient(rgba(148, 163, 184, 0.2) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(148, 163, 184, 0.2) 1px, transparent 1px);
                    background-size: ${isMobile ? '30px 30px' : '40px 40px'};
                "></div>
                
                <!-- Desktop Controls -->
                ${!isMobile ? `
                <div style="
                    position: absolute;
                    top: 15px;
                    left: 15px;
                    background: rgba(255,255,255,0.95);
                    padding: 10px 14px;
                    border-radius: 6px;
                    font-weight: 600;
                    color: #1e293b;
                    font-size: 13px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    backdrop-filter: blur(4px);
                ">
                    📍 Rosh HaAyin - Live Issues
                </div>
                
                <div style="
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    display: flex;
                    gap: 6px;
                ">
                    <button onclick="refreshMapData()" style="
                        background: rgba(255,255,255,0.95);
                        border: 1px solid rgba(203, 213, 224, 0.5);
                        color: #475569;
                        padding: 8px 12px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 12px;
                        font-weight: 500;
                        transition: all 0.2s ease;
                    ">🔄 Refresh</button>
                    <button onclick="zoomToFit()" style="
                        background: rgba(255,255,255,0.95);
                        border: 1px solid rgba(203, 213, 224, 0.5);
                        color: #475569;
                        padding: 8px 12px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 12px;
                        font-weight: 500;
                        transition: all 0.2s ease;
                    ">🎯 Fit All</button>
                </div>
                
                <!-- Desktop Legend -->
                <div style="
                    position: absolute;
                    bottom: 15px;
                    right: 15px;
                    background: rgba(255,255,255,0.95);
                    padding: 14px;
                    border-radius: 6px;
                    font-size: 11px;
                    line-height: 1.4;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    min-width: 120px;
                    backdrop-filter: blur(4px);
                ">
                    <div style="font-weight: 600; margin-bottom: 8px; color: #1e293b; text-align: center; font-size: 12px;">
                        📊 Status
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                        <div style="width: 12px; height: 12px; background: #ef4444; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 2px rgba(0,0,0,0.1);"></div>
                        <span style="color: #374151; font-weight: 500;">High Priority</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                        <div style="width: 12px; height: 12px; background: #f59e0b; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 2px rgba(0,0,0,0.1);"></div>
                        <span style="color: #374151; font-weight: 500;">New</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                        <div style="width: 12px; height: 12px; background: #3b82f6; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 2px rgba(0,0,0,0.1);"></div>
                        <span style="color: #374151; font-weight: 500;">Progress</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <div style="width: 12px; height: 12px; background: #10b981; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 2px rgba(0,0,0,0.1);"></div>
                        <span style="color: #374151; font-weight: 500;">Resolved</span>
                    </div>
                </div>
                ` : ''}
                
                ${generateResponsiveMapPoints()}
            </div>
            
            <!-- Mobile Bottom Info -->
            ${isMobile ? `
            <div style="
                background: #f1f5f9;
                padding: 10px 15px;
                border-top: 1px solid #e2e8f0;
                font-size: 12px;
                color: #64748b;
                text-align: center;
            ">
                Tap any point to view report details
            </div>
            ` : ''}
        </div>
    `;
    
    // Add responsive handlers
    addResponsiveMapHandlers();
    
    // Add global functions
    window.refreshMapData = function() {
        showNotification('🔄 Map refreshed!', 'info');
        addResponsiveMapHandlers();
    };
    
    window.zoomToFit = function() {
        showNotification('🎯 Showing all reports', 'info');
        const points = document.querySelectorAll('.responsive-map-point');
        points.forEach((point, index) => {
            setTimeout(() => {
                point.style.animation = 'bounce 0.5s ease-out';
                setTimeout(() => point.style.animation = '', 500);
            }, index * 50);
        });
    };
    
    window.showMobileLegend = function() {
        const legendModal = document.createElement('div');
        legendModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        legendModal.innerHTML = `
            <div style="
                background: white;
                margin: 20px;
                padding: 20px;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                max-width: 280px;
                width: 100%;
            ">
                <h3 style="margin: 0 0 15px 0; text-align: center; color: #1e293b;">📊 Report Status Legend</h3>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <div style="width: 16px; height: 16px; background: #ef4444; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div>
                    <span style="color: #374151; font-weight: 500;">High Priority Issues</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <div style="width: 16px; height: 16px; background: #f59e0b; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div>
                    <span style="color: #374151; font-weight: 500;">New Reports</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <div style="width: 16px; height: 16px; background: #3b82f6; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div>
                    <span style="color: #374151; font-weight: 500;">In Progress</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                    <div style="width: 16px; height: 16px; background: #10b981; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div>
                    <span style="color: #374151; font-weight: 500;">Resolved</span>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    width: 100%;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 10px;
                    border-radius: 6px;
                    font-weight: 500;
                    cursor: pointer;
                ">Got it!</button>
            </div>
        `;
        
        legendModal.addEventListener('click', (e) => {
            if (e.target === legendModal) legendModal.remove();
        });
        
        document.body.appendChild(legendModal);
    };
    
    showNotification('🗺️ City map ready! Tap points to view details.', 'success');
}

function generateResponsiveMapPoints() {
    let points = '';
    const isMobile = window.innerWidth <= 768;
    
    reportLocations.forEach((report, index) => {
        const color = getMarkerColor(report.status, report.priority);
        const icon = getMarkerIcon(report.type);
        
        // Better mobile positioning
        const mobilePositions = [
            { left: 20, top: 25 },
            { left: 45, top: 35 },
            { left: 70, top: 25 },
            { left: 30, top: 55 },
            { left: 60, top: 45 }
        ];
        
        const desktopPositions = [
            { left: 25, top: 30 },
            { left: 45, top: 20 },
            { left: 65, top: 40 },
            { left: 35, top: 50 },
            { left: 55, top: 30 }
        ];
        
        const positions = isMobile ? mobilePositions : desktopPositions;
        const pos = positions[index] || { left: 30 + Math.random() * 40, top: 30 + Math.random() * 40 };
        
        const size = isMobile ? '32px' : '26px';
        const fontSize = isMobile ? '14px' : '12px';
        
        points += `
            <div class="responsive-map-point" data-report-id="${report.id}" style="
                position: absolute;
                left: ${pos.left}%;
                top: ${pos.top}%;
                width: ${size};
                height: ${size};
                background: ${color};
                border: 3px solid white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: ${fontSize};
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                cursor: pointer;
                transition: all 0.3s ease;
                z-index: 50;
                animation: fadeIn 0.6s ease-out;
                animation-delay: ${index * 0.1}s;
                animation-fill-mode: both;
                touch-action: manipulation;
            " 
            title="${report.title} - ${report.location}">
                ${icon}
            </div>
        `;
    });
    
    // Add responsive animations
    if (!document.getElementById('responsiveMapAnimations')) {
        const style = document.createElement('style');
        style.id = 'responsiveMapAnimations';
        style.textContent = `
            @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: scale(0.5);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }
            
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-6px); }
            }
            
            .responsive-map-point:hover {
                transform: scale(1.2);
                z-index: 100 !important;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            }
            
            .responsive-map-point:active {
                transform: scale(0.95);
            }
            
            @media (max-width: 768px) {
                .responsive-map-point {
                    width: 36px !important;
                    height: 36px !important;
                    font-size: 16px !important;
                }
                
                .responsive-map-point:hover {
                    transform: scale(1.1);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    return points;
}

function addResponsiveMapHandlers() {
    setTimeout(() => {
        const mapPoints = document.querySelectorAll('.responsive-map-point');
        mapPoints.forEach(point => {
            point.addEventListener('click', function(e) {
                e.stopPropagation();
                const reportId = this.getAttribute('data-report-id');
                const report = reportLocations.find(r => r.id === reportId);
                
                if (report) {
                    // Mobile feedback
                    this.style.transform = 'scale(0.9)';
                    setTimeout(() => {
                        this.style.transform = '';
                        showReportFromMap(reportId);
                    }, 100);
                }
            });
            
            // Touch handling for mobile
            point.addEventListener('touchstart', function(e) {
                e.preventDefault();
                this.style.transform = 'scale(1.05)';
            });
            
            point.addEventListener('touchend', function(e) {
                e.preventDefault();
                this.style.transform = '';
                this.click();
            });
        });
    }, 100);
}

function generateProfessionalMapPoints() {
    let points = '';
    
    reportLocations.forEach((report, index) => {
        const color = getMarkerColor(report.status, report.priority);
        const icon = getMarkerIcon(report.type);
        
        // Strategic positioning for realistic city layout
        const positions = [
            { left: 25, top: 35 }, // Main street intersection
            { left: 45, top: 25 }, // North district
            { left: 65, top: 45 }, // East side
            { left: 35, top: 55 }, // South area
            { left: 55, top: 35 }  // Central area
        ];
        
        const pos = positions[index] || { left: 30 + Math.random() * 40, top: 30 + Math.random() * 40 };
        
        points += `
            <div class="pro-map-point" data-report-id="${report.id}" style="
                position: absolute;
                left: ${pos.left}%;
                top: ${pos.top}%;
                width: 28px;
                height: 28px;
                background: ${color};
                border: 3px solid white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                box-shadow: 0 3px 12px rgba(0,0,0,0.25), 0 1px 4px rgba(0,0,0,0.1);
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 100;
                animation: fadeInBounce 0.8s ease-out;
                animation-delay: ${index * 0.15}s;
                animation-fill-mode: both;
            " 
            onmouseover="this.style.transform='scale(1.25) translateY(-2px)'; this.style.zIndex='200'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.15)';" 
            onmouseout="this.style.transform='scale(1) translateY(0)'; this.style.zIndex='100'; this.style.boxShadow='0 3px 12px rgba(0,0,0,0.25), 0 1px 4px rgba(0,0,0,0.1)';"
            title="${report.title} - ${report.location} (${report.status})">
                ${icon}
            </div>
        `;
    });
    
    // Add professional animations
    if (!document.getElementById('professionalMapAnimations')) {
        const style = document.createElement('style');
        style.id = 'professionalMapAnimations';
        style.textContent = `
            @keyframes fadeInBounce {
                0% {
                    opacity: 0;
                    transform: scale(0.3) translateY(20px);
                }
                60% {
                    opacity: 1;
                    transform: scale(1.1) translateY(-5px);
                }
                100% {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }
            
            @keyframes bounce {
                0%, 100% {
                    transform: translateY(0);
                }
                50% {
                    transform: translateY(-8px);
                }
            }
            
            .pro-map-point:hover::after {
                content: '';
                position: absolute;
                top: -3px;
                left: -3px;
                right: -3px;
                bottom: -3px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%);
                z-index: -1;
                animation: pulse 2s ease-in-out infinite;
            }
            
            @keyframes pulse {
                0%, 100% {
                    transform: scale(1);
                    opacity: 0.7;
                }
                50% {
                    transform: scale(1.5);
                    opacity: 0.3;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    return points;
}

function addProfessionalMapHandlers() {
    setTimeout(() => {
        const mapPoints = document.querySelectorAll('.pro-map-point');
        mapPoints.forEach(point => {
            // Remove existing handlers
            point.replaceWith(point.cloneNode(true));
        });
        
        // Re-add handlers to cloned nodes
        const newMapPoints = document.querySelectorAll('.pro-map-point');
        newMapPoints.forEach(point => {
            point.addEventListener('click', function(e) {
                e.stopPropagation();
                const reportId = this.getAttribute('data-report-id');
                const report = reportLocations.find(r => r.id === reportId);
                
                if (report) {
                    // Create ripple effect
                    createClickRipple(e, this);
                    
                    // Add click animation
                    this.style.animation = 'bounce 0.4s ease-out';
                    
                    // Show report details
                    setTimeout(() => {
                        showReportFromMap(reportId);
                        this.style.animation = '';
                    }, 200);
                }
            });
            
            // Re-add hover effects
            point.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.25) translateY(-2px)';
                this.style.zIndex = '200';
                this.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.15)';
            });
            
            point.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1) translateY(0)';
                this.style.zIndex = '100';
                this.style.boxShadow = '0 3px 12px rgba(0,0,0,0.25), 0 1px 4px rgba(0,0,0,0.1)';
            });
        });
    }, 100);
}

function showGoogleMapsInstructions() {
    const mapContainer = document.querySelector('.map-placeholder');
    if (!mapContainer) return;
    
    mapContainer.innerHTML = `
        <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            gap: 20px;
            background: linear-gradient(135deg, #4285f4, #34a853);
            color: white;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
        ">
            <div style="
                width: 80px;
                height: 80px;
                background: rgba(255,255,255,0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 40px;
            ">🗺️</div>
            
            <div>
                <h3 style="margin: 0 0 10px 0; font-size: 24px; font-weight: 600;">Google Maps Required</h3>
                <p style="margin: 0 0 20px 0; opacity: 0.9; font-size: 16px; line-height: 1.5;">
                    Add this script tag to your HTML to enable Google Maps:
                </p>
            </div>
            
            <div style="
                background: rgba(0,0,0,0.3);
                padding: 15px;
                border-radius: 8px;
                font-family: monospace;
                font-size: 12px;
                line-height: 1.4;
                text-align: left;
                word-break: break-all;
                max-width: 100%;
                overflow-x: auto;
                border: 1px solid rgba(255,255,255,0.2);
            ">
&lt;script src="https://maps.googleapis.com/maps/api/js?<br/>
&nbsp;&nbsp;key=YOUR_API_KEY&<br/>
&nbsp;&nbsp;callback=initializeGoogleMap"&gt;<br/>
&lt;/script&gt;
            </div>
            
            <div style="
                background: rgba(255,255,255,0.1);
                padding: 15px;
                border-radius: 8px;
                font-size: 14px;
                line-height: 1.5;
                text-align: left;
                border: 1px solid rgba(255,255,255,0.2);
            ">
                <strong>🚀 Quick Setup:</strong><br/>
                1. Go to <a href="https://console.cloud.google.com/" target="_blank" style="color: #ffd700; text-decoration: underline;">Google Cloud Console</a><br/>
                2. Create a new project or select existing one<br/>
                3. Enable "Maps JavaScript API"<br/>
                4. Create an API key in Credentials<br/>
                5. Add the script tag above to your HTML<br/>
                6. Replace YOUR_API_KEY with your actual key<br/>
                7. Refresh the page
            </div>
            
            <div style="display: flex; gap: 15px; flex-wrap: wrap; justify-content: center;">
                <button onclick="window.open('https://console.cloud.google.com/', '_blank')" style="
                    padding: 12px 20px;
                    background: #ffd700;
                    border: none;
                    color: #333;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s ease;
                " onmouseover="this.style.background='#ffed4a'" 
                   onmouseout="this.style.background='#ffd700'">
                    Get API Key
                </button>
                <button onclick="testGoogleMaps()" style="
                    padding: 12px 20px;
                    background: rgba(255,255,255,0.2);
                    border: 2px solid rgba(255,255,255,0.3);
                    color: white;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.2s ease;
                " onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
                   onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                    Test Connection
                </button>
            </div>
            
            <p style="margin: 0; font-size: 12px; opacity: 0.7;">
                ⚠️ Google Maps API is required for the real map functionality
            </p>
        </div>
    `;
    
    // Make test function available globally
    window.testGoogleMaps = function() {
        if (typeof google !== 'undefined' && google.maps) {
            showNotification('✅ Google Maps is loaded! Initializing map...', 'success');
            setTimeout(() => {
                initializeGoogleMap();
            }, 1000);
        } else {
            showNotification('❌ Google Maps not found. Please add the API script first.', 'error');
        }
    };
}

function loadWorkingMap() {
    // Direct to map creation - no loading screen
    createCustomInteractiveMap();
}

function createReliableMap() {
    // Direct to custom map - no Leaflet attempts
    createCustomInteractiveMap();
}

function loadLeafletResources() {
    return new Promise((resolve, reject) => {
        // Check if Leaflet is already loaded
        if (typeof L !== 'undefined') {
            resolve();
            return;
        }
        
        mapContainer.innerHTML = `
            <div id="leaflet-map" style="width: 100%; height: 100%; border-radius: 8px;"></div>
        `;
        
        // Load CSS
        const leafletCSS = document.createElement('link');
        leafletCSS.rel = 'stylesheet';
        leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        leafletCSS.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        leafletCSS.crossOrigin = '';
        document.head.appendChild(leafletCSS);
        
        // Load JS
        const leafletJS = document.createElement('script');
        leafletJS.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        leafletJS.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        leafletJS.crossOrigin = '';
        
        leafletJS.onload = () => {
            setTimeout(() => resolve(), 100);
        };
        
        leafletJS.onerror = () => {
            reject();
        };
        
        document.head.appendChild(leafletJS);
        
        // Timeout fallback
        setTimeout(() => {
            if (typeof L === 'undefined') {
                reject();
            }
        }, 5000);
    });
}

function createCustomInteractiveMap() {
    const mapContainer = document.querySelector('.map-placeholder');
    if (!mapContainer) return;
    
    mapContainer.innerHTML = `
        <div style="
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px;
            position: relative;
            overflow: hidden;
            cursor: pointer;
            transition: all 0.3s ease;
        " onmouseover="this.style.transform='scale(1.02)'" 
           onmouseout="this.style.transform='scale(1)'">
            
            <!-- Map Grid Background -->
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-image: 
                    linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
                background-size: 50px 50px;
                opacity: 0.3;
            "></div>
            
            <!-- City Info -->
            <div style="
                position: absolute;
                top: 20px;
                left: 20px;
                background: rgba(255,255,255,0.9);
                padding: 12px 16px;
                border-radius: 8px;
                font-weight: 600;
                color: #1f2937;
                font-size: 14px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            ">
                📍 City Center - Live Issues
            </div>
            
            <!-- Legend -->
            <div style="
                position: absolute;
                bottom: 20px;
                right: 20px;
                background: rgba(255,255,255,0.95);
                padding: 15px;
                border-radius: 8px;
                font-size: 12px;
                line-height: 1.4;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                min-width: 120px;
            ">
                <div style="font-weight: 600; margin-bottom: 8px; color: #1f2937;">Report Status</div>
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                    <div style="width: 12px; height: 12px; background: #ef4444; border-radius: 50%;"></div>
                    <span style="color: #374151;">High Priority</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                    <div style="width: 12px; height: 12px; background: #f59e0b; border-radius: 50%;"></div>
                    <span style="color: #374151;">New Report</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                    <div style="width: 12px; height: 12px; background: #3b82f6; border-radius: 50%;"></div>
                    <span style="color: #374151;">In Progress</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <div style="width: 12px; height: 12px; background: #10b981; border-radius: 50%;"></div>
                    <span style="color: #374151;">Resolved</span>
                </div>
            </div>
            
            ${generateInteractiveMapPoints()}
        </div>
    `;
    
    // Add click handlers to points
    addMapPointHandlers();
    
    // Show success message immediately
    showNotification('🗺️ Interactive map ready! Click on points to view reports.', 'success');
}

function generateInteractiveMapPoints() {
    let points = '';
    
    reportLocations.forEach((report, index) => {
        const color = getMarkerColor(report.status, report.priority);
        const icon = getMarkerIcon(report.type);
        const left = 20 + (index * 15) + Math.random() * 40;
        const top = 25 + (index * 10) + Math.random() * 40;
        
        points += `
            <div class="map-point" data-report-id="${report.id}" style="
                position: absolute;
                left: ${left}%;
                top: ${top}%;
                width: 24px;
                height: 24px;
                background: ${color};
                border: 3px solid white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                cursor: pointer;
                animation: bounce 2s ease-in-out infinite;
                animation-delay: ${index * 0.2}s;
                transition: all 0.2s ease;
                z-index: 10;
            " 
            onmouseover="this.style.transform='scale(1.3)'; this.style.zIndex='20';" 
            onmouseout="this.style.transform='scale(1)'; this.style.zIndex='10';"
            title="${report.title} - ${report.location}">
                ${icon}
            </div>
        `;
    });
    
    // Add bounce animation
    if (!document.getElementById('bounceAnimation')) {
        const style = document.createElement('style');
        style.id = 'bounceAnimation';
        style.textContent = `
            @keyframes bounce {
                0%, 100% {
                    transform: translateY(0);
                }
                50% {
                    transform: translateY(-3px);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    return points;
}

function addMapPointHandlers() {
    setTimeout(() => {
        const mapPoints = document.querySelectorAll('.map-point');
        mapPoints.forEach(point => {
            point.addEventListener('click', function(e) {
                e.stopPropagation();
                const reportId = this.getAttribute('data-report-id');
                const report = reportLocations.find(r => r.id === reportId);
                
                if (report) {
                    // Create ripple effect
                    createClickRipple(e, this);
                    
                    // Show report details
                    setTimeout(() => {
                        showReportFromMap(reportId);
                    }, 200);
                }
            });
        });
    }, 100);
}

function initializeGoogleMap() {
    // Check if Google Maps API is really loaded
    if (typeof google === 'undefined' || !google.maps) {
        showGoogleMapsInstructions();
        return;
    }
    
    const mapContainer = document.querySelector('.map-placeholder');
    if (!mapContainer) return;
    
    // Clear placeholder content
    mapContainer.innerHTML = '';
    mapContainer.style.background = 'none';
    mapContainer.style.color = 'inherit';
    
    try {
        // Initialize Google Maps
        map = new google.maps.Map(mapContainer, {
            zoom: 14,
            center: { lat: 31.2365, lng: 34.5678 }, // Rosh HaAyin coordinates
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }]
                },
                {
                    featureType: 'transit',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }]
                }
            ],
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
            zoomControl: true,
            gestureHandling: 'greedy'
        });
        
        // Initialize info window
        infoWindow = new google.maps.InfoWindow();
        
        // Add markers for all reports
        addReportMarkers();
        
        // Add map controls
        addMapControls();
        
        showNotification('🗺️ Google Maps loaded successfully!', 'success');
        
    } catch (error) {
        console.error('Error initializing Google Maps:', error);
        showNotification('❌ Error loading Google Maps. Check your API key.', 'error');
        showGoogleMapsInstructions();
    }
}

function loadExternalGoogleMaps() {
    const mapContainer = document.querySelector('.map-placeholder');
    if (!mapContainer) return;
    
    // Show loading state
    mapContainer.innerHTML = `
        <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            gap: 15px;
            background: linear-gradient(135deg, #4285f4, #34a853);
            color: white;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        ">
            <div style="
                width: 50px;
                height: 50px;
                border: 4px solid rgba(255,255,255,0.3);
                border-top: 4px solid white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            "></div>
            <div style="font-weight: 600; font-size: 16px;">Loading Google Maps...</div>
            <div style="font-size: 14px; opacity: 0.9;">Setting up API connection</div>
        </div>
    `;
    
    // Check if we have a valid API key in the page
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    
    if (existingScript) {
        // Google Maps script already exists, wait for it to load
        waitForGoogleMaps();
    } else {
        // Show API key setup instructions
        setTimeout(() => {
            showAPIKeyInstructions();
        }, 2000);
    }
}

function waitForGoogleMaps() {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds total
    
    const checkInterval = setInterval(() => {
        attempts++;
        
        if (typeof google !== 'undefined' && google.maps) {
            clearInterval(checkInterval);
            initializeGoogleMap();
        } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.log('Google Maps failed to load, switching to alternative');
            loadAlternativeMap();
        }
    }, 100);
}

function showAPIKeyInstructions() {
    const mapContainer = document.querySelector('.map-placeholder');
    if (!mapContainer) return;
    
    mapContainer.innerHTML = `
        <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            gap: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
        ">
            <div style="
                width: 80px;
                height: 80px;
                background: rgba(255,255,255,0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 40px;
            ">🗺️</div>
            
            <div>
                <h3 style="margin: 0 0 10px 0; font-size: 24px; font-weight: 600;">Google Maps Setup Required</h3>
                <p style="margin: 0 0 20px 0; opacity: 0.9; font-size: 16px; line-height: 1.5;">
                    To display Google Maps, add this script to your HTML:
                </p>
            </div>
            
            <div style="
                background: rgba(0,0,0,0.3);
                padding: 15px;
                border-radius: 8px;
                font-family: monospace;
                font-size: 12px;
                line-height: 1.4;
                text-align: left;
                word-break: break-all;
                max-width: 100%;
                overflow-x: auto;
            ">
&lt;script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initializeGoogleMap"&gt;&lt;/script&gt;
            </div>
            
            <div style="
                background: rgba(255,255,255,0.1);
                padding: 15px;
                border-radius: 8px;
                font-size: 14px;
                line-height: 1.5;
            ">
                <strong>📋 Quick Steps:</strong><br/>
                1. Get API key from <a href="https://console.cloud.google.com/" target="_blank" style="color: #ffd700;">Google Cloud Console</a><br/>
                2. Enable Maps JavaScript API<br/>
                3. Add the script tag with your key<br/>
                4. Refresh the page
            </div>
            
            <div style="display: flex; gap: 15px; flex-wrap: wrap; justify-content: center;">
                <button onclick="loadAlternativeMap()" style="
                    padding: 12px 20px;
                    background: rgba(255,255,255,0.2);
                    border: 2px solid rgba(255,255,255,0.3);
                    color: white;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.2s ease;
                " onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
                   onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                    Use Demo Map Instead
                </button>
                <button onclick="window.open('https://console.cloud.google.com/', '_blank')" style="
                    padding: 12px 20px;
                    background: #ffd700;
                    border: none;
                    color: #333;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s ease;
                " onmouseover="this.style.background='#ffed4a'" 
                   onmouseout="this.style.background='#ffd700'">
                    Get API Key
                </button>
            </div>
            
            <p style="margin: 0; font-size: 12px; opacity: 0.7;">
                Don't worry! The demo map has all the same features.
            </p>
        </div>
    `;
}

function loadAlternativeMap() {
    const mapContainer = document.querySelector('.map-placeholder');
    if (!mapContainer) return;
    
    // Try Mapbox as alternative
    mapContainer.innerHTML = `
        <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            gap: 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        ">
            <div style="
                width: 50px;
                height: 50px;
                border: 4px solid rgba(255,255,255,0.3);
                border-top: 4px solid white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            "></div>
            <div style="font-weight: 600; font-size: 16px;">Loading Alternative Map...</div>
            <div style="font-size: 14px; opacity: 0.9;">Using OpenStreetMap</div>
        </div>
    `;
    
    setTimeout(() => {
        createDemoMapWithLeaflet();
    }, 1500);
}

function loadGoogleMapsAPI() {
    // Try to load Google Maps without API key first
    loadExternalGoogleMaps();
}

// Remove the entire showMapInstructions function and showDemoMap function since we go straight to demo

// Remove unused functions - these are no longer needed

function createDemoMapWithLeaflet() {
    const mapContainer = document.querySelector('.map-placeholder');
    if (!mapContainer) return;
    
    mapContainer.innerHTML = `
        <div id="leaflet-map" style="width: 100%; height: 100%; border-radius: 8px;"></div>
    `;
    
    // Load Leaflet CSS and JS directly
    loadLeafletResources();
}

function loadLeafletResources() {
    // Check if Leaflet is already loaded
    if (typeof L !== 'undefined') {
        initLeafletMap();
        return;
    }
    
    // Load Leaflet CSS
    const leafletCSS = document.createElement('link');
    leafletCSS.rel = 'stylesheet';
    leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    leafletCSS.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    leafletCSS.crossOrigin = '';
    document.head.appendChild(leafletCSS);
    
    // Load Leaflet JS
    const leafletJS = document.createElement('script');
    leafletJS.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    leafletJS.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    leafletJS.crossOrigin = '';
    leafletJS.onload = function() {
        setTimeout(initLeafletMap, 100);
    };
    leafletJS.onerror = function() {
        // Fallback if CDN fails
        showSimpleMapPlaceholder();
    };
    document.head.appendChild(leafletJS);
}

function showSimpleMapPlaceholder() {
    const mapContainer = document.querySelector('.map-placeholder');
    if (!mapContainer) return;
    
    mapContainer.innerHTML = `
        <div style="
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            text-align: center;
            padding: 20px;
        ">
            <div>
                <div style="font-size: 48px; margin-bottom: 15px;">🗺️</div>
                <h3 style="margin: 0 0 10px 0; font-size: 20px;">Interactive City Map</h3>
                <p style="margin: 0; opacity: 0.9; font-size: 14px;">Live tracking of city issues and reports</p>
            </div>
            ${generateMapPoints()}
        </div>
    `;
}

function generateMapPoints() {
    let points = '';
    const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];
    
    for (let i = 0; i < 5; i++) {
        const left = 15 + Math.random() * 70;
        const top = 20 + Math.random() * 60;
        const color = colors[i % colors.length];
        const delay = i * 0.5;
        
        points += `
            <div style="
                position: absolute;
                left: ${left}%;
                top: ${top}%;
                width: 12px;
                height: 12px;
                background: ${color};
                border: 2px solid white;
                border-radius: 50%;
                box-shadow: 0 0 10px rgba(255,255,255,0.5);
                animation: pulse 2s ease-in-out infinite;
                animation-delay: ${delay}s;
            "></div>
        `;
    }
    
    // Add pulse animation
    if (!document.getElementById('pulseAnimation')) {
        const style = document.createElement('style');
        style.id = 'pulseAnimation';
        style.textContent = `
            @keyframes pulse {
                0%, 100% {
                    transform: scale(1);
                    opacity: 1;
                }
                50% {
                    transform: scale(1.3);
                    opacity: 0.7;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    return points;
}

function initLeafletMap() {
    const mapElement = document.getElementById('leaflet-map');
    if (!mapElement || typeof L === 'undefined') return;
    
    // Initialize Leaflet map
    const leafletMap = L.map('leaflet-map').setView([31.2365, 34.5678], 14);
    
    // Store reference globally
    window.leafletMapInstance = leafletMap;
    
    // Add tile layer with better styling
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
        tileSize: 256,
        zoomOffset: 0
    }).addTo(leafletMap);
    
    // Add custom control panel
    const controlPanel = L.control({position: 'topright'});
    controlPanel.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'custom-control');
        div.style.cssText = `
            background: white;
            padding: 12px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            font-size: 12px;
            line-height: 1.4;
            margin-right: 10px;
            margin-top: 10px;
        `;
        
        div.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 8px; color: #1f2937; text-align: center;">
                📍 Report Status
            </div>
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <div style="width: 12px; height: 12px; background: #ef4444; border-radius: 50%;"></div>
                <span style="font-size: 11px;">High Priority</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <div style="width: 12px; height: 12px; background: #f59e0b; border-radius: 50%;"></div>
                <span style="font-size: 11px;">New Report</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <div style="width: 12px; height: 12px; background: #3b82f6; border-radius: 50%;"></div>
                <span style="font-size: 11px;">In Progress</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
                <div style="width: 12px; height: 12px; background: #10b981; border-radius: 50%;"></div>
                <span style="font-size: 11px;">Resolved</span>
            </div>
        `;
        
        return div;
    };
    controlPanel.addTo(leafletMap);
    
    // Add markers for reports with custom icons
    reportLocations.forEach(report => {
        const markerColor = getMarkerColor(report.status, report.priority);
        const markerIcon = getMarkerIcon(report.type);
        
        // Create custom icon
        const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `
                <div style="
                    position: relative;
                    width: 30px;
                    height: 30px;
                    background: ${markerColor};
                    border: 3px solid white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                    cursor: pointer;
                    transition: transform 0.2s ease;
                " onmouseover="this.style.transform='scale(1.1)'" 
                   onmouseout="this.style.transform='scale(1)'">
                    ${markerIcon}
                </div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });
        
        const marker = L.marker([report.lat, report.lng], {
            icon: customIcon
        }).addTo(leafletMap);
        
        // Create popup content
        const popupContent = `
            <div style="min-width: 220px; font-family: system-ui, sans-serif;">
                <h4 style="margin: 0 0 10px 0; color: #1f2937; display: flex; align-items: center; gap: 8px; font-size: 16px;">
                    ${markerIcon} ${report.title}
                </h4>
                <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">📍 ${report.location}</p>
                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px;">⏰ ${report.time}</p>
                <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
                    <span style="
                        padding: 4px 8px;
                        background: ${markerColor};
                        color: white;
                        border-radius: 12px;
                        font-size: 10px;
                        font-weight: 600;
                        text-transform: uppercase;
                    ">${report.status}</span>
                    <span style="
                        padding: 4px 8px;
                        background: ${getPriorityColor(report.priority)};
                        color: white;
                        border-radius: 12px;
                        font-size: 10px;
                        font-weight: 600;
                        text-transform: uppercase;
                    ">${report.priority}</span>
                </div>
                <button onclick="showReportFromMap('${report.id}')" style="
                    padding: 8px 16px;
                    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 13px;
                    width: 100%;
                    font-weight: 500;
                    transition: all 0.2s ease;
                " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(59,130,246,0.3)'" 
                   onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                    👁️ View Full Details
                </button>
            </div>
        `;
        
        marker.bindPopup(popupContent, {
            maxWidth: 300,
            className: 'custom-popup'
        });
        
        // Add hover effect
        marker.on('mouseover', function() {
            this.openPopup();
        });
    });
    
    // Add demo notification
    setTimeout(() => {
        showNotification('🗺️ Interactive map loaded successfully! Click markers to view reports.', 'success');
    }, 500);
    
    // Add some custom CSS for better popup styling
    const mapStyle = document.createElement('style');
    mapStyle.textContent = `
        .custom-popup .leaflet-popup-content-wrapper {
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            border: none;
        }
        .custom-popup .leaflet-popup-tip {
            background: white;
            border: none;
            box-shadow: none;
        }
        .custom-marker {
            background: none !important;
            border: none !important;
        }
    `;
    document.head.appendChild(mapStyle);
}

function addReportMarkers() {
    if (!map) return;
    
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    
    reportLocations.forEach(report => {
        const markerColor = getMarkerColor(report.status, report.priority);
        const markerIcon = getMarkerIcon(report.type);
        
        const marker = new google.maps.Marker({
            position: { lat: report.lat, lng: report.lng },
            map: map,
            title: report.title,
            icon: {
                url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(createMarkerSVG(markerColor, markerIcon))}`,
                scaledSize: new google.maps.Size(30, 40),
                anchor: new google.maps.Point(15, 40)
            }
        });
        
        // Add click listener
        marker.addListener('click', () => {
            showMarkerInfo(report, marker);
        });
        
        markers.push(marker);
    });
}

function createMarkerSVG(color, icon) {
    return `
        <svg width="30" height="40" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 0C6.716 0 0 6.716 0 15c0 8.284 15 25 15 25s15-16.716 15-25C30 6.716 23.284 0 15 0z" fill="${color}"/>
            <circle cx="15" cy="15" r="8" fill="white"/>
            <text x="15" y="19" text-anchor="middle" fill="${color}" font-size="12" font-weight="bold">${icon}</text>
        </svg>
    `;
}

function getMarkerColor(status, priority) {
    if (priority === 'high') return '#ef4444';
    if (status === 'new') return '#f59e0b';
    if (status === 'progress') return '#3b82f6';
    if (status === 'pending') return '#8b5cf6';
    return '#10b981';
}

function getMarkerIcon(type) {
    const icons = {
        'streetlight': '💡',
        'pothole': '🕳️',
        'graffiti': '🎨',
        'traffic': '🚦',
        'water': '💧'
    };
    return icons[type] || '📍';
}

function getPriorityColor(priority) {
    const colors = {
        'high': '#ef4444',
        'medium': '#f59e0b',
        'low': '#10b981'
    };
    return colors[priority] || '#6b7280';
}

function showMarkerInfo(report, marker) {
    const markerIcon = getMarkerIcon(report.type);
    const markerColor = getMarkerColor(report.status, report.priority);
    
    const content = `
        <div style="min-width: 250px; font-family: system-ui, sans-serif;">
            <h4 style="margin: 0 0 10px 0; color: #1f2937; display: flex; align-items: center; gap: 8px;">
                ${markerIcon} ${report.title}
            </h4>
            <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">📍 ${report.location}</p>
            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px;">⏰ ${report.time}</p>
            <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                <span style="
                    padding: 4px 8px;
                    background: ${markerColor};
                    color: white;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 500;
                ">${report.status.toUpperCase()}</span>
                <span style="
                    padding: 4px 8px;
                    background: ${getPriorityColor(report.priority)};
                    color: white;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 500;
                ">${report.priority.toUpperCase()}</span>
            </div>
            <button onclick="showReportFromMap('${report.id}')" style="
                padding: 8px 16px;
                background: #3b82f6;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
                width: 100%;
                font-weight: 500;
            ">View Full Details</button>
        </div>
    `;
    
    infoWindow.setContent(content);
    infoWindow.open(map, marker);
}

function addMapControls() {
    if (!map) return;
    
    // Add custom legend control
    const legend = document.createElement('div');
    legend.style.cssText = `
        background: white;
        padding: 10px;
        margin: 10px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        font-size: 12px;
        line-height: 1.4;
    `;
    
    legend.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 8px; color: #1f2937;">Report Status</div>
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <div style="width: 12px; height: 12px; background: #ef4444; border-radius: 50%;"></div>
            <span>High Priority</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <div style="width: 12px; height: 12px; background: #f59e0b; border-radius: 50%;"></div>
            <span>New Report</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <div style="width: 12px; height: 12px; background: #3b82f6; border-radius: 50%;"></div>
            <span>In Progress</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
            <div style="width: 12px; height: 12px; background: #10b981; border-radius: 50%;"></div>
            <span>Resolved</span>
        </div>
    `;
    
    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(legend);
}

// Global function to show report details from map
window.showReportFromMap = function(reportId) {
    const report = reportLocations.find(r => r.id === reportId);
    if (!report) return;
    
    // Create a mock report element with the data
    const mockElement = document.createElement('div');
    mockElement.innerHTML = `
        <h4>${report.title}</h4>
        <p>${report.location}</p>
        <div class="report-time">${report.time}</div>
        <span class="report-status ${report.status}">${report.status}</span>
    `;
    
    showReportDetails(mockElement);
};

// Make function available globally for Google Maps callback
window.initializeGoogleMap = initializeGoogleMap;

// ===========================
// Report Details Modal
// ===========================
function showReportDetails(reportElement) {
    const title = reportElement.querySelector('h4')?.textContent || 'Unknown Report';
    const location = reportElement.querySelector('p')?.textContent || 'Unknown Location';
    const time = reportElement.querySelector('.report-time')?.textContent || 'Unknown Time';
    const status = reportElement.querySelector('.report-status')?.textContent || 'Unknown';
    
    // Generate detailed information
    const reportData = generateReportData(title, location, time, status);
    
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'report-details-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    modal.innerHTML = `
        <div class="modal-content" style="
            background: white;
            border-radius: 12px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
            transform: scale(0.9);
            transition: transform 0.3s ease;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
        ">
            <div class="modal-header" style="
                padding: 25px;
                border-bottom: 1px solid #e5e7eb;
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                color: white;
                border-radius: 12px 12px 0 0;
                position: relative;
            ">
                <button class="close-btn" style="
                    position: absolute;
                    top: 15px;
                    right: 20px;
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    width: 35px;
                    height: 35px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s ease;
                " onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
                   onmouseout="this.style.background='rgba(255,255,255,0.2)'">&times;</button>
                
                <h2 style="margin: 0 40px 8px 0; font-size: 24px; font-weight: 600;">${title}</h2>
                <div style="display: flex; align-items: center; gap: 12px; margin-top: 12px;">
                    <span class="status-badge" style="
                        padding: 6px 12px;
                        background: rgba(255, 255, 255, 0.2);
                        border-radius: 20px;
                        font-size: 12px;
                        font-weight: 500;
                        text-transform: uppercase;
                    ">${status}</span>
                    <span style="opacity: 0.9; font-size: 14px;">📍 ${location}</span>
                </div>
            </div>
            
            <div class="modal-body" style="padding: 25px;">
                <div class="detail-grid" style="display: grid; gap: 20px;">
                    
                    <!-- Location Details -->
                    <div class="detail-section">
                        <h3 style="
                            color: #1f2937;
                            margin: 0 0 12px 0;
                            font-size: 16px;
                            font-weight: 600;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            📍 Location Information
                        </h3>
                        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                            <p style="margin: 5px 0; color: #4b5563;"><strong>Address:</strong> ${location}</p>
                            <p style="margin: 5px 0; color: #4b5563;"><strong>Coordinates:</strong> ${reportData.coordinates}</p>
                            <p style="margin: 5px 0; color: #4b5563;"><strong>District:</strong> ${reportData.district}</p>
                            <p style="margin: 5px 0; color: #4b5563;"><strong>Nearby:</strong> ${reportData.nearby}</p>
                        </div>
                    </div>
                    
                    <!-- Report Details -->
                    <div class="detail-section">
                        <h3 style="
                            color: #1f2937;
                            margin: 0 0 12px 0;
                            font-size: 16px;
                            font-weight: 600;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            📋 Report Details
                        </h3>
                        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
                            <p style="margin: 5px 0; color: #4b5563;"><strong>Report ID:</strong> ${reportData.id}</p>
                            <p style="margin: 5px 0; color: #4b5563;"><strong>Reported:</strong> ${time}</p>
                            <p style="margin: 5px 0; color: #4b5563;"><strong>Priority:</strong> ${reportData.priority}</p>
                            <p style="margin: 5px 0; color: #4b5563;"><strong>Category:</strong> ${reportData.category}</p>
                        </div>
                    </div>
                    
                    <!-- Description -->
                    <div class="detail-section">
                        <h3 style="
                            color: #1f2937;
                            margin: 0 0 12px 0;
                            font-size: 16px;
                            font-weight: 600;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            📝 Description
                        </h3>
                        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                            <p style="margin: 0; color: #4b5563; line-height: 1.6;">${reportData.description}</p>
                        </div>
                    </div>
                    
                    <!-- Assignment Info -->
                    <div class="detail-section">
                        <h3 style="
                            color: #1f2937;
                            margin: 0 0 12px 0;
                            font-size: 16px;
                            font-weight: 600;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            👥 Assignment
                        </h3>
                        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #8b5cf6;">
                            <p style="margin: 5px 0; color: #4b5563;"><strong>Assigned Team:</strong> ${reportData.assignedTeam}</p>
                            <p style="margin: 5px 0; color: #4b5563;"><strong>Supervisor:</strong> ${reportData.supervisor}</p>
                            <p style="margin: 5px 0; color: #4b5563;"><strong>Contact:</strong> ${reportData.contact}</p>
                            <p style="margin: 5px 0; color: #4b5563;"><strong>Expected Resolution:</strong> ${reportData.expectedResolution}</p>
                        </div>
                    </div>
                    
                    <!-- Progress Timeline -->
                    <div class="detail-section">
                        <h3 style="
                            color: #1f2937;
                            margin: 0 0 12px 0;
                            font-size: 16px;
                            font-weight: 600;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            ⏱️ Progress Timeline
                        </h3>
                        <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
                            ${generateTimeline(reportData.timeline)}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="modal-footer" style="
                padding: 20px 25px;
                border-top: 1px solid #e5e7eb;
                background: #f9fafb;
                border-radius: 0 0 12px 12px;
                display: flex;
                gap: 12px;
                justify-content: flex-end;
            ">
                <button class="btn-secondary" style="
                    padding: 10px 20px;
                    border: 1px solid #d1d5db;
                    background: white;
                    color: #374151;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.2s ease;
                " onmouseover="this.style.background='#f3f4f6'" 
                   onmouseout="this.style.background='white'">
                    📍 View on Map
                </button>
                <button class="btn-primary" style="
                    padding: 10px 20px;
                    border: none;
                    background: #3b82f6;
                    color: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.2s ease;
                " onmouseover="this.style.background='#2563eb'" 
                   onmouseout="this.style.background='#3b82f6'">
                    🔄 Update Status
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Animate modal in
    setTimeout(() => {
        modal.style.opacity = '1';
        const content = modal.querySelector('.modal-content');
        content.style.transform = 'scale(1)';
    }, 10);
    
    // Close modal functionality
    setupModalClosing(modal);
    setupModalButtons(modal, reportData);
}

function generateReportData(title, location, time, status) {
    const reportTypes = {
        'Broken Streetlight': {
            category: 'Street Lighting',
            priority: 'Medium',
            teams: ['Street Lighting Division', 'Electrical Maintenance', 'Public Safety'],
            supervisors: ['Ahmad Al-Zahra', 'Sarah Johnson', 'Mike Rodriguez'],
            descriptions: [
                'Multiple streetlights are non-functional along this major thoroughfare, creating safety concerns for both pedestrians and drivers during nighttime hours.',
                'LED streetlight system failure detected through smart city sensors. The issue appears to be related to power supply infrastructure.',
                'Vandalism damage to streetlight fixture requiring complete unit replacement and security assessment of the area.'
            ]
        },
        'Pothole Repair': {
            category: 'Road Maintenance',
            priority: 'High',
            teams: ['Road Maintenance Crew', 'Public Works', 'Traffic Management'],
            supervisors: ['Lisa Chen', 'David Wilson', 'Omar Hassan'],
            descriptions: [
                'Large pothole formation causing vehicle damage and creating hazardous driving conditions. Immediate repair required.',
                'Road surface deterioration due to recent weather conditions and heavy traffic load. Requires asphalt patching.',
                'Multiple potholes reported along this section requiring comprehensive road resurfacing evaluation.'
            ]
        },
        'Graffiti Removal': {
            category: 'Public Cleanliness',
            priority: 'Low',
            teams: ['Cleaning Services', 'Parks & Recreation', 'Community Services'],
            supervisors: ['Jennifer Smith', 'Khalil Ibrahim', 'Robert Kim'],
            descriptions: [
                'Vandalism graffiti on public property requires professional cleaning and possible protective coating application.',
                'Multiple graffiti tags reported in high-visibility public area. Community complaint received.',
                'Recurring graffiti problem requiring both cleaning and enhanced security monitoring of the location.'
            ]
        }
    };
    
    const districts = ['Downtown District', 'North Quarter', 'South Ward', 'East Side', 'West End', 'Central Business District'];
    const nearbyLandmarks = ['City Hall', 'Central Park', 'Shopping Center', 'Metro Station', 'Hospital', 'School', 'Library'];
    
    const reportType = reportTypes[title] || reportTypes['Broken Streetlight'];
    
    return {
        id: 'RPT-' + (10000 + Math.floor(Math.random() * 90000)),
        coordinates: `${(31.234 + Math.random() * 0.1).toFixed(6)}, ${(34.567 + Math.random() * 0.1).toFixed(6)}`,
        district: districts[Math.floor(Math.random() * districts.length)],
        nearby: nearbyLandmarks[Math.floor(Math.random() * nearbyLandmarks.length)],
        category: reportType.category,
        priority: reportType.priority,
        assignedTeam: reportType.teams[Math.floor(Math.random() * reportType.teams.length)],
        supervisor: reportType.supervisors[Math.floor(Math.random() * reportType.supervisors.length)],
        contact: '+972-' + Math.floor(Math.random() * 10) + '-' + Math.floor(Math.random() * 10000000).toString().padStart(7, '0'),
        expectedResolution: getExpectedResolution(status),
        description: reportType.descriptions[Math.floor(Math.random() * reportType.descriptions.length)],
        timeline: generateTimelineData(status),
        title: title,
        location: location
    };
}

function getExpectedResolution(status) {
    const resolutions = {
        'New': ['2-4 hours', '1-2 business days', 'Within 24 hours'],
        'In Progress': ['1-2 hours', '4-6 hours', 'Later today'],
        'Pending': ['Pending approval', 'Waiting for materials', 'Next business day'],
        'Resolved': ['Completed', 'Fixed and verified', 'Successfully resolved']
    };
    
    const options = resolutions[status] || resolutions['New'];
    return options[Math.floor(Math.random() * options.length)];
}

function generateTimelineData(status) {
    const baseTimeline = [
        { step: 'Report Received', time: '2 hours ago', completed: true, description: 'Initial report submitted and logged in system' },
        { step: 'Initial Assessment', time: '1.5 hours ago', completed: status !== 'New', description: 'Field assessment team dispatched' },
        { step: 'Work Assignment', time: '1 hour ago', completed: status === 'In Progress' || status === 'Resolved', description: 'Assigned to appropriate department team' },
        { step: 'Resolution Complete', time: '30 minutes ago', completed: status === 'Resolved', description: 'Work completed and verified' }
    ];
    
    return baseTimeline;
}

function generateTimeline(timeline) {
    return timeline.map(item => `
        <div style="
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
            padding: 8px 0;
            border-left: 3px solid ${item.completed ? '#10b981' : '#d1d5db'};
            padding-left: 15px;
            position: relative;
        ">
            <div style="
                position: absolute;
                left: -8px;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: ${item.completed ? '#10b981' : '#d1d5db'};
                border: 3px solid white;
                box-shadow: 0 0 0 2px ${item.completed ? '#10b981' : '#d1d5db'};
            "></div>
            <div style="flex: 1;">
                <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">${item.step}</div>
                <div style="font-size: 14px; color: #6b7280; margin-bottom: 2px;">${item.description}</div>
                <div style="font-size: 12px; color: #9ca3af;">${item.time}</div>
            </div>
        </div>
    `).join('');
}

function setupModalClosing(modal) {
    const closeBtn = modal.querySelector('.close-btn');
    
    const closeModal = () => {
        modal.style.opacity = '0';
        const content = modal.querySelector('.modal-content');
        content.style.transform = 'scale(0.9)';
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    };
    
    closeBtn.addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // ESC key to close
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}

function setupModalButtons(modal, reportData) {
    const mapBtn = modal.querySelector('.btn-secondary');
    const statusBtn = modal.querySelector('.btn-primary');
    
    mapBtn.addEventListener('click', () => {
        // Close modal and show location on map
        modal.style.opacity = '0';
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
        
        // Find and focus on the report location on map
        focusMapOnLocation(reportData);
    });
    
    statusBtn.addEventListener('click', () => {
        showStatusUpdateOptions(reportData);
    });
}

function focusMapOnLocation(reportData) {
    // Try to find the report in our sample data
    const report = reportLocations.find(r => 
        r.title === reportData.title || 
        r.location === reportData.location
    );
    
    if (report && map) {
        // Google Maps
        map.setCenter({ lat: report.lat, lng: report.lng });
        map.setZoom(16);
        
        // Find and trigger the marker
        const marker = markers.find(m => 
            Math.abs(m.getPosition().lat() - report.lat) < 0.0001 &&
            Math.abs(m.getPosition().lng() - report.lng) < 0.0001
        );
        
        if (marker) {
            google.maps.event.trigger(marker, 'click');
        }
        
        showNotification(`🗺️ Showing ${report.title} on map`, 'info');
    } else if (typeof L !== 'undefined') {
        // Leaflet fallback
        const leafletMap = window.leafletMapInstance;
        if (leafletMap && report) {
            leafletMap.setView([report.lat, report.lng], 16);
            showNotification(`🗺️ Showing ${report.title} on map`, 'info');
        }
    } else {
        showNotification('🗺️ Map location: ' + (reportData.coordinates || 'Unknown'), 'info');
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    const colors = {
        success: '#10b981',
        info: '#3b82f6',
        warning: '#f59e0b',
        error: '#ef4444'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 10001;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
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
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

function showStatusUpdateOptions(reportData) {
    showNotification('🔄 Status update functionality coming soon!', 'info');
}

// ===========================
// Stats Cards Interactions
// ===========================
function addStatsInteractions() {
    const statCards = document.querySelectorAll('.stat-card');
    
    statCards.forEach((card, index) => {
        // Entrance animation
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
        
        // Hover effects
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
            this.style.zIndex = '10';
            
            // Animate number
            animateNumber(this);
            
            // Add glow
            const originalBoxShadow = getComputedStyle(this).boxShadow;
            this.dataset.originalShadow = originalBoxShadow;
            this.style.boxShadow = originalBoxShadow + ', 0 0 20px rgba(59, 130, 246, 0.3)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.zIndex = '';
            this.style.boxShadow = this.dataset.originalShadow || '';
        });
        
        // Click effect
        card.addEventListener('click', function(e) {
            createClickRipple(e, this);
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = 'translateY(-5px) scale(1.02)';
            }, 150);
        });
    });
}

function animateNumber(card) {
    const numberElement = card.querySelector('.stat-number');
    if (!numberElement) return;
    
    const text = numberElement.textContent;
    const number = parseFloat(text.replace(/[^\d.]/g, ''));
    if (isNaN(number)) return;
    
    const suffix = text.replace(/[\d.,]/g, '');
    let current = 0;
    const increment = number / 20;
    
    const animate = () => {
        current += increment;
        if (current < number) {
            numberElement.textContent = Math.floor(current).toLocaleString() + suffix;
            requestAnimationFrame(animate);
        } else {
            numberElement.textContent = text;
        }
    };
    
    animate();
}

// ===========================
// Reports Interactions
// ===========================
function addReportsInteractions() {
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
        
        // Store original styles
        const originalBg = getComputedStyle(item).backgroundColor;
        const originalBorder = getComputedStyle(item).borderLeft;
        
        // Hover effects
        item.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f8fafc';
            this.style.borderLeft = '3px solid #3b82f6';
            this.style.transform = 'translateX(5px)';
            
            // Animate status badge
            const badge = this.querySelector('.report-status');
            if (badge) {
                badge.style.transition = 'transform 0.2s ease';
                badge.style.transform = 'scale(1.05)';
            }
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.backgroundColor = originalBg;
            this.style.borderLeft = originalBorder;
            this.style.transform = 'translateX(0)';
            
            const badge = this.querySelector('.report-status');
            if (badge) {
                badge.style.transform = 'scale(1)';
            }
        });
        
        // Click effect
        item.addEventListener('click', function(e) {
            createClickRipple(e, this);
            this.style.animation = 'reportClick 0.3s ease';
            setTimeout(() => {
                this.style.animation = '';
            }, 300);
            
            // Show report details
            showReportDetails(this);
        });
    });
    
    // Add time updates simulation
    simulateTimeUpdates();
}

function simulateTimeUpdates() {
    setInterval(() => {
        const timeElements = document.querySelectorAll('.report-time');
        if (timeElements.length === 0) return;
        
        const randomTime = timeElements[Math.floor(Math.random() * timeElements.length)];
        if (Math.random() > 0.8) {
            // Flash effect
            randomTime.style.backgroundColor = '#fef3c7';
            randomTime.style.padding = '2px 4px';
            randomTime.style.borderRadius = '3px';
            randomTime.style.transition = 'all 0.3s ease';
            
            setTimeout(() => {
                randomTime.style.backgroundColor = '';
                randomTime.style.padding = '';
                randomTime.style.borderRadius = '';
            }, 2000);
        }
    }, 8000);
}

// ===========================
// Navigation Interactions
// ===========================
function addNavigationInteractions() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        const originalBg = getComputedStyle(item).backgroundColor;
        
        item.addEventListener('mouseenter', function() {
            if (!this.classList.contains('active')) {
                this.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                this.style.transform = 'translateX(5px)';
            }
        });
        
        item.addEventListener('mouseleave', function() {
            if (!this.classList.contains('active')) {
                this.style.backgroundColor = originalBg;
                this.style.transform = 'translateX(0)';
            }
        });
        
        item.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = this.classList.contains('active') ? 'translateX(0)' : 'translateX(5px)';
            }, 100);
        });
    });
}

// ===========================
// General Interactions
// ===========================
function addGeneralInteractions() {
    // Smooth transitions for all interactive elements
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Add click effects to buttons
    const buttons = document.querySelectorAll('button, .btn, [onclick]');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    });
    
    // Add CSS animations
    addAnimationStyles();
    
    // Add entrance animation for main content
    const mainContent = document.querySelector('.content-wrapper');
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

// ===========================
// Utility Functions
// ===========================
function createClickRipple(event, element) {
    const ripple = document.createElement('div');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 0.8;
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: rgba(59, 130, 246, 0.2);
        transform: scale(0);
        left: ${x}px;
        top: ${y}px;
        pointer-events: none;
        animation: rippleEffect 0.6s ease-out;
    `;
    
    const originalPosition = getComputedStyle(element).position;
    if (originalPosition === 'static') {
        element.style.position = 'relative';
    }
    element.style.overflow = 'hidden';
    
    element.appendChild(ripple);
    
    setTimeout(() => {
        if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
        }
    }, 600);
}

function addAnimationStyles() {
    if (document.getElementById('interactiveStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'interactiveStyles';
    style.textContent = `
        @keyframes rippleEffect {
            to {
                transform: scale(2);
                opacity: 0;
            }
        }
        
        @keyframes dotPulse {
            0%, 100% {
                transform: scale(1);
                opacity: 1;
            }
            50% {
                transform: scale(1.2);
                opacity: 0.7;
            }
        }
        
        @keyframes mapPulse {
            0%, 100% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.02);
            }
        }
        
        @keyframes reportClick {
            0% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.02);
            }
            100% {
                transform: scale(1);
            }
        }
        
        .stat-card, .report-item, .nav-item {
            transition: all 0.3s ease;
        }
        
        .report-status {
            transition: transform 0.2s ease;
        }
        
        button, .btn {
            transition: transform 0.15s ease;
        }
    `;
    
    document.head.appendChild(style);
}

console.log('✨ CityFix Interactive Features Loaded!');