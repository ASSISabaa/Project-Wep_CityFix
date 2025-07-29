// CityFix Footer Admin System
// footer-admin.js - Administrative footer with working links and interactions

// Footer Admin System State
let footerAdminSystem = {
    isInitialized: false,
    socialLinks: {
        twitter: 'https://twitter.com/cityfix',
        facebook: 'https://facebook.com/cityfix',
        instagram: 'https://instagram.com/cityfix'
    },
    currentPage: 'dashboard'
};

// Initialize Footer Admin System
function initializeFooterAdmin() {
    if (footerAdminSystem.isInitialized) return;
    
    console.log(' Initializing footer admin system...');
    
    setupAdminFooterLinks();
    setupAdminSocialLinks();
    setupAdminLogoLinks();
    updateAdminCopyright();
    addAdminFooterAnimations();
    
    footerAdminSystem.isInitialized = true;
    console.log('✅ Footer admin system activated');
}

// Setup Admin Footer Navigation Links
function setupAdminFooterLinks() {
    const footerLinks = document.querySelectorAll('.footer-links a');
    
    footerLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        // Remove default behavior
        link.addEventListener('click', (e) => {
            e.preventDefault();
            handleAdminFooterNavigation(href, link);
        });
        
        // Add admin hover effects
        link.addEventListener('mouseenter', () => {
            link.style.transform = 'translateX(4px)';
            link.style.color = '#3B82F6';
        });
        
        link.addEventListener('mouseleave', () => {
            link.style.transform = 'translateX(0)';
            link.style.color = '';
        });
    });
}

// Handle Admin Footer Navigation
function handleAdminFooterNavigation(href, linkElement) {
    const section = href.replace('#', '');
    const linkText = linkElement.textContent;
    
    console.log('🔗 Admin footer navigation:', section);
    
    // Handle different admin navigation types
    switch(section) {
        case 'dashboard':
            navigateToAdminDashboard();
            break;
        case 'reports':
            navigateToAdminReports();
            break;
        case 'analytics':
            showAdminComingSoon('Analytics', 'Advanced analytics and reporting tools for administrators');
            break;
        case 'team':
            showAdminComingSoon('Team Management', 'Manage your admin team members and permissions');
            break;
        case 'notifications':
            showAdminComingSoon('Admin Notifications', 'Administrative notification center and alert management');
            break;
        case 'settings':
            showAdminComingSoon('Admin Settings', 'System configuration and administrative preferences');
            break;
        case 'contact':
            showAdminContactInfo();
            break;
        case 'privacy':
            showAdminPrivacyPolicy();
            break;
        default:
            showAdminFooterNotification(`${linkText} admin feature coming soon!`, 'info');
    }
    
    // Visual feedback
    addAdminClickFeedback(linkElement);
}

// Navigate to Admin Dashboard
function navigateToAdminDashboard() {
    if (window.location.pathname.includes('dashboard.html')) {
        // Already on admin dashboard, scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showAdminFooterNotification('Already on Admin Dashboard - scrolled to top', 'info');
    } else {
        // Navigate to admin dashboard
        window.location.href = 'dashboard.html';
    }
}

// Navigate to Admin Reports
function navigateToAdminReports() {
    if (typeof setActive === 'function') {
        // If on same page, use existing admin navigation
        const reportsLink = document.querySelector('[data-icon="reports"]');
        if (reportsLink) {
            setActive(reportsLink);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    } else {
        // Navigate to admin reports page
        window.location.href = 'reports.html';
    }
}

// Show Admin Coming Soon
function showAdminComingSoon(title, description) {
    const modal = createAdminFooterModal(title, `
        <div class="admin-footer-coming-soon">
            <div class="admin-coming-soon-icon-footer">
                <div style="font-size: 48px; margin-bottom: 16px;">🛠️</div>
            </div>
            <h3>Admin ${title} Coming Soon!</h3>
            <p>${description}</p>
            <div style="margin: 20px 0; padding: 16px; background: #FEF3C7; border-radius: 8px; border-left: 4px solid #F59E0B;">
                <strong>Admin Note:</strong> This administrative feature is currently under development and will be available in the next update.
            </div>
            <button onclick="closeAdminFooterModal()" class="admin-footer-modal-btn">
                Got it!
            </button>
        </div>
    `);
    
    showAdminFooterModal(modal);
}

// Show Admin Contact Information
function showAdminContactInfo() {
    const modal = createAdminFooterModal('Admin IT Support Contact', `
        <div class="admin-contact-info-panel">
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 48px; margin-bottom: 16px;">🔧</div>
                <h3>Administrative IT Support</h3>
                <p style="color: #F59E0B; font-weight: 600;">Priority Support for Administrators</p>
            </div>
            
            <div class="admin-contact-methods">
                <div class="admin-contact-method">
                    <div class="admin-contact-icon">📧</div>
                    <div class="admin-contact-details">
                        <div class="admin-contact-label">Admin Email</div>
                        <div class="admin-contact-value">admin-support@cityfix.gov</div>
                    </div>
                </div>
                
                <div class="admin-contact-method">
                    <div class="admin-contact-icon">📱</div>
                    <div class="admin-contact-details">
                        <div class="admin-contact-label">Emergency Hotline</div>
                        <div class="admin-contact-value">+1 (555) 911-ADMIN</div>
                    </div>
                </div>
                
                <div class="admin-contact-method">
                    <div class="admin-contact-icon">🕒</div>
                    <div class="admin-contact-details">
                        <div class="admin-contact-label">Admin Hours</div>
                        <div class="admin-contact-value">24/7 Priority Support</div>
                    </div>
                </div>
                
                <div class="admin-contact-method">
                    <div class="admin-contact-icon">🏢</div>
                    <div class="admin-contact-details">
                        <div class="admin-contact-label">Admin Office</div>
                        <div class="admin-contact-value">City Hall, Admin Wing, Room A-101</div>
                    </div>
                </div>

                <div class="admin-contact-method">
                    <div class="admin-contact-icon">🔐</div>
                    <div class="admin-contact-details">
                        <div class="admin-contact-label">Security Issues</div>
                        <div class="admin-contact-value">security@cityfix.gov</div>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 24px; text-align: center;">
                <button onclick="closeAdminFooterModal()" class="admin-footer-modal-btn">
                    Close
                </button>
            </div>
        </div>
    `);
    
    showAdminFooterModal(modal);
}

// Show Admin Privacy Policy
function showAdminPrivacyPolicy() {
    const modal = createAdminFooterModal('Administrator Privacy Policy', `
        <div class="admin-privacy-policy-panel">
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 48px; margin-bottom: 16px;">🔒</div>
                <h3>Administrative Privacy Policy</h3>
                <p style="color: #DC2626; font-weight: 600;">For Administrative Users Only</p>
            </div>
            
            <div class="admin-policy-content">
                <h4>Administrative Data Access</h4>
                <p>As an administrator, you have elevated access to city infrastructure data and citizen reports. This access comes with additional responsibilities.</p>
                
                <h4>Admin Data Usage Guidelines</h4>
                <p>Administrative data must be used exclusively for:</p>
                <ul>
                    <li>Managing and resolving city infrastructure issues</li>
                    <li>Monitoring system performance and security</li>
                    <li>Generating reports for city officials</li>
                    <li>Training and supervising staff members</li>
                    <li>Compliance with regulatory requirements</li>
                </ul>
                
                <h4>Security Responsibilities</h4>
                <p>As an admin user, you must:</p>
                <ul>
                    <li>Use strong, unique passwords and enable 2FA</li>
                    <li>Never share administrative credentials</li>
                    <li>Log out from shared devices immediately</li>
                    <li>Report suspicious activities promptly</li>
                    <li>Follow data retention policies</li>
                </ul>
                
                <h4>Audit and Compliance</h4>
                <p>All administrative actions are logged and subject to regular audits. Misuse of administrative privileges will result in account suspension and disciplinary action.</p>
                
                <div style="margin-top: 20px; padding: 16px; background: #FEE2E2; border-radius: 8px; border-left: 4px solid #DC2626;">
                    <strong>Important:</strong> By using this system, you acknowledge understanding of your administrative responsibilities and agree to comply with all security policies.
                </div>
                
                <div style="margin-top: 16px; padding: 16px; background: #F3F4F6; border-radius: 8px;">
                    <strong>Last Updated:</strong> January 2025<br>
                    <strong>Admin Contact:</strong> admin-privacy@cityfix.gov<br>
                    <strong>Policy Version:</strong> Admin-2.1
                </div>
            </div>
            
            <div style="margin-top: 24px; text-align: center;">
                <button onclick="closeAdminFooterModal()" class="admin-footer-modal-btn">
                    I Understand My Responsibilities
                </button>
            </div>
        </div>
    `);
    
    showAdminFooterModal(modal);
}

// Setup Admin Social Media Links
function setupAdminSocialLinks() {
    const socialIcons = document.querySelectorAll('.social-icons a');
    
    socialIcons.forEach(link => {
        const platform = getAdminSocialPlatform(link);
        
        link.addEventListener('click', (e) => {
            e.preventDefault();
            handleAdminSocialClick(platform, link);
        });
        
        // Add admin hover animations
        link.addEventListener('mouseenter', () => {
            link.style.transform = 'translateY(-4px) scale(1.1)';
            link.style.filter = 'brightness(1.2)';
        });
        
        link.addEventListener('mouseleave', () => {
            link.style.transform = 'translateY(0) scale(1)';
            link.style.filter = 'brightness(1)';
        });
    });
}

// Get Admin Social Platform from Link
function getAdminSocialPlatform(link) {
    const href = link.getAttribute('href');
    if (href.includes('twitter')) return 'twitter';
    if (href.includes('facebook')) return 'facebook';
    if (href.includes('instagram')) return 'instagram';
    return 'unknown';
}

// Handle Admin Social Media Clicks
function handleAdminSocialClick(platform, linkElement) {
    const platformNames = {
        twitter: 'Twitter',
        facebook: 'Facebook', 
        instagram: 'Instagram'
    };
    
    const platformName = platformNames[platform] || 'Social Media';
    
    // Show admin confirmation modal
    const modal = createAdminFooterModal(`Visit CityFix ${platformName}`, `
        <div class="admin-social-modal">
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 48px; margin-bottom: 16px;">🔗</div>
                <h3>External Admin Link</h3>
                <p>You're about to visit CityFix's official ${platformName} page.</p>
                <div style="margin: 16px 0; padding: 12px; background: #EFF6FF; border-radius: 8px; border-left: 4px solid #3B82F6;">
                    <strong>Admin Note:</strong> You may be identified as an administrative user when visiting external links.
                </div>
            </div>
            
            <div class="admin-social-actions">
                <button onclick="openAdminSocialLink('${footerAdminSystem.socialLinks[platform]}')" class="admin-footer-modal-btn primary">
                    Visit ${platformName}
                </button>
                <button onclick="closeAdminFooterModal()" class="admin-footer-modal-btn secondary">
                    Cancel
                </button>
            </div>
        </div>
    `);
    
    showAdminFooterModal(modal);
    addAdminClickFeedback(linkElement);
}

// Open Admin Social Media Link
function openAdminSocialLink(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
    closeAdminFooterModal();
    showAdminFooterNotification('Opened in new tab', 'success');
}

// Setup Admin Logo Links
function setupAdminLogoLinks() {
    const logoLinks = document.querySelectorAll('.footer-logo');
    
    logoLinks.forEach(logo => {
        logo.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToAdminDashboard();
            addAdminClickFeedback(logo);
        });
        
        // Add admin hover effect
        logo.addEventListener('mouseenter', () => {
            logo.style.transform = 'scale(1.05)';
            logo.style.filter = 'brightness(1.1)';
        });
        
        logo.addEventListener('mouseleave', () => {
            logo.style.transform = 'scale(1)';
            logo.style.filter = 'brightness(1)';
        });
    });
}

// Create Admin Footer Modal
function createAdminFooterModal(title, content) {
    return {
        title: title,
        content: content
    };
}

// Show Admin Footer Modal
function showAdminFooterModal(modal) {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'admin-footer-modal-overlay';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.75);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10002;
        opacity: 0;
        transition: opacity 0.3s ease;
        backdrop-filter: blur(4px);
    `;
    
    const modalContent = document.createElement('div');
    modalContent.className = 'admin-footer-modal-content';
    modalContent.style.cssText = `
        background: white;
        padding: 32px;
        border-radius: 16px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        transform: scale(0.8);
        transition: transform 0.3s ease;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
        position: relative;
        border-top: 4px solid #3B82F6;
    `;
    
    modalContent.innerHTML = `
        <div class="admin-badge" style="
            position: absolute;
            top: -2px;
            right: 16px;
            background: #3B82F6;
            color: white;
            padding: 4px 12px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-radius: 0 0 8px 8px;
        ">ADMIN</div>
        
        <button class="admin-footer-modal-close" onclick="closeAdminFooterModal()" style="
            position: absolute;
            top: 16px;
            right: 16px;
            background: #F3F4F6;
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            color: #6B7280;
            transition: all 0.2s ease;
        ">✕</button>
        <div class="admin-footer-modal-body">
            ${modal.content}
        </div>
    `;
    
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
    
    // Store reference
    window.currentAdminFooterModal = modalOverlay;
    
    // Animate in
    setTimeout(() => {
        modalOverlay.style.opacity = '1';
        modalContent.style.transform = 'scale(1)';
    }, 10);
    
    // Click outside to close
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeAdminFooterModal();
        }
    });
    
    // ESC key to close
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            closeAdminFooterModal();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}

// Close Admin Footer Modal
function closeAdminFooterModal() {
    const modal = window.currentAdminFooterModal;
    if (modal) {
        modal.style.opacity = '0';
        modal.firstChild.style.transform = 'scale(0.8)';
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
            window.currentAdminFooterModal = null;
        }, 300);
    }
}

// Update Admin Copyright Year
function updateAdminCopyright() {
    const copyrightElements = document.querySelectorAll('.footer-bottom p');
    const currentYear = new Date().getFullYear();
    
    copyrightElements.forEach(element => {
        if (element.textContent.includes('©')) {
            element.textContent = `© ${currentYear} CityFix Admin Panel. All rights reserved.`;
        }
    });
}

// Add Admin Footer Animations
function addAdminFooterAnimations() {
    const footer = document.querySelector('.dashboard-footer');
    if (!footer) return;
    
    // Add intersection observer for admin footer animation
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                footer.style.animation = 'slideUpAdminFooter 0.6s ease forwards';
            }
        });
    }, { threshold: 0.1 });
    
    observer.observe(footer);
    
    // Add admin CSS animation
    if (!document.querySelector('#adminFooterAnimations')) {
        const style = document.createElement('style');
        style.id = 'adminFooterAnimations';
        style.textContent = `
            @keyframes slideUpAdminFooter {
                from {
                    opacity: 0;
                    transform: translateY(50px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Add Admin Click Feedback
function addAdminClickFeedback(element) {
    element.style.transform = 'scale(0.95)';
    element.style.transition = 'transform 0.1s ease';
    
    setTimeout(() => {
        element.style.transform = '';
    }, 150);
}

// Show Admin Footer Notification
function showAdminFooterNotification(message, type = 'info') {
    if (typeof showTimedNotification === 'function') {
        showTimedNotification(`[ADMIN] ${message}`, type);
    } else {
        // Fallback admin notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #3B82F6, #1D4ED8);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10001;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            border-left: 4px solid #60A5FA;
        `;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="background: #60A5FA; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">ADMIN</span>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 4000);
    }
}

// Initialize Admin Footer when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for other admin systems to load
    setTimeout(() => {
        initializeFooterAdmin();
    }, 1500);
});

// Export Admin Footer System API
window.FooterAdminSystem = {
    init: initializeFooterAdmin,
    navigate: handleAdminFooterNavigation,
    showContact: showAdminContactInfo,
    showPrivacy: showAdminPrivacyPolicy
};

// Make admin functions global for onclick handlers
window.closeAdminFooterModal = closeAdminFooterModal;
window.openAdminSocialLink = openAdminSocialLink;

console.log(' Footer Admin system module loaded');

console.log(' Footer system module loaded');