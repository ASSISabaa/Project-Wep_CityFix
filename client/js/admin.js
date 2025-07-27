// CityFix Admin Dashboard JavaScript

// DOM Elements
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const hamburgerBtn = document.querySelector('.hamburger-btn');
const navItems = document.querySelectorAll('.nav-item');

// State management
let sidebarOpen = false;
let isMobile = window.innerWidth <= 1024; // Back to checking screen size

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    setupEventListeners();
    checkResponsive();
});

// Initialize dashboard
function initializeDashboard() {
    console.log('CityFix Admin Dashboard Initialized');
    
    // Set initial state based on screen size
    if (isMobile) {
        // Mobile/Tablet: start with sidebar closed
        sidebar.classList.remove('sidebar-open');
        overlay.classList.remove('show');
        sidebarOpen = false;
    } else {
        // Desktop: sidebar always open
        sidebar.classList.add('sidebar-open');
        overlay.classList.remove('show');
        sidebarOpen = true;
    }
    
    // Initialize hamburger button state
    if (hamburgerBtn) {
        hamburgerBtn.classList.remove('hamburger-active');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Window resize listener
    window.addEventListener('resize', debounce(handleResize, 250));
    
    // Keyboard navigation
    document.addEventListener('keydown', handleKeydown);
    
    // Click outside sidebar to close (mobile)
    document.addEventListener('click', handleOutsideClick);
    
    // Touch events for mobile
    if ('ontouchstart' in window) {
        setupTouchEvents();
    }
}

// Toggle sidebar function
function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
    
    if (sidebarOpen) {
        openSidebar();
    } else {
        closeSidebar();
    }
}

// Open sidebar
function openSidebar() {
    if (!sidebar || !overlay || !hamburgerBtn) return;
    
    sidebar.classList.add('sidebar-open');
    overlay.classList.add('show');
    hamburgerBtn.classList.add('hamburger-active');
    sidebarOpen = true;
    
    // Prevent body scroll on mobile/tablet only
    if (isMobile) {
        document.body.style.overflow = 'hidden';
    }
    
    // Focus management
    setTimeout(() => {
        const firstNavItem = sidebar.querySelector('.nav-item');
        if (firstNavItem) {
            firstNavItem.focus();
        }
    }, 300);
}

// Close sidebar
function closeSidebar() {
    if (!sidebar || !overlay || !hamburgerBtn) return;
    
    sidebar.classList.remove('sidebar-open');
    overlay.classList.remove('show');
    hamburgerBtn.classList.remove('hamburger-active');
    sidebarOpen = false;
    
    // Restore body scroll
    document.body.style.overflow = '';
}

// Set active navigation item
function setActive(clickedItem) {
    // Remove active class from all items
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to clicked item
    clickedItem.classList.add('active');
    
    // Close sidebar after selection only on mobile/tablet
    if (isMobile && sidebarOpen) {
        setTimeout(() => {
            closeSidebar();
        }, 200);
    }
    
    // Update content based on selection (placeholder)
    updateMainContent(clickedItem.getAttribute('data-icon'));
    
    // Prevent default link behavior
    return false;
}

// Update main content based on selection
function updateMainContent(section) {
    const contentWrapper = document.querySelector('.content-wrapper');
    if (!contentWrapper) return;
    
    const titles = {
        'dashboard': 'Dashboard Overview',
        'reports': 'Reports & Documentation',
        'analytics': 'Analytics & Insights',
        'team': 'Team Management',
        'notifications': 'Notifications Center',
        'settings': 'System Settings'
    };
    
    const descriptions = {
        'dashboard': 'Monitor your city infrastructure and view real-time status updates.',
        'reports': 'Generate and view detailed reports about city maintenance and operations.',
        'analytics': 'Analyze trends and performance metrics across all city services.',
        'team': 'Manage team members, roles, and permissions for the CityFix platform.',
        'notifications': 'View and manage system notifications and alerts.',
        'settings': 'Configure system settings and preferences for your organization.'
    };
    
    const title = titles[section] || 'Welcome to CityFix Admin Dashboard';
    const description = descriptions[section] || 'Select a menu item to get started.';
    
    contentWrapper.innerHTML = `
        <h1>${title}</h1>
        <p>${description}</p>
        <div style="margin-top: 30px; padding: 20px; background: #F3F4F6; border-radius: 8px; border-left: 4px solid #3B82F6;">
            <h3 style="color: #1F2937; margin-bottom: 10px;">Section: ${section.charAt(0).toUpperCase() + section.slice(1)}</h3>
            <p style="color: #6B7280; margin: 0;">This section is ready for development. Add your ${section} functionality here.</p>
        </div>
    `;
}

// Handle window resize
function handleResize() {
    const wasMobile = isMobile;
    isMobile = window.innerWidth <= 1024;
    
    if (wasMobile !== isMobile) {
        checkResponsive();
    }
}

// Check responsive state
function checkResponsive() {
    if (isMobile) {
        // Mobile/Tablet: ensure sidebar is closed initially
        closeSidebar();
    } else {
        // Desktop: ensure sidebar is visible and overlay is hidden
        sidebar.classList.add('sidebar-open');
        overlay.classList.remove('show');
        if (hamburgerBtn) {
            hamburgerBtn.classList.remove('hamburger-active');
        }
        document.body.style.overflow = '';
        sidebarOpen = true;
    }
}

// Handle keyboard navigation
function handleKeydown(event) {
    // ESC key to close sidebar (only on mobile/tablet)
    if (event.key === 'Escape' && sidebarOpen && isMobile) {
        closeSidebar();
        return;
    }
    
    // Enter or Space to toggle hamburger
    if ((event.key === 'Enter' || event.key === ' ') && 
        event.target.classList.contains('hamburger-btn')) {
        event.preventDefault();
        toggleSidebar();
        return;
    }
    
    // Arrow key navigation in sidebar
    if (sidebar.contains(event.target) && 
        (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
        event.preventDefault();
        navigateWithArrows(event.key);
    }
}

// Arrow key navigation
function navigateWithArrows(direction) {
    const focusedElement = document.activeElement;
    const navItems = Array.from(sidebar.querySelectorAll('.nav-item'));
    const currentIndex = navItems.indexOf(focusedElement);
    
    let nextIndex;
    if (direction === 'ArrowDown') {
        nextIndex = currentIndex + 1;
        if (nextIndex >= navItems.length) {
            nextIndex = 0; // Loop to first item
        }
    } else if (direction === 'ArrowUp') {
        nextIndex = currentIndex - 1;
        if (nextIndex < 0) {
            nextIndex = navItems.length - 1; // Loop to last item
        }
    }
    
    if (nextIndex !== undefined && navItems[nextIndex]) {
        navItems[nextIndex].focus();
    }
}

// Handle clicks outside sidebar
function handleOutsideClick(event) {
    if (!isMobile || !sidebarOpen) return;
    
    const isClickInsideSidebar = sidebar.contains(event.target);
    const isClickOnHamburger = hamburgerBtn && hamburgerBtn.contains(event.target);
    
    if (!isClickInsideSidebar && !isClickOnHamburger) {
        closeSidebar();
    }
}

// Setup touch events for mobile
function setupTouchEvents() {
    let startX = null;
    let startY = null;
    
    // Touch start
    document.addEventListener('touchstart', function(event) {
        startX = event.touches[0].clientX;
        startY = event.touches[0].clientY;
    }, { passive: true });
    
    // Touch move
    document.addEventListener('touchmove', function(event) {
        if (!startX || !startY || !isMobile) return;
        
        const currentX = event.touches[0].clientX;
        const currentY = event.touches[0].clientY;
        
        const diffX = startX - currentX;
        const diffY = startY - currentY;
        
        // Check if horizontal swipe is more significant than vertical
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Swipe left to close sidebar
            if (diffX > 50 && sidebarOpen) {
                closeSidebar();
            }
            // Swipe right to open sidebar (from left edge)
            else if (diffX < -50 && !sidebarOpen && startX < 20) {
                openSidebar();
            }
        }
    }, { passive: true });
    
    // Reset touch coordinates
    document.addEventListener('touchend', function() {
        startX = null;
        startY = null;
    }, { passive: true });
}

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Handle escape key globally
function handleEscapeKey(event) {
    if (event.key === 'Escape' && sidebarOpen && isMobile) {
        closeSidebar();
    }
}

// Setup keyboard accessibility
function setupKeyboardAccessibility() {
    // Make hamburger button focusable and accessible
    if (hamburgerBtn) {
        hamburgerBtn.setAttribute('tabindex', '0');
        hamburgerBtn.setAttribute('role', 'button');
        hamburgerBtn.setAttribute('aria-label', 'Toggle navigation menu');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
    }
    
    // Make nav items accessible
    navItems.forEach(item => {
        item.setAttribute('role', 'menuitem');
    });
    
    // Make sidebar accessible
    if (sidebar) {
        sidebar.setAttribute('role', 'navigation');
        sidebar.setAttribute('aria-label', 'Main navigation');
    }
}

// Update aria attributes based on sidebar state
function updateAriaAttributes() {
    if (hamburgerBtn) {
        hamburgerBtn.setAttribute('aria-expanded', sidebarOpen.toString());
    }
}

// Enhanced initialization
function enhancedInitialization() {
    setupKeyboardAccessibility();
    updateAriaAttributes();
    
    // Add focus trap for mobile when sidebar is open
    if (isMobile && sidebarOpen) {
        trapFocus();
    }
}

// Focus trap for accessibility
function trapFocus() {
    const focusableElements = sidebar.querySelectorAll(
        'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    );
    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement = focusableElements[focusableElements.length - 1];
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstFocusableElement) {
                    lastFocusableElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastFocusableElement) {
                    firstFocusableElement.focus();
                    e.preventDefault();
                }
            }
        }
    });
}

// Performance monitoring
function logPerformance() {
    if (window.performance) {
        const perfData = window.performance.timing;
        const loadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log(`CityFix Dashboard loaded in ${loadTime}ms`);
    }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    setupEventListeners();
    checkResponsive();
    enhancedInitialization();
    logPerformance();
});

// Handle visibility change (when user switches tabs)
document.addEventListener('visibilitychange', function() {
    if (document.hidden && sidebarOpen && isMobile) {
        // Close sidebar when user switches tabs on mobile
        closeSidebar();
    }
});

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        toggleSidebar,
        openSidebar,
        closeSidebar,
        setActive,
        updateMainContent
    };
}