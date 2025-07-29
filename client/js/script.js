// CityFix Simple Navigation System
// File: homepage.js  

console.log('🏙️ CityFix Loading...');

// Wait for page to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Page loaded - Starting navigation setup');
    
    // Find all navigation items (both desktop and mobile)
    const navItems = document.querySelectorAll('.nav-item');
    console.log(`Found ${navItems.length} navigation items`);
    
    navItems.forEach((item, index) => {
        console.log(`Setting up nav item ${index}: "${item.textContent.trim()}"`);
        
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            const text = this.textContent.trim();
            console.log(`🔗 Clicked: "${text}"`);
            
            // Simple navigation logic
            if (text === 'Home') {
                console.log('→ Going to index.html');
                window.location.href = 'index.html';
            }
            else if (text === 'Reports') {
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
                console.log('→ Showing My Impact not found');
                showPageNotFoundModal('My Impact', 'The My Impact page is not available yet. This feature is currently under development.');
            }
            else if (text === 'Contact') {
                console.log('→ Showing Contact modal');
                showComingSoonModal('Contact', 'Contact page is coming soon! For now, you can reach us through the feedback options in your profile.');
            }
            else {
                console.log('→ Unknown navigation item');
            }
        });
    });
    
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
    
    // Setup hero button
    const heroBtn = document.querySelector('.hero-button');
    if (heroBtn) {
        console.log('Found hero button');
        heroBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🚀 Hero button clicked → Going to SubmitReport.html');
            window.location.href = 'SubmitReport.html';
        });
    }
    
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
    
    console.log('✅ Navigation setup complete!');
});

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
            ">Got it!</button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function showPageNotFoundModal(pageName, description) {
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
    `;
    
    modalContent.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
        <h2 style="color: #EF4444; margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">Page Not Found</h2>
        <h3 style="color: #1E40AF; margin: 0 0 12px 0; font-size: 18px; font-weight: 500;">${pageName}</h3>
        <p style="color: #6B7280; margin: 0 0 24px 0; line-height: 1.6; font-size: 16px;">${description}</p>
        <div style="display: flex; gap: 12px; justify-content: center;">
            <button onclick="window.location.href='index.html'" style="
                background: #3B82F6;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
            ">🏠 Go Home</button>
            <button onclick="closeModal()" style="
                background: #F3F4F6;
                color: #6B7280;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
            ">Close</button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function closeModal() {
    const modal = document.querySelector('.custom-modal');
    if (modal) {
        modal.remove();
    }
}

console.log('📄 CityFix Navigation Script Loaded');