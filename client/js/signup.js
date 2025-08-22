(() => {
  if (window.__CITYFIX_SIGNUP__) return;
  window.__CITYFIX_SIGNUP__ = true;

  const META_API = document.querySelector('meta[name="cityfix-api"]')?.content?.trim();
  const API_BASE = `${location.origin}/api`;

  const EP = { SIGNUP_TRY: ['/api/auth/signup','/api/auth/register','/api/users/register','/api/users/signup'] };
  const ST = { TOKEN:'cityfix_token', USER:'cityfix_user', ROLE:'cityfix_role' };

  const TA = () => window.Toast || window.toast || window.toastr || window.Notifier || null;
  function toast(msg, type='info'){
    const t = TA();
    if (t?.dismissAll) t.dismissAll();
    if (t?.clear) t.clear();
    if (t?.[type]) return t[type](msg);
    if (t?.show) return t.show(msg, { type, duration: 3200 });
    alert(msg);
  }

  const emailOk = (e)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e||'').trim());
  const onlyDigits = (s)=>String(s||'').replace(/\D/g,'');
  const q = (s, r=document)=>r.querySelector(s);

  async function http(path,{method='POST',body}) {
    const res = await fetch(API_BASE+path,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const txt = await res.text(); const json = txt?JSON.parse(txt):{};
    if(!res.ok){ const err=new Error(json.message||`HTTP ${res.status}`); err.status=res.status; throw err; }
    return json;
  }

  async function trySignup(payload){
    let last;
    for(const p of EP.SIGNUP_TRY){
      try{ return await http(p,{body:payload}); }
      catch(e){ last=e; if(e.status===404) continue; throw e; }
    }
    throw last||new Error('Signup endpoint not available');
  }

  function disable(btn,on){
    if(!btn) return;
    btn.disabled=on;
    if(on){ btn.dataset._txt = btn.textContent; btn.innerHTML = '<span class="spinner"></span> Creating account...'; }
    else{ btn.textContent = btn.dataset._txt || 'Sign Up'; }
  }

  function saveSession(token,user){
    if(token) localStorage.setItem(ST.TOKEN, token);
    if(user)  localStorage.setItem(ST.USER, JSON.stringify(user));
    if(user?.role) localStorage.setItem(ST.ROLE, user.role);
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const form = document.getElementById('signupForm') || q('form');
    if(!form) return;

    const el = {
      username: q('input[name="username"]', form),
      email:    q('input[name="email"]', form),
      password: q('input[name="password"]', form),
      userId:   q('input[name="userId"]', form) || q('input[name="nationalId"]', form),
      roleAll:  form.querySelectorAll('input[name="role"]'),
      submit:   q('button[type="submit"]', form)
    };

    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const username = el.username?.value?.trim();
      const email    = el.email?.value?.trim();
      const password = el.password?.value || '';
      const idRaw    = el.userId?.value?.trim();
      let role = 'citizen'; el.roleAll?.forEach(r=>{ if(r.checked) role=r.value; });

      if(!username || !email || !password) return toast('Please fill in all required fields','error');
      if(!emailOk(email)) return toast('Please enter a valid email address','error');
      if(password.length<6) return toast('Password must be at least 6 characters','error');

      const wantsAdmin = String(role).toLowerCase() === 'admin';
      let payload = { username, email, password, role };

      if (wantsAdmin) {
        const id = onlyDigits(idRaw);
        if (!id) return toast('National ID is required for admin registration','error');
        payload.nationalId = id;
      } else if (idRaw) {
        payload.userId = idRaw;
      }

      disable(el.submit,true);
      try{
        const res = await trySignup(payload);
        const ok = res.success !== false;
        if(!ok) throw new Error(res.message || 'Registration failed');

        const token = res?.data?.token || res?.token;
        const user  = res?.data?.user  || res?.user;
        if(token || user) saveSession(token,user);

        toast(`Account created successfully! Welcome ${username}!`,'success');
        const finalRole = (user?.role || role) === 'admin' ? 'admin' : 'citizen';
        setTimeout(()=>{ location.href = finalRole==='admin' ? 'dashboard.html' : 'index.html'; }, 900);
      }catch(err){
        toast(err?.message || 'Registration failed','error');
        form.style.animation='shake .4s'; setTimeout(()=>form.style.animation='',420);
      }finally{
        disable(el.submit,false);
      }
    });
  });
})();
