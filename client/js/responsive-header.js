// CityFix - universal mobile header / sidebar
(() => {
  if (window.__cfHeaderReady) return; // prevent double init across pages
  window.__cfHeaderReady = true;

  const BREAKPOINT = 1024;

  const els = {
    header: document.querySelector('.mobile-header'),
    sidebar: document.getElementById('sidebar'),
    overlay: document.getElementById('overlay'),
    burger: document.querySelector('.hamburger-btn'),
  };

  // If basic elements are missing: expose safe no-ops so onclicks don't crash
  if (!els.sidebar || !els.overlay) {
    window.toggleSidebar = () => {};
    window.openSidebar = () => {};
    window.closeSidebar = () => {};
    console.warn('[CityFix] Sidebar elements not found on this page.');
    return;
  }

  // Inject minimal mobile CSS (RTL-friendly offcanvas from the right)
  if (!document.getElementById('cf-mobile-style')) {
    const s = document.createElement('style');
    s.id = 'cf-mobile-style';
    s.textContent = `
      @media (max-width:${BREAKPOINT}px){
        .sidebar{left:auto!important;right:-100%!important;transform:translateX(100%)!important}
        .sidebar.sidebar-open{right:0!important;transform:translateX(0)!important}
      }
      .overlay.visible,.overlay.show,.overlay.active{display:block!important;opacity:1!important}
    `;
    document.head.appendChild(s);
  }

  // Helpers
  function lockBody(on) {
    if (!on) { document.body.style.position=''; document.body.style.top=''; document.body.style.width=''; return; }
    const y = window.scrollY || 0;
    document.body.style.top = `-${y}px`;
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
  }
  function applyTop() {
    if (!els.header || !els.sidebar) return;
    if (window.innerWidth <= BREAKPOINT) {
      els.sidebar.style.top = (els.header.offsetHeight || 60) + 'px';
    } else {
      els.sidebar.style.top = '';
      closeSidebar();
    }
  }

  // Actions
  function openSidebar() {
    els.sidebar.classList.add('sidebar-open', 'active');
    els.overlay.classList.add('visible', 'show', 'active');
    els.burger?.classList.add('hamburger-active');
    lockBody(true);
  }
  function closeSidebar() {
    els.sidebar.classList.remove('sidebar-open', 'active');
    els.overlay.classList.remove('visible', 'show', 'active');
    els.burger?.classList.remove('hamburger-active');
    lockBody(false);
  }
  function toggleSidebar() {
    const open = els.sidebar.classList.contains('sidebar-open') || els.sidebar.classList.contains('active');
    open ? closeSidebar() : openSidebar();
  }

  // Bind once
  if (els.burger && !els.burger.hasAttribute('data-cf-bound')) {
    els.burger.setAttribute('data-cf-bound', '1');
    els.burger.setAttribute('role', 'button');
    els.burger.setAttribute('tabindex', '0');
    els.burger.style.cursor = 'pointer';
    els.burger.addEventListener('click', toggleSidebar);
    els.burger.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSidebar(); }
    });
  }
  els.overlay.addEventListener('click', closeSidebar);
  window.addEventListener('keydown', e => { if (e.key === 'Escape') closeSidebar(); });
  window.addEventListener('resize', applyTop, { passive: true });
  window.addEventListener('orientationchange', applyTop);
  applyTop();

  // Expose globals for inline onclick="toggleSidebar()" / onclick="closeSidebar()"
  if (typeof window.toggleSidebar !== 'function') window.toggleSidebar = toggleSidebar;
  if (typeof window.openSidebar   !== 'function') window.openSidebar   = openSidebar;
  if (typeof window.closeSidebar  !== 'function') window.closeSidebar  = closeSidebar;

  console.log('✅ CityFix universal mobile header ready');
})();
