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
        timeline: generateTimelineData(status)
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
        showNotification('🗺️ Opening map view for: ' + reportData.id, 'info');
    });
    
    statusBtn.addEventListener('click', () => {
        showStatusUpdateOptions(reportData);
    });
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
// Map Interactions
// ===========================
function addMapInteractions() {
    const mapContainer = document.querySelector('.map-container');
    const mapPlaceholder = document.querySelector('.map-placeholder');
    
    if (!mapPlaceholder) return;
    
    // Make it more interactive
    mapPlaceholder.style.cursor = 'pointer';
    mapPlaceholder.style.transition = 'all 0.3s ease';
    
    // Add dots
    addMapDots(mapPlaceholder);
    
    mapPlaceholder.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.02)';
        this.style.filter = 'brightness(1.1)';
    });
    
    mapPlaceholder.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
        this.style.filter = 'brightness(1)';
    });
    
    mapPlaceholder.addEventListener('click', function() {
        showMapNotification();
        this.style.animation = 'mapPulse 0.5s ease';
        setTimeout(() => {
            this.style.animation = '';
        }, 500);
    });
}

function addMapDots(container) {
    for (let i = 0; i < 4; i++) {
        const dot = document.createElement('div');
        dot.style.cssText = `
            position: absolute;
            width: 8px;
            height: 8px;
            background: #ffffff;
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.7);
            animation: dotPulse ${1.5 + Math.random()}s ease-in-out infinite;
            animation-delay: ${i * 0.3}s;
        `;
        
        dot.style.left = 20 + Math.random() * 60 + '%';
        dot.style.top = 30 + Math.random() * 40 + '%';
        
        container.appendChild(dot);
    }
}

function showMapNotification() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: linear-gradient(135deg, #4f46e5, #7c3aed);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        max-width: 300px;
    `;
    
    notification.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 5px;">🗺️ Interactive Map</div>
        <div style="font-size: 14px; opacity: 0.9;">Coming soon with real-time tracking!</div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3500);
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