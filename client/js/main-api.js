// client/js/main-api.js
(() => {
  if (window.CF?.API_BASE) return; // already set

const API_BASE = `${location.origin}/api`;
 

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
