/**
 * ===================================
 * MY IMPACT PAGE - FIXED FOR IMAGES
 * ===================================
 */

// Global variables and configuration
const MyImpactApp = {
    config: {
        animationDuration: 300,
        counterAnimationDuration: 2000,
        notificationTimeout: 3000,
        apiEndpoint: '/api/impact',
        refreshInterval: 30000 // 30 seconds
    },
    data: {
        stats: {},
        activities: [],
        badges: [],
        mapData: null
    },
    state: {
        isLoading: false,
        lastUpdated: null,
        activeFilters: []
    }
};

/**
 * ===================================
 * INITIALIZATION
 * ===================================
 */

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeMyImpactPage();
});

function initializeMyImpactPage() {
    console.log('🚀 Initializing My Impact Page...');
    
    try {
        // Core functionality
        setupEventListeners();
        setupImageLoadHandlers();
        setupStatsCounters();
        setupActivityList();
        setupBadgeSystem();
        setupNotificationSystem();
        
        // Interactive features
        setupHoverEffects();
        setupKeyboardNavigation();
        setupPerformanceOptimizations();
        
        // Data loading
        loadInitialData();
        setupAutoRefresh();
        
        console.log('✅ My Impact Page initialized successfully!');
        
    } catch (error) {
        console.error('❌ Error initializing page:', error);
        showNotification('Error loading page. Please refresh.', 'error');
    }
}

/**
 * ===================================
 * EVENT LISTENERS SETUP
 * ===================================
 */

function setupEventListeners() {
    // Window events
    window.addEventListener('resize', debounce(handleWindowResize, 250));
    window.addEventListener('beforeunload', handlePageUnload);
    
    // Visibility change (tab switching)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Error handling
    window.addEventListener('error', handleGlobalError);
    
    // Custom events
    document.addEventListener('dataUpdated', handleDataUpdate);
    document.addEventListener('statsChanged', handleStatsChange);
}

/**
 * ===================================
 * IMAGE LOADING HANDLERS
 * ===================================
 */

function setupImageLoadHandlers() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
        // Skip external images (social icons, etc.)
        if (img.src.includes('cdn.jsdelivr.net') || img.src.includes('http')) {
            return;
        }
        
        // Add loading placeholder
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
        
        // Handle successful load
        img.addEventListener('load', function() {
            this.style.opacity = '1';
            this.classList.add('loaded');
        });
        
        // Handle failed load
        img.addEventListener('error', function() {
            console.warn('Failed to load image:', this.src);
            // Don't hide the icon, just show a placeholder
            this.style.opacity = '0.3';
            this.alt = 'Icon';
            
            // Try to set a fallback background
            this.style.backgroundColor = '#f3f4f6';
            this.style.borderRadius = '4px';
        });
        
        // If image is already loaded (cached)
        if (img.complete && img.naturalWidth > 0) {
            img.style.opacity = '1';
            img.classList.add('loaded');
        }
    });
}

/**
 * ===================================
 * STATS COUNTER SYSTEM
 * ===================================
 */

function setupStatsCounters() {
    const statCards = document.querySelectorAll('.stat-card');
    
    // Setup intersection observer for animation trigger
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNumber = entry.target.querySelector('.stat-number');
                if (statNumber && !statNumber.classList.contains('animated')) {
                    animateCounter(statNumber);
                    statNumber.classList.add('animated');
                }
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.5
    });
    
    statCards.forEach(card => observer.observe(card));
}

function animateCounter(element) {
    const originalText = element.textContent.trim();
    const finalValue = parseFloat(originalText.replace(/[^\d.]/g, ''));
    const suffix = originalText.replace(/[\d.,]/g, '');
    const isDecimal = originalText.includes('.');
    const hasK = originalText.toLowerCase().includes('k');
    
    if (isNaN(finalValue)) return;
    
    let actualTarget = finalValue;
    if (hasK) {
        actualTarget = finalValue * 1000;
    }
    
    const duration = MyImpactApp.config.counterAnimationDuration;
    const fps = 60;
    const totalFrames = Math.round(duration / 1000 * fps);
    const increment = actualTarget / totalFrames;
    
    let currentValue = 0;
    let frame = 0;
    
    function updateCounter() {
        frame++;
        currentValue += increment;
        
        if (frame >= totalFrames) {
            currentValue = actualTarget;
        }
        
        // Format and display
        let displayValue;
        if (hasK) {
            displayValue = (currentValue / 1000).toFixed(1) + 'k';
        } else if (isDecimal) {
            displayValue = currentValue.toFixed(1);
        } else {
            displayValue = Math.floor(currentValue).toString();
        }
        
        element.textContent = displayValue + suffix.replace(/k/i, '');
        
        if (frame < totalFrames) {
            requestAnimationFrame(updateCounter);
        } else {
            // Final cleanup
            element.textContent = originalText;
            element.classList.add('animation-complete');
        }
    }
    
    requestAnimationFrame(updateCounter);
}

/**
 * ===================================
 * ACTIVITY LIST MANAGEMENT
 * ===================================
 */

function setupActivityList() {
    const activityItems = document.querySelectorAll('.activity-item');
    
    activityItems.forEach((item, index) => {
        // Add data attributes for filtering
        item.dataset.index = index;
        
        // Setup click handlers
        item.addEventListener('click', function() {
            handleActivityClick(this);
        });
        
        // Add keyboard support
        item.setAttribute('tabindex', '0');
        item.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleActivityClick(this);
            }
        });
        
        // Add animation delay for staggered effect
        item.style.animationDelay = `${index * 0.1}s`;
    });
}

function handleActivityClick(activityItem) {
    const title = activityItem.querySelector('.activity-title').textContent;
    const location = activityItem.querySelector('.activity-location').textContent;
    const time = activityItem.querySelector('.activity-time').textContent;
    
    showActivityDetails({
        title,
        location,
        time,
        element: activityItem
    });
}

function showActivityDetails(activity) {
    // Create modal or detailed view
    const modal = createModal({
        title: activity.title,
        content: `
            <div class="activity-modal">
                <div class="activity-header">
                    <h3>${activity.title}</h3>
                    <span class="activity-time">${activity.time}</span>
                </div>
                <div class="activity-body">
                    <p><strong>Location:</strong> ${activity.location}</p>
                    <div class="activity-actions">
                        <button class="btn btn-primary" onclick="viewOnMap('${activity.location}')">
                            View on Map
                        </button>
                        <button class="btn btn-secondary" onclick="shareActivity('${activity.title}')">
                            Share
                        </button>
                    </div>
                </div>
            </div>
        `,
        actions: [
            {
                text: 'Close',
                class: 'btn-secondary',
                action: () => closeModal()
            }
        ]
    });
    
    showModal(modal);
}

/**
 * ===================================
 * BADGE SYSTEM
 * ===================================
 */

function setupBadgeSystem() {
    const badgeCards = document.querySelectorAll('.badge-card');
    
    badgeCards.forEach(badge => {
        const isEarned = badge.classList.contains('earned');
        
        if (isEarned) {
            badge.style.cursor = 'pointer';
            badge.addEventListener('click', function() {
                handleBadgeClick(this);
            });
        }
        
        // Add tooltip
        setupBadgeTooltip(badge);
        
        // Add achievement animation if recently earned
        if (badge.dataset.recentlyEarned === 'true') {
            animateBadgeAchievement(badge);
        }
    });
}

function handleBadgeClick(badgeElement) {
    const title = badgeElement.querySelector('.badge-title').textContent;
    const date = badgeElement.querySelector('.badge-date').textContent;
    const description = getBadgeDescription(title);
    
    showBadgeDetails({
        title,
        date,
        description,
        element: badgeElement
    });
    
    // Analytics tracking
    trackEvent('badge_clicked', {
        badge_name: title,
        earned_date: date
    });
}

function showBadgeDetails(badge) {
    // Get the image HTML from the badge
    const badgeIconHtml = badge.element.querySelector('.badge-icon').innerHTML;
    
    const modal = createModal({
        title: `🏆 ${badge.title}`,
        content: `
            <div class="badge-modal">
                <div class="badge-celebration">
                    <div class="badge-icon-large">
                        ${badgeIconHtml}
                    </div>
                    <h3>Congratulations!</h3>
                    <p class="badge-description">${badge.description}</p>
                    <p class="badge-earned-date">${badge.date}</p>
                </div>
                <div class="badge-share">
                    <button class="btn btn-primary" onclick="shareBadge('${badge.title}')">
                        Share Achievement
                    </button>
                </div>
            </div>
        `,
        className: 'badge-modal-container'
    });
    
    showModal(modal);
    
    // Add celebration animation
    setTimeout(() => {
        const celebration = modal.querySelector('.badge-celebration');
        if (celebration) {
            celebration.classList.add('celebrate');
        }
    }, 300);
}

function getBadgeDescription(title) {
    const descriptions = {
        'First Report': 'You submitted your first report to help improve the community!',
        '10 Resolved Issues': 'Your reports have led to 10 successful issue resolutions!',
        'Community Hero': 'You\'ve made a significant positive impact on your community!',
        'Top Reporter': 'You\'re among the most active reporters in your area!'
    };
    
    return descriptions[title] || 'Great achievement in community improvement!';
}

function setupBadgeTooltip(badge) {
    const title = badge.querySelector('.badge-title').textContent;
    const date = badge.querySelector('.badge-date').textContent;
    const isEarned = badge.classList.contains('earned');
    
    let tooltipText;
    if (isEarned) {
        tooltipText = `${title} - ${date}`;
    } else {
        tooltipText = `${title} - Not earned yet`;
    }
    
    badge.setAttribute('title', tooltipText);
    badge.setAttribute('aria-label', tooltipText);
}

function animateBadgeAchievement(badge) {
    badge.classList.add('achievement-animation');
    
    // Remove after animation
    setTimeout(() => {
        badge.classList.remove('achievement-animation');
        badge.removeAttribute('data-recently-earned');
    }, 2000);
}

/**
 * ===================================
 * HOVER EFFECTS AND INTERACTIONS
 * ===================================
 */

function setupHoverEffects() {
    // Enhanced stat card hover
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
        });
    });
    
    // Activity item enhanced hover
    const activityItems = document.querySelectorAll('.activity-item');
    activityItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f9fafb';
            this.style.borderRadius = '8px';
            this.style.padding = '0.75rem';
            this.style.margin = '0 -0.75rem';
            this.style.transform = 'translateX(4px)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'transparent';
            this.style.borderRadius = '0';
            this.style.padding = '0';
            this.style.margin = '0';
            this.style.transform = 'translateX(0)';
        });
    });
}

/**
 * ===================================
 * NOTIFICATION SYSTEM
 * ===================================
 */

function setupNotificationSystem() {
    // Create notification container if it doesn't exist
    if (!document.getElementById('notification-container')) {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
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

function showNotification(message, type = 'info', duration = null) {
    const container = document.getElementById('notification-container');
    if (!container) {
        setupNotificationSystem();
        return showNotification(message, type, duration);
    }
    
    const notification = document.createElement('div');
    const id = 'notification-' + Date.now();
    
    notification.id = id;
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        margin-bottom: 0.5rem;
        max-width: 400px;
        pointer-events: auto;
        transform: translateX(100%);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        opacity: 0;
        padding: 1rem;
        border-left: 4px solid ${getNotificationColor(type)};
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="font-size: 1.25rem; flex-shrink: 0;">${getNotificationIcon(type)}</div>
            <div style="flex: 1; font-size: 0.875rem; color: #374151;">${message}</div>
            <button onclick="closeNotification('${id}')" 
                    style="background: none; border: none; font-size: 1.25rem; color: #9ca3af; cursor: pointer; padding: 0; width: 24px; height: 24px;">
                &times;
            </button>
        </div>
    `;
    
    // Add to container
    container.appendChild(notification);
    
    // Animate in
    requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    });
    
    // Auto close
    const timeoutDuration = duration || MyImpactApp.config.notificationTimeout;
    setTimeout(() => {
        closeNotification(id);
    }, timeoutDuration);
    
    return id;
}

function closeNotification(id) {
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
}

function getNotificationIcon(type) {
    const icons = {
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'info': 'ℹ️'
    };
    return icons[type] || icons.info;
}

function getNotificationColor(type) {
    const colors = {
        'success': '#10b981',
        'error': '#ef4444',
        'warning': '#f59e0b',
        'info': '#3b82f6'
    };
    return colors[type] || colors.info;
}

/**
 * ===================================
 * DATA MANAGEMENT
 * ===================================
 */

function loadInitialData() {
    MyImpactApp.state.isLoading = true;
    showLoadingState();
    
    Promise.all([
        loadStatsData(),
        loadActivityData(),
        loadBadgeData()
    ]).then(() => {
        MyImpactApp.state.isLoading = false;
        MyImpactApp.state.lastUpdated = new Date();
        hideLoadingState();
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('dataUpdated', {
            detail: MyImpactApp.data
        }));
        
    }).catch(error => {
        console.error('Error loading data:', error);
        MyImpactApp.state.isLoading = false;
        hideLoadingState();
        showNotification('Failed to load data. Please refresh the page.', 'error');
    });
}

async function loadStatsData() {
    try {
        // Simulate API call - replace with actual API endpoint
        const response = await mockApiCall('/api/stats');
        MyImpactApp.data.stats = response;
        updateStatsDisplay(response);
        return response;
    } catch (error) {
        console.error('Error loading stats:', error);
        throw error;
    }
}

async function loadActivityData() {
    try {
        const response = await mockApiCall('/api/activities');
        MyImpactApp.data.activities = response;
        updateActivityDisplay(response);
        return response;
    } catch (error) {
        console.error('Error loading activities:', error);
        throw error;
    }
}

async function loadBadgeData() {
    try {
        const response = await mockApiCall('/api/badges');
        MyImpactApp.data.badges = response;
        updateBadgeDisplay(response);
        return response;
    } catch (error) {
        console.error('Error loading badges:', error);
        throw error;
    }
}

// Mock API call function - replace with actual API calls
function mockApiCall(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simulate different responses based on endpoint
            if (endpoint.includes('stats')) {
                resolve({
                    totalReports: 47,
                    resolvedIssues: 32,
                    communityImpact: 1200,
                    rating: 4.8
                });
            } else if (endpoint.includes('activities')) {
                resolve([
                    { id: 1, type: 'report', title: 'Pothole Reported', location: 'Main Street, Downtown', time: '2 days ago' },
                    { id: 2, type: 'fix', title: 'Street Light Fixed', location: 'Park Avenue', time: '5 days ago' },
                    { id: 3, type: 'issue', title: 'Garbage Collection Issue', location: 'Residential Area B', time: '1 week ago' }
                ]);
            } else if (endpoint.includes('badges')) {
                resolve([
                    { id: 1, name: 'First Report', earned: true, date: 'Jan 2025' },
                    { id: 2, name: '10 Resolved Issues', earned: true, date: 'Mar 2025' },
                    { id: 3, name: 'Community Hero', earned: true, date: 'May 2025' },
                    { id: 4, name: 'Top Reporter', earned: true, date: 'Jun 2025' }
                ]);
            }
        }, Math.random() * 500 + 200); // Random delay 200-700ms
    });
}

/**
 * ===================================
 * UI UPDATE FUNCTIONS
 * ===================================
 */

function updateStatsDisplay(stats) {
    // Update stat numbers if they've changed
    const statElements = {
        totalReports: document.querySelector('.stat-card:nth-child(1) .stat-number'),
        resolvedIssues: document.querySelector('.stat-card:nth-child(2) .stat-number'),
        communityImpact: document.querySelector('.stat-card:nth-child(3) .stat-number'),
        rating: document.querySelector('.stat-card:nth-child(4) .stat-number')
    };
    
    Object.keys(statElements).forEach(key => {
        const element = statElements[key];
        if (element && stats[key] !== undefined) {
            const newValue = formatStatValue(stats[key], key);
            if (element.textContent !== newValue) {
                animateValueChange(element, newValue);
            }
        }
    });
}

function formatStatValue(value, type) {
    switch (type) {
        case 'communityImpact':
            return value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value.toString();
        case 'rating':
            return value.toFixed(1);
        default:
            return value.toString();
    }
}

function animateValueChange(element, newValue) {
    element.style.transform = 'scale(1.1)';
    element.style.color = '#10b981';
    
    setTimeout(() => {
        element.textContent = newValue;
        element.style.transform = 'scale(1)';
        element.style.color = '';
    }, 150);
}

function updateActivityDisplay(activities) {
    // This would update the activity list if needed
    console.log('Activities updated:', activities);
}

function updateBadgeDisplay(badges) {
    // This would update the badges if needed
    console.log('Badges updated:', badges);
}

/**
 * ===================================
 * UTILITY FUNCTIONS
 * ===================================
 */

function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

function trackEvent(eventName, properties = {}) {
    // Analytics tracking
    console.log('📊 Event tracked:', eventName, properties);
}

/**
 * ===================================
 * MODAL SYSTEM
 * ===================================
 */

function createModal(options) {
    const modal = document.createElement('div');
    modal.className = `modal ${options.className || ''}`;
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
    `;
    
    modal.innerHTML = `
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5);" onclick="closeModal()"></div>
        <div style="position: relative; background: white; border-radius: 12px; max-width: 500px; width: 90%; max-height: 80vh; margin: 5vh auto; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2); transform: scale(0.9) translateY(20px); transition: all 0.3s ease;">
            <div style="padding: 1.5rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between;">
                <h2 style="margin: 0; font-size: 1.25rem; font-weight: 600; color: #111827;">${options.title}</h2>
                <button onclick="closeModal()" style="background: none; border: none; font-size: 1.5rem; color: #9ca3af; cursor: pointer; width: 32px; height: 32px;">&times;</button>
            </div>
            <div style="padding: 1.5rem; max-height: 60vh; overflow-y: auto;">${options.content}</div>
        </div>
    `;
    
    return modal;
}

function showModal(modal) {
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Animate in
    requestAnimationFrame(() => {
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
        const container = modal.querySelector('div:last-child');
        if (container) {
            container.style.transform = 'scale(1) translateY(0)';
        }
    });
}

function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.style.opacity = '0';
        modal.style.visibility = 'hidden';
        setTimeout(() => {
            if (modal.parentNode) {
                document.body.removeChild(modal);
                document.body.style.overflow = '';
            }
        }, 300);
    }
}

/**
 * ===================================
 * LOADING STATES
 * ===================================
 */

function showLoadingState() {
    if (document.getElementById('page-loader')) return;
    
    const loader = document.createElement('div');
    loader.id = 'page-loader';
    loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        backdrop-filter: blur(5px);
    `;
    
    loader.innerHTML = `
        <div style="text-align: center;">
            <div style="width: 40px; height: 40px; border: 4px solid #f3f4f6; border-top: 4px solid #4f46e5; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
            <p style="color: #6b7280;">Loading your impact data...</p>
        </div>
    `;
    
    // Add spin animation
    const style = document.createElement('style');
    style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
    document.head.appendChild(style);
    
    document.body.appendChild(loader);
}

function hideLoadingState() {
    const loader = document.getElementById('page-loader');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => {
            if (loader.parentNode) {
                document.body.removeChild(loader);
            }
        }, 300);
    }
}

/**
 * ===================================
 * PERFORMANCE OPTIMIZATIONS
 * ===================================
 */

function setupPerformanceOptimizations() {
    // Intersection Observer for animations
    const observeElements = document.querySelectorAll('.stat-card, .activity-item, .badge-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    observeElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
}

function setupAutoRefresh() {
    // Auto-refresh data every 30 seconds when page is visible
    setInterval(() => {
        if (!document.hidden && !MyImpactApp.state.isLoading) {
            refreshData();
        }
    }, MyImpactApp.config.refreshInterval);
}

function refreshData() {
    console.log('🔄 Refreshing data...');
    loadStatsData().catch(console.error);
}

/**
 * ===================================
 * EVENT HANDLERS
 * ===================================
 */

function handleWindowResize() {
    // Adjust layouts for responsive design
    const width = window.innerWidth;
    
    if (width <= 768) {
        document.body.classList.add('mobile-view');
    } else {
        document.body.classList.remove('mobile-view');
    }
}

function handleVisibilityChange() {
    if (!document.hidden) {
        // Page became visible, refresh data if it's been a while
        const now = new Date();
        const lastUpdate = MyImpactApp.state.lastUpdated;
        
        if (!lastUpdate || (now - lastUpdate) > 300000) { // 5 minutes
            refreshData();
        }
    }
}

function handleGlobalError(event) {
    console.error('Global error:', event.error);
    showNotification('An unexpected error occurred.', 'error');
}

function handlePageUnload() {
    console.log('👋 Cleaning up My Impact page...');
}

function handleDataUpdate(event) {
    console.log('📊 Data updated:', event.detail);
    showNotification('Data refreshed successfully!', 'success', 2000);
}

function handleStatsChange(event) {
    console.log('📈 Stats changed:', event.detail);
}

function setupKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'r':
                    e.preventDefault();
                    refreshData();
                    break;
            }
        }
    });
}

/**
 * ===================================
 * EXTERNAL FUNCTIONS
 * ===================================
 */

window.viewOnMap = function(location) {
    console.log('🗺️ View on map:', location);
    showNotification(`Opening map for: ${location}`, 'info');
};

window.shareActivity = function(title) {
    console.log('📤 Share activity:', title);
    
    if (navigator.share) {
        navigator.share({
            title: 'My CityFix Activity',
            text: `I reported: ${title}`,
            url: window.location.href
        });
    } else {
        const text = `I reported: ${title} via CityFix`;
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Activity details copied to clipboard!', 'success');
        });
    }
};

window.shareBadge = function(badgeName) {
    console.log('🏆 Share badge:', badgeName);
    
    if (navigator.share) {
        navigator.share({
            title: 'My CityFix Achievement',
            text: `I earned the "${badgeName}" badge on CityFix!`,
            url: window.location.href
        });
    } else {
        const text = `I earned the "${badgeName}" badge on CityFix! 🏆`;
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Badge details copied to clipboard!', 'success');
        });
    }
};

window.closeNotification = closeNotification;

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MyImpactApp;
}

console.log('📱 MyImpact.js loaded successfully!');