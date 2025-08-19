(function () {
  window.CITYFIX = window.CITYFIX || {};
  if (!window.CITYFIX.API_BASE) {
    window.CITYFIX.API_BASE =
      (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
        ? 'http://localhost:5000/api'
        : location.origin + '/api';
  }
  if (!window.CITYFIX.getToken) {
    window.CITYFIX.getToken = function () {
      return localStorage.getItem('cityfix_token') || sessionStorage.getItem('cityfix_token') || '';
    };
  }
})();
