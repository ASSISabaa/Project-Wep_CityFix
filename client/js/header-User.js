// header.js — Right profile+bell when logged in, Login/Sign up when logged out
(() => {
  'use strict';

  const PUBLIC_PAGES = new Set(['', 'index', 'home', 'contact', 'contacts', 'count', 'counct']);
  const GUARDED_PAGES = new Set(['submitreport', 'myimpact', 'browsereports']);
  const LS_USER = 'cityfix_user';
  const LS_TOKEN = 'cityfix_token';

  const CITYFIX_API_BASE =
    (window.API_CONFIG && window.API_CONFIG.BASE_URL) ||
    window.CITYFIX_API_BASE ||
    location.origin; 

  const apiURL = (p) => `${CITYFIX_API_BASE}${p.startsWith('/') ? p : `/${p}`}`;
  const qs = (s, r=document)=>r.querySelector(s);
  const qsa = (s, r=document)=>Array.from(r.querySelectorAll(s));

  function pageName(){
    const last=(location.pathname.split('/').pop()||'').toLowerCase();
    const name=last.replace(/\.(html|htm)$/, '');
    return name||'index';
  }
  function isLoggedIn(){ return Boolean(localStorage.getItem(LS_TOKEN) || sessionStorage.getItem(LS_TOKEN)); }
  function readUser(){ try{ return JSON.parse(localStorage.getItem(LS_USER) || sessionStorage.getItem(LS_USER) || 'null'); }catch{ return null; } }
  function writeUser(u){ const j=JSON.stringify(u||{}); localStorage.setItem(LS_USER,j); sessionStorage.setItem(LS_USER,j); }
  function toast(msg, type='info'){
    if (window.CityToast?.show) return void window.CityToast.show({message:msg,type});
    if (window.CityToast?.push) return void window.CityToast.push({message:msg,type});
    if (window.toast?.show) return void window.toast.show(msg,{type});
    window.dispatchEvent(new CustomEvent('toast:show',{detail:{message:msg,type}}));
  }

  function injectStyles(){
    if (document.getElementById('cityfix-header-injected-css')) return;
    const css = `
      .auth-section{margin-left:auto;display:flex;align-items:center;gap:14px}
      .header-actions{display:flex;align-items:center;gap:14px}
      .notification-bell,.user-icon-btn{background:transparent;border:0;cursor:pointer;display:grid;place-items:center;width:36px;height:36px;border-radius:10px}
      .notification-bell:hover,.user-icon-btn:hover{background:#f3f4f6}
      .notification-badge{position:absolute;top:-6px;right:-6px;background:#ef4444;color:#fff;font-size:11px;min-width:18px;height:18px;padding:0 5px;border-radius:999px;display:flex;align-items:center;justify-content:center}
      .hf-panel{position:absolute;z-index:1000;width:min(420px,calc(100vw - 24px));background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 12px 28px rgba(0,0,0,.12);overflow:hidden;display:none}
      .hf-panel.is-open{display:block}
      .panel-header{padding:12px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f1f5f9}
      .panel-title{font-weight:700}
      .panel-body{max-height:60vh;overflow:auto}
      .notifications-list{display:grid;gap:8px;padding:12px}
      .notification-item{display:flex;gap:12px;padding:12px;border-radius:10px;background:#fafafa;border:1px solid #f1f5f9;position:relative;cursor:pointer}
      .notification-item.unread{background:#f8fbff}
      .unread-dot{position:absolute;right:10px;top:12px;width:8px;height:8px;background:#3b82f6;border-radius:50%}
      .user-avatar-letter,.user-avatar-img{box-shadow:0 1px 2px rgba(0,0,0,.05)}
      .profile-card{padding:14px;display:grid;gap:10px}
      .profile-row{display:flex;align-items:center;gap:12px}
      .role-badge{background:#eef2ff;color:#3730a3;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:600}
      .panel-actions{padding:12px;border-top:1px solid #f1f5f9;display:flex;gap:10px;justify-content:flex-end}
      .mobile-logout{display:block;margin:12px 14px 18px;padding:14px;border-radius:10px;background:#fff1f2;color:#b91c1c;text-align:center;font-weight:700;border:1px solid #ffe4e6}
    `.trim();
    const style=document.createElement('style'); style.id='cityfix-header-injected-css'; style.textContent=css; document.head.appendChild(style);
  }

  const Panels = {
    open(anchor, panel){
      this.position(anchor,panel);
      panel.classList.add('is-open');
      setTimeout(()=>document.addEventListener('click', this._outside, {once:true}));
      window.addEventListener('resize', this._repos, {once:true});
      window.addEventListener('scroll', this._repos, {once:true});
      this._cur = {anchor, panel};
    },
    close(panel){ (panel||this._cur?.panel)?.classList.remove('is-open'); this._cur=null; },
    position(anchor, panel){
      const r=anchor.getBoundingClientRect();
      const top=r.bottom+8+window.scrollY;
      const right=window.innerWidth-r.right+8;
      panel.style.top=`${top}px`; panel.style.right=`${right}px`; panel.style.left='auto'; panel.style.minWidth='320px';
    },
    _outside(e){ const c=Panels._cur?.panel, a=Panels._cur?.anchor; if (!c) return; if (!c.contains(e.target)&&!a.contains(e.target)) Panels.close(c); },
    _repos(){ if (Panels._cur) Panels.position(Panels._cur.anchor, Panels._cur.panel); }
  };

  const Notifs = {
    icon(){ return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'; },
    fmt(ts){ const n=new Date(), d=new Date(ts), s=(n-d)/1000; if (s<60) return 'Just now'; if (s<3600) return `${Math.floor(s/60)} minutes ago`; if (s<86400) return `${Math.floor(s/3600)} hours ago`; if (s<604800) return `${Math.floor(s/86400)} days ago`; return d.toLocaleDateString(); },
    async load(){
      const list=qs('#notificationsList'); const badge=qs('#notifBadge'); if (!list) return;
      list.innerHTML='<div style="padding:18px;text-align:center;color:#6b7280">Loading...</div>';
      const token=localStorage.getItem(LS_TOKEN)||sessionStorage.getItem(LS_TOKEN);
      const init={headers:{'Authorization':`Bearer ${token||''}`, 'Content-Type':'application/json'}};
      const endpoints=['/api/notifications','/api/users/notifications','/api/profile/notifications'];
      let res=null; for (const p of endpoints){ try{ const r=await fetch(apiURL(p), init); if (r.ok){ res=r; break; } if (r.status!==404){ res=null; break; } }catch{} }
      const data = res ? await res.json() : JSON.parse(localStorage.getItem('cityfix_notifications')||'[]');
      const items = res ? (data.notifications||data||[]) : data;
      const unread=items.filter(n=>!n.isRead).length;
      if (badge){ badge.textContent=unread; badge.style.display=unread>0?'flex':'none'; }
      list.innerHTML = items.length ? items.map(n=>`
        <div class="notification-item ${n.isRead?'read':'unread'}" data-id="${n._id||n.id||''}">
          <div class="notification-icon">${Notifs.icon()}</div>
          <div class="notification-content">
            <h4 style="margin:0 0 4px 0">${n.title||''}</h4>
            <p style="margin:0 0 6px 0;color:#4b5563">${n.message||''}</p>
            <span class="notification-time" style="font-size:12px;color:#6b7280">${Notifs.fmt(n.createdAt||Date.now())}</span>
          </div>
          ${!n.isRead?'<span class="unread-dot"></span>':''}
        </div>`).join('') : `<div style="padding:18px;text-align:center;color:#6b7280">No notifications</div>`;
    },
    async openOne(id){
      try{
        const token=localStorage.getItem(LS_TOKEN)||sessionStorage.getItem(LS_TOKEN);
        const headers={'Authorization':`Bearer ${token||''}`,'Content-Type':'application/json'};
        for (const p of [`/api/notifications/${id}/read`,`/api/users/notifications/${id}/read`,`/api/profile/notifications/${id}/read`]) { try{ await fetch(apiURL(p),{method:'PUT',headers}); break; }catch{} }
        for (const p of [`/api/notifications/${id}`,`/api/users/notifications/${id}`,`/api/profile/notifications/${id}`]) {
          try{ const r=await fetch(apiURL(p),{headers}); if (r.ok){ const n=await r.json(); const t=n.type||''; if (['report_status','report_comment','report_resolved'].includes(t) && n.reportId) location.href=`report-details.html?id=${n.reportId}`; else if (t==='upvote') location.href='MyImpact.html'; break; } }catch{}
        }
      }catch{ toast('Failed to open notification','error'); }
    }
  };

  function avatarHTML(user, large=false){
    const size=large?50:32;
    if (user?.profilePhoto) return `<img src="${user.profilePhoto}" alt="U" class="user-avatar-img" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;">`;
    const src=(user?.username||user?.email||'U'); const first=src[0]?.toUpperCase()||'U';
    const colors=['#667eea','#f56565','#48bb78','#ed8936','#9f7aea','#38b2ac','#ed64a6','#4299e1','#ecc94b','#a0aec0'];
    const bg=colors[(src.charCodeAt(0)||85)%colors.length];
    return `<div class="user-avatar-letter" style="width:${size}px;height:${size}px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:700;background:${bg};">${first}</div>`;
  }

  function renderAuthArea(){
    const host=qs('.auth-section'); if (!host) return;
    const logged=isLoggedIn();

    if (!logged){
      removePanels();
      removeMobileLogout();
      ensureMobileAuthLinks();
      host.innerHTML = `
        <div class="header-actions">
          <a class="btn btn-secondary login-btn" href="login.html">Log in</a>
          <a class="btn btn-primary signup-btn" href="signup.html">Sign up</a>
        </div>`;
      return;
    }

    removeMobileAuthLinks();
    ensureMobileLogout();

    const user=readUser()||{};
    host.innerHTML = `
      <div class="header-actions">
        <div style="position:relative">
          <button class="notification-bell" id="notificationBell" aria-label="Notifications" title="Notifications">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span class="notification-badge" id="notifBadge" style="display:none">0</span>
          </button>
        </div>
        <div style="position:relative">
          <button class="user-icon-btn" id="userIconBtn" aria-label="Profile" title="Profile">
            ${avatarHTML(user)}
          </button>
        </div>
      </div>`;
    ensurePanels(user);
    bindAuthEvents();
  }

  function ensurePanels(user){
    if (!qs('#notifPanel')){
      const p=document.createElement('div'); p.id='notifPanel'; p.className='hf-panel';
      p.innerHTML = `
        <div class="panel-header"><div class="panel-title">Notifications</div>
          <button class="btn-link" id="markAllReadBtn" style="background:none">Mark all as read</button></div>
        <div class="panel-body"><div class="notifications-list" id="notificationsList"></div></div>`;
      document.body.appendChild(p);
    }
    if (!qs('#profilePanel')){
      const p=document.createElement('div'); p.id='profilePanel'; p.className='hf-panel';
      p.innerHTML = `
        <div class="panel-header">
          <div class="panel-title">Profile</div>
          <button class="btn-link" id="openSettingsItem" style="background:none">Settings</button>
        </div>
        <div class="panel-body">
          <div class="profile-card">
            <div class="profile-row">
              ${avatarHTML(user, true)}
              <div>
                <div style="font-weight:700">${user.username||user.name||'User'}</div>
                <div style="font-size:13px;color:#6b7280">${user.email||''}</div>
                <div style="margin-top:6px"><span class="role-badge ${user.role||'citizen'}">${user.role||'citizen'}</span></div>
              </div>
            </div>
            <a href="MyImpact.html" class="btn btn-secondary" style="width:100%;text-align:center">My Impact</a>
            ${user.role==='admin'?'<a href="dashboard.html" class="btn btn-secondary" style="width:100%;text-align:center">Admin Dashboard</a>':''}
          </div>
        </div>
        <div class="panel-actions">
          <button class="btn btn-primary" id="viewProfileItem">View Profile</button>
          <button class="btn btn-secondary" id="logoutBtn">Logout</button>
        </div>`;
      document.body.appendChild(p);
    }
  }

  function removePanels(){
    qs('#notifPanel')?.remove();
    qs('#profilePanel')?.remove();
  }

  function bindAuthEvents(){
    const bell=qs('#notificationBell'); const bellPanel=qs('#notifPanel');
    bell?.addEventListener('click', (e)=>{ e.stopPropagation(); Panels.open(bell,bellPanel); Notifs.load(); });

    const userBtn=qs('#userIconBtn'); const profPanel=qs('#profilePanel');
    userBtn?.addEventListener('click', (e)=>{ e.stopPropagation(); Panels.open(userBtn,profPanel); });

    document.addEventListener('click', (e)=>{ const item=e.target.closest('.notification-item'); if (item?.dataset.id) Notifs.openOne(item.dataset.id); });
    qs('#openSettingsItem')?.addEventListener('click', (e)=>{ e.preventDefault();  });
    qs('#viewProfileItem')?.addEventListener('click', (e)=>{ e.preventDefault();  });
    qs('#logoutBtn')?.addEventListener('click', doLogout);
    qs('#markAllReadBtn')?.addEventListener('click', ()=> Notifs.load().then(()=>toast('All notifications marked as read','success')));
  }

  function ensureMobileLogout(){
    const nav=qs('.mobile-nav'); if (!nav) return;
    if (qs('.mobile-logout', nav)) return;
    const a=document.createElement('a'); a.href='#'; a.className='mobile-logout'; a.textContent='Logout';
    a.addEventListener('click', (e)=>{ e.preventDefault(); doLogout(); });
    nav.appendChild(a);
  }
  function removeMobileLogout(){ qs('.mobile-logout')?.remove(); }

  function ensureMobileAuthLinks(){
    const nav=qs('.mobile-nav'); if (!nav) return;
    removeMobileAuthLinks();
    const wrap=document.createElement('div');
    wrap.className='mobile-auth-wrap';
    wrap.innerHTML = `
      <a class="nav-item" href="login.html">Log in</a>
      <a class="nav-item" href="signup.html">Sign up</a>`;
    nav.appendChild(wrap);
  }
  function removeMobileAuthLinks(){ qs('.mobile-auth-wrap')?.remove(); }

  function doLogout(){
    localStorage.removeItem(LS_TOKEN); localStorage.removeItem(LS_USER); sessionStorage.clear();
    location.href='login.html';
  }

  class HeaderCtrl{
    constructor(){
      this.el = {
        body: document.body,
        mobileMenuBtn: qs('.mobile-menu-btn'),
        mobileNav: qs('.mobile-nav'),
        navItems: qsa('.nav-item'),
        mobileNavItems: qsa('.mobile-nav .nav-item')
      };
      this.state={open:false};
      this.init();
    }
    init(){
      if (this.el.mobileMenuBtn && this.el.mobileNav){
        this.el.mobileMenuBtn.addEventListener('click',(e)=>{ e.stopPropagation(); this.toggle(); });
        document.addEventListener('click',(e)=>{ if (this.state.open && !this.el.mobileNav.contains(e.target) && !this.el.mobileMenuBtn.contains(e.target)) this.close(); });
        this.el.mobileNavItems.forEach(i=> i.addEventListener('click', ()=> this.close()));
        document.addEventListener('keydown',(e)=>{ if (e.key==='Escape' && this.state.open) this.close(); });
      }
      const curr=pageName(); const isHome=curr==='index';
      this.el.navItems.forEach(a=>{ const href=a.getAttribute('href'); if (href===`${curr}.html` || (isHome&&(href==='/'||href==='index.html'))) a.classList.add('active'); });
      this.el.mobileNavItems.forEach(a=>{ const href=a.getAttribute('href'); if (href===`${curr}.html` || (isHome&&(href==='/'||href==='index.html'))) a.classList.add('active'); });
    }
    open(){ this.state.open=true; this.el.mobileMenuBtn.classList.add('active'); this.el.mobileNav.classList.add('active'); this.el.body.classList.add('mobile-menu-open'); const y=scrollY; this.el.body.style.position='fixed'; this.el.body.style.top=`-${y}px`; this.el.body.style.width='100%'; }
    close(){ this.el.mobileMenuBtn.classList.remove('active'); this.el.mobileNav.classList.remove('active'); this.el.body.classList.remove('mobile-menu-open'); const y=this.el.body.style.top; this.el.body.style.position=''; this.el.body.style.top=''; this.el.body.style.width=''; scrollTo(0, parseInt(y||'0')*-1); this.state.open=false; }
    toggle(){ this.state.open ? this.close() : this.open(); }
  }

  function guard(){
    if (isLoggedIn()) return;
    if (PUBLIC_PAGES.has(pageName())) return;
    if (!GUARDED_PAGES.has(pageName())) return;
    setTimeout(()=> toast('Please sign in to view this page.','warning'), 20000);
  }

  function boot(){
    injectStyles();
    const header=new HeaderCtrl();
    renderAuthArea();
    guard();

    window.CityFixHeader = {
      toggleMenu: ()=> header.toggle(),
      login: (user)=>{ if (user) writeUser(user); localStorage.setItem(LS_TOKEN, user?.token||'1'); location.reload(); },
      logout: ()=> doLogout(),
      isLoggedIn: ()=> isLoggedIn()
    };

    console.log('✅ Header wired to common.css for auth buttons; profile/bell on login, login/signup on logout.');
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
