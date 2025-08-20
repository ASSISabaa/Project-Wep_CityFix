/**
 * CityFix Header System - Mobile Optimized
 * Version: 3.0
 * Focus: Responsive functionality for mobile and tablet
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeHeader();
});

function initializeHeader() {
    // Cache elements
    const elements = {
        body: document.body,
        header: document.querySelector('.header'),
        mobileMenuBtn: document.querySelector('.mobile-menu-btn'),
        mobileNav: document.querySelector('.mobile-nav'),
        navItems: document.querySelectorAll('.nav-item'),
        mobileNavItems: document.querySelectorAll('.mobile-nav .nav-item'),
        userProfile: document.querySelector('.user-profile'),
        loginBtns: document.querySelectorAll('.login-btn'),
        signupBtns: document.querySelectorAll('.signup-btn')
    };

    // State management
    let state = {
        isMobileMenuOpen: false,
        isUserLoggedIn: checkUserLoginStatus(),
        currentBreakpoint: getCurrentBreakpoint()
    };

    // Initialize mobile menu
    if (elements.mobileMenuBtn && elements.mobileNav) {
        initializeMobileMenu();
    }

    // Initialize user profile
    if (elements.userProfile) {
        initializeUserProfile();
    }

    // Set active page
    setActivePage();

    // Handle window resize
    handleResponsive();

    // ========================================
    // MOBILE MENU FUNCTIONS
    // ========================================
    function initializeMobileMenu() {
        // Toggle menu on button click
        elements.mobileMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleMobileMenu();
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (state.isMobileMenuOpen) {
                if (!elements.mobileNav.contains(e.target) && 
                    !elements.mobileMenuBtn.contains(e.target)) {
                    closeMobileMenu();
                }
            }
        });

        // Close menu when clicking nav items
        elements.mobileNavItems.forEach(item => {
            item.addEventListener('click', function() {
                closeMobileMenu();
            });
        });

        // Close menu on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && state.isMobileMenuOpen) {
                closeMobileMenu();
            }
        });
    }

    function toggleMobileMenu() {
        state.isMobileMenuOpen = !state.isMobileMenuOpen;
        
        if (state.isMobileMenuOpen) {
            openMobileMenu();
        } else {
            closeMobileMenu();
        }
    }

    function openMobileMenu() {
        elements.mobileMenuBtn.classList.add('active');
        elements.mobileNav.classList.add('active');
        elements.body.classList.add('mobile-menu-open');
        
        // Animate menu items
        animateMenuItems();
        
        // Prevent scroll
        const scrollY = window.scrollY;
        elements.body.style.position = 'fixed';
        elements.body.style.top = `-${scrollY}px`;
        elements.body.style.width = '100%';
    }

    function closeMobileMenu() {
        elements.mobileMenuBtn.classList.remove('active');
        elements.mobileNav.classList.remove('active');
        elements.body.classList.remove('mobile-menu-open');
        
        // Restore scroll
        const scrollY = elements.body.style.top;
        elements.body.style.position = '';
        elements.body.style.top = '';
        elements.body.style.width = '';
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
        
        state.isMobileMenuOpen = false;
    }

    function animateMenuItems() {
        const items = elements.mobileNav.querySelectorAll('.nav-item, .login-btn, .signup-btn');
        
        items.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(-10px)';
            
            setTimeout(() => {
                item.style.transition = 'all 0.3s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 50);
        });
    }

    // ========================================
    // USER PROFILE FUNCTIONS
    // ========================================
    function initializeUserProfile() {
        // Create mobile user info if logged in
        if (state.isUserLoggedIn && elements.mobileNav) {
            createMobileUserInfo();
        }

        // Handle profile dropdown (desktop)
        if (window.innerWidth > 768) {
            elements.userProfile.addEventListener('click', function(e) {
                e.stopPropagation();
                this.classList.toggle('active');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', function(e) {
                if (!elements.userProfile.contains(e.target)) {
                    elements.userProfile.classList.remove('active');
                }
            });
        }
    }

    function createMobileUserInfo() {
        const userData = getUserData();
        if (!userData) return;

        const mobileUserInfo = document.createElement('div');
        mobileUserInfo.className = 'mobile-user-info';
        mobileUserInfo.innerHTML = `
            <img src="${userData.avatar || '/default-avatar.png'}" class="mobile-avatar" alt="User">
            <div>
                <div style="font-weight: 600;">${userData.name}</div>
                <div style="font-size: 12px; color: #6b7280;">${userData.email}</div>
            </div>
        `;

        // Insert at the beginning of mobile nav
        const mobileNavContent = elements.mobileNav.querySelector('.mobile-nav-content') || elements.mobileNav;
        mobileNavContent.insertBefore(mobileUserInfo, mobileNavContent.firstChild);
    }

    // ========================================
    // RESPONSIVE HANDLING
    // ========================================
    function handleResponsive() {
        let resizeTimer;
        
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                const newBreakpoint = getCurrentBreakpoint();
                
                if (newBreakpoint !== state.currentBreakpoint) {
                    state.currentBreakpoint = newBreakpoint;
                    
                    // Close mobile menu if switching to desktop
                    if (newBreakpoint === 'desktop' && state.isMobileMenuOpen) {
                        closeMobileMenu();
                    }
                    
                    // Adjust header height for different breakpoints
                    adjustHeaderHeight();
                }
            }, 250);
        });
    }

    function getCurrentBreakpoint() {
        const width = window.innerWidth;
        
        if (width <= 480) return 'mobile-small';
        if (width <= 768) return 'mobile';
        if (width <= 992) return 'tablet';
        if (width <= 1200) return 'desktop-small';
        return 'desktop';
    }

    function adjustHeaderHeight() {
        const breakpoint = state.currentBreakpoint;
        
        switch(breakpoint) {
            case 'mobile-small':
                elements.header.style.minHeight = '56px';
                break;
            case 'mobile':
                elements.header.style.minHeight = '60px';
                break;
            default:
                elements.header.style.minHeight = '70px';
        }
    }

    // ========================================
    // UTILITY FUNCTIONS
    // ========================================
    function setActivePage() {
        const currentPath = window.location.pathname;
        const currentPage = currentPath.split('/').pop() || 'index.html';
        
        // Desktop nav
        elements.navItems.forEach(item => {
            const href = item.getAttribute('href');
            if (href === currentPage || (currentPage === 'index.html' && href === '/')) {
                item.classList.add('active');
            }
        });
        
        // Mobile nav
        elements.mobileNavItems.forEach(item => {
            const href = item.getAttribute('href');
            if (href === currentPage || (currentPage === 'index.html' && href === '/')) {
                item.classList.add('active');
            }
        });
    }

    function checkUserLoginStatus() {
        // Check if user is logged in (from localStorage or session)
        const user = localStorage.getItem('cityfix_user');
        return user !== null;
    }

    function getUserData() {
        const userData = localStorage.getItem('cityfix_user');
        if (userData) {
            try {
                return JSON.parse(userData);
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    // ========================================
    // PUBLIC API
    // ========================================
    window.CityFixHeader = {
        openMenu: function() {
            if (elements.mobileMenuBtn && elements.mobileNav) {
                openMobileMenu();
            }
        },
        closeMenu: function() {
            if (elements.mobileMenuBtn && elements.mobileNav) {
                closeMobileMenu();
            }
        },
        toggleMenu: function() {
            if (elements.mobileMenuBtn && elements.mobileNav) {
                toggleMobileMenu();
            }
        },
        login: function(userData) {
            localStorage.setItem('cityfix_user', JSON.stringify(userData));
            state.isUserLoggedIn = true;
            location.reload(); // Reload to update header state
        },
        logout: function() {
            localStorage.removeItem('cityfix_user');
            state.isUserLoggedIn = false;
            location.reload(); // Reload to update header state
        },
        isLoggedIn: function() {
            return state.isUserLoggedIn;
        },
        getCurrentBreakpoint: function() {
            return state.currentBreakpoint;
        }
    };

    console.log('✅ CityFix Header initialized successfully');
}

// ========================================
// HELPER FUNCTIONS (Outside main function)
// ========================================

// Smooth scroll to element
function scrollToElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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

// Check if device is touch-enabled
function isTouchDevice() {
    return ('ontouchstart' in window) || 
           (navigator.maxTouchPoints > 0) || 
           (navigator.msMaxTouchPoints > 0);
}

// Add touch-friendly class if needed
if (isTouchDevice()) {
    document.documentElement.classList.add('touch-device');
}



