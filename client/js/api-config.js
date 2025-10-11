const getAPIBase = () => {
  const meta = document.querySelector('meta[name="cityfix-api"]');
  if (meta?.content && meta.content !== window.location.origin) {
    return meta.content;
  }
  
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return window.location.origin;
  }
  
  return 'http://localhost:5000';
};

window.CITYFIX_API_BASE = getAPIBase();

async function checkBackendConnection(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`${window.CITYFIX_API_BASE}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        console.log('✅ Backend connected:', window.CITYFIX_API_BASE);
        hideConnectionError();
        return true;
      }
    } catch (error) {
      console.warn(`❌ Connection attempt ${i + 1}/${retries} failed`);
      if (i === retries - 1) {
        console.error('❌ Backend connection failed after', retries, 'attempts');
        showConnectionError();
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
}

function showConnectionError() {
  let banner = document.getElementById('connection-error-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'connection-error-banner';
    banner.style.cssText = `
      position: fixed;
      top: 70px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #fee2e2, #fecaca);
      color: #dc2626;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
      z-index: 9999;
      font-weight: 600;
      text-align: center;
      max-width: 90%;
      animation: slideDown 0.3s ease;
      border: 2px solid #ef4444;
    `;
    banner.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; justify-content: center;">
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
        </svg>
        <div>
          <div style="font-weight: 700; margin-bottom: 4px;">Unable to connect to server</div>
          <div style="font-size: 13px; opacity: 0.9;">Please ensure backend is running on port 5000</div>
        </div>
      </div>
    `;
    document.body.appendChild(banner);
  }
}

function hideConnectionError() {
  const banner = document.getElementById('connection-error-banner');
  if (banner) {
    banner.style.animation = 'slideUp 0.3s ease';
    setTimeout(() => banner.remove(), 300);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    checkBackendConnection();
    setInterval(() => checkBackendConnection(1), 30000);
  });
} else {
  checkBackendConnection();
  setInterval(() => checkBackendConnection(1), 30000);
}

window.API_CONFIG = {
  BASE_URL: window.CITYFIX_API_BASE,
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      SIGNUP: '/api/auth/signup',
      VERIFY: '/api/auth/verify',
      ME: '/api/auth/me'
    },
    REPORTS: {
      LIST: '/api/reports',
      CREATE: '/api/reports',
      GET: '/api/reports/:id',
      UPDATE: '/api/reports/:id',
      DELETE: '/api/reports/:id'
    },
    DASHBOARD: {
      STATS: '/api/dashboard/stats',
      RECENT: '/api/dashboard/recent-activity',
      CHART: '/api/dashboard/chart-data'
    },
    PUBLIC: {
      STATS: '/api/public/stats',
      REPORTS: '/api/public/reports'
    },
    DISTRICTS: '/api/districts',
    REPORT_TYPES: '/api/report-types'
  }
};

window.apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('cityfix_token') || sessionStorage.getItem('cityfix_token');
  
  const defaultHeaders = {
    'Content-Type': 'application/json'
  };
  
  // Only add token if it exists
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    method: options.method || 'GET',
    headers: { ...defaultHeaders, ...options.headers },
    credentials: 'include'
  };
  
  if (options.body && config.method !== 'GET') {
    config.body = JSON.stringify(options.body);
  }
  
  try {
    const url = `${window.CITYFIX_API_BASE}${endpoint}`;
    console.log('📡 API Request:', config.method, url);
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
      if (response.status === 401) {
        // CRITICAL: Only redirect if NOT on homepage/public pages
        const publicPages = ['/', '/index.html', '/homepage.html', ''];
        const currentPath = window.location.pathname;
        const isPublicPage = publicPages.some(page => 
          currentPath === page || currentPath.endsWith(page)
        );
        
        // Only redirect to login if on a protected page
        if (!isPublicPage && !endpoint.includes('/public/')) {
          localStorage.removeItem('cityfix_token');
          sessionStorage.removeItem('cityfix_token');
          window.location.href = '/login.html';
        }
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ API Response:', data);
    return data;
  } catch (error) {
    console.error('❌ API Request failed:', error);
    throw error;
  }
};

const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      transform: translate(-50%, -100%);
      opacity: 0;
    }
    to {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }
  
  @keyframes slideUp {
    from {
      transform: translate(-50%, 0);
      opacity: 1;
    }
    to {
      transform: translate(-50%, -100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

console.log('✅ API Config loaded:', window.CITYFIX_API_BASE);