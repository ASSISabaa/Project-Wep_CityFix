// CityFix Homepage Complete Frontend System
// File: homepage.js
// Complete navigation system with all pages and functionality

console.log('🏙️ CityFix Complete System Loading...');

// ==============================================
// GLOBAL CONFIGURATION & STATE MANAGEMENT
// ==============================================

const CityFixApp = {
    currentPage: 'home',
    user: {
        isLoggedIn: false,
        username: '',
        email: '',
        reports: 0,
        impact: 0
    },
    navigation: {
        pages: ['home', 'reports', 'submit', 'browse', 'insights', 'dashboard', 'login', 'signup'],
        history: []
    },
    data: {
        reports: [],
        insights: {},
        dashboard: {},
        filters: {
            startDate: '',
            endDate: '',
            district: '',
            issueTypes: ['potholes', 'lighting', 'drainage']
        }
    }
};

// ==============================================
// PAGE DEFINITIONS & CONTENT
// ==============================================

const PageTemplates = {
    // Home Page (الصفحة الرئيسية)
    home: `
        <div class="page-container home-page">
            <!-- Hero Section -->
            <section class="hero-section">
                <div class="hero-container">
                    <div class="hero-content">
                        <h1 class="hero-title">Report City Issues, Make a Difference</h1>
                        <p class="hero-description">Join thousands of citizens making our city better by reporting issues and tracking progress in real-time.</p>
                        <a href="#" class="hero-button" onclick="navigateTo('submit')">Report Now</a>
                    </div>
                    <div class="hero-image-container">
                        <div class="hero-image" style="background: linear-gradient(135deg, #3B82F6, #1E40AF); display: flex; align-items: center; justify-content: center; color: white; font-size: 24px;">🏙️ City View</div>
                    </div>
                </div>
            </section>

            <!-- Stats Section -->
            <section class="stats-section">
                <div class="stats-container">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <div class="stat-icon-image" style="background: #3B82F6; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">📊</div>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number">15,234</div>
                            <div class="stat-label">Total Reports</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <div class="stat-icon-image" style="background: #10B981; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">✅</div>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number">12,847</div>
                            <div class="stat-label">Issues Resolved</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <div class="stat-icon-image" style="background: #F59E0B; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">⏳</div>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number">2,387</div>
                            <div class="stat-label">In Progress</div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Main Content Area -->
            <div class="main-content-area">
                <!-- Filters Section -->
                <aside class="filters-section">
                    <div class="filters-header">
                        <h3 class="filters-title">🔍 Filters</h3>
                    </div>
                    <div class="filter-group">
                        <label class="filter-label">Date Range</label>
                        <div class="date-inputs">
                            <input type="text" class="date-input" placeholder="Start Date (mm/dd/yyyy)" maxlength="10">
                            <input type="text" class="date-input" placeholder="End Date (mm/dd/yyyy)" maxlength="10">
                        </div>
                    </div>
                    <div class="filter-group">
                        <label class="filter-label">District</label>
                        <select class="district-select">
                            <option value="">All Districts</option>
                            <option value="downtown">Downtown</option>
                            <option value="north">North District</option>
                            <option value="south">South District</option>
                            <option value="east">East District</option>
                            <option value="west">West District</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label class="filter-label">Issue Type</label>
                        <div class="checkbox-group">
                            <div class="checkbox-item">
                                <input type="checkbox" id="potholes" name="issue-type" value="potholes" checked>
                                <label for="potholes" class="checkbox-label">
                                    <span class="checkbox-icon"></span>
                                    Potholes
                                </label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="lighting" name="issue-type" value="lighting" checked>
                                <label for="lighting" class="checkbox-label">
                                    <span class="checkbox-icon"></span>
                                    Street Lighting
                                </label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="drainage" name="issue-type" value="drainage" checked>
                                <label for="drainage" class="checkbox-label">
                                    <span class="checkbox-icon"></span>
                                    Drainage Issues
                                </label>
                            </div>
                        </div>
                    </div>
                </aside>

                <!-- Map Section -->
                <main class="map-section">
                    <div class="map-card">
                        <div class="map-header">
                            <h3 class="map-title">🗺️ Issue Density Map</h3>
                        </div>
                        <div class="map-stats-container">
                            <div class="map-stat-card">
                                <div class="map-stat-header">
                                    <span class="map-stat-icon">🏢</span>
                                    <h4 class="map-stat-title">Active District</h4>
                                </div>
                                <div class="map-stat-content">
                                    <div class="resolution-percentage">Downtown</div>
                                </div>
                            </div>
                            <div class="map-stat-card">
                                <div class="map-stat-header">
                                    <span class="map-stat-icon">🔥</span>
                                    <h4 class="map-stat-title">Top Issue</h4>
                                </div>
                                <div class="map-stat-content">
                                    <div class="resolution-percentage">Potholes</div>
                                </div>
                            </div>
                            <div class="map-stat-card">
                                <div class="map-stat-header">
                                    <span class="map-stat-icon">📈</span>
                                    <h4 class="map-stat-title">Resolution Rate</h4>
                                </div>
                                <div class="map-stat-content">
                                    <div class="resolution-percentage">84%</div>
                                </div>
                            </div>
                            <div class="map-stat-card">
                                <div class="map-stat-header">
                                    <span class="map-stat-icon">📊</span>
                                    <h4 class="map-stat-title">Weekly Trend</h4>
                                </div>
                                <div class="map-stat-content">
                                    <div class="resolution-percentage">↗️ +12%</div>
                                </div>
                            </div>
                        </div>
                        <div class="map-container">
                            <div class="density-map" style="background: linear-gradient(135deg, #EFF6FF, #DBEAFE); display: flex; align-items: center; justify-content: center; color: #1E40AF; font-size: 18px; border-radius: 12px;">
                                🗺️ Interactive City Map<br><small>Click areas to view details</small>
                            </div>
                        </div>
                        <div class="map-actions">
                            <button class="share-report-btn">
                                📤 Share Report
                            </button>
                            <button class="export-pdf-btn">
                                📄 Export PDF
                            </button>
                        </div>
                    </div>
                </main>
            </div>

            <!-- Common Issues Section -->
            <section class="common-issues-section">
                <h2 class="common-issues-title">Most Common Issues Reported</h2>
                <div class="issues-container">
                    <div class="issue-card pothole-card">
                        <div class="issue-icon-container">
                            <div class="issue-icon" style="background: rgba(59, 130, 246, 0.1); display: flex; align-items: center; justify-content: center; font-size: 40px;">🕳️</div>
                        </div>
                        <h3 class="issue-title">Potholes</h3>
                        <p class="issue-description">Road surface damage affecting vehicle safety and comfort</p>
                    </div>
                    <div class="issue-card lighting-card">
                        <div class="issue-icon-container">
                            <div class="issue-icon" style="background: rgba(245, 158, 11, 0.1); display: flex; align-items: center; justify-content: center; font-size: 40px;">💡</div>
                        </div>
                        <h3 class="issue-title">Street Lighting</h3>
                        <p class="issue-description">Broken or dim street lights compromising safety at night</p>
                    </div>
                    <div class="issue-card drainage-card">
                        <div class="issue-icon-container">
                            <div class="issue-icon" style="background: rgba(16, 185, 129, 0.1); display: flex; align-items: center; justify-content: center; font-size: 40px;">🌊</div>
                        </div>
                        <h3 class="issue-title">Drainage Issues</h3>
                        <p class="issue-description">Poor water drainage causing flooding and damage</p>
                    </div>
                </div>
            </section>
        </div>
    `,

    // Submit a Report Page
    submit: `
        <div class="page-container submit-page">
            <div class="submit-header">
                <h1 class="page-title">Submit a Report</h1>
                <p class="page-description">Help improve our community by reporting local issues</p>
            </div>
            
            <div class="submit-content">
                <form class="report-form" id="submitReportForm">
                    <div class="form-section">
                        <h3 class="section-title">📍 Location Information</h3>
                        <div class="form-group">
                            <label class="form-label">Street Address *</label>
                            <input type="text" class="form-input" id="reportAddress" required placeholder="Enter the street address">
                        </div>
                        <div class="form-group">
                            <label class="form-label">District</label>
                            <select class="form-select" id="reportDistrict">
                                <option value="">Select District</option>
                                <option value="downtown">Downtown</option>
                                <option value="north">North District</option>
                                <option value="south">South District</option>
                                <option value="east">East District</option>
                                <option value="west">West District</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-section">
                        <h3 class="section-title">🔧 Issue Details</h3>
                        <div class="form-group">
                            <label class="form-label">Issue Type *</label>
                            <select class="form-select" id="reportIssueType" required>
                                <option value="">Select Issue Type</option>
                                <option value="potholes">Potholes</option>
                                <option value="lighting">Street Lighting</option>
                                <option value="drainage">Drainage Issues</option>
                                <option value="traffic">Traffic Signals</option>
                                <option value="sidewalk">Sidewalk Issues</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Priority Level</label>
                            <select class="form-select" id="reportPriority">
                                <option value="low">Low - Not urgent</option>
                                <option value="medium" selected>Medium - Needs attention</option>
                                <option value="high">High - Safety concern</option>
                                <option value="critical">Critical - Immediate danger</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Description *</label>
                            <textarea class="form-textarea" id="reportDescription" required placeholder="Please describe the issue in detail..." rows="4"></textarea>
                        </div>
                    </div>

                    <div class="form-section">
                        <h3 class="section-title">📸 Additional Information</h3>
                        <div class="form-group">
                            <label class="form-label">Photo Upload</label>
                            <div class="file-upload-area" onclick="document.getElementById('photoUpload').click()">
                                <div class="upload-icon">📷</div>
                                <div class="upload-text">Click to upload photos</div>
                                <div class="upload-hint">Supports JPG, PNG files</div>
                            </div>
                            <input type="file" id="photoUpload" accept="image/*" multiple style="display: none;">
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="navigateTo('home')">Cancel</button>
                        <button type="submit" class="btn-primary">
                            <span class="btn-icon">📤</span>
                            Submit Report
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `,

    // Browse Reports Page
    browse: `
        <div class="page-container browse-page">
            <div class="browse-header">
                <h1 class="page-title">Browse Reports</h1>
                <div class="browse-actions">
                    <button class="btn-filter" onclick="toggleBrowseFilters()">🔽 Filters</button>
                    <button class="btn-sort" onclick="toggleSortMenu()">📊 Sort</button>
                </div>
            </div>

            <div class="browse-filters" id="browseFilters" style="display: none;">
                <div class="filter-row">
                    <select class="form-select" id="browseDistrict">
                        <option value="">All Districts</option>
                        <option value="downtown">Downtown</option>
                        <option value="north">North District</option>
                        <option value="south">South District</option>
                    </select>
                    <select class="form-select" id="browseStatus">
                        <option value="">All Status</option>
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                    </select>
                    <select class="form-select" id="browseIssueType">
                        <option value="">All Types</option>
                        <option value="potholes">Potholes</option>
                        <option value="lighting">Street Lighting</option>
                        <option value="drainage">Drainage</option>
                    </select>
                </div>
            </div>

            <div class="reports-grid" id="reportsGrid">
                ${generateSampleReports()}
            </div>

            <div class="pagination">
                <button class="page-btn" onclick="changePage('prev')">← Previous</button>
                <span class="page-info">Page 1 of 45</span>
                <button class="page-btn" onclick="changePage('next')">Next →</button>
            </div>
        </div>
    `,

    // City Insights Page (New!)
    insights: `
        <div class="page-container insights-page">
            <div class="insights-header">
                <h1 class="page-title">🏙️ City Insights</h1>
                <p class="page-description">Data-driven insights about your community</p>
                <div class="coming-soon-badge">Coming Soon!</div>
            </div>

            <div class="insights-content">
                <div class="insights-preview">
                    <div class="preview-card">
                        <div class="preview-icon">📊</div>
                        <h3>Analytics Dashboard</h3>
                        <p>Comprehensive data analysis and trends</p>
                    </div>
                    <div class="preview-card">
                        <div class="preview-icon">🎯</div>
                        <h3>Performance Metrics</h3>
                        <p>Track resolution times and efficiency</p>
                    </div>
                    <div class="preview-card">
                        <div class="preview-icon">🔮</div>
                        <h3>Predictive Insights</h3>
                        <p>AI-powered predictions for better planning</p>
                    </div>
                    <div class="preview-card">
                        <div class="preview-icon">📈</div>
                        <h3>Trend Analysis</h3>
                        <p>Identify patterns and seasonal trends</p>
                    </div>
                </div>

                <div class="insights-demo">
                    <h3>Preview: Analytics Dashboard</h3>
                    <div class="demo-chart" style="background: linear-gradient(135deg, #EFF6FF, #DBEAFE); border-radius: 12px; padding: 40px; text-align: center;">
                        <div style="font-size: 24px; color: #1E40AF; margin-bottom: 20px;">📊 Live Data Visualization</div>
                        <div style="display: flex; justify-content: space-around; margin-top: 30px;">
                            <div style="text-align: center;">
                                <div style="font-size: 32px; font-weight: bold; color: #3B82F6;">84%</div>
                                <div style="color: #6B7280;">Resolution Rate</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 32px; font-weight: bold; color: #10B981;">4.2</div>
                                <div style="color: #6B7280;">Avg Days</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 32px; font-weight: bold; color: #F59E0B;">2.3K</div>
                                <div style="color: #6B7280;">This Month</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="notify-section">
                    <h3>Get Notified When Available</h3>
                    <div class="notify-form">
                        <input type="email" class="form-input" placeholder="Enter your email" id="notifyEmail">
                        <button class="btn-primary" onclick="addToNotifyList()">Notify Me</button>
                    </div>
                </div>
            </div>
        </div>
    `,

    // Dashboard Page (Admin/User Dashboard)
    dashboard: `
        <div class="page-container dashboard-page">
            <div class="dashboard-header">
                <h1 class="page-title">📊 Dashboard</h1>
                <div class="dashboard-stats">
                    <div class="quick-stat">
                        <span class="stat-value">47</span>
                        <span class="stat-label">Your Reports</span>
                    </div>
                    <div class="quick-stat">
                        <span class="stat-value">32</span>
                        <span class="stat-label">Resolved</span>
                    </div>
                    <div class="quick-stat">
                        <span class="stat-value">856</span>
                        <span class="stat-label">Impact Points</span>
                    </div>
                </div>
            </div>

            <div class="dashboard-content">
                <div class="dashboard-section">
                    <h3>🎯 Your Impact Overview</h3>
                    <div class="impact-cards">
                        <div class="impact-card">
                            <div class="impact-icon">🏆</div>
                            <div class="impact-info">
                                <h4>Community Champion</h4>
                                <p>Top 10% contributor this month</p>
                            </div>
                        </div>
                        <div class="impact-card">
                            <div class="impact-icon">⚡</div>
                            <div class="impact-info">
                                <h4>Quick Reporter</h4>
                                <p>Average response time: 2.3 days</p>
                            </div>
                        </div>
                        <div class="impact-card">
                            <div class="impact-icon">🌟</div>
                            <div class="impact-info">
                                <h4>Quality Reports</h4>
                                <p>95% acceptance rate</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="dashboard-section">
                    <h3>📋 Recent Activity</h3>
                    <div class="activity-list">
                        ${generateUserActivity()}
                    </div>
                </div>

                <div class="dashboard-section">
                    <h3>📈 Analytics Preview</h3>
                    <div class="analytics-preview">
                        <div class="chart-placeholder" style="background: linear-gradient(135deg, #F3F4F6, #E5E7EB); border-radius: 12px; padding: 40px; text-align: center;">
                            <div style="font-size: 20px; color: #6B7280;">📊 Personal Analytics</div>
                            <p style="color: #9CA3AF; margin-top: 10px;">Track your reporting trends and impact</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,

    // Reports Page (Detailed Reports View)
    reports: `
        <div class="page-container reports-page">
            <div class="reports-header">
                <h1 class="page-title">📋 Reports Management</h1>
                <div class="reports-actions">
                    <button class="btn-primary" onclick="navigateTo('submit')">+ New Report</button>
                    <button class="btn-secondary" onclick="exportAllReports()">📤 Export All</button>
                </div>
            </div>

            <div class="reports-tabs">
                <button class="tab-btn active" onclick="switchReportsTab('all')">All Reports</button>
                <button class="tab-btn" onclick="switchReportsTab('my')">My Reports</button>
                <button class="tab-btn" onclick="switchReportsTab('following')">Following</button>
            </div>

            <div class="reports-content" id="reportsContent">
                <div class="reports-table">
                    <div class="table-header">
                        <div class="table-cell">ID</div>
                        <div class="table-cell">Type</div>
                        <div class="table-cell">Location</div>
                        <div class="table-cell">Status</div>
                        <div class="table-cell">Date</div>
                        <div class="table-cell">Actions</div>
                    </div>
                    ${generateReportsTable()}
                </div>
            </div>
        </div>
    `,

    // Login Page
    login: `
        <div class="page-container login-page">
            <div class="auth-container">
                <div class="auth-header">
                    <h1 class="auth-title">Welcome Back!</h1>
                    <p class="auth-description">Sign in to continue making a difference</p>
                </div>
                
                <form class="auth-form" id="loginForm">
                    <div class="form-group">
                        <label class="form-label">Email Address</label>
                        <input type="email" class="form-input" id="loginEmail" required placeholder="Enter your email">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <input type="password" class="form-input" id="loginPassword" required placeholder="Enter your password">
                    </div>
                    <div class="form-options">
                        <label class="checkbox-label">
                            <input type="checkbox" id="rememberMe">
                            <span class="checkbox-icon"></span>
                            Remember me
                        </label>
                        <a href="#" class="forgot-link">Forgot password?</a>
                    </div>
                    <button type="submit" class="btn-primary auth-btn">Sign In</button>
                </form>
                
                <div class="auth-footer">
                    <p>Don't have an account? <a href="#" onclick="navigateTo('signup')">Sign up</a></p>
                </div>
            </div>
        </div>
    `,

    // Signup Page
    signup: `
        <div class="page-container signup-page">
            <div class="auth-container">
                <div class="auth-header">
                    <h1 class="auth-title">Join CityFix</h1>
                    <p class="auth-description">Create an account to start reporting and making a difference</p>
                </div>
                
                <form class="auth-form" id="signupForm">
                    <div class="form-group">
                        <label class="form-label">Full Name</label>
                        <input type="text" class="form-input" id="signupName" required placeholder="Enter your full name">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email Address</label>
                        <input type="email" class="form-input" id="signupEmail" required placeholder="Enter your email">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <input type="password" class="form-input" id="signupPassword" required placeholder="Create a password">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Confirm Password</label>
                        <input type="password" class="form-input" id="confirmPassword" required placeholder="Confirm your password">
                    </div>
                    <div class="form-options">
                        <label class="checkbox-label">
                            <input type="checkbox" id="agreeTerms" required>
                            <span class="checkbox-icon"></span>
                            I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
                        </label>
                    </div>
                    <button type="submit" class="btn-primary auth-btn">Create Account</button>
                </form>
                
                <div class="auth-footer">
                    <p>Already have an account? <a href="#" onclick="navigateTo('login')">Sign in</a></p>
                </div>
            </div>
        </div>
    `
};

// ==============================================
// NAVIGATION SYSTEM
// ==============================================

function navigateTo(pageName, addToHistory = true) {
    console.log(`🧭 Navigating to: ${pageName}`);
    
    if (!PageTemplates[pageName]) {
        console.error(`❌ Page not found: ${pageName}`);
        showNotification('Page not found', 'error');
        return;
    }

    // Add to history
    if (addToHistory && CityFixApp.currentPage !== pageName) {
        CityFixApp.navigation.history.push(CityFixApp.currentPage);
    }

    // Update current page
    const previousPage = CityFixApp.currentPage;
    CityFixApp.currentPage = pageName;

    // Update page content
    updatePageContent(pageName);
    
    // Update navigation highlighting
    updateNavigationHighlight(pageName);
    
    // Update URL without page refresh
    updateURL(pageName);
    
    // Initialize page-specific functionality
    initializePage(pageName);
    
    // Close mobile menu if open
    closeMobileMenu();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    console.log(`✅ Navigation complete: ${previousPage} → ${pageName}`);
}

function updatePageContent(pageName) {
    const pageContent = document.querySelector('.page-content');
    if (!pageContent) {
        console.error('❌ Page content container not found');
        return;
    }

    // Add loading animation
    pageContent.style.opacity = '0.5';
    
    setTimeout(() => {
        pageContent.innerHTML = PageTemplates[pageName];
        pageContent.style.opacity = '1';
        
        // Re-initialize common components for new page
        initializeCommonComponents();
    }, 150);
}

function updateNavigationHighlight(pageName) {
    // Update desktop navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === `#${pageName}` || 
            item.textContent.toLowerCase().includes(pageName.toLowerCase())) {
            item.classList.add('active');
        }
    });

    // Update mobile navigation
    const mobileNavItems = document.querySelectorAll('.mobile-nav .nav-item');
    mobileNavItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === `#${pageName}`) {
            item.classList.add('active');
        }
    });
}

function updateURL(pageName) {
    const newURL = `${window.location.origin}${window.location.pathname}#${pageName}`;
    history.pushState({ page: pageName }, `CityFix - ${pageName}`, newURL);
}

function goBack() {
    if (CityFixApp.navigation.history.length > 0) {
        const previousPage = CityFixApp.navigation.history.pop();
        navigateTo(previousPage, false);
    } else {
        navigateTo('home', false);
    }
}

// ==============================================
// PAGE-SPECIFIC INITIALIZATION
// ==============================================

function initializePage(pageName) {
    console.log(`🔧 Initializing page: ${pageName}`);
    
    switch (pageName) {
        case 'home':
            initializeHomePage();
            break;
        case 'submit':
            initializeSubmitPage();
            break;
        case 'browse':
            initializeBrowsePage();
            break;
        case 'insights':
            initializeInsightsPage();
            break;
        case 'dashboard':
            initializeDashboardPage();
            break;
        case 'reports':
            initializeReportsPage();
            break;
        case 'login':
            initializeLoginPage();
            break;
        case 'signup':
            initializeSignupPage();
            break;
        default:
            console.log(`ℹ️ No specific initialization for: ${pageName}`);
    }
}

function initializeHomePage() {
    // Initialize filters and map functionality
    setupDateValidation();
    setupFilters();
    setupMapInteractions();
    animateCounters();
    
    console.log('🏠 Home page initialized');
}

function initializeSubmitPage() {
    const form = document.getElementById('submitReportForm');
    if (form) {
        form.addEventListener('submit', handleReportSubmission);
    }
    
    const photoUpload = document.getElementById('photoUpload');
    if (photoUpload) {
        photoUpload.addEventListener('change', handlePhotoUpload);
    }
    
    console.log('📝 Submit page initialized');
}

function initializeBrowsePage() {
    setupBrowseFilters();
    loadReports();
    
    console.log('🔍 Browse page initialized');
}

function initializeInsightsPage() {
    setupNotifyForm();
    
    console.log('🏙️ Insights page initialized (Coming Soon)');
}

function initializeDashboardPage() {
    loadUserDashboard();
    setupAnalytics();
    
    console.log('📊 Dashboard page initialized');
}

function initializeReportsPage() {
    setupReportsTable();
    setupReportsTabs();
    
    console.log('📋 Reports page initialized');
}

function initializeLoginPage() {
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', handleLogin);
    }
    
    console.log('🔐 Login page initialized');
}

function initializeSignupPage() {
    const form = document.getElementById('signupForm');
    if (form) {
        form.addEventListener('submit', handleSignup);
    }
    
    console.log('📝 Signup page initialized');
}

// ==============================================
// COMMON COMPONENTS INITIALIZATION
// ==============================================

function initializeCommonComponents() {
    // Re-initialize date validation if date inputs exist
    const dateInputs = document.querySelectorAll('.date-input');
    if (dateInputs.length > 0) {
        setupDateValidation();
    }

    // Re-initialize filters
    const filters = document.querySelector('.filters-section');
    if (filters) {
        setupFilters();
    }

    // Re-initialize issue cards
    const issueCards = document.querySelectorAll('.issue-card');
    if (issueCards.length > 0) {
        setupIssueCards();
    }

    // Re-initialize counters
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length > 0) {
        animateCounters();
    }
}

// ==============================================
// HELPER FUNCTIONS FOR CONTENT GENERATION
// ==============================================

function generateSampleReports() {
    const reports = [
        { id: 'R001', type: 'Pothole', location: 'Main St & 5th Ave', status: 'Open', date: '2025-01-25', priority: 'high' },
        { id: 'R002', type: 'Lighting', location: 'Park Avenue', status: 'In Progress', date: '2025-01-24', priority: 'medium' },
        { id: 'R003', type: 'Drainage', location: 'Oak Street', status: 'Resolved', date: '2025-01-23', priority: 'low' },
        { id: 'R004', type: 'Traffic', location: '1st Street', status: 'Open', date: '2025-01-22', priority: 'critical' }
    ];

    return reports.map(report => `
        <div class="report-card" data-status="${report.status.toLowerCase().replace(' ', '-')}">
            <div class="report-header">
                <span class="report-id">#${report.id}</span>
                <span class="report-status status-${report.status.toLowerCase().replace(' ', '-')}">${report.status}</span>
            </div>
            <div class="report-content">
                <h4 class="report-type">${report.type}</h4>
                <p class="report-location">📍 ${report.location}</p>
                <p class="report-date">📅 ${report.date}</p>
                <span class="priority-badge priority-${report.priority}">${report.priority.toUpperCase()}</span>
            </div>
            <div class="report-actions">
                <button class="btn-view" onclick="viewReportDetails('${report.id}')">View Details</button>
                <button class="btn-follow" onclick="followReport('${report.id}')">Follow</button>
            </div>
        </div>
    `).join('');
}

function generateReportsTable() {
    const reports = [
        { id: 'R001', type: 'Pothole', location: 'Main St & 5th Ave', status: 'Open', date: '2025-01-25' },
        { id: 'R002', type: 'Lighting', location: 'Park Avenue', status: 'In Progress', date: '2025-01-24' },
        { id: 'R003', type: 'Drainage', location: 'Oak Street', status: 'Resolved', date: '2025-01-23' }
    ];

    return reports.map(report => `
        <div class="table-row">
            <div class="table-cell">#${report.id}</div>
            <div class="table-cell">${report.type}</div>
            <div class="table-cell">${report.location}</div>
            <div class="table-cell">
                <span class="status-badge status-${report.status.toLowerCase().replace(' ', '-')}">${report.status}</span>
            </div>
            <div class="table-cell">${report.date}</div>
            <div class="table-cell">
                <button class="btn-sm" onclick="editReport('${report.id}')">Edit</button>
                <button class="btn-sm btn-danger" onclick="deleteReport('${report.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function generateUserActivity() {
    const activities = [
        { type: 'report', action: 'Submitted pothole report', location: 'Main Street', time: '2 hours ago' },
        { type: 'update', action: 'Report #R001 was updated', location: 'Downtown', time: '1 day ago' },
        { type: 'resolved', action: 'Your lighting report was resolved', location: 'Park Ave', time: '3 days ago' }
    ];

    return activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${activity.type}">
                ${activity.type === 'report' ? '📝' : activity.type === 'update' ? '🔄' : '✅'}
            </div>
            <div class="activity-content">
                <p class="activity-action">${activity.action}</p>
                <p class="activity-location">📍 ${activity.location}</p>
                <span class="activity-time">${activity.time}</span>
            </div>
        </div>
    `).join('');
}

// ==============================================
// FORM HANDLERS
// ==============================================

function handleReportSubmission(event) {
    event.preventDefault();
    
    const formData = {
        address: document.getElementById('reportAddress').value,
        district: document.getElementById('reportDistrict').value,
        issueType: document.getElementById('reportIssueType').value,
        priority: document.getElementById('reportPriority').value,
        description: document.getElementById('reportDescription').value
    };
    
    if (!formData.address || !formData.issueType || !formData.description) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalContent = submitBtn.innerHTML;
    submitBtn.innerHTML = '<div class="loading-spinner"></div>Submitting...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        // Simulate successful submission
        CityFixApp.user.reports++;
        
        showNotification('Report submitted successfully! Thank you for helping improve our community.', 'success');
        
        // Reset form
        event.target.reset();
        
        // Navigate to reports page
        setTimeout(() => {
            navigateTo('reports');
        }, 2000);
        
        submitBtn.innerHTML = originalContent;
        submitBtn.disabled = false;
    }, 2000);
}

function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalContent = submitBtn.innerHTML;
    submitBtn.innerHTML = '<div class="loading-spinner"></div>Signing In...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        // Simulate successful login
        CityFixApp.user.isLoggedIn = true;
        CityFixApp.user.username = email.split('@')[0];
        CityFixApp.user.email = email;
        
        showNotification('Welcome back! Login successful.', 'success');
        
        // Navigate to dashboard
        setTimeout(() => {
            navigateTo('dashboard');
            updateAuthUI();
        }, 1000);
        
        submitBtn.innerHTML = originalContent;
        submitBtn.disabled = false;
    }, 2000);
}

function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!name || !email || !password || !confirmPassword) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalContent = submitBtn.innerHTML;
    submitBtn.innerHTML = '<div class="loading-spinner"></div>Creating Account...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        // Simulate successful signup
        CityFixApp.user.isLoggedIn = true;
        CityFixApp.user.username = name;
        CityFixApp.user.email = email;
        
        showNotification('Account created successfully! Welcome to CityFix.', 'success');
        
        // Navigate to dashboard
        setTimeout(() => {
            navigateTo('dashboard');
            updateAuthUI();
        }, 1000);
        
        submitBtn.innerHTML = originalContent;
        submitBtn.disabled = false;
    }, 2000);
}

// ==============================================
// UI UPDATE FUNCTIONS
// ==============================================

function updateAuthUI() {
    const authSection = document.querySelector('.auth-section');
    if (!authSection) return;
    
    if (CityFixApp.user.isLoggedIn) {
        authSection.innerHTML = `
            <div class="user-menu">
                <span class="user-name">👋 ${CityFixApp.user.username}</span>
                <button class="btn-secondary" onclick="logout()">Logout</button>
            </div>
        `;
    } else {
        authSection.innerHTML = `
            <a href="#" class="login-btn" onclick="navigateTo('login')">Login</a>
            <a href="#" class="signup-btn" onclick="navigateTo('signup')">Sign Up</a>
        `;
    }
}

function logout() {
    CityFixApp.user.isLoggedIn = false;
    CityFixApp.user.username = '';
    CityFixApp.user.email = '';
    
    showNotification('Logged out successfully', 'success');
    navigateTo('home');
    updateAuthUI();
}

// ==============================================
// ADDITIONAL FUNCTIONALITY
// ==============================================

function setupDateValidation() {
    const dateInputs = document.querySelectorAll('.date-input');
    dateInputs.forEach((input, index) => {
        input.addEventListener('input', function() {
            formatDateInput(this);
            validateDateInput(this);
        });
    });
}

function setupFilters() {
    const filterElements = document.querySelectorAll('.district-select, input[name="issue-type"]');
    filterElements.forEach(element => {
        element.addEventListener('change', applyFilters);
    });
}

function setupIssueCards() {
    const issueCards = document.querySelectorAll('.issue-card');
    issueCards.forEach(card => {
        card.addEventListener('click', function() {
            const issueType = this.classList[1].replace('-card', '');
            navigateTo('submit');
            // Pre-fill the form with the selected issue type
            setTimeout(() => {
                const issueTypeSelect = document.getElementById('reportIssueType');
                if (issueTypeSelect) {
                    issueTypeSelect.value = issueType;
                }
            }, 200);
        });
    });
}

function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    counters.forEach(counter => {
        const target = parseInt(counter.textContent.replace(/[^\d]/g, ''));
        animateCounter(counter, target);
    });
}

function animateCounter(element, target) {
    let current = 0;
    const increment = target / 100;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current).toLocaleString();
    }, 20);
}

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification-toast ${type}`;
    
    const icons = {
        'success': '✅',
        'error': '❌',
        'info': 'ℹ️',
        'warning': '⚠️'
    };
    
    notification.innerHTML = `
        <span class="notification-icon">${icons[type] || icons.info}</span>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        if (notification.parentElement) {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

function addToNotifyList() {
    const email = document.getElementById('notifyEmail').value;
    if (!email) {
        showNotification('Please enter your email address', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    showNotification('Great! We\'ll notify you when City Insights becomes available.', 'success');
    document.getElementById('notifyEmail').value = '';
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ==============================================
// MOBILE MENU FUNCTIONS
// ==============================================

function closeMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileNav = document.querySelector('.mobile-nav');
    
    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.classList.remove('active');
        mobileNav.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ==============================================
// INITIALIZATION AND EVENT LISTENERS
// ==============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 CityFix Homepage System Initializing...');
    
    // Initialize navigation system
    setupNavigation();
    
    // Load initial page based on URL hash
    const hash = window.location.hash.slice(1);
    const initialPage = hash && PageTemplates[hash] ? hash : 'home';
    navigateTo(initialPage, false);
    
    // Setup global event listeners
    setupGlobalEventListeners();
    
    // Initialize mobile menu
    initializeMobileMenuSystem();
    
    console.log('✅ CityFix Homepage System Ready!');
});

function setupNavigation() {
    // Setup desktop navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                const pageName = href.slice(1);
                if (PageTemplates[pageName]) {
                    navigateTo(pageName);
                }
            }
        });
    });
    
    // Setup mobile navigation
    const mobileNavItems = document.querySelectorAll('.mobile-nav .nav-item');
    mobileNavItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                const pageName = href.slice(1);
                if (PageTemplates[pageName]) {
                    navigateTo(pageName);
                }
            }
        });
    });
}

function setupGlobalEventListeners() {
    // Handle browser back/forward buttons
    window.addEventListener('popstate', function(event) {
        if (event.state && event.state.page) {
            navigateTo(event.state.page, false);
        }
    });
    
    // Handle keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'h':
                    e.preventDefault();
                    navigateTo('home');
                    break;
                case 'n':
                    e.preventDefault();
                    navigateTo('submit');
                    break;
                case 'b':
                    e.preventDefault();
                    navigateTo('browse');
                    break;
            }
        }
        
        if (e.key === 'Escape') {
            closeMobileMenu();
            // Close any open modals
            const modals = document.querySelectorAll('.modal-overlay');
            modals.forEach(modal => modal.classList.remove('active'));
        }
    });
}

function initializeMobileMenuSystem() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileNav = document.querySelector('.mobile-nav');
    
    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            mobileNav.classList.toggle('active');
            
            if (mobileNav.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
    }
}

// ==============================================
// EXPORT GLOBAL FUNCTIONS
// ==============================================

// Make functions globally accessible
window.navigateTo = navigateTo;
window.goBack = goBack;
window.showNotification = showNotification;
window.addToNotifyList = addToNotifyList;
window.CityFixApp = CityFixApp;

console.log('🎯 CityFix Homepage JavaScript Loaded Successfully!');
console.log('📱 Responsive navigation system active');
console.log('🔄 Page routing system ready');
console.log('⚡ All functionality initialized');