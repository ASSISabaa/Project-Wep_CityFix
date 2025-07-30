// CityFix Universal Navigation System - Mobile Fixed
// File: script.js - Works on all screens including mobile

console.log('🏙️ CityFix Universal Loading...');

// Wait for page to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Page loaded - Starting universal navigation setup');
    
    setActiveNavItem(); // Set active navigation item first
    setupMobileMenu();
    setupNavigation();
    setupAuthButtons();
    setupInteractiveElements();
    setupResponsiveHeader();
    setupReportsLinks(); // Special handling for Reports links
    
    console.log('✅ Universal navigation setup complete!');
});

// ==============================================
// REPORTS LINKS SETUP - SPECIAL HANDLING
// ==============================================

function setupReportsLinks() {
    console.log('🔍 Setting up Reports links...');
    
    // Find all possible Reports links
    const reportsSelectors = [
        'a[href*="BrowseReports"]',
        'a[href*="reports"]', 
        '.nav-item:contains("Reports")',
        'a:contains("Reports")',
        '.mobile-nav-item:contains("Reports")'
    ];
    
    // Manual search for Reports text
    const allLinks = document.querySelectorAll('a, .nav-item, .mobile-nav-item');
    const reportsLinks = [];
    
    allLinks.forEach(link => {
        const text = link.textContent.trim().toLowerCase();
        const href = link.href || '';
        
        if (text === 'reports' || text === 'browse reports' || href.includes('BrowseReports')) {
            reportsLinks.push(link);
            console.log(`📋 Found Reports link: "${link.textContent.trim()}" → ${href || 'No href'}`);
        }
    });
    
    console.log(`Found ${reportsLinks.length} Reports links total`);
    
    // Setup click handlers for all Reports links
    reportsLinks.forEach((link, index) => {
        link.addEventListener('click', function(e) {
            console.log(`📋 Reports link ${index + 1} clicked`);
            
            // If it has href, let it work naturally
            if (this.href && this.href.includes('BrowseReports')) {
                console.log(`✅ Using natural navigation to: ${this.href}`);
                return; // Let browser handle it
            }
            
            // Otherwise, force navigation
            e.preventDefault();
            console.log('🚀 Force navigating to BrowseReports.html');
            window.location.href = 'BrowseReports.html';
        });
    });
    
    // Also setup a global fallback
    document.addEventListener('click', function(e) {
        const clickedElement = e.target;
        const text = clickedElement.textContent.trim().toLowerCase();
        
        if (text === 'reports' && !clickedElement.href) {
            console.log('🎯 Global fallback: Reports clicked without href');
            e.preventDefault();
            window.location.href = 'BrowseReports.html';
        }
    });
    
    console.log('✅ Reports links setup complete');
}

// ==============================================
// MOBILE MENU SETUP - FIXED FOR ALL SCREENS
// ==============================================

function setupMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    
    if (mobileMenuBtn) {
        console.log('Setting up mobile menu');
        
        // Create mobile nav if it doesn't exist
        let mobileNav = document.querySelector('.mobile-nav');
        if (!mobileNav) {
            console.log('Creating mobile nav...');
            mobileNav = document.createElement('div');
            mobileNav.className = 'mobile-nav';
            
            // Add mobile nav styles directly via JavaScript
            mobileNav.style.cssText = `
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                width: 100%;
                height: 100vh;
                background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 30%, #e2e8f0 60%, #cbd5e1 100%);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                z-index: 999;
                padding: 20px 15px 30px;
                overflow-y: auto;
                transform: translateX(100%);
                transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                -webkit-overflow-scrolling: touch;
            `;
            
            mobileNav.innerHTML = `
                <!-- Mobile Header with Logo and Close -->
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 20px 0 40px 0;
                    border-bottom: 1px solid rgba(148, 163, 184, 0.3);
                    margin-bottom: 30px;
                ">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <img src="assets/CityFix-logo.svg" alt="CityFix Logo" style="width: 30px; height: 24px; object-fit: contain;">
                        <span style="
                            font-family: 'Poppins', sans-serif;
                            font-size: 18px;
                            font-weight: bold;
                            color: #333;
                        ">CityFix</span>
                    </div>
                    <button onclick="closeMobileMenu()" style="
                        background: none;
                        border: none;
                        font-size: 24px;
                        color: #666;
                        cursor: pointer;
                        padding: 8px;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.background='rgba(0,0,0,0.1)'" onmouseout="this.style.background='none'">×</button>
                </div>
                
                <!-- Navigation Items -->
                <a href="index.html" class="mobile-nav-item ${getCurrentPage() === 'index' ? 'active' : ''}" style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 18px 0;
                    color: ${getCurrentPage() === 'index' ? '#2563EB' : '#1e293b'};
                    text-decoration: none;
                    text-align: center;
                    font-size: 18px;
                    font-weight: 600;
                    min-height: 60px;
                    border-radius: 16px;
                    margin: 8px 0;
                    transition: all 0.3s ease;
                    background: ${getCurrentPage() === 'index' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(255, 255, 255, 0.7)'};
                    border: 1px solid ${getCurrentPage() === 'index' ? '#2563EB' : 'rgba(148, 163, 184, 0.3)'};
                    backdrop-filter: blur(10px);
                ">Home</a>
                <a href="BrowseReports.html" class="mobile-nav-item ${getCurrentPage() === 'BrowseReports' ? 'active' : ''}" style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 18px 0;
                    color: ${getCurrentPage() === 'BrowseReports' ? '#2563EB' : '#1e293b'};
                    text-decoration: none;
                    text-align: center;
                    font-size: 18px;
                    font-weight: 600;
                    min-height: 60px;
                    border-radius: 16px;
                    margin: 8px 0;
                    transition: all 0.3s ease;
                    background: ${getCurrentPage() === 'BrowseReports' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(255, 255, 255, 0.7)'};
                    border: 1px solid ${getCurrentPage() === 'BrowseReports' ? '#2563EB' : 'rgba(148, 163, 184, 0.3)'};
                    backdrop-filter: blur(10px);
                ">Reports</a>
                <a href="SubmitReport.html" class="mobile-nav-item ${getCurrentPage() === 'SubmitReport' ? 'active' : ''}" style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 18px 0;
                    color: ${getCurrentPage() === 'SubmitReport' ? '#2563EB' : '#1e293b'};
                    text-decoration: none;
                    text-align: center;
                    font-size: 18px;
                    font-weight: 600;
                    min-height: 60px;
                    border-radius: 16px;
                    margin: 8px 0;
                    transition: all 0.3s ease;
                    background: ${getCurrentPage() === 'SubmitReport' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(255, 255, 255, 0.7)'};
                    border: 1px solid ${getCurrentPage() === 'SubmitReport' ? '#2563EB' : 'rgba(148, 163, 184, 0.3)'};
                    backdrop-filter: blur(10px);
                ">Submit Report</a>
                <a href="#" class="mobile-nav-item" data-action="city-insights" style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 18px 0;
                    color: #1e293b;
                    text-decoration: none;
                    text-align: center;
                    font-size: 18px;
                    font-weight: 600;
                    min-height: 60px;
                    border-radius: 16px;
                    margin: 8px 0;
                    transition: all 0.3s ease;
                    background: rgba(255, 255, 255, 0.7);
                    border: 1px solid rgba(148, 163, 184, 0.3);
                    backdrop-filter: blur(10px);
                ">City Insights</a>
                <a href="MyImpact.html" class="mobile-nav-item ${getCurrentPage() === 'MyImpact' ? 'active' : ''}" style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 18px 0;
                    color: ${getCurrentPage() === 'MyImpact' ? '#2563EB' : '#1e293b'};
                    text-decoration: none;
                    text-align: center;
                    font-size: 18px;
                    font-weight: 600;
                    min-height: 60px;
                    border-radius: 16px;
                    margin: 8px 0;
                    transition: all 0.3s ease;
                    background: ${getCurrentPage() === 'MyImpact' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(255, 255, 255, 0.7)'};
                    border: 1px solid ${getCurrentPage() === 'MyImpact' ? '#2563EB' : 'rgba(148, 163, 184, 0.3)'};
                    backdrop-filter: blur(10px);
                ">My Impact</a>
                <a href="#" class="mobile-nav-item" data-action="contact" style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 18px 0;
                    color: #1e293b;
                    text-decoration: none;
                    text-align: center;
                    font-size: 18px;
                    font-weight: 600;
                    min-height: 60px;
                    border-radius: 16px;
                    margin: 8px 0;
                    transition: all 0.3s ease;
                    background: rgba(255, 255, 255, 0.7);
                    border: 1px solid rgba(148, 163, 184, 0.3);
                    backdrop-filter: blur(10px);
                ">Contact</a>
            `;
            
            document.body.appendChild(mobileNav);
            console.log('✅ Mobile nav created');
        }
        
        // Mobile menu toggle
        mobileMenuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('📱 Mobile menu button clicked');
            
            const isActive = mobileNav.style.display === 'block' && mobileNav.style.transform === 'translateX(0px)';
            
            if (isActive) {
                // Close menu
                console.log('Closing mobile menu');
                mobileNav.style.transform = 'translateX(100%)';
                mobileMenuBtn.classList.remove('active');
                document.body.classList.remove('mobile-menu-open');
                setTimeout(() => {
                    mobileNav.style.display = 'none';
                }, 400);
            } else {
                // Open menu
                console.log('Opening mobile menu');
                mobileNav.style.display = 'block';
                mobileMenuBtn.classList.add('active');
                document.body.classList.add('mobile-menu-open');
                setTimeout(() => {
                    mobileNav.style.transform = 'translateX(0px)';
                }, 10);
            }
        });
        
        // Handle mobile nav clicks
        mobileNav.addEventListener('click', function(e) {
            if (e.target.classList.contains('mobile-nav-item')) {
                const action = e.target.getAttribute('data-action');
                const text = e.target.textContent.trim();
                
                console.log(`Mobile nav clicked: ${text}`);
                
                // Close mobile menu first
                mobileNav.style.transform = 'translateX(100%)';
                mobileMenuBtn.classList.remove('active');
                document.body.classList.remove('mobile-menu-open');
                setTimeout(() => {
                    mobileNav.style.display = 'none';
                }, 400);
                
                // Handle navigation
                if (action === 'city-insights') {
                    e.preventDefault();
                    setTimeout(() => {
                        showComingSoonModal('City Insights', 'Advanced analytics and insights about your city are coming soon! Stay tuned for data-driven reports and trends.');
                    }, 500);
                } else if (action === 'contact') {
                    e.preventDefault();
                    setTimeout(() => {
                        showComingSoonModal('Contact', 'Contact page is coming soon! For now, you can reach us through the feedback options in your profile.');
                    }, 500);
                }
                // For other items, let the href handle navigation
            }
        });
        
        // Close mobile menu when clicking outside (on backdrop)
        mobileNav.addEventListener('click', function(e) {
            if (e.target === mobileNav) {
                console.log('Backdrop clicked - closing menu');
                mobileNav.style.transform = 'translateX(100%)';
                mobileMenuBtn.classList.remove('active');
                document.body.classList.remove('mobile-menu-open');
                setTimeout(() => {
                    mobileNav.style.display = 'none';
                }, 400);
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', function() {
            if (window.innerWidth > 1024) {
                // Desktop view - close mobile menu
                mobileNav.style.transform = 'translateX(100%)';
                mobileMenuBtn.classList.remove('active');
                document.body.classList.remove('mobile-menu-open');
                setTimeout(() => {
                    mobileNav.style.display = 'none';
                }, 400);
            }
        });
        
        console.log('✅ Mobile menu setup complete');
    } else {
        console.log('❌ Mobile menu button not found');
    }
}

// ==============================================
// DESKTOP NAVIGATION SETUP - ENHANCED
// ==============================================

function setupNavigation() {
    // Find all navigation items (desktop only)
    const navItems = document.querySelectorAll('.nav-section .nav-item');
    console.log(`Found ${navItems.length} desktop navigation items`);
    
    navItems.forEach((item, index) => {
        const text = item.textContent.trim();
        console.log(`Setting up desktop nav item ${index}: "${text}"`);
        
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            const clickedText = this.textContent.trim();
            console.log(`🔗 Desktop clicked: "${clickedText}"`);
            
            // Remove active class from all nav items
            navItems.forEach(navItem => navItem.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Navigation logic
            handleNavigation(clickedText);
        });
        
        // Also handle direct href clicks for Reports
        if (text === 'Reports' && item.href && item.href.includes('BrowseReports.html')) {
            console.log(`✅ Found Reports link with correct href: ${item.href}`);
        }
    });
    
    // Additional setup for any Reports links that might have href
    const reportsLinks = document.querySelectorAll('a[href*="BrowseReports"], a[href*="reports"]');
    console.log(`Found ${reportsLinks.length} additional Reports links`);
    
    reportsLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            console.log(`📋 Direct Reports link clicked: ${this.href}`);
            // Let the browser handle this naturally
        });
    });
}

// ==============================================
// NAVIGATION HANDLER - FIXED FOR REPORTS
// ==============================================

function handleNavigation(text) {
    console.log(`🎯 Handling navigation for: "${text}"`);
    
    if (text === 'Home') {
        console.log('→ Going to index.html');
        window.location.href = 'index.html';
    }
    else if (text === 'Reports' || text === 'Browse Reports') {
        console.log('→ Going to BrowseReports.html');
        window.location.href = 'BrowseReports.html';
    }
    else if (text === 'Submit Report') {
        console.log('→ Going to SubmitReport.html');  
        window.location.href = 'SubmitReport.html';
    }
    else if (text === 'City Insights') {
        console.log('→ Showing City Insights modal');
        showComingSoonModal('City Insights', 'Advanced analytics and insights about your city are coming soon! Stay tuned for data-driven reports and trends.');
    }
    else if (text === 'My Impact') {
        console.log('→ Going to MyImpact.html');
        window.location.href = 'MyImpact.html';
    }
    else if (text === 'Contact') {
        console.log('→ Showing Contact modal');
        showComingSoonModal('Contact', 'Contact page is coming soon! For now, you can reach us through the feedback options in your profile.');
    }
    else {
        console.log(`→ Unknown navigation item: "${text}"`);
        console.log('Available options: Home, Reports, Submit Report, City Insights, My Impact, Contact');
    }
}

// ==============================================
// AUTH BUTTONS SETUP
// ==============================================

function setupAuthButtons() {
    // Setup login buttons  
    const loginBtns = document.querySelectorAll('.login-btn');
    console.log(`Found ${loginBtns.length} login buttons`);
    
    loginBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🔐 Login clicked → Going to login.html');
            window.location.href = 'login.html';
        });
    });
    
    // Setup signup buttons
    const signupBtns = document.querySelectorAll('.signup-btn');
    console.log(`Found ${signupBtns.length} signup buttons`);
    
    signupBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('📝 Signup clicked → Going to signup.html');
            window.location.href = 'signup.html';
        });
    });
    
    // Setup notification and profile icons
    const notificationIcon = document.querySelector('.notification-icon');
    const profileIcon = document.querySelector('.profile-icon');
    
    if (notificationIcon) {
        notificationIcon.addEventListener('click', function() {
            console.log('🔔 Notification clicked');
            showComingSoonModal('Notifications', 'Stay updated with notifications about your reports and city improvements. This feature will keep you informed!');
        });
    }
    
    if (profileIcon) {
        profileIcon.addEventListener('click', function() {
            console.log('👤 Profile clicked');
            showProfileModal();
        });
    }
}

// ==============================================
// INTERACTIVE ELEMENTS SETUP
// ==============================================

function setupInteractiveElements() {
    // Setup hero button
    const heroBtns = document.querySelectorAll('.hero-button, .cta-button');
    console.log(`Found ${heroBtns.length} hero/CTA buttons`);
    
    heroBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🚀 Hero button clicked → Going to SubmitReport.html');
            window.location.href = 'SubmitReport.html';
        });
    });
    
    // Make issue cards clickable
    const issueCards = document.querySelectorAll('.issue-card');
    console.log(`Found ${issueCards.length} issue cards`);
    
    issueCards.forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', function() {
            console.log('📋 Issue card clicked → Going to SubmitReport.html');
            window.location.href = 'SubmitReport.html';
        });
    });
}

// ==============================================
// RESPONSIVE HEADER SETUP
// ==============================================

function setupResponsiveHeader() {
    // Ensure header is visible on all screen sizes
    const header = document.querySelector('.header');
    if (header) {
        // Force header visibility
        header.style.display = 'flex';
        header.style.position = 'sticky';
        header.style.top = '0';
        header.style.zIndex = '100';
        header.style.width = '100%';
        
        console.log('✅ Header visibility ensured on all screens');
    }
    
    // Check current screen size and adjust
    checkScreenSize();
    
    // Monitor screen size changes
    window.addEventListener('resize', checkScreenSize);
}

function checkScreenSize() {
    const screenWidth = window.innerWidth;
    const header = document.querySelector('.header');
    const navSection = document.querySelector('.nav-section');
    const authSection = document.querySelector('.auth-section');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    
    console.log(`📱 Screen width: ${screenWidth}px`);
    
    if (screenWidth <= 1024) {
        // Mobile/Tablet view
        if (navSection) navSection.style.display = 'none';
        if (authSection) authSection.style.display = 'none';
        if (mobileMenuBtn) mobileMenuBtn.style.display = 'flex';
        
        if (header) {
            header.style.padding = '8px 20px';
        }
        
        console.log('📱 Mobile view activated');
    } else {
        // Desktop view
        if (navSection) navSection.style.display = 'flex';
        if (authSection) authSection.style.display = 'flex';
        if (mobileMenuBtn) mobileMenuBtn.style.display = 'none';
        
        if (header) {
            header.style.padding = '16px 80px';
        }
        
        // Close mobile menu if open
        const mobileNav = document.querySelector('.mobile-nav');
        if (mobileNav && mobileNav.classList.contains('active')) {
            mobileNav.classList.remove('active');
            if (mobileMenuBtn) mobileMenuBtn.classList.remove('active');
            document.body.classList.remove('mobile-menu-open');
        }
        
        console.log('🖥️ Desktop view activated');
    }
}

// ==============================================
// MODAL FUNCTIONS
// ==============================================

function showComingSoonModal(featureName, description) {
    // Remove existing modal
    const existingModal = document.querySelector('.custom-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'custom-modal';
    modal.style.cssText = `
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
        backdrop-filter: blur(4px);
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 16px;
        padding: 32px;
        max-width: 500px;
        width: 90%;
        text-align: center;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        transform: scale(0.9);
        transition: all 0.3s ease;
    `;
    
    modalContent.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 16px;">🚀</div>
        <h2 style="color: #1E40AF; margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">${featureName}</h2>
        <p style="color: #6B7280; margin: 0 0 24px 0; line-height: 1.6; font-size: 16px;">${description}</p>
        <div style="display: flex; gap: 12px; justify-content: center;">
            <button onclick="closeModal()" style="
                background: #3B82F6;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            " onmouseover="this.style.background='#2563EB'" onmouseout="this.style.background='#3B82F6'">Got it!</button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Animate in
    setTimeout(() => {
        modalContent.style.transform = 'scale(1)';
    }, 10);
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

function showProfileModal() {
    // Remove existing modal
    const existingModal = document.querySelector('.custom-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'custom-modal';
    modal.style.cssText = `
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
        backdrop-filter: blur(4px);
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 16px;
        padding: 32px;
        max-width: 400px;
        width: 90%;
        text-align: center;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        transform: scale(0.9);
        transition: all 0.3s ease;
    `;
    
    modalContent.innerHTML = `
        <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%); margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; font-weight: 600;">U</div>
        <h2 style="color: #1E40AF; margin: 0 0 8px 0; font-size: 24px; font-weight: 600;">User Profile</h2>
        <p style="color: #6B7280; margin: 0 0 24px 0; font-size: 14px;">user@cityfix.com</p>
        <div style="display: flex; flex-direction: column; gap: 12px;">
            <button onclick="window.location.href='MyImpact.html'" style="
                background: #2563EB;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            " onmouseover="this.style.background='#1d4ed8'" onmouseout="this.style.background='#2563EB'">📊 My Impact</button>
            <button onclick="showComingSoonModal('Settings', 'Profile settings and preferences are coming soon!')" style="
                background: #F3F4F6;
                color: #6B7280;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            " onmouseover="this.style.background='#E5E7EB'" onmouseout="this.style.background='#F3F4F6'">⚙️ Settings</button>
            <button onclick="closeModal()" style="
                background: transparent;
                color: #9CA3AF;
                border: none;
                padding: 8px;
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                margin-top: 8px;
            ">Close</button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Animate in
    setTimeout(() => {
        modalContent.style.transform = 'scale(1)';
    }, 10);
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

function closeModal() {
    const modal = document.querySelector('.custom-modal');
    if (modal) {
        const modalContent = modal.querySelector('div');
        if (modalContent) {
            modalContent.style.transform = 'scale(0.9)';
        }
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// ==============================================
// UTILITY FUNCTIONS - PAGE DETECTION & MOBILE MENU
// ==============================================

function getCurrentPage() {
    const currentPath = window.location.pathname;
    const fileName = currentPath.split('/').pop().replace('.html', '');
    
    // Handle different page names
    if (fileName === '' || fileName === 'index') {
        return 'index';
    } else if (fileName === 'BrowseReports' || fileName === 'reports') {
        return 'BrowseReports';
    } else if (fileName === 'SubmitReport') {
        return 'SubmitReport';
    } else if (fileName === 'MyImpact') {
        return 'MyImpact';
    } else {
        return fileName;
    }
}

function closeMobileMenu() {
    const mobileNav = document.querySelector('.mobile-nav');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    
    if (mobileNav && mobileMenuBtn) {
        console.log('🔴 Closing mobile menu via X button');
        mobileNav.style.transform = 'translateX(100%)';
        mobileMenuBtn.classList.remove('active');
        document.body.classList.remove('mobile-menu-open');
        setTimeout(() => {
            mobileNav.style.display = 'none';
        }, 400);
    }
}

function setActiveNavItem() {
    const currentPage = getCurrentPage();
    console.log(`📍 Current page detected: ${currentPage}`);
    
    // Set active state for desktop navigation
    const desktopNavItems = document.querySelectorAll('.nav-section .nav-item');
    desktopNavItems.forEach(item => {
        const text = item.textContent.trim().toLowerCase();
        item.classList.remove('active');
        
        if (
            (currentPage === 'index' && text === 'home') ||
            (currentPage === 'BrowseReports' && text === 'reports') ||
            (currentPage === 'SubmitReport' && text === 'submit report') ||
            (currentPage === 'MyImpact' && text === 'my impact')
        ) {
            item.classList.add('active');
            console.log(`✅ Set active: ${text}`);
        }
    });
}

// Make functions globally available
window.closeModal = closeModal;
window.showComingSoonModal = showComingSoonModal;
window.showProfileModal = showProfileModal;
window.closeMobileMenu = closeMobileMenu;
window.getCurrentPage = getCurrentPage;
window.setActiveNavItem = setActiveNavItem;

console.log('📄 CityFix Universal Navigation Script Loaded - Mobile Ready!');