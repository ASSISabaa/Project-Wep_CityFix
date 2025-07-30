// CityFix Reports Details - Complete Backend Ready Code

// 🔧 API Configuration
const API_CONFIG = {
    BASE_URL: 'http://localhost:3000/api',
    ENDPOINTS: {
        GET_REPORT: '/reports/:id',
        UPDATE_REPORT: '/reports/:id'
    }
};

// 🗺️ Google Maps Configuration
const GOOGLE_MAPS_CONFIG = {
    API_KEY: 'AIzaSyC6jZx_eYnWWpBMMGEIVdNwmlNgWbfDqtM', // Your API key
    MAP_ID: 'cityfix-map'
};

// Global Variables
let currentReport = null;
let map = null;
let marker = null;
let isLoading = false;
let hasUnsavedChanges = false;

// DOM Elements
const reportTitle = document.querySelector('.dashboard-header h1');
const reportSubtitle = document.querySelector('.dashboard-header p');
const locationTitle = document.querySelector('.report-details-header h2');
const reportDate = document.querySelector('.report-details-header .report-id');
const descriptionText = document.querySelector('.description-text');
const statusDropdown = document.querySelector('.status-dropdown');
const notesTextarea = document.querySelector('.notes-textarea');
const saveBtn = document.querySelector('.save-btn');
const backBtn = document.querySelector('.back-btn');
const mapContainer = document.querySelector('.map-container');

// 🔄 API Functions
async function makeApiRequest(endpoint, options = {}) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json'
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
        handleApiError(error);
        throw error;
    }
}

function handleApiError(error) {
    let message = 'An unexpected error occurred';
    
    if (error.message.includes('Failed to fetch')) {
        message = 'Failed to connect to server. Make sure the server is running.';
    } else if (error.message.includes('404')) {
        message = 'Report not found.';
    } else if (error.message.includes('401')) {
        message = 'Unauthorized access. Please login again.';
    } else if (error.message.includes('500')) {
        message = 'Server error. Please try again later.';
    }
    
    showNotification(message, 'error');
}

// 🔃 Loading Functions
function showLoading() {
    if (isLoading) return;
    isLoading = true;
    
    const loader = document.createElement('div');
    loader.className = 'loading-overlay';
    loader.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
                    background: rgba(255,255,255,0.9); display: flex; 
                    align-items: center; justify-content: center; z-index: 2000;">
            <div style="text-align: center;">
                <div class="spinner"></div>
                <div style="margin-top: 15px; color: #666; font-size: 16px;">Loading report details...</div>
            </div>
        </div>
    `;
    document.body.appendChild(loader);
}

function hideLoading() {
    isLoading = false;
    const loader = document.querySelector('.loading-overlay');
    if (loader) {
        loader.remove();
    }
}

// 📡 Load Report Data from Backend
async function loadReportData() {
    const urlParams = new URLSearchParams(window.location.search);
    const reportId = urlParams.get('id');
    
    if (!reportId) {
        showErrorMessage('Report ID not specified in URL');
        return;
    }

    try {
        showLoading();
        
        // 🧪 FOR TESTING: Use sample data if backend not available
        const testMode = true; // Set to false when backend is ready
        
        if (testMode) {
            console.log('🧪 Test Mode: Loading sample data for report:', reportId);
            currentReport = getTestReportData(reportId);
            
            if (currentReport) {
                console.log('✅ Test data loaded:', currentReport);
                displayReportData();
                initializeGoogleMap();
                showNotification('Test data loaded successfully! 🧪', 'info');
            } else {
                showErrorMessage('Test report not found. Try IDs: 12345, 12346, or 12347');
            }
            return;
        }
        
        // Real backend call (when testMode = false)
        const endpoint = API_CONFIG.ENDPOINTS.GET_REPORT.replace(':id', reportId);
        const response = await makeApiRequest(endpoint);
        
        currentReport = response.data || response;
        
        if (currentReport) {
            displayReportData();
            initializeGoogleMap();
        } else {
            showErrorMessage('Failed to load report data');
        }
        
    } catch (error) {
        console.error('Error loading report:', error);
    } finally {
        hideLoading();
    }
}

// 🧪 Test Data Function
function getTestReportData(reportId) {
    const testReports = {
        '12345': {
            id: "12345",
            title: "Broken Streetlight",
            location: "123 Main St, Tel Aviv",
            type: "Lighting",
            status: "new",
            date: "Jan 15, 2025",
            createdAt: "2025-01-15T10:30:00Z",
            description: "Streetlight is not working, causing the area to be very dark at night. This poses a safety risk for pedestrians and drivers. The light appears to be completely out, not flickering.",
            coordinates: { lat: 32.0853, lng: 34.7818 }, // Tel Aviv coordinates
            notes: ["Initial report received", "Work order created", "Assigned to electrical team"]
        },
        '12346': {
            id: "12346",
            title: "Pothole on Highway 1",
            location: "Highway 1, Jerusalem",
            type: "Roads",
            status: "in-progress",
            date: "Jan 14, 2025",
            createdAt: "2025-01-14T09:15:00Z",
            description: "Large pothole causing damage to vehicles. Approximately 2 feet wide and 6 inches deep. Multiple cars have sustained tire damage.",
            coordinates: { lat: 31.7683, lng: 35.2137 }, // Jerusalem coordinates
            notes: ["Work scheduled for next week", "Materials ordered", "Traffic control arranged"]
        },
        '12347': {
            id: "12347",
            title: "Garbage Collection Missed",
            location: "Rothschild Blvd, Tel Aviv",
            type: "Waste",
            status: "pending",
            date: "Jan 13, 2025",
            createdAt: "2025-01-13T14:20:00Z",
            description: "Garbage collection was missed for the entire street. Bins are overflowing and creating unsanitary conditions.",
            coordinates: { lat: 32.0668, lng: 34.7748 },
            notes: ["Contacted waste management company", "Emergency collection scheduled"]
        }
    };
    
    return testReports[reportId] || null;
}

// 🎨 Display Report Data
function displayReportData() {
    if (!currentReport) return;
    
    try {
        console.log('🎨 Displaying report data:', currentReport);
        
        // Update page title and header
        if (reportTitle) {
            reportTitle.textContent = 'Report Details';
        }
        
        if (reportSubtitle) {
            const reportId = currentReport.id || currentReport.reportId;
            reportSubtitle.textContent = `${reportId} ${currentReport.title}`;
        }
        
        // Update location and date
        if (locationTitle) {
            locationTitle.textContent = currentReport.location || currentReport.address;
        }
        
        if (reportDate) {
            const date = formatDate(currentReport.createdAt || currentReport.date || currentReport.reportDate);
            reportDate.textContent = date;
        }
        
        // Update description
        if (descriptionText) {
            descriptionText.textContent = currentReport.description || currentReport.details || 'No description available';
        }
        
        // Update status dropdown
        if (statusDropdown) {
            statusDropdown.value = currentReport.status || 'new';
        }
        
        // Load existing notes
        if (notesTextarea) {
            const notes = currentReport.notes || currentReport.adminNotes || [];
            if (Array.isArray(notes)) {
                notesTextarea.value = notes.join('\n');
            } else if (typeof notes === 'string') {
                notesTextarea.value = notes;
            }
        }
        
        // Update page title
        document.title = `CityFix - ${currentReport.title} Details`;
        
        // Reset unsaved changes flag
        hasUnsavedChanges = false;
        updateSaveButtonState();
        
        console.log('✅ Report data displayed successfully');
        
    } catch (error) {
        console.error('❌ Error displaying report data:', error);
        showErrorMessage('Error displaying report data');
    }
}

// 🗺️ Google Maps Integration
function loadGoogleMapsScript() {
    return new Promise((resolve, reject) => {
        console.log('🗺️ Loading Google Maps...');
        
        // Check if Google Maps is already loaded
        if (window.google && window.google.maps) {
            console.log('✅ Google Maps already loaded');
            resolve();
            return;
        }
        
        // Check if script is already being loaded
        if (document.querySelector('script[src*="maps.googleapis.com"]')) {
            console.log('⏳ Google Maps script already loading, waiting...');
            const checkGoogle = setInterval(() => {
                if (window.google && window.google.maps) {
                    clearInterval(checkGoogle);
                    console.log('✅ Google Maps loaded via existing script');
                    resolve();
                }
            }, 100);
            return;
        }
        
        // Load Google Maps script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_CONFIG.API_KEY}&libraries=geometry,places`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
            console.log('✅ Google Maps loaded successfully via JavaScript');
            resolve();
        };
        
        script.onerror = () => {
            console.error('❌ Failed to load Google Maps');
            reject(new Error('Failed to load Google Maps'));
        };
        
        document.head.appendChild(script);
    });
}

async function initializeGoogleMap() {
    if (!mapContainer || !currentReport) {
        console.log('❌ No map container or report data');
        return;
    }
    
    try {
        console.log('🗺️ Initializing Google Map...');
        
        // Load Google Maps if not already loaded
        await loadGoogleMapsScript();
        
        // Get coordinates from report data
        const coordinates = currentReport.coordinates || currentReport.location_coordinates;
        let lat, lng;
        
        if (coordinates && coordinates.lat && coordinates.lng) {
            lat = parseFloat(coordinates.lat);
            lng = parseFloat(coordinates.lng);
            console.log(`📍 Using coordinates: ${lat}, ${lng}`);
        } else {
            // Default coordinates (Tel Aviv center)
            lat = 32.0853;
            lng = 34.7818;
            console.warn('⚠️ No coordinates found, using Tel Aviv center');
        }
        
        // Clear the container
        mapContainer.innerHTML = '';
        
        // Create map
        map = new google.maps.Map(mapContainer, {
            center: { lat, lng },
            zoom: 16,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }]
                }
            ]
        });
        
        // Create custom marker icon
        const markerIcon = {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="16" fill="#dc3545"/>
                    <circle cx="16" cy="16" r="8" fill="white"/>
                    <circle cx="16" cy="16" r="4" fill="#dc3545"/>
                </svg>
            `),
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 16)
        };
        
        // Create marker
        marker = new google.maps.Marker({
            position: { lat, lng },
            map: map,
            title: currentReport.location || currentReport.address,
            icon: markerIcon,
            animation: google.maps.Animation.DROP
        });
        
        // Add info window
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div style="padding: 10px; max-width: 200px; font-family: Arial, sans-serif;">
                    <h4 style="margin: 0 0 5px 0; color: #333; font-size: 16px;">${currentReport.title}</h4>
                    <p style="margin: 0 0 5px 0; color: #666; font-size: 14px;">${currentReport.location || currentReport.address}</p>
                    <div style="display: flex; justify-content: space-between; font-size: 12px;">
                        <span style="color: #999;">Status:</span>
                        <span style="color: #007bff; font-weight: bold;">${currentReport.status}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 3px;">
                        <span style="color: #999;">Type:</span>
                        <span style="color: #28a745;">${currentReport.type}</span>
                    </div>
                </div>
            `
        });
        
        // Show info window on marker click
        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });
        
        // Add map controls
        const controlsDiv = document.createElement('div');
        controlsDiv.style.cssText = `
            position: absolute; top: 10px; right: 10px; z-index: 1000;
            background: white; border-radius: 6px; box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        
        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.innerHTML = '🔗';
        fullscreenBtn.title = 'Open in Google Maps';
        fullscreenBtn.style.cssText = `
            border: none; background: white; padding: 10px; cursor: pointer;
            border-radius: 6px; font-size: 16px; transition: background 0.2s;
        `;
        
        fullscreenBtn.onmouseover = () => fullscreenBtn.style.background = '#f0f0f0';
        fullscreenBtn.onmouseout = () => fullscreenBtn.style.background = 'white';
        fullscreenBtn.onclick = openInGoogleMaps;
        
        controlsDiv.appendChild(fullscreenBtn);
        mapContainer.appendChild(controlsDiv);
        
        console.log('✅ Google Map initialized successfully');
        showNotification('Map loaded successfully! 🗺️', 'success');
        
    } catch (error) {
        console.error('❌ Error initializing Google Map:', error);
        showFallbackMap();
    }
}

function showFallbackMap() {
    console.log('🔄 Showing fallback map');
    
    const location = currentReport.location || currentReport.address || 'Unknown location';
    const type = currentReport.type || currentReport.category || 'Unknown';
    
    mapContainer.innerHTML = `
        <div style="width: 100%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    display: flex; align-items: center; justify-content: center; 
                    color: white; font-size: 18px; border-radius: 8px; cursor: pointer;
                    transition: transform 0.2s ease;">
            <div style="text-align: center;">
                <div style="font-size: 32px; margin-bottom: 15px;">📍</div>
                <div style="font-weight: 600; margin-bottom: 5px;">${location}</div>
                <div style="font-size: 14px; opacity: 0.9; margin-bottom: 15px;">
                    ${type} Issue
                </div>
                <div style="font-size: 12px; opacity: 0.8; padding: 8px 16px; 
                           background: rgba(255,255,255,0.2); border-radius: 20px;">
                    Click to open in Google Maps
                </div>
            </div>
        </div>
    `;
    
    const mapDiv = mapContainer.firstElementChild;
    
    mapDiv.addEventListener('click', openInGoogleMaps);
    
    mapDiv.addEventListener('mouseenter', () => {
        mapDiv.style.transform = 'scale(1.05)';
    });
    
    mapDiv.addEventListener('mouseleave', () => {
        mapDiv.style.transform = 'scale(1)';
    });
    
    showNotification('Fallback map loaded. Click to open Google Maps.', 'info');
}

function openInGoogleMaps() {
    if (!currentReport) return;
    
    const coordinates = currentReport.coordinates || currentReport.location_coordinates;
    
    if (coordinates && coordinates.lat && coordinates.lng) {
        const url = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}&t=m&z=16`;
        window.open(url, '_blank');
        console.log('🔗 Opened Google Maps with coordinates');
    } else {
        const location = currentReport.location || currentReport.address;
        if (location) {
            const url = `https://www.google.com/maps/search/${encodeURIComponent(location)}`;
            window.open(url, '_blank');
            console.log('🔗 Opened Google Maps with address search');
        }
    }
}

// 💾 Save Report Data
async function saveReportData() {
    if (!currentReport || isLoading) return;
    
    try {
        console.log('💾 Saving report data...');
        showLoading();
        
        // Collect updated data
        const updatedData = {
            status: statusDropdown?.value || currentReport.status,
            notes: notesTextarea?.value || '',
            lastModified: new Date().toISOString()
        };
        
        console.log('📝 Updated data:', updatedData);
        
        // In test mode, just simulate save
        const testMode = true; // Same as in loadReportData
        
        if (testMode) {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Update local data
            currentReport = { ...currentReport, ...updatedData };
            
            console.log('✅ Test save completed');
            showNotification('Changes saved successfully! (Test Mode) ✅', 'success');
        } else {
            // Real backend save
            const reportId = currentReport.id || currentReport.reportId;
            const endpoint = API_CONFIG.ENDPOINTS.UPDATE_REPORT.replace(':id', reportId);
            
            const response = await makeApiRequest(endpoint, {
                method: 'PUT',
                body: JSON.stringify(updatedData)
            });
            
            currentReport = { ...currentReport, ...updatedData };
            showNotification('Report updated successfully! ✅', 'success');
        }
        
        // Reset unsaved changes flag
        hasUnsavedChanges = false;
        updateSaveButtonState();
        
    } catch (error) {
        console.error('❌ Error saving report:', error);
    } finally {
        hideLoading();
    }
}

// 🔄 Change Tracking Functions
function trackChanges() {
    hasUnsavedChanges = true;
    updateSaveButtonState();
    console.log('📝 Changes tracked - hasUnsavedChanges:', hasUnsavedChanges);
    showNotification('Changes detected! 📝', 'info');
}

function updateSaveButtonState() {
    if (saveBtn) {
        // Remove existing classes
        saveBtn.classList.remove('has-changes', 'is-saved');
        
        if (hasUnsavedChanges) {
            saveBtn.classList.add('has-changes');
            saveBtn.textContent = 'Save Changes';
            saveBtn.disabled = false;
            console.log('✅ Save button activated (has changes)');
        } else {
            saveBtn.classList.add('is-saved');
            saveBtn.textContent = 'Saved';
            saveBtn.disabled = true;
            console.log('💾 Save button deactivated (saved)');
        }
    }
}

function handleStatusChange() {
    if (!statusDropdown) return;
    
    const newStatus = statusDropdown.value;
    console.log('🔄 Status changed to:', newStatus);
    
    // Auto-add resolution note if status changed to resolved
    if (newStatus === 'resolved') {
        if (notesTextarea && !notesTextarea.value.includes('Resolved:')) {
            const currentNotes = notesTextarea.value;
            const resolutionNote = `Resolved: ${new Date().toLocaleDateString()}`;
            notesTextarea.value = currentNotes ? `${currentNotes}\n${resolutionNote}` : resolutionNote;
            showNotification('Resolution note added automatically! 📝', 'info');
        }
    }
    
    trackChanges();
}

// 📅 Helper Functions
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US');
}

function goBackToReports() {
    if (hasUnsavedChanges) {
        if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
            window.location.href = 'Reports.html'; // Note: capital R to match your file name
        }
    } else {
        window.location.href = 'Reports.html';
    }
}

// 📱 UI Helper Functions
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
        <div style="background: #dc3545; color: white; padding: 30px; 
                    border-radius: 12px; text-align: center; margin: 20px; 
                    box-shadow: 0 4px 20px rgba(220, 53, 69, 0.3);">
            <div style="font-size: 48px; margin-bottom: 15px;">⚠️</div>
            <h3 style="margin: 0 0 15px 0; font-size: 24px;">Error</h3>
            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.5;">${message}</p>
            <button onclick="window.history.back()" 
                    style="background: white; color: #dc3545; border: none; 
                           padding: 12px 24px; border-radius: 6px; cursor: pointer; 
                           font-size: 16px; font-weight: bold; transition: all 0.2s;">
                Go Back
            </button>
        </div>
    `;
    
    const contentWrapper = document.querySelector('.content-wrapper');
    if (contentWrapper) {
        contentWrapper.innerHTML = '';
        contentWrapper.appendChild(errorDiv);
    }
}

function showNotification(message, type = 'info') {
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        info: '#007bff',
        warning: '#ffc107'
    };

    const icons = {
        success: '✅',
        error: '⚠️',
        info: 'ℹ️',
        warning: '⚠️'
    };

    const notification = document.createElement('div');
    notification.className = 'notification-custom';
    notification.innerHTML = `
        <div style="background: ${colors[type]}; color: white; padding: 15px 20px; 
                    border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center;">
                    <span style="margin-right: 10px; font-size: 18px;">${icons[type]}</span>
                    <span style="font-size: 14px; line-height: 1.4;">${message}</span>
                </div>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                        style="background: none; border: none; color: white; 
                               cursor: pointer; font-size: 20px; margin-left: 15px; 
                               padding: 5px; line-height: 1;">×</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
    
    console.log(`📢 Notification: ${message}`);
}

// 🔧 Global Sidebar Functions (Override any conflicts)
window.toggleSidebar = function() {
    console.log('🔄 toggleSidebar called from HTML onclick');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    
    if (!sidebar || !overlay) {
        console.error('❌ Sidebar or overlay not found');
        return;
    }
    
    const isOpen = sidebar.classList.contains('sidebar-open') || sidebar.classList.contains('active');
    
    console.log('📱 Current sidebar state:', isOpen ? 'open' : 'closed');
    
    if (isOpen) {
        closeSidebar();
    } else {
        openSidebar();
    }
};

window.openSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    
    if (!sidebar || !overlay) return;
    
    console.log('📂 Opening sidebar...');
    
    // Use both class names for compatibility
    sidebar.classList.add('sidebar-open', 'active');
    overlay.classList.add('show', 'active');
    
    if (hamburgerBtn) {
        hamburgerBtn.classList.add('hamburger-active');
    }
    
    // Prevent body scroll on mobile
    if (window.innerWidth <= 1024) {
        document.body.style.overflow = 'hidden';
    }
    
    console.log('✅ Sidebar opened');
};

window.closeSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    
    if (!sidebar || !overlay) return;
    
    console.log('📁 Closing sidebar...');
    
    // Remove both class names for compatibility
    sidebar.classList.remove('sidebar-open', 'active');
    overlay.classList.remove('show', 'active');
    
    if (hamburgerBtn) {
        hamburgerBtn.classList.remove('hamburger-active');
    }
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    console.log('✅ Sidebar closed');
};

// 🔧 Local Sidebar Functions (for event listeners)
function toggleSidebar() {
    window.toggleSidebar();
}

function openSidebar() {
    window.openSidebar();
}

function closeSidebar() {
    window.closeSidebar();
}

// 🚀 Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing CityFix Report Details');

    // Add required styles
    addRequiredStyles();
    
    // Load report data
    loadReportData();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('✅ Report Details initialized successfully');
});

// 🗺️ Google Maps callback function (called from HTML script tag)
function initMap() {
    console.log('🗺️ Google Maps API loaded via HTML callback');
    // Maps will be initialized when report data is loaded
}

// 🧪 Test Button (for debugging only)
function addTestButton() {
    const testBtn = document.createElement('button');
    testBtn.textContent = 'Test Change Tracking';
    testBtn.className = 'test-button';
    testBtn.onclick = () => {
        console.log('🧪 Testing change tracking...');
        trackChanges();
        showNotification('Test: Change tracking triggered! 🧪', 'info');
    };
    document.body.appendChild(testBtn);
    
    // Remove after 10 seconds
    setTimeout(() => {
        if (testBtn.parentNode) {
            testBtn.remove();
        }
    }, 10000);
}

function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Save button
    if (saveBtn) {
        saveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('💾 Save button clicked');
            saveReportData();
        });
        console.log('✅ Save button listener added');
    }
    
    // Status change tracking
    if (statusDropdown) {
        statusDropdown.addEventListener('change', (e) => {
            console.log('🔄 Status dropdown changed:', e.target.value);
            handleStatusChange();
        });
        console.log('✅ Status dropdown listener added');
    }
    
    // Notes change tracking - Multiple events for better detection
    if (notesTextarea) {
        ['input', 'keyup', 'paste', 'change'].forEach(eventType => {
            notesTextarea.addEventListener(eventType, (e) => {
                console.log(`📝 Notes ${eventType} event:`, e.target.value.substring(0, 50) + '...');
                trackChanges();
            });
        });
        console.log('✅ Notes textarea listeners added');
        
        // Auto-save every 30 seconds if there are changes
        setInterval(() => {
            if (hasUnsavedChanges && notesTextarea.value.trim()) {
                console.log('⏰ Auto-saving...');
                saveReportData();
            }
        }, 30000);
    }
    
    // Back button
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            goBackToReports();
        });
        console.log('✅ Back button listener added');
    }
    
    // Hamburger button for mobile sidebar
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSidebar();
        });
        console.log('✅ Hamburger button listener added');
    }
    
    // Overlay click to close sidebar
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
        console.log('✅ Overlay click listener added');
    }
    
    // Prevent accidental page leave with unsaved changes
    window.addEventListener('beforeunload', (e) => {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
    
    // Mobile responsive - close sidebar when resizing to desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 1024) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.classList.remove('sidebar-open');
            }
            const overlay = document.getElementById('overlay');
            if (overlay) {
                overlay.classList.remove('show');
            }
            document.body.style.overflow = '';
        }
    });
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('sidebar');
        const hamburger = document.querySelector('.hamburger-btn');
        const isMobile = window.innerWidth <= 1024;
        
        if (isMobile && sidebar && hamburger) {
            const isClickInsideSidebar = sidebar.contains(e.target);
            const isClickOnHamburger = hamburger.contains(e.target);
            const isSidebarOpen = sidebar.classList.contains('sidebar-open');
            
            if (!isClickInsideSidebar && !isClickOnHamburger && isSidebarOpen) {
                closeSidebar();
            }
        }
    });
    
    console.log('✅ All event listeners set up');
}

function addRequiredStyles() {
    const styles = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #007bff;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        
        /* Override only necessary styles, respect existing CSS */
        .save-btn.has-changes {
            background: #28a745 !important;
            color: white !important;
            cursor: pointer !important;
            border-color: #28a745 !important;
        }
        
        .save-btn.is-saved {
            background: #6c757d !important;
            color: white !important;
            cursor: not-allowed !important;
            opacity: 0.7 !important;
            border-color: #6c757d !important;
        }
        
        .save-btn:hover.has-changes {
            background: #218838 !important;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3) !important;
        }
        
        .save-btn:active.has-changes {
            transform: translateY(0);
        }
        
        /* Notification positioning - respect existing layout */
        .notification-custom {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1001;
            max-width: 350px;
            animation: slideIn 0.3s ease;
        }
        
        @media (max-width: 768px) {
            .notification-custom {
                top: 10px;
                right: 10px;
                left: 10px;
                max-width: none;
            }
        }
        
        /* Loading overlay - minimal interference */
        .loading-overlay {
            backdrop-filter: blur(3px);
        }
        
        /* Map container - respect existing height */
        .map-container {
            position: relative;
        }
        
        /* Test button styling */
        .test-button {
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 1000;
            background: #17a2b8;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            box-shadow: 0 2px 8px rgba(23, 162, 184, 0.3);
            transition: all 0.2s ease;
        }
        
        .test-button:hover {
            background: #138496;
            transform: translateY(-1px);
        }
        
        @media (max-width: 768px) {
            .test-button {
                bottom: 10px;
                left: 10px;
                padding: 8px 12px;
                font-size: 11px;
            }
        }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    
    console.log('✅ Minimal override styles added (respecting existing CSS)');
}