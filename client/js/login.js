(() => {
  if (window.__CITYFIX_LOGIN__) return; window.__CITYFIX_LOGIN__ = true;

  function baseURL() {
    const meta = document.querySelector('meta[name="cityfix-api"]')?.content?.trim();
    const cfg = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || window.CITYFIX_API_BASE || null;
    const fallback =
      location.protocol === 'file:' ? 'http://localhost:5000' :
      (/^(localhost|127\.0\.0\.1)$/i.test(location.hostname) ? 'http://localhost:5000' : location.origin);
    return (meta || cfg || fallback).replace(/\/+$/,'');
  }
  const API_BASE = baseURL();
  const api = (p) => `${API_BASE}${p.startsWith('/') ? p : `/${p}`}`;

  const EP = { LOGIN:'/api/auth/login', VERIFY:'/api/auth/verify', FORGOT:'/api/auth/forgotpassword' };
  const ST = { TOKEN:'cityfix_token', USER:'cityfix_user', ROLE:'cityfix_role', REM:'cityfix_remember', EMAIL:'remembered_email' };
  const RD = { ADMIN:'dashboard.html', CITIZEN:'index.html' };

  let ACTIVE = null;
  const T = () => window.Toast || window.toast || window.cityToast || window.toastr || window.Notifier || null;
  function closeToast(){ const t=T(); if(t?.dismissAll) t.dismissAll(); if(t?.clear) t.clear(); if(ACTIVE?.remove) ACTIVE.remove(); ACTIVE=null; }
  function msg(m){ if(!m) return 'Something went wrong'; if(typeof m==='string') return m; if(typeof m.message==='string') return m.message; try{ return JSON.stringify(m) }catch{ return String(m) } }
  function toast(m,type='info'){
    closeToast(); const text=msg(m), t=T();
    if(t?.[type]) return t[type](text);
    if(t?.show) return t.show(text,{type,duration:3200});
    const d=document.createElement('div'); d.textContent=text;
    d.style.cssText='position:fixed;top:20px;right:20px;padding:14px 16px;background:'+
      ({success:'#10b981',error:'#ef4444',warning:'#f59e0b',info:'#3b82f6'}[type]||'#3b82f6')+
      ';color:#fff;border-radius:8px;z-index:10000;box-shadow:0 6px 18px rgba(0,0,0,.15);font-weight:600';
    document.body.appendChild(d); ACTIVE=d; setTimeout(closeToast,3500);
  }

  const q=(s,r=document)=>r.querySelector(s);
  const emailOk=(e)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e||'').trim());

  async function http(path,{method='GET',body=null,token=null,timeout=12000}={}){
    const ctrl=new AbortController(); const to=setTimeout(()=>ctrl.abort(),timeout);
    try{
      const res=await fetch(api(path),{
        method,
        headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},
        body:body?JSON.stringify(body):null,
        signal:ctrl.signal
      });
      const txt=await res.text(); let json={}; try{ json=txt?JSON.parse(txt):{} }catch{}
      if(!res.ok){ const err=new Error(json.message||`HTTP ${res.status}`); err.status=res.status; throw err; }
      return json;
    } finally{ clearTimeout(to); }
  }

  async function verifyToken(token){
    const r=await http(EP.VERIFY,{token});
    const user=r.user||r.data?.user||{};
    const role=r.role||user.role;
    if(!role) throw new Error('Invalid token');
    return { user:{...user, role} };
  }

  function saveSession(token,user,remember){
    if(remember){
      localStorage.setItem(ST.REM,'true');
      localStorage.setItem(ST.TOKEN,token||''); localStorage.setItem(ST.USER,JSON.stringify(user||{})); localStorage.setItem(ST.ROLE,user?.role||'');
      sessionStorage.removeItem(ST.TOKEN); sessionStorage.removeItem(ST.USER); sessionStorage.removeItem(ST.ROLE);
    }else{
      localStorage.removeItem(ST.REM);
      sessionStorage.setItem(ST.TOKEN,token||''); sessionStorage.setItem(ST.USER,JSON.stringify(user||{})); sessionStorage.setItem(ST.ROLE,user?.role||'');
      localStorage.setItem(ST.TOKEN,token||''); localStorage.setItem(ST.USER,JSON.stringify(user||{})); localStorage.setItem(ST.ROLE,user?.role||'');
    }
  }
  function clearSession(){ [localStorage,sessionStorage].forEach(s=>{ s.removeItem(ST.TOKEN); s.removeItem(ST.USER); s.removeItem(ST.ROLE); }); }
  const getToken=()=> localStorage.getItem(ST.TOKEN)||sessionStorage.getItem(ST.TOKEN)||'';

  function mapLoginError(e,role){
    const s=e?.status, m=String(e?.message||'').toLowerCase();
    if(s===401||m.includes('invalid')) return 'Invalid email or password';
    if(s===403&&role==='admin') return 'Not authorized as admin';
    if(s===403&&role==='citizen') return 'Not authorized as citizen';
    if(s===400) return 'Bad request';
    if(s===500) return 'Server error. Please try again';
    return e?.message||'Login failed. Please try again';
  }

  class LoginUI{
    constructor(){
      this.email=q('#email'); this.pass=q('#password'); this.rem=q('#rememberMe');
      this.btnAdmin=q('.admin-login-btn'); this.btnUser=q('.user-login-btn');
      this.linkForgot=q('.forgot-password, #forgotPassword, a[href*="forgot"]');
      this.bind(); this.prefill(); this.resume();
    }
    busy(btn,on){
      if(!btn) return;
      btn.disabled=on; const t=btn.querySelector('.admin-btn-text, .user-btn-text');
      if(on){ btn.dataset._txt=t?t.textContent:btn.textContent; if(t) t.textContent='Authenticating...'; else btn.textContent='Authenticating...';
        [this.email,this.pass,this.rem].forEach(x=>x&&(x.disabled=true));
      }else{
        if(t&&btn.dataset._txt) t.textContent=btn.dataset._txt; else if(btn.dataset._txt) btn.textContent=btn.dataset._txt;
        [this.email,this.pass,this.rem].forEach(x=>x&&(x.disabled=false));
      }
    }
    valid(){
      const e=(this.email?.value||'').trim(), p=(this.pass?.value||'').trim();
      if(!emailOk(e)){ toast('Invalid email','error'); return false; }
      if(p.length<6){ toast('Password too short','error'); return false; }
      return true;
    }
    async go(role,btn){
      if(!this.valid()) return;
      const remember=!!(this.rem&&this.rem.checked);
      const email=(this.email?.value||'').trim();
      this.busy(btn,true);
      try{
        const out=await http(EP.LOGIN,{method:'POST',body:{email,password:this.pass.value,role}});
        const token=out.token||out.accessToken||out.jwt||out.data?.token;
        const user=out.user||out.data?.user||{};
        if(!token) throw new Error('Missing token');
        if(role==='admin' && user.role!=='admin'){ toast('Not authorized as admin','error'); clearSession(); return; }
        if(role==='citizen' && user.role==='admin'){ toast('Admins must use admin login','error'); clearSession(); return; }
        saveSession(token,user,remember);
        if(remember) localStorage.setItem(ST.EMAIL,email); else localStorage.removeItem(ST.EMAIL);
        toast('Login successful! Redirecting...','success');
        setTimeout(()=>{ location.href=(user.role==='admin'?RD.ADMIN:RD.CITIZEN); },500);
      }catch(e){
        toast(mapLoginError(e,role),'error');
      }finally{
        this.busy(btn,false);
      }
    }
    async forgot(){
      const e=(this.email?.value||'').trim();
      if(!emailOk(e)){ toast('Enter a valid email first','warning'); this.email?.focus(); return; }
      try{ await http(EP.FORGOT,{method:'POST',body:{email:e}}); toast('Reset link sent to your email','success'); }
      catch(err){ toast(err?.message||'Could not send reset link','error'); }
    }
    bind(){
      this.btnAdmin?.addEventListener('click',ev=>{ ev.preventDefault(); this.go('admin',this.btnAdmin); });
      this.btnUser ?.addEventListener('click',ev=>{ ev.preventDefault(); this.go('citizen',this.btnUser); });
      this.linkForgot?.addEventListener('click',ev=>{ ev.preventDefault(); this.forgot(); });
      this.email?.addEventListener('keypress',e=>{ if(e.key==='Enter'){ e.preventDefault(); this.pass?.focus(); }});
      this.pass ?.addEventListener('keypress',e=>{ if(e.key==='Enter'){ e.preventDefault(); (this.btnUser||this.btnAdmin)?.click(); }});
    }
    prefill(){ const em=localStorage.getItem(ST.EMAIL); if(em&&this.email){ this.email.value=em; if(this.rem) this.rem.checked=true; } }
    async resume(){
      const t=getToken(); if(!t) return;
      try{
        const {user}=await verifyToken(t);
        setTimeout(()=>{ location.href=(user.role==='admin'?RD.ADMIN:RD.CITIZEN); },150);
      }catch{
        clearSession(); toast('Session expired. Please log in.','warning');
      }
    }
  }

  document.addEventListener('DOMContentLoaded',()=>{ new LoginUI(); });
})();
