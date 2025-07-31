// Footer Content with External Popup Pages
const footerContent = {
    // Quick Links Section
    home: `
        <h2>Welcome to CityFix</h2>
        <p>Your premier platform for reporting and tracking municipal infrastructure issues. 
        Join thousands of citizens making their communities better, one report at a time.</p>
        
        <h3>What We Do:</h3>
        <ul>
            <li>📍 Easy issue reporting with GPS location</li>
            <li>📸 Photo documentation for clear communication</li>
            <li>🔔 Real-time updates on your reports</li>
            <li>📊 Track city-wide improvement statistics</li>
            <li>🤝 Connect citizens with local authorities</li>
            <li>🏛️ Collaboration with municipalities nationwide</li>
        </ul>
        
        <p>Making our city better together, one report at a time.</p>
    `,

    reports: `
        <h2>City Reports Dashboard</h2>
        <p>Explore real-time reports from citizens across the country. See what issues 
        are being addressed and track the progress of community improvements.</p>
        
        <h3>Report Categories:</h3>
        <ul>
            <li>🚧 Road & Infrastructure Issues</li>
            <li>💡 Street Lighting Problems</li>
            <li>🚰 Water & Sewer Issues</li>
            <li>🗑️ Waste Management & Cleaning</li>
            <li>🌳 Parks & Public Gardens</li>
            <li>🚦 Traffic & Parking</li>
            <li>🏢 Public Buildings</li>
            <li>⚠️ Public Safety Concerns</li>
            <li>🚌 Public Transportation</li>
            <li>🏫 Educational Institutions</li>
            <li>🏥 Healthcare Facilities</li>
            <li>🎯 Municipal Services</li>
        </ul>
        
        <h3>Report Status:</h3>
        <ul>
            <li><span style="color: #f59e0b;">🟡 Pending Review</span> - Recently submitted</li>
            <li><span style="color: #3b82f6;">🔵 In Progress</span> - Being addressed by municipality</li>
            <li><span style="color: #10b981;">🟢 Completed</span> - Issue resolved</li>
            <li><span style="color: #ef4444;">🔴 Rejected</span> - Cannot be processed</li>
        </ul>
        
        <h3>Response Times:</h3>
        <ul>
            <li>🚨 Emergency Issues: Within 2 hours</li>
            <li>⚡ High Priority: 24-48 hours</li>
            <li>📋 Standard Issues: 3-7 business days</li>
            <li>📅 Long-term Projects: 2-4 weeks</li>
        </ul>
    `,

    submitReport: `
        <h2>Submit a New Report</h2>
        <p>Found an issue in your neighborhood? Help make your city better by reporting it!</p>
        
        <h3>How to Submit a Report:</h3>
        <ol>
            <li><strong>Choose Category:</strong> Select the type of issue you're reporting</li>
            <li><strong>Add Location:</strong> Use GPS or manually enter the address</li>
            <li><strong>Describe the Issue:</strong> Provide clear details about the problem</li>
            <li><strong>Upload Photos:</strong> Add images to help authorities understand</li>
            <li><strong>Contact Info:</strong> Add your details for updates (optional)</li>
            <li><strong>Submit:</strong> Send your report to the municipality</li>
        </ol>
        
        <h3>Reporting Tips:</h3>
        <ul>
            <li>📝 Be specific and detailed in your description</li>
            <li>📷 Include clear, well-lit photos</li>
            <li>📍 Double-check the location accuracy</li>
            <li>🔄 Check if the issue hasn't been reported already</li>
            <li>📞 For emergencies, call emergency services: 100, 101, 102</li>
        </ul>
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <strong>⚠️ Emergency Notice:</strong><br>
            For urgent safety issues, fires, or medical emergencies, 
            please call emergency services immediately: Police 100, Fire 102, Medical 101.
        </div>
    `,

    aboutUs: `
        <h2>About CityFix</h2>
        <p>CityFix is a citizen-powered platform designed to bridge the gap between 
        communities and local government. Founded in 2022, we believe every citizen 
        has the power to make their city better.</p>
        
        <h3>Our Mission</h3>
        <p>To empower citizens with the tools they need to report, track, and resolve 
        infrastructure issues in their communities, creating more responsive and 
        accountable local governance.</p>
        
        <h3>Our Impact</h3>
        <ul>
            <li>📈 75,000+ issues reported and resolved</li>
            <li>🏙️ Active in 45+ municipalities nationwide</li>
            <li>👥 150,000+ registered citizens</li>
            <li>⭐ 94% user satisfaction rate</li>
            <li>⚡ Average response time: 36 hours</li>
            <li>🏆 Partnership with Ministry of Interior</li>
            <li>📱 Available in Hebrew, Arabic, and English</li>
        </ul>
    `,

    contact: `
        <h2>Contact CityFix</h2>
        <p>We'd love to hear from you! Whether you have questions, feedback, 
        or need technical support, our team is here to help.</p>
        
        <h3>📞 Contact Information</h3>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 15px 0;">
            <p><strong>🏢 Main Office:</strong><br>
            CityFix Solutions Ltd.<br>
            HaTachana Building, Floor 3<br>
            Tel Aviv-Yafo, 6818211</p>
            
            <p><strong>📧 Email:</strong><br>
            General: info@cityfix.co.il<br>
            Support: support@cityfix.co.il<br>
            Media: media@cityfix.co.il</p>
            
            <p><strong>📱 Phone:</strong><br>
            Main: 03-1234567<br>
            Support: 1-700-CITYFIX</p>
        </div>
        
        <h3>🕒 Business Hours</h3>
        <ul>
            <li>Sunday - Thursday: 8:00 AM - 6:00 PM</li>
            <li>Friday: 8:00 AM - 1:00 PM</li>
            <li>Saturday: Closed</li>
        </ul>
    `,

    privacyPolicy: `
        <h2>Privacy Policy</h2>
        <p><em>Last updated: January 2025</em></p>
        
        <p>At CityFix, we take your privacy seriously. This Privacy Policy explains 
        how we collect, use, disclose, and safeguard your information when you use our platform.</p>
        
        <h3>📋 Information We Collect</h3>
        <ul>
            <li>Personal information (name, email, phone)</li>
            <li>Report information (descriptions, locations, photos)</li>
            <li>Technical information (device type, IP address)</li>
        </ul>
        
        <h3>🔒 How We Use Your Information</h3>
        <ul>
            <li>Process and route reports to municipalities</li>
            <li>Send updates about your reports</li>
            <li>Improve our platform</li>
            <li>Ensure safety and prevent fraud</li>
        </ul>
        
        <h3>🛡️ Data Security</h3>
        <ul>
            <li>🔐 Advanced encryption for sensitive data</li>
            <li>🔄 Regular security audits</li>
            <li>🏢 Secure data centers</li>
            <li>👥 Strict access controls</li>
        </ul>
        
        <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <strong>📧 Contact Our Privacy Team:</strong><br>
            privacy@cityfix.co.il | 03-1234567 ext. 101
        </div>
    `
};

// Create popup function
function createPopup() {
    const existingPopup = document.getElementById('cityfix-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = 'cityfix-popup';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(5px);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
        animation: fadeIn 0.3s ease-out;
    `;

    const popup = document.createElement('div');
    popup.style.cssText = `
        background: white;
        width: 90%;
        max-width: 800px;
        max-height: 85vh;
        border-radius: 16px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        position: relative;
        overflow: hidden;
        animation: slideIn 0.4s ease-out;
        font-family: 'Poppins', sans-serif;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
        background: linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%);
        color: white;
        padding: 20px 25px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;

    const title = document.createElement('h2');
    title.textContent = 'CityFix';
    title.style.cssText = `margin: 0; font-size: 24px; font-weight: 700;`;

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        font-size: 24px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        font-weight: bold;
    `;

    closeBtn.addEventListener('click', closePopup);
    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.background = 'rgba(255, 255, 255, 0.3)';
        closeBtn.style.transform = 'scale(1.1)';
    });
    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        closeBtn.style.transform = 'scale(1)';
    });

    header.appendChild(title);
    header.appendChild(closeBtn);

    const contentArea = document.createElement('div');
    contentArea.id = 'popup-content';
    contentArea.style.cssText = `
        padding: 30px;
        overflow-y: auto;
        max-height: calc(85vh - 80px);
        line-height: 1.6;
        color: #333;
    `;

    popup.appendChild(header);
    popup.appendChild(contentArea);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closePopup();
        }
    });

    document.addEventListener('keydown', handleEscKey);
    document.body.style.overflow = 'hidden';

    return contentArea;
}

function closePopup() {
    const popup = document.getElementById('cityfix-popup');
    if (popup) {
        popup.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            popup.remove();
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleEscKey);
        }, 300);
    }
}

function handleEscKey(e) {
    if (e.key === 'Escape') {
        closePopup();
    }
}

function showContent(section) {
    const contentArea = createPopup();
    const content = footerContent[section];
    
    if (content) {
        contentArea.innerHTML = content;
    } else {
        contentArea.innerHTML = `
            <h2>Section Not Found</h2>
            <p>Sorry, the content for "${section}" is not available.</p>
        `;
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    @keyframes slideIn {
        from { 
            transform: scale(0.9) translateY(-20px);
            opacity: 0;
        }
        to { 
            transform: scale(1) translateY(0);
            opacity: 1;
        }
    }
    
    #popup-content h2 {
        color: #2563EB;
        border-bottom: 3px solid #2563EB;
        padding-bottom: 10px;
        margin-bottom: 20px;
    }
    
    #popup-content h3 {
        color: #1e293b;
        margin: 25px 0 15px 0;
    }
    
    #popup-content ul, #popup-content ol {
        margin: 15px 0;
        padding-left: 25px;
    }
    
    #popup-content li {
        margin: 8px 0;
    }
    
    #popup-content p {
        margin: 15px 0;
    }
`;
document.head.appendChild(style);

// Auto-bind footer links
document.addEventListener('DOMContentLoaded', function() {
    const homeLink = document.querySelector('a[href*="home"], a[href="#home"]');
    const reportsLink = document.querySelector('a[href*="reports"], a[href="#reports"]');
    const submitLink = document.querySelector('a[href*="submit"], a[href="#submit"]');
    const aboutLink = document.querySelector('a[href*="about"], a[href="#about"]');
    const contactLink = document.querySelector('a[href*="contact"], a[href="#contact"]');
    const privacyLink = document.querySelector('a[href*="privacy"], a[href="#privacy"]');
    
    if (homeLink) homeLink.addEventListener('click', (e) => { e.preventDefault(); showContent('home'); });
    if (reportsLink) reportsLink.addEventListener('click', (e) => { e.preventDefault(); showContent('reports'); });
    if (submitLink) submitLink.addEventListener('click', (e) => { e.preventDefault(); showContent('submitReport'); });
    if (aboutLink) aboutLink.addEventListener('click', (e) => { e.preventDefault(); showContent('aboutUs'); });
    if (contactLink) contactLink.addEventListener('click', (e) => { e.preventDefault(); showContent('contact'); });
    if (privacyLink) privacyLink.addEventListener('click', (e) => { e.preventDefault(); showContent('privacyPolicy'); });
});

// Direct functions for testing
function showHome() { showContent('home'); }
function showReports() { showContent('reports'); }
function showSubmitReport() { showContent('submitReport'); }
function showAboutUs() { showContent('aboutUs'); }
function showContact() { showContent('contact'); }
function showPrivacyPolicy() { showContent('privacyPolicy'); }

// Success message
console.log('✅ CityFix Popup System Ready!');
console.log('🚀 Test functions: showHome(), showAboutUs(), showContact(), etc.');