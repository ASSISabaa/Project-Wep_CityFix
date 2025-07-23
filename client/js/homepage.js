// Counter Animation Script
class CounterAnimation {
    constructor() {
        this.counters = [];
        this.isAnimating = false;
        this.observer = null;
        this.init();
    }

    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupCounters());
        } else {
            this.setupCounters();
        }
    }

    setupCounters() {
        // Find all stat number elements
        const statNumbers = document.querySelectorAll('.stat-number');
        
        // Counter data with target values
        const counterData = [
            { element: statNumbers[0], target: 15234, duration: 2000 },
            { element: statNumbers[1], target: 12847, duration: 2200 },
            { element: statNumbers[2], target: 2387, duration: 1800 }
        ];

        this.counters = counterData;
        
        // Setup intersection observer for trigger animation when visible
        this.setupIntersectionObserver();
        
        // Initial setup - set all counters to 0
        this.resetCounters();
    }

    setupIntersectionObserver() {
        const options = {
            threshold: 0.5, // Trigger when 50% of stats section is visible
            rootMargin: '0px 0px -50px 0px'
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isAnimating) {
                    this.startAnimation();
                }
            });
        }, options);

        // Observe the stats section
        const statsSection = document.querySelector('.stats-section');
        if (statsSection) {
            this.observer.observe(statsSection);
        }
    }

    resetCounters() {
        this.counters.forEach(counter => {
            if (counter.element) {
                counter.element.textContent = '0';
            }
        });
    }

    startAnimation() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        
        // Add animation class to stats cards for additional effects
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.transform = 'translateY(0px)';
                card.style.opacity = '1';
            }, index * 200);
        });

        // Start counter animations
        this.counters.forEach((counter, index) => {
            setTimeout(() => {
                this.animateCounter(counter);
            }, index * 300); // Stagger the start of each counter
        });
    }

    animateCounter(counter) {
        if (!counter.element) return;

        const startTime = performance.now();
        const startValue = 0;
        const endValue = counter.target;
        const duration = counter.duration;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation (easeOutQuart)
            const easeProgress = 1 - Math.pow(1 - progress, 4);
            
            const currentValue = Math.floor(startValue + (endValue - startValue) * easeProgress);
            
            // Format number with commas
            counter.element.textContent = this.formatNumber(currentValue);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Ensure final value is exactly the target
                counter.element.textContent = this.formatNumber(endValue);
                
                // Add completion effect
                this.addCompletionEffect(counter.element);
            }
        };

        requestAnimationFrame(animate);
    }

    formatNumber(num) {
        return num.toLocaleString();
    }

    addCompletionEffect(element) {
        // Add a subtle bounce effect when counter completes
        element.style.transform = 'scale(1.1)';
        element.style.transition = 'transform 0.2s ease';
        
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 200);
    }

    // Method to manually trigger animation (useful for testing)
    triggerAnimation() {
        this.isAnimating = false;
        this.resetCounters();
        setTimeout(() => {
            this.startAnimation();
        }, 100);
    }

    // Method to reset and restart animation
    restart() {
        this.isAnimating = false;
        this.resetCounters();
        
        // Reset card styles
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach(card => {
            card.style.transform = 'translateY(20px)';
            card.style.opacity = '0.8';
            card.style.transition = 'all 0.6s ease';
        });

        setTimeout(() => {
            this.startAnimation();
        }, 500);
    }
}

// Initialize the counter animation
let counterAnimationInstance;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    counterAnimationInstance = new CounterAnimation();
});

// Expose methods globally for testing/debugging
window.CounterAnimation = {
    trigger: () => counterAnimationInstance?.triggerAnimation(),
    restart: () => counterAnimationInstance?.restart()
};

// Handle mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileNav = document.querySelector('.mobile-nav');
    const body = document.body;

    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenuBtn.classList.toggle('active');
            mobileNav.classList.toggle('active');
            body.classList.toggle('menu-open');
        });

        // Close mobile menu when clicking on nav links
        const navItems = mobileNav.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                mobileMenuBtn.classList.remove('active');
                mobileNav.classList.remove('active');
                body.classList.remove('menu-open');
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!mobileNav.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                mobileMenuBtn.classList.remove('active');
                mobileNav.classList.remove('active');
                body.classList.remove('menu-open');
            }
        });
    }
});

// Header scroll effect
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    if (header) {
        if (window.scrollY > 10) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
});

// Smooth scrolling for anchor links
document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Add loading animation to buttons
document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('.hero-button, .signup-btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Add ripple effect
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
});

// Add CSS for ripple effect
const rippleStyles = `
.hero-button, .signup-btn {
    position: relative;
    overflow: hidden;
}

.ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    pointer-events: none;
    transform: scale(0);
    animation: ripple-animation 0.6s linear;
}

@keyframes ripple-animation {
    to {
        transform: scale(2);
        opacity: 0;
    }
}
`;

// Inject ripple styles
const styleSheet = document.createElement('style');
styleSheet.textContent = rippleStyles;
document.head.appendChild(styleSheet);

console.log('🚀 CityFix JavaScript loaded successfully!');