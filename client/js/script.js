// CityFix Universal Navigation System - Mobile Fixed
// File: script.js

console.log('🏙️ CityFix Universal Loading...');

document.addEventListener('DOMContentLoaded', function () {
  console.log('🚀 Page loaded - Starting universal navigation setup');

  setActiveNavItem();
  setupMobileMenu();
  setupNavigation();
  setupAuthButtons();
  setupInteractiveElements();
  setupResponsiveHeader();
  setupReportsLinks();

  console.log('✅ Universal navigation setup complete!');
});

/* ============================
   REPORTS LINKS (special case)
============================ */
function setupReportsLinks() {
  console.log('🔍 Setting up Reports links...');

  // Manual scan for anything that looks like "Reports"
  const allLinks = document.querySelectorAll('a, .nav-item, .mobile-nav-item');
  const reportsLinks = [];

  allLinks.forEach((link) => {
    const text = (link.textContent || '').trim().toLowerCase();
    const href = link.href || '';
    if (text === 'reports' || text === 'browse reports' || href.includes('BrowseReports')) {
      reportsLinks.push(link);
      console.log(`📋 Found Reports link: "${(link.textContent || '').trim()}" → ${href || 'No href'}`);
    }
  });

  console.log(`Found ${reportsLinks.length} Reports links total`);

  // Click behavior
  reportsLinks.forEach((link, index) => {
    link.addEventListener('click', function (e) {
      console.log(`📋 Reports link ${index + 1} clicked`);
      if (this.href && this.href.includes('BrowseReports')) {
        console.log(`✅ Using natural navigation to: ${this.href}`);
        return;
      }
      e.preventDefault();
      console.log('🚀 Force navigating to BrowseReports.html');
      window.location.href = 'BrowseReports.html';
    });
  });

  // Global fallback
  document.addEventListener('click', function (e) {
    const el = e.target;
    const text = (el.textContent || '').trim().toLowerCase();
    if (text === 'reports' && !el.href) {
      console.log('🎯 Global fallback: Reports clicked without href');
      e.preventDefault();
      window.location.href = 'BrowseReports.html';
    }
  });

  console.log('✅ Reports links setup complete');
}

/* ============================
   MOBILE MENU
============================ */
function setupMobileMenu() {
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  if (!mobileMenuBtn) return console.log('❌ Mobile menu button not found');

  console.log('Setting up mobile menu');

  let mobileNav = document.querySelector('.mobile-nav');
  if (!mobileNav) {
    console.log('Creating mobile nav...');
    mobileNav = document.createElement('div');
    mobileNav.className = 'mobile-nav';
    mobileNav.style.cssText = `
      display:none;position:fixed;top:0;left:0;right:0;width:100%;height:100vh;
      background:linear-gradient(135deg,#f8fafc 0%,#f1f5f9 30%,#e2e8f0 60%,#cbd5e1 100%);
      backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);z-index:999;
      padding:20px 15px 30px;overflow-y:auto;transform:translateX(100%);
      transition:transform .4s cubic-bezier(.16,1,.3,1);-webkit-overflow-scrolling:touch;
    `;

    // Build menu (Contact is LIVE → direct href)
    mobileNav.innerHTML = `
      <div style="
        display:flex;align-items:center;justify-content:space-between;
        padding:20px 0 40px;border-bottom:1px solid rgba(148,163,184,.3);margin-bottom:30px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <img src="assets/CityFix-logo.svg" alt="CityFix Logo" style="width:30px;height:24px;object-fit:contain;">
          <span style="font-family:'Poppins',sans-serif;font-size:18px;font-weight:bold;color:#333;">CityFix</span>
        </div>
        <button onclick="closeMobileMenu()" style="
          background:none;border:none;font-size:24px;color:#666;cursor:pointer;padding:8px;border-radius:50%;
          width:40px;height:40px;display:flex;align-items:center;justify-content:center;transition:all .3s ease;"
          onmouseover="this.style.background='rgba(0,0,0,0.1)'" onmouseout="this.style.background='none'">×</button>
      </div>

      <a href="index.html" class="mobile-nav-item ${getCurrentPage() === 'index' ? 'active' : ''}" style="
        display:flex;align-items:center;justify-content:center;padding:18px 0;color:${getCurrentPage()==='index'?'#2563EB':'#1e293b'};
        text-decoration:none;text-align:center;font-size:18px;font-weight:600;min-height:60px;border-radius:16px;margin:8px 0;transition:all .3s ease;
        background:${getCurrentPage()==='index'?'rgba(37,99,235,.1)':'rgba(255,255,255,.7)'};border:1px solid ${getCurrentPage()==='index'?'#2563EB':'rgba(148,163,184,.3)'};backdrop-filter:blur(10px);">Home</a>

      <a href="BrowseReports.html" class="mobile-nav-item ${getCurrentPage() === 'BrowseReports' ? 'active' : ''}" style="
        display:flex;align-items:center;justify-content:center;padding:18px 0;color:${getCurrentPage()==='BrowseReports'?'#2563EB':'#1e293b'};
        text-decoration:none;text-align:center;font-size:18px;font-weight:600;min-height:60px;border-radius:16px;margin:8px 0;transition:all .3s ease;
        background:${getCurrentPage()==='BrowseReports'?'rgba(37,99,235,.1)':'rgba(255,255,255,.7)'};border:1px solid ${getCurrentPage()==='BrowseReports'?'#2563EB':'rgba(148,163,184,.3)'};backdrop-filter:blur(10px);">Reports</a>

      <a href="SubmitReport.html" class="mobile-nav-item ${getCurrentPage() === 'SubmitReport' ? 'active' : ''}" style="
        display:flex;align-items:center;justify-content:center;padding:18px 0;color:${getCurrentPage()==='SubmitReport'?'#2563EB':'#1e293b'};
        text-decoration:none;text-align:center;font-size:18px;font-weight:600;min-height:60px;border-radius:16px;margin:8px 0;transition:all .3s ease;
        background:${getCurrentPage()==='SubmitReport'?'rgba(37,99,235,.1)':'rgba(255,255,255,.7)'};border:1px solid ${getCurrentPage()==='SubmitReport'?'#2563EB':'rgba(148,163,184,.3)'};backdrop-filter:blur(10px);">Submit Report</a>

      <a href="#" class="mobile-nav-item" data-action="city-insights" style="
        display:flex;align-items:center;justify-content:center;padding:18px 0;color:#1e293b;text-decoration:none;text-align:center;font-size:18px;font-weight:600;
        min-height:60px;border-radius:16px;margin:8px 0;transition:all .3s ease;background:rgba(255,255,255,.7);border:1px solid rgba(148,163,184,.3);backdrop-filter:blur(10px);">
        City Insights</a>

      <a href="MyImpact.html" class="mobile-nav-item ${getCurrentPage() === 'MyImpact' ? 'active' : ''}" style="
        display:flex;align-items:center;justify-content:center;padding:18px 0;color:${getCurrentPage()==='MyImpact'?'#2563EB':'#1e293b'};
        text-decoration:none;text-align:center;font-size:18px;font-weight:600;min-height:60px;border-radius:16px;margin:8px 0;transition:all .3s ease;
        background:${getCurrentPage()==='MyImpact'?'rgba(37,99,235,.1)':'rgba(255,255,255,.7)'};border:1px solid ${getCurrentPage()==='MyImpact'?'#2563EB':'rgba(148,163,184,.3)'};backdrop-filter:blur(10px);">My Impact</a>

      <!-- Contact is LIVE -->
      <a href="Contact.html" class="mobile-nav-item ${getCurrentPage() === 'Contact' ? 'active' : ''}" style="
        display:flex;align-items:center;justify-content:center;padding:18px 0;color:${getCurrentPage()==='Contact'?'#2563EB':'#1e293b'};
        text-decoration:none;text-align:center;font-size:18px;font-weight:600;min-height:60px;border-radius:16px;margin:8px 0;transition:all .3s ease;
        background:${getCurrentPage()==='Contact'?'rgba(37,99,235,.1)':'rgba(255,255,255,.7)'};border:1px solid ${getCurrentPage()==='Contact'?'#2563EB':'rgba(148,163,184,.3)'};backdrop-filter:blur(10px);">Contact</a>
    `;

    document.body.appendChild(mobileNav);
    console.log('✅ Mobile nav created');
  }

  // Toggle open/close
  mobileMenuBtn.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    const isActive = mobileNav.style.display === 'block' && mobileNav.style.transform === 'translateX(0px)';
    if (isActive) {
      mobileNav.style.transform = 'translateX(100%)';
      mobileMenuBtn.classList.remove('active');
      document.body.classList.remove('mobile-menu-open');
      setTimeout(() => (mobileNav.style.display = 'none'), 400);
    } else {
      mobileNav.style.display = 'block';
      mobileMenuBtn.classList.add('active');
      document.body.classList.add('mobile-menu-open');
      setTimeout(() => (mobileNav.style.transform = 'translateX(0px)'), 10);
    }
  });

  // Handle clicks (only special actions)
  mobileNav.addEventListener('click', function (e) {
    if (e.target.classList.contains('mobile-nav-item')) {
      const action = e.target.getAttribute('data-action');
      const text = e.target.textContent.trim();
      console.log(`Mobile nav clicked: ${text}`);

      // Close first
      mobileNav.style.transform = 'translateX(100%)';
      mobileMenuBtn.classList.remove('active');
      document.body.classList.remove('mobile-menu-open');
      setTimeout(() => (mobileNav.style.display = 'none'), 400);

      if (action === 'city-insights') {
        e.preventDefault();
        setTimeout(() => {
          showComingSoonModal(
            'City Insights',
            'Advanced analytics and insights about your city are coming soon! Stay tuned for data-driven reports and trends.'
          );
        }, 500);
      }
      // Others use href naturally (including Contact)
    }
  });

  // Backdrop close
  mobileNav.addEventListener('click', function (e) {
    if (e.target === mobileNav) {
      mobileNav.style.transform = 'translateX(100%)';
      mobileMenuBtn.classList.remove('active');
      document.body.classList.remove('mobile-menu-open');
      setTimeout(() => (mobileNav.style.display = 'none'), 400);
    }
  });

  // Auto-close on desktop resize
  window.addEventListener('resize', function () {
    if (window.innerWidth > 1024) {
      mobileNav.style.transform = 'translateX(100%)';
      mobileMenuBtn.classList.remove('active');
      document.body.classList.remove('mobile-menu-open');
      setTimeout(() => (mobileNav.style.display = 'none'), 400);
    }
  });

  console.log('✅ Mobile menu setup complete');
}

/* ============================
   DESKTOP NAVIGATION
============================ */
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-section .nav-item');
  console.log(`Found ${navItems.length} desktop navigation items`);

  navItems.forEach((item, index) => {
    const text = (item.textContent || '').trim();
    console.log(`Setting up desktop nav item ${index}: "${text}"`);

    item.addEventListener('click', function (e) {
      e.preventDefault();
      navItems.forEach((n) => n.classList.remove('active'));
      this.classList.add('active');
      handleNavigation(text);
    });
  });

  // Extra safety for direct Reports links
  const reportsLinks = document.querySelectorAll('a[href*="BrowseReports"], a[href*="reports"]');
  reportsLinks.forEach((link) => {
    link.addEventListener('click', function () {
      console.log(`📋 Direct Reports link clicked: ${this.href}`);
    });
  });
}

/* ============================
   ROUTING HANDLER
============================ */
function handleNavigation(text) {
  console.log(`🎯 Handling navigation for: "${text}"`);

  if (text === 'Home') window.location.href = 'index.html';
  else if (text === 'Reports' || text === 'Browse Reports') window.location.href = 'BrowseReports.html';
  else if (text === 'Submit Report') window.location.href = 'SubmitReport.html';
  else if (text === 'City Insights') {
    showComingSoonModal(
      'City Insights',
      'Advanced analytics and insights about your city are coming soon! Stay tuned for data-driven reports and trends.'
    );
  } else if (text === 'My Impact') window.location.href = 'MyImpact.html';
  else if (text === 'Contact') window.location.href = 'Contact.html';
  else {
    console.log(`→ Unknown navigation item: "${text}"`);
    console.log('Available: Home, Reports, Submit Report, City Insights, My Impact, Contact');
  }
}

/* ============================
   AUTH BUTTONS
============================ */
function setupAuthButtons() {
  const loginBtns = document.querySelectorAll('.login-btn');
  loginBtns.forEach((btn) =>
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      window.location.href = 'login.html';
    })
  );

  const signupBtns = document.querySelectorAll('.signup-btn');
  signupBtns.forEach((btn) =>
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      window.location.href = 'signup.html';
    })
  );

  const notificationIcon = document.querySelector('.notification-icon');
  const profileIcon = document.querySelector('.profile-icon');

  if (notificationIcon) {
    notificationIcon.addEventListener('click', function () {
      showComingSoonModal(
        'Notifications',
        'Stay updated with notifications about your reports and city improvements. This feature will keep you informed!'
      );
    });
  }

  if (profileIcon) {
    profileIcon.addEventListener('click', function () {
      showProfileModal();
    });
  }
}

/* ============================
   INTERACTIVE ELEMENTS
============================ */
function setupInteractiveElements() {
  const heroBtns = document.querySelectorAll('.hero-button, .cta-button');
  heroBtns.forEach((btn) =>
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      window.location.href = 'SubmitReport.html';
    })
  );

  const issueCards = document.querySelectorAll('.issue-card');
  issueCards.forEach((card) => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', function () {
      window.location.href = 'SubmitReport.html';
    });
    });
}

/* ============================
   RESPONSIVE HEADER
============================ */
function setupResponsiveHeader() {
  const header = document.querySelector('.header');
  if (header) {
    header.style.display = 'flex';
    header.style.position = 'sticky';
    header.style.top = '0';
    header.style.zIndex = '100';
    header.style.width = '100%';
    console.log('✅ Header visibility ensured on all screens');
  }
  checkScreenSize();
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
    if (navSection) navSection.style.display = 'none';
    if (authSection) authSection.style.display = 'none';
    if (mobileMenuBtn) mobileMenuBtn.style.display = 'flex';
    if (header) header.style.padding = '8px 20px';
    console.log('📱 Mobile view activated');
  } else {
    if (navSection) navSection.style.display = 'flex';
    if (authSection) authSection.style.display = 'flex';
    if (mobileMenuBtn) mobileMenuBtn.style.display = 'none';
    if (header) header.style.padding = '16px 80px';

    const mobileNav = document.querySelector('.mobile-nav');
    if (mobileNav && mobileNav.classList.contains('active')) {
      mobileNav.classList.remove('active');
      if (mobileMenuBtn) mobileMenuBtn.classList.remove('active');
      document.body.classList.remove('mobile-menu-open');
    }
    console.log('🖥️ Desktop view activated');
  }
}

/* ============================
   MODALS (Profile / Coming Soon)
============================ */
function showComingSoonModal(featureName, description) {
  const existing = document.querySelector('.custom-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.className = 'custom-modal';
  modal.style.cssText = `
    position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);
    display:flex;align-items:center;justify-content:center;z-index:10000;backdrop-filter:blur(4px);
  `;

  const content = document.createElement('div');
  content.style.cssText = `
    background:#fff;border-radius:16px;padding:32px;max-width:500px;width:90%;text-align:center;
    box-shadow:0 20px 40px rgba(0,0,0,.15);transform:scale(.9);transition:all .3s ease;
  `;
  content.innerHTML = `
    <div style="font-size:48px;margin-bottom:16px;">🚀</div>
    <h2 style="color:#1E40AF;margin:0 0 16px;font-size:24px;font-weight:600;">${featureName}</h2>
    <p style="color:#6B7280;margin:0 0 24px;line-height:1.6;font-size:16px;">${description}</p>
    <div style="display:flex;gap:12px;justify-content:center;">
      <button onclick="closeModal()" style="
        background:#3B82F6;color:#fff;border:none;padding:12px 24px;border-radius:8px;font-weight:500;cursor:pointer;transition:all .2s ease;"
        onmouseover="this.style.background='#2563EB'" onmouseout="this.style.background='#3B82F6'">Got it!</button>
    </div>
  `;
  modal.appendChild(content);
  document.body.appendChild(modal);
  setTimeout(() => (content.style.transform = 'scale(1)'), 10);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') closeModal();
  });
}

function showProfileModal() {
  const existing = document.querySelector('.custom-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.className = 'custom-modal';
  modal.style.cssText = `
    position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);
    display:flex;align-items:center;justify-content:center;z-index:10000;backdrop-filter:blur(4px);
  `;

  const content = document.createElement('div');
  content.style.cssText = `
    background:#fff;border-radius:16px;padding:32px;max-width:400px;width:90%;text-align:center;
    box-shadow:0 20px 40px rgba(0,0,0,.15);transform:scale(.9);transition:all .3s ease;
  `;
  content.innerHTML = `
    <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#2563EB 0%,#1d4ed8 100%);
      margin:0 auto 16px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:32px;font-weight:600;">U</div>
    <h2 style="color:#1E40AF;margin:0 0 8px;font-size:24px;font-weight:600;">User Profile</h2>
    <p style="color:#6B7280;margin:0 0 24px;font-size:14px;">user@cityfix.com</p>
    <div style="display:flex;flex-direction:column;gap:12px;">
      <button onclick="window.location.href='MyImpact.html'" style="
        background:#2563EB;color:#fff;border:none;padding:12px 24px;border-radius:8px;font-weight:500;cursor:pointer;transition:all .2s ease;"
        onmouseover="this.style.background='#1d4ed8'" onmouseout="this.style.background='#2563EB'">📊 My Impact</button>
      <button onclick="showComingSoonModal('Settings','Profile settings and preferences are coming soon!')" style="
        background:#F3F4F6;color:#6B7280;border:none;padding:12px 24px;border-radius:8px;font-weight:500;cursor:pointer;transition:all .2s ease;"
        onmouseover="this.style.background='#E5E7EB'" onmouseout="this.style.background='#F3F4F6'">⚙️ Settings</button>
      <button onclick="closeModal()" style="background:transparent;color:#9CA3AF;border:none;padding:8px;border-radius:8px;font-weight:500;cursor:pointer;margin-top:8px;">Close</button>
    </div>
  `;
  modal.appendChild(content);
  document.body.appendChild(modal);
  setTimeout(() => (content.style.transform = 'scale(1)'), 10);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

function closeModal() {
  const modal = document.querySelector('.custom-modal');
  if (modal) {
    const content = modal.querySelector('div');
    if (content) content.style.transform = 'scale(0.9)';
    setTimeout(() => modal.remove(), 300);
  }
}

/* ============================
   PAGE DETECTION / ACTIVE STATE
============================ */
function getCurrentPage() {
  const currentPath = window.location.pathname;
  const fileName = currentPath.split('/').pop().replace('.html', '');
  if (fileName === '' || fileName === 'index') return 'index';
  else if (fileName === 'BrowseReports' || fileName === 'reports') return 'BrowseReports';
  else if (fileName === 'SubmitReport') return 'SubmitReport';
  else if (fileName === 'MyImpact') return 'MyImpact';
  else if (fileName === 'Contact') return 'Contact';
  else return fileName;
}

function closeMobileMenu() {
  const mobileNav = document.querySelector('.mobile-nav');
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  if (mobileNav && mobileMenuBtn) {
    console.log('🔴 Closing mobile menu via X button');
    mobileNav.style.transform = 'translateX(100%)';
    mobileMenuBtn.classList.remove('active');
    document.body.classList.remove('mobile-menu-open');
    setTimeout(() => (mobileNav.style.display = 'none'), 400);
  }
}

function setActiveNavItem() {
  const currentPage = getCurrentPage();
  console.log(`📍 Current page detected: ${currentPage}`);

  const desktopNavItems = document.querySelectorAll('.nav-section .nav-item');
  desktopNavItems.forEach((item) => {
    const text = (item.textContent || '').trim().toLowerCase();
    item.classList.remove('active');
    if (
      (currentPage === 'index' && text === 'home') ||
      (currentPage === 'BrowseReports' && text === 'reports') ||
      (currentPage === 'SubmitReport' && text === 'submit report') ||
      (currentPage === 'MyImpact' && text === 'my impact') ||
      (currentPage === 'Contact' && text === 'contact')
    ) {
      item.classList.add('active');
      console.log(`✅ Set active: ${text}`);
    }
  });
}

// Expose small API
window.closeModal = closeModal;
window.showComingSoonModal = showComingSoonModal;
window.showProfileModal = showProfileModal;
window.closeMobileMenu = closeMobileMenu;
window.getCurrentPage = getCurrentPage;
window.setActiveNavItem = setActiveNavItem;

console.log('📄 CityFix Universal Navigation Script Loaded - Mobile Ready!');
