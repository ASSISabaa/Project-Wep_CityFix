// client/js/main-api.js
(() => {
  if (window.CF?.API_BASE) return; // already set

  const BASE =
    (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
      ? 'http://localhost:5000/api'
      : `${location.origin}/api`;

  window.CF = {
    API_BASE: BASE,
    getToken() {
      return (
        localStorage.getItem('cityfix_token') ||
        sessionStorage.getItem('cityfix_token') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('token') ||
        ''
      );
    },
    authHeaders(json = true) {
      const t = this.getToken();
      const h = json ? { 'Content-Type': 'application/json' } : {};
      return t ? { ...h, Authorization: `Bearer ${t}` } : h;
    }
  };
})();
