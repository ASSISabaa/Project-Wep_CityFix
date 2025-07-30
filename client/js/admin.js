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
}// CityFix Admin Dashboard JavaScript

// DOM Elements
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const hamburgerBtn = document.querySelector('.hamburger-btn');
const navItems = document.querySelectorAll('.nav-item');

// State management
let sidebarOpen = false;
let isMobile = window.innerWidth <= 1024;

// Page URLs mapping
const pageUrls = {
    'dashboard': 'dashboard.html',
    'reports': 'reports.html',
    'analytics': 'analytics.html',
    'team': 'team.html',
    'notifications': 'notifications.html',
    'settings': 'settings.html'
};

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    setupEventListeners();
    setupHeaderFunctionality();
    checkResponsive();
});

// Initialize dashboard
function initializeDashboard() {
    console.log('CityFix Admin Dashboard Initialized');
    
    if (isMobile) {
        sidebar.classList.remove('sidebar-open');
        overlay.classList.remove('show');
        sidebarOpen = false;
    } else {
        sidebar.classList.add('sidebar-open');
        overlay.classList.remove('show');
        sidebarOpen = true;
    }
    
    if (hamburgerBtn) {
        hamburgerBtn.classList.remove('hamburger-active');
    }
}

// Setup event listeners
function setupEventListeners() {
    window.addEventListener('resize', debounce(handleResize, 250));
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('click', handleOutsideClick);
    
    if ('ontouchstart' in window) {
        setupTouchEvents();
    }
}

// Setup Header Functionality
function setupHeaderFunctionality() {
    // Notifications functionality
    const notificationContainer = document.querySelector('.notification-container');
    if (notificationContainer) {
        notificationContainer.addEventListener('click', handleNotificationsClick);
        notificationContainer.style.cursor = 'pointer';
        notificationContainer.title = 'Notifications';
    }
    
    // User profile functionality
    const userProfile = document.querySelector('.user-profile');
    if (userProfile) {
        userProfile.addEventListener('click', handleUserProfileClick);
        userProfile.style.cursor = 'pointer';
        userProfile.title = 'User Profile';
    }
}

// Handle notifications click
function handleNotificationsClick() {
    showComingSoon('Notifications', 'The notifications system will be available soon. You will be able to view alerts, system messages, and important updates here.');
}

// Handle user profile click
function handleUserProfileClick() {
    showComingSoon('User Profile', 'User profile management is coming soon. You will be able to update your account settings, change password, and manage preferences here.');
}

// Show coming soon modal/alert
function showComingSoon(feature, description) {
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'coming-soon-overlay';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'coming-soon-modal';
    modalContent.style.cssText = `
        background: white;
        padding: 32px;
        border-radius: 12px;
        max-width: 480px;
        width: 90%;
        text-align: center;
        transform: scale(0.9);
        transition: transform 0.3s ease;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    `;
    
    modalContent.innerHTML = `
        <div style="width: 64px; height: 64px; background: #3B82F6; border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
            <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
        </div>
        <h2 style="color: #1F2937; margin-bottom: 16px; font-size: 24px; font-weight: 600;">${feature}</h2>
        <p style="color: #6B7280; margin-bottom: 24px; line-height: 1.6; font-size: 16px;">${description}</p>
        <button class="close-modal-btn" style="
            background: #3B82F6;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s ease;
        ">Got it!</button>
    `;
    
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
    
    // Animate in
    setTimeout(() => {
        modalOverlay.style.opacity = '1';
        modalContent.style.transform = 'scale(1)';
    }, 10);
    
    // Close modal functionality
    const closeBtn = modalContent.querySelector('.close-modal-btn');
    const closeModal = () => {
        modalOverlay.style.opacity = '0';
        modalContent.style.transform = 'scale(0.9)';
        setTimeout(() => {
            document.body.removeChild(modalOverlay);
        }, 300);
    };
    
    closeBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
    
    // ESC key to close
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
    
    // Hover effect for button
    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.background = '#2563EB';
    });
    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.background = '#3B82F6';
    });
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
    
    if (isMobile) {
        document.body.style.overflow = 'hidden';
    }
    
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
    
    document.body.style.overflow = '';
}

// Set active navigation item with real navigation
function setActive(clickedItem) {
    const section = clickedItem.getAttribute('data-icon');
    const url = pageUrls[section];
    
    const comingSoonPages = ['analytics', 'team', 'notifications', 'settings'];
    
    if (comingSoonPages.includes(section)) {
        showComingSoonPage(section, clickedItem);
    } else if (url) {
        // Navigate to the actual page
        window.location.href = url;
    } else {
        // Fallback for pages that don't exist yet
        showComingSoon(
            clickedItem.querySelector('.nav-text').textContent,
            `The ${clickedItem.querySelector('.nav-text').textContent.toLowerCase()} section is under development and will be available soon.`
        );
    }
    
    // Close sidebar after selection on mobile
    if (isMobile && sidebarOpen) {
        setTimeout(() => {
            closeSidebar();
        }, 200);
    }
    
    return false;
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
        closeSidebar();
    } else {
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
    if (event.key === 'Escape' && sidebarOpen && isMobile) {
        closeSidebar();
        return;
    }
    
    if ((event.key === 'Enter' || event.key === ' ') && 
        event.target.classList.contains('hamburger-btn')) {
        event.preventDefault();
        toggleSidebar();
        return;
    }
    
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
            nextIndex = 0;
        }
    } else if (direction === 'ArrowUp') {
        nextIndex = currentIndex - 1;
        if (nextIndex < 0) {
            nextIndex = navItems.length - 1;
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
    
    document.addEventListener('touchstart', function(event) {
        startX = event.touches[0].clientX;
        startY = event.touches[0].clientY;
    }, { passive: true });
    
    document.addEventListener('touchmove', function(event) {
        if (!startX || !startY || !isMobile) return;
        
        const currentX = event.touches[0].clientX;
        const currentY = event.touches[0].clientY;
        
        const diffX = startX - currentX;
        const diffY = startY - currentY;
        
        if (Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX > 50 && sidebarOpen) {
                closeSidebar();
            }
            else if (diffX < -50 && !sidebarOpen && startX < 20) {
                openSidebar();
            }
        }
    }, { passive: true });
    
    document.addEventListener('touchend', function() {
        startX = null;
        startY = null;
    }, { passive: true });
}

// Show coming soon page in the content area
function showComingSoonPage(section, clickedItem) {
    // Update active nav item
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    clickedItem.classList.add('active');
    
    // Page content based on section
    const pageContent = {
        'analytics': {
            title: 'Analytics & Insights',
            subtitle: 'Data analysis and performance metrics',
            icon: '<path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm5-18v4h3V3h-3z"/>',
            mainTitle: 'Analytics Coming Soon!',
            description: 'Our analytics dashboard will provide you with comprehensive insights into city infrastructure performance, report trends, response times, and much more. You\'ll be able to generate custom reports, view real-time statistics, and make data-driven decisions for better city management.'
        },
        'team': {
            title: 'Team Management',
            subtitle: 'Manage your team members and permissions',
            icon: '<path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.5 7h-5c-.8 0-1.5.7-1.5 1.5v8.5h2V22h5zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm1.5 1h-2C4.45 7 4 7.45 4 8v8.5h2V22h4v-5.5h2V8c0-.55-.45-1-1-1z"/>',
            mainTitle: 'Team Management Coming Soon!',
            description: 'The team management module will allow you to add team members, assign roles and permissions, manage user access to different sections, track team performance, and facilitate collaboration between different departments in your city management system.'
        },
        'notifications': {
            title: 'Notifications Center',
            subtitle: 'Stay updated with system alerts and messages',
            icon: '<path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>',
            mainTitle: 'Notifications Coming Soon!',
            description: 'Our notification center will keep you informed about important system updates, new reports, urgent issues requiring attention, team activities, and system maintenance schedules. You\'ll be able to customize notification preferences and receive real-time alerts.'
        },
        'settings': {
            title: 'System Settings',
            subtitle: 'Configure system preferences and options',
            icon: '<path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>',
            mainTitle: 'Settings Coming Soon!',
            description: 'The settings panel will provide you with complete control over system configuration, user preferences, security settings, integration options, notification preferences, appearance customization, and administrative controls for your CityFix dashboard.'
        }
    };
    
    const content = pageContent[section];
    
    // Update dashboard header
    const headerLeft = document.querySelector('.header-left');
    if (headerLeft) {
        headerLeft.innerHTML = `
            <h1>${content.title}</h1>
            <p>${content.subtitle}</p>
        `;
    }
    
    // Update main content
    const contentWrapper = document.querySelector('.content-wrapper');
    if (contentWrapper) {
        contentWrapper.innerHTML = `
            <div class="coming-soon-container">
                <div class="coming-soon-icon">
                    <svg viewBox="0 0 24 24">
                        ${content.icon}
                    </svg>
                </div>
                <h2 class="coming-soon-title">${content.mainTitle}</h2>
                <p class="coming-soon-subtitle">We're working hard to bring you this feature</p>
                <p class="coming-soon-description">${content.description}</p>
                <button class="back-to-dashboard" onclick="goToDashboard()">Back to Dashboard</button>
            </div>
        `;
    }
}

// Go back to dashboard
function goToDashboard() {
    // Reset to dashboard
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-icon') === 'dashboard') {
            item.classList.add('active');
        }
    });
    
    // Update header
    const headerLeft = document.querySelector('.header-left');
    if (headerLeft) {
        headerLeft.innerHTML = `
            <h1>Dashboard Overview</h1>
            <p>Welcome back, Admin</p>
        `;
    }
    
    // Restore original dashboard content (you can customize this)
    const contentWrapper = document.querySelector('.content-wrapper');
    if (contentWrapper) {
        location.reload();
    }
}