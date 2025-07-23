// CityFix Global JavaScript - Works on all pages
(function() {
    'use strict';

    // Wait for DOM to be fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        initMobileMenu();
        initNavigation();
        initScrollEffects();
        initFormValidation();
        initSmoothScrolling();
        initResponsiveHandling();
        
        console.log('✅ CityFix JavaScript loaded successfully!');
    });

    // Mobile Menu Functionality
    function initMobileMenu() {
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const mobileNav = document.querySelector('.mobile-nav');
        const body = document.body;

        if (!mobileMenuBtn || !mobileNav) return;

        // Toggle mobile menu on button click
        mobileMenuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleMobileMenu();
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!mobileMenuBtn.contains(e.target) && !mobileNav.contains(e.target)) {
                closeMobileMenu();
            }
        });

        // Close menu when clicking on navigation links
        const mobileNavLinks = mobileNav.querySelectorAll('.nav-item, .login-btn, .signup-btn');
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', function() {
                closeMobileMenu();
            });
        });

        // Handle escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
                closeMobileMenu();
            }
        });

        function toggleMobileMenu() {
            const isActive = mobileNav.classList.contains('active');
            
            if (isActive) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        }

        function openMobileMenu() {
            mobileNav.classList.add('active');
            mobileMenuBtn.classList.add('active');
            body.style.overflow = 'hidden';
            
            // Add accessibility
            mobileMenuBtn.setAttribute('aria-expanded', 'true');
            mobileNav.setAttribute('aria-hidden', 'false');
        }

        function closeMobileMenu() {
            mobileNav.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
            body.style.overflow = '';
            
            // Add accessibility
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
            mobileNav.setAttribute('aria-hidden', 'true');
        }
    }

    // Navigation Active State Management
    function initNavigation() {
        setActiveNavigation();
    }

    function setActiveNavigation() {
        const currentPage = getCurrentPage();
        const navLinks = document.querySelectorAll('.nav-item');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            
            const linkHref = link.getAttribute('href');
            if (isCurrentPage(linkHref, currentPage)) {
                link.classList.add('active');
            }
        });
    }

    function getCurrentPage() {
        let currentPage = window.location.pathname.split('/').pop();
        if (!currentPage || currentPage === '') {
            currentPage = 'index.html';
        }
        return currentPage;
    }

    function isCurrentPage(linkHref, currentPage) {
        if (!linkHref || linkHref === '#') return false;
        
        // Handle index page variations
        if ((currentPage === 'index.html' || currentPage === '') && 
            (linkHref === 'index.html' || linkHref === './index.html' || linkHref === '/')) {
            return true;
        }
        
        // Handle other pages
        return linkHref === currentPage || linkHref === './' + currentPage;
    }

    // Smooth Scrolling for Anchor Links
    function initSmoothScrolling() {
        const anchorLinks = document.querySelectorAll('a[href^="#"]');
        
        anchorLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                if (href && href !== '#' && href.length > 1) {
                    const target = document.querySelector(href);
                    
                    if (target) {
                        e.preventDefault();
                        
                        // Close mobile menu if open
                        const mobileNav = document.querySelector('.mobile-nav');
                        if (mobileNav && mobileNav.classList.contains('active')) {
                            mobileNav.classList.remove('active');
                            document.querySelector('.mobile-menu-btn').classList.remove('active');
                            document.body.style.overflow = '';
                        }
                        
                        // Smooth scroll to target
                        const headerHeight = document.querySelector('.header').offsetHeight;
                        const targetPosition = target.offsetTop - headerHeight - 20;
                        
                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        });
                    }
                }
            });
        });
    }

    // Header Scroll Effects
    function initScrollEffects() {
        const header = document.querySelector('.header');
        if (!header) return;

        let lastScrollY = window.scrollY;
        let scrollTimeout;

        window.addEventListener('scroll', function() {
            clearTimeout(scrollTimeout);
            
            scrollTimeout = setTimeout(function() {
                const currentScrollY = window.scrollY;
                
                // Add/remove scrolled class
                if (currentScrollY > 50) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
                
                lastScrollY = currentScrollY;
            }, 10);
        });
    }

    // Form Validation
    function initFormValidation() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            form.addEventListener('submit', function(e) {
                if (!validateForm(this)) {
                    e.preventDefault();
                }
            });
            
            // Real-time validation
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('blur', function() {
                    validateField(this);
                });
                
                input.addEventListener('input', function() {
                    if (this.classList.contains('error')) {
                        validateField(this);
                    }
                });
            });
        });
    }

    function validateForm(form) {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!validateField(field)) {
                isValid = false;
            }
        });
        
        return isValid;
    }

    function validateField(field) {
        field.classList.remove('error');
        
        // Check if field is required and empty
        if (field.hasAttribute('required') && !field.value.trim()) {
            field.classList.add('error');
            return false;
        }
        
        // Email validation
        if (field.type === 'email' && field.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(field.value)) {
                field.classList.add('error');
                return false;
            }
        }
        
        // Phone validation (basic)
        if (field.type === 'tel' && field.value) {
            const phoneRegex = /^[\d\s\-\+\(\)]+$/;
            if (!phoneRegex.test(field.value)) {
                field.classList.add('error');
                return false;
            }
        }
        
        return true;
    }

    // Responsive Handling
    function initResponsiveHandling() {
        let resizeTimeout;
        
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            
            resizeTimeout = setTimeout(function() {
                handleResize();
            }, 250);
        });
    }

    function handleResize() {
        const mobileNav = document.querySelector('.mobile-nav');
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        
        // Close mobile menu on desktop
        if (window.innerWidth > 640) {
            if (mobileNav && mobileNav.classList.contains('active')) {
                mobileNav.classList.remove('active');
            }
            if (mobileMenuBtn && mobileMenuBtn.classList.contains('active')) {
                mobileMenuBtn.classList.remove('active');
            }
            document.body.style.overflow = '';
        }
    }

    // Utility Functions
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

    // Initialize accessibility features
    function initAccessibility() {
        // Add ARIA labels to mobile menu button
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        if (mobileMenuBtn) {
            mobileMenuBtn.setAttribute('aria-label', 'Toggle navigation menu');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
        }
        
        // Add ARIA hidden to mobile nav
        const mobileNav = document.querySelector('.mobile-nav');
        if (mobileNav) {
            mobileNav.setAttribute('aria-hidden', 'true');
        }
    }

    // Call accessibility init when DOM loads
    document.addEventListener('DOMContentLoaded', initAccessibility);

    // Export functions for external use if needed
    window.CityFix = {
        closeMobileMenu: function() {
            const mobileNav = document.querySelector('.mobile-nav');
            const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
            
            if (mobileNav) mobileNav.classList.remove('active');
            if (mobileMenuBtn) mobileMenuBtn.classList.remove('active');
            document.body.style.overflow = '';
        },
        
        setActiveNav: setActiveNavigation,
        validateForm: validateForm
    };

})();