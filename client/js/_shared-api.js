(function () {
  window.CITYFIX = window.CITYFIX || {};
  if (!window.CITYFIX.API_BASE) {
    window.CITYFIX.API_BASE = location.origin + '/api';  
  }
  if (!window.CITYFIX.getToken) {
    window.CITYFIX.getToken = function () {
      return localStorage.getItem('cityfix_token') || sessionStorage.getItem('cityfix_token') || '';
    };
  }
})();