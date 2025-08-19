/* CityFix — Reports page (photo-safe, no image errors) */
(() => {
  'use strict';

  const API = {
    BASE: (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
      ? 'http://localhost:5000/api'
      : `${location.origin}/api`,
    PATH: {
      REPORTS: '/reports',
      STATUS: '/reports/:id/status',
      DELETE: '/reports/:id',
      DISTRICTS: '/districts',
      TYPES: '/report-types',
      STATS: '/reports/statistics'
    }
  };

  const PAGE_SIZE = 12;
  let page = 1, total = 0, pages = 1, sort = 'newest';
  let rows = [];
  let cachedDistricts = null, cachedTypes = null;
  let contextMenu = null;

  const el = {
    table: document.querySelector('.reports-table'),
    thead: document.querySelector('.reports-table thead'),
    tbody: document.querySelector('.reports-table tbody'),
    search: document.getElementById('searchInput'),
    issue: document.getElementById('issueTypeFilter'),
    district: document.getElementById('districtFilter'),
    status: document.getElementById('statusFilter'),
    dateFrom: document.getElementById('dateFrom'),
    exportBtn: document.querySelector('.export-btn'),
    filterBtn: document.querySelector('.filter-btn'),
    pageInfo: document.querySelector('.pagination-info span'),
    prev: document.getElementById('prevBtn'),
    next: document.getElementById('nextBtn')
  };

  document.addEventListener('DOMContentLoaded', async () => {
    injectStyles();
    ensurePhotoColumn();
    hookEvents();
    await loadDropdowns();
    await loadReports();
    try {
      const s = await request(API.PATH.STATS);
      document.querySelector('[data-stat="total"]')?.replaceChildren(String(s.total ?? 0));
      document.querySelector('[data-stat="resolved"]')?.replaceChildren(String(s.resolved ?? 0));
      document.querySelector('[data-stat="in-progress"]')?.replaceChildren(String(s.inProgress ?? 0));
      document.querySelector('[data-stat="pending"]')?.replaceChildren(String(s.pending ?? 0));
    } catch {}
  });

  function hookEvents() {
    el.tbody?.addEventListener('click', (e) => {
      const btn = e.target.closest('.action-menu-btn');
      if (btn) {
        e.stopPropagation();
        openMenu(btn, btn.closest('tr')?.dataset.id);
        return;
      }
      const photoBtn = e.target.closest('.photo-btn');
      if (photoBtn) { e.stopPropagation(); showImage(photoBtn.dataset.src); return; }
      const row = e.target.closest('tr.report-row');
      if (row && !e.target.closest('.actions-cell')) goDetails(row.dataset.id);
    });

    el.prev?.addEventListener('click', () => { if (page > 1) { page--; loadReports(); } });
    el.next?.addEventListener('click', () => { if (page < pages) { page++; loadReports(); } });
    el.filterBtn?.addEventListener('click', () => { page = 1; loadReports(); });

    const onFilter = debounce(() => { page = 1; loadReports(); }, 350);
    el.search?.addEventListener('input', onFilter);
    el.issue?.addEventListener('change', onFilter);
    el.district?.addEventListener('change', onFilter);
    el.status?.addEventListener('change', onFilter);
    el.dateFrom?.addEventListener('change', onFilter);

    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') { e.preventDefault(); el.search?.focus(); }
      if (e.key === 'Escape') { closeMenu(); document.querySelector('.cf-img-modal')?.remove(); document.querySelector('.cf-status-modal')?.remove(); }
    });

    el.exportBtn?.addEventListener('click', exportPDF);
  }

  async function loadReports() {
    showLoading();
    try {
      const qs = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), sort });
      if (el.search?.value) qs.set('search', el.search.value);
      if (el.issue?.value) qs.set('issueType', mapIssue(el.issue.value));
      if (el.district?.value) qs.set('district', el.district.value);
      if (el.status?.value) qs.set('status', el.status.value);
      if (el.dateFrom?.value) qs.set('dateFrom', el.dateFrom.value);

      const res = await request(`${API.PATH.REPORTS}?${qs.toString()}`);
      const list = (Array.isArray(res) && res) || res.reports || res.items || res.data || [];
      rows = list;
      total = res.total ?? res.count ?? (Array.isArray(list) ? list.length : 0);
      pages = res.pages ?? Math.max(1, Math.ceil(total / PAGE_SIZE));
      page = res.page || page;

      renderTable();
      updatePager();
    } catch (e) {
      showError(e.message || 'Failed to load reports.');
    }
  }

  async function loadDropdowns() {
    try {
      if (!cachedDistricts) {
        const r = await request(API.PATH.DISTRICTS);
        cachedDistricts = r.data || r.districts || r || [];
      }
      fillSelect(el.district, cachedDistricts, 'All Districts');
    } catch {
      fillSelect(el.district, ['Downtown','North','West','East','Suburbs'], 'All Districts');
    }
    try {
      if (!cachedTypes) {
        const r = await request(API.PATH.TYPES);
        cachedTypes = r.data || r.reportTypes || r || [];
      }
      fillSelect(el.issue, cachedTypes, 'All Issue Types');
    } catch {
      fillSelect(el.issue, ['Lighting','Roads','Drainage','Sanitation','Parks'], 'All Issue Types');
    }
  }

  function renderTable() {
    if (!el.tbody) return;
    if (!rows.length) { showEmpty(); return; }

    el.tbody.innerHTML = rows.map(r => {
      const id = r._id || r.id || r.reportId || '';
      const displayId = id ? `#${String(id).slice(-5).toUpperCase()}` : '#00000';
      const location = formatLocation(r.location, { address: r.address, street: r.street, city: r.city, text: r.locationText });
      const type = formatType(r.issueType || r.type, { category: r.category, typeName: r.typeName });
      const s = (r.status || 'pending').toLowerCase();
      const date = r.createdAt || r.timestamp || r.date;

      const rawPhoto = firstPhotoCandidate(r);
      const photo = sanitizeImageUrl(rawPhoto); // returns '' if invalid

      return `
        <tr class="report-row" data-id="${attr(id)}">
          <td class="cell-id">${esc(displayId)}</td>
          <td class="cell-title">${esc(r.title || 'Untitled')}</td>
          <td class="cell-photo">
            ${photo
              ? `<button class="photo-btn" data-src="${attr(photo)}" title="View photo">
                   <img class="photo-thumb"
                        src="${attr(photo)}"
                        alt=""
                        loading="lazy"
                        decoding="async"
                        referrerpolicy="no-referrer"
                        onerror="this.onerror=null;this.closest('.cell-photo').innerHTML='<span class=&quot;no-photo&quot;>—</span>';">
                 </button>`
              : `<span class="no-photo">—</span>`
            }
          </td>
          <td class="cell-location">${esc(location)}</td>
          <td class="cell-type">${esc(type)}</td>
          <td class="cell-status"><span class="status-badge ${statusClass(s)}">${statusText(s)}</span></td>
          <td class="cell-date">${fmtDate(date)}</td>
          <td class="actions-cell"><button class="action-menu-btn" aria-label="Actions">⋮</button></td>
        </tr>`;
    }).join('');
  }

  function updatePager() {
    if (!el.pageInfo) return;
    const start = Math.min((page - 1) * PAGE_SIZE + 1, Math.max(total, 0));
    const end = Math.min(page * PAGE_SIZE, Math.max(total, 0));
    el.pageInfo.textContent = `Showing ${start} to ${end} of ${total} entries`;
    if (el.prev) el.prev.disabled = page === 1;
    if (el.next) el.next.disabled = page >= pages;
  }

  function showLoading() {
    if (!el.tbody) return;
    el.tbody.innerHTML = `
      <tr><td colspan="${getColspan()}" style="text-align:center;padding:42px">
        <div class="spinner"></div>
        <div style="margin-top:10px;color:#6b7280">Loading...</div>
      </td></tr>`;
  }
  function showEmpty() {
    el.tbody.innerHTML = `
      <tr><td colspan="${getColspan()}" style="text-align:center;padding:60px 20px;color:#6b7280">
        <div style="font-size:44px;margin-bottom:8px">📋</div>No reports found.
      </td></tr>`;
  }
  function showError(msg) {
    el.tbody.innerHTML = `
      <tr><td colspan="${getColspan()}" style="text-align:center;padding:60px 20px;color:#dc2626">
        <div style="font-size:44px;margin-bottom:8px">⚠️</div>${esc(msg)}
      </td></tr>`;
  }

  function ensurePhotoColumn() {
    if (!el.thead) return;
    const tr = el.thead.querySelector('tr'); if (!tr) return;
    const already = [...tr.children].some(th => (th.dataset.col || th.textContent.trim().toLowerCase()) === 'photo');
    if (already) return;
    const idxTitle = [...tr.children].findIndex(th => th.textContent.trim().toLowerCase() === 'title');
    const th = document.createElement('th');
    th.dataset.col = 'photo';
    th.textContent = 'Photo';
    th.className = 'col-photo';
    if (idxTitle >= 0 && idxTitle < tr.children.length - 1) tr.insertBefore(th, tr.children[idxTitle + 1]);
    else tr.insertBefore(th, tr.firstChild.nextSibling);
  }
  function getColspan() { const n = el.thead ? el.thead.querySelectorAll('th').length : 8; return Math.max(n, 8); }

  function openMenu(anchorBtn, id) {
    closeMenu();
    const m = document.createElement('div');
    m.className = 'cf-menu';
    m.innerHTML = `
      <button data-cmd="view" data-id="${attr(id)}">View details</button>
      <button data-cmd="status" data-id="${attr(id)}">Edit status</button>
      <button data-cmd="assign" data-id="${attr(id)}">Assign team</button>
      <button class="danger" data-cmd="delete" data-id="${attr(id)}">Delete</button>`;
    document.body.appendChild(m);
    const r = anchorBtn.getBoundingClientRect();
    const mw = m.offsetWidth, mh = m.offsetHeight;
    let left = Math.max(8, r.right - mw), top = r.bottom + 6;
    if (top + mh > innerHeight - 8) top = r.top - mh - 6;
    m.style.left = `${left}px`; m.style.top = `${top}px`;
    m.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-cmd]'); if (!b) return;
      const rid = b.dataset.id, cmd = b.dataset.cmd;
      if (cmd === 'view') goDetails(rid);
      if (cmd === 'status') openStatusModal(rid);
      if (cmd === 'assign') toast('Team assignment coming soon', 'info');
      if (cmd === 'delete') confirmDelete(rid);
      closeMenu();
    }, { once: true });
    setTimeout(() => document.addEventListener('click', closeMenu, { once: true }), 0);
    contextMenu = m;
  }
  function closeMenu() { if (contextMenu) { contextMenu.remove(); contextMenu = null; } }
  function goDetails(id) { if (id) location.href = `ReportsDetails.html?id=${encodeURIComponent(id)}`; }

  function openStatusModal(id) {
    const host = document.createElement('div');
    host.className = 'cf-status-modal';
    host.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-card">
        <h3>Update Report Status</h3>
        <div class="grid">
          ${['new','pending','in-progress','resolved','rejected','closed'].map(s =>
            `<button data-new="${s}" class="status-option ${statusClass(s)}">${statusText(s)}</button>`).join('')}
        </div>
        <div class="actions"><button class="close">Cancel</button></div>
      </div>`;
    document.body.appendChild(host);
    setTimeout(() => host.classList.add('show'), 10);
    host.querySelector('.modal-backdrop').onclick = () => host.remove();
    host.querySelector('.close').onclick = () => host.remove();
    host.querySelectorAll('[data-new]').forEach(b => b.onclick = async () => { host.remove(); await updateStatus(id, b.dataset.new); });
  }
  async function updateStatus(id, status) {
    try {
      await request(API.PATH.STATUS.replace(':id', id), { method: 'PATCH', body: JSON.stringify({ status }) });
      toast('Status updated', 'success'); await loadReports();
    } catch (e) { toast(e.message || 'Failed to update status', 'error'); }
  }
  async function confirmDelete(id) {
    if (!confirm('Delete this report?')) return;
    try { await request(API.PATH.DELETE.replace(':id', id), { method: 'DELETE' }); toast('Report deleted', 'success'); await loadReports(); }
    catch (e) { toast(e.message || 'Delete failed', 'error'); }
  }

  async function exportPDF() {
    if (!(window.jspdf?.jsPDF && window.jspdf.jsPDF.prototype?.autoTable)) {
      toast('jsPDF + autoTable required on the page.', 'error'); return;
    }
    try {
      toast('Preparing PDF...', 'info');
      const qs = new URLSearchParams();
      if (el.search?.value) qs.set('search', el.search.value);
      if (el.issue?.value) qs.set('issueType', mapIssue(el.issue.value));
      if (el.district?.value) qs.set('district', el.district.value);
      if (el.status?.value) qs.set('status', el.status.value);
      if (el.dateFrom?.value) qs.set('dateFrom', el.dateFrom.value);
      qs.set('page', '1'); qs.set('limit', '1000'); qs.set('sort', sort);

      let list = [];
      try {
        const res = await request(`${API.PATH.REPORTS}?${qs.toString()}`);
        list = res?.reports || res?.items || res?.data || (Array.isArray(res) ? res : []);
      } catch { list = rows; }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const margin = 40;

      doc.setFont('helvetica','bold'); doc.setFontSize(16);
      doc.text('CityFix — Reports Export', margin, 40);
      doc.setFont('helvetica','normal'); doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 58);

      const head = [['ID','Title','Photo','Location','Type','Status','Date']];
      const body = list.map(r => [
        String((r._id || r.id || '')).slice(-5).toUpperCase(),
        r.title || '',
        sanitizeImageUrl(firstPhotoCandidate(r)) ? 'Yes' : '—',
        typeof r.location === 'string' ? r.location : formatLocation(r.location, { address:r.address, street:r.street, city:r.city }),
        typeof r.issueType === 'string' ? r.issueType : formatType(r.issueType || r.type, { category:r.category }),
        typeof r.status === 'string' ? r.status : statusText(r.status),
        fmtDate(r.createdAt || r.timestamp || r.date)
      ]);

      doc.autoTable({
        startY: 80, head, body,
        styles: { fontSize: 9, cellPadding: 6, overflow: 'linebreak' },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        columnStyles: {
          0:{cellWidth:60}, 1:{cellWidth:220}, 2:{cellWidth:60, halign:'center'},
          3:{cellWidth:220}, 4:{cellWidth:110}, 5:{cellWidth:90, halign:'center'}, 6:{cellWidth:100}
        },
        margin: { left: margin, right: margin },
        didDrawPage: (d) => {
          const w = d.doc.internal.pageSize.getWidth(), h = d.doc.internal.pageSize.getHeight();
          d.doc.setFontSize(9); d.doc.text(`Page ${d.doc.internal.getNumberOfPages()}`, w - margin, h - 20, { align: 'right' });
        }
      });

      doc.save(`cityfix-reports-${new Date().toISOString().slice(0,10)}.pdf`);
      toast('PDF downloaded', 'success');
    } catch { toast('Export failed', 'error'); }
  }

  /* --------------- Image helpers (no errors) --------------- */
  function firstPhotoCandidate(r = {}) {
    return (
      r.photo || r.thumbnail || r.image || r.picture ||
      (Array.isArray(r.photos) && r.photos[0]) ||
      (Array.isArray(r.images) && r.images[0]) ||
      (Array.isArray(r.media) && r.media.find(m => (m?.type||m?.mime||'').startsWith('image'))) ||
      (Array.isArray(r.attachments) && r.attachments.find(a => (a?.type||a?.mime||'').startsWith('image'))) ||
      ''
    );
  }

  function sanitizeImageUrl(u) {
    if (!u) return '';
    const s = typeof u === 'string' ? u.trim() : (u.url || u.src || u.path || '').trim();
    if (!s) return '';
    const ok =
      s.startsWith('https://') ||
      s.startsWith('http://') ||
      s.startsWith('/') ||
      s.startsWith('data:image/');
    if (!ok) return '';                 // blocks blob: and invalid schemes => no request => no errors
    return s;
  }

  /* --------------- Misc helpers --------------- */
  function request(path, opt = {}) {
    const url = path.startsWith('http') ? path : API.BASE + path;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...(opt.headers || {})
    };
    return fetch(url, { ...opt, headers }).then(async (r) => {
      if (!r.ok) {
        let msg = `${r.status} ${r.statusText}`;
        try { const j = await r.json(); if (j?.message) msg = j.message; } catch {}
        throw new Error(msg);
      }
      try { return await r.json(); } catch { return {}; }
    });
  }
  function getToken() {
    const keys = ['cityfix_token','authToken','token','jwt','accessToken'];
    for (const store of [localStorage, sessionStorage]) {
      for (const k of keys) { const v = store.getItem(k); if (v) return v; }
    }
    return '';
  }
  function mapIssue(v) { const m = { lighting:'lighting', roads:'traffic', water:'drainage', waste:'garbage', parks:'other' }; return m[v] || v; }
  function fillSelect(select, data, firstLabel) {
    if (!select) return;
    select.innerHTML = `<option value="">${firstLabel}</option>`;
    data.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.value || d.id || d.slug || d.name || d;
      opt.textContent = d.name || d.title || d;
      select.appendChild(opt);
    });
  }
  function esc(s) { return String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function attr(s) { return String(s ?? '').replace(/"/g, '&quot;'); }
  function fmtDate(d) { if (!d) return 'N/A'; const x = new Date(d); return isNaN(x) ? 'N/A' : x.toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}); }
  function statusText(v='pending'){ const m={new:'New',pending:'Pending','in-progress':'In Progress',resolved:'Resolved',rejected:'Rejected',closed:'Closed'}; return m[String(v).toLowerCase()]||'Pending'; }
  function statusClass(v='pending'){ const m={new:'status-new',pending:'status-pending','in-progress':'status-progress',resolved:'status-resolved',rejected:'status-rejected',closed:'status-closed'}; return m[String(v).toLowerCase()]||'status-pending'; }
  function formatType(t, fb={}){ if(!t) return fb.category||fb.typeName||'—'; if(typeof t==='string') return t; if(Array.isArray(t)) return t.map(x=>x?.name||x?.title||x).join(', '); if(typeof t==='object') return t.name||t.title||t.slug||'—'; return '—'; }
  function formatLocation(loc, fb={}) {
    if (!loc) { const {address,street,city,text}=fb; if(address) return address; if(street&&city) return `${street}, ${city}`; return text||street||city||'—'; }
    if (typeof loc === 'string') return loc;
    if (Array.isArray(loc)) return loc.filter(Boolean).join(', ');
    if (typeof loc === 'object') {
      if (loc.formatted_address || loc.formatted) return loc.formatted_address || loc.formatted;
      if (loc.display_name || loc.address || loc.label || loc.text) return loc.display_name || loc.address || loc.label || loc.text;
      if (loc.name && loc.city) return `${loc.name}, ${loc.city}`;
      if (loc.street && loc.city) return `${loc.street}, ${loc.city}`;
      if (loc.city) return loc.city;
      if (loc.lat && loc.lng) return `${Number(loc.lat).toFixed(5)}, ${Number(loc.lng).toFixed(5)}`;
      if (loc.coordinates) {
        const c = loc.coordinates;
        if (Array.isArray(c) && c.length >= 2) return `${Number(c[1]).toFixed(5)}, ${Number(c[0]).toFixed(5)}`;
        if (c.lat && c.lng) return `${Number(c.lat).toFixed(5)}, ${Number(c.lng).toFixed(5)}`;
      }
      if (loc.geometry?.location?.lat && loc.geometry?.location?.lng) {
        const {lat,lng}=loc.geometry.location; return `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
      }
    }
    return '—';
  }
  function debounce(fn, ms=300){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }

  function injectStyles() {
    if (document.getElementById('cf-reports-inline')) return;
    const s = document.createElement('style');
    s.id = 'cf-reports-inline';
    s.textContent = `
      .spinner{width:40px;height:40px;border-radius:50%;border:4px solid #eee;border-top-color:#2563eb;animation:spin 1s linear infinite}
      @keyframes spin{to{transform:rotate(360deg)}}
      .col-photo{width:88px}
      .cell-photo{text-align:center}
      .photo-btn{display:inline-flex;align-items:center;justify-content:center;background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:2px;cursor:pointer}
      .photo-btn:hover{box-shadow:0 6px 18px rgba(0,0,0,.08)}
      .photo-thumb{width:52px;height:52px;border-radius:8px;object-fit:cover;background:#eef2f7}
      .no-photo{color:#9ca3af;display:inline-block;min-width:52px;text-align:center}
      .action-menu-btn{background:transparent;border:0;color:#6b7280;font-size:18px;padding:6px 8px;border-radius:8px;cursor:pointer}
      .action-menu-btn:hover{background:#f3f4f6;color:#111827}
      .cf-menu{position:fixed;min-width:190px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:6px;z-index:9999;box-shadow:0 14px 36px rgba(0,0,0,.12)}
      .cf-menu button{display:block;width:100%;text-align:left;background:none;border:none;padding:10px 12px;border-radius:10px;cursor:pointer}
      .cf-menu button:hover{background:#f3f4f6}
      .cf-menu .danger{color:#ef4444}
      .cf-img-modal{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;opacity:0;transition:.2s;z-index:10000}
      .cf-img-modal.show{opacity:1}
      .cf-img-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.55)}
      .cf-img-box{position:relative;background:#fff;border-radius:14px;max-width:min(92vw,980px);max-height:80vh;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.35)}
      .cf-img-box img{display:block;max-width:100%;max-height:80vh}
      .cf-img-close{position:absolute;top:8px;right:8px;background:#111827;color:#fff;border:0;border-radius:8px;padding:6px 10px;cursor:pointer}
      .cf-status-modal{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;opacity:0;transition:.2s;z-index:10000}
      .cf-status-modal.show{opacity:1}
      .cf-status-modal .modal-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.5)}
      .cf-status-modal .modal-card{position:relative;background:#fff;border-radius:14px;min-width:340px;padding:16px;box-shadow:0 20px 60px rgba(0,0,0,.25)}
      .cf-status-modal .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0}
      .cf-status-modal .actions{text-align:right}
      .cf-toast{pointer-events:none}
    `;
    document.head.appendChild(s);
  }

  function showImage(url) {
    if (!url) return;
    const m = document.createElement('div');
    m.className = 'cf-img-modal';
    m.innerHTML = `
      <div class="cf-img-backdrop"></div>
      <div class="cf-img-box">
        <button class="cf-img-close" aria-label="Close">×</button>
        <img src="${attr(url)}" alt="">
      </div>`;
    document.body.appendChild(m);
    setTimeout(() => m.classList.add('show'), 10);
    m.querySelector('.cf-img-backdrop').onclick = () => m.remove();
    m.querySelector('.cf-img-close').onclick = () => m.remove();
  }

  function toast(message, type = 'info') {
    const colors = { success:'#16a34a', error:'#dc2626', info:'#2563eb', warning:'#d97706' };
    const host = document.createElement('div');
    host.className = 'cf-toast';
    host.style.cssText = 'position:fixed;top:20px;right:20px;z-index:10001';
    host.innerHTML = `<div class="cf-toast-inner" style="background:${colors[type]};color:#fff;padding:12px 16px;border-radius:10px;box-shadow:0 10px 24px rgba(0,0,0,.2);font-weight:600">${esc(message)}</div>`;
    document.body.appendChild(host);
    setTimeout(() => host.remove(), 3000);
  }
})();
