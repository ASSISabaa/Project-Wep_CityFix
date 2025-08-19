// CityFix Reports Management - Full with robust PDF export
'use strict';

/* API */
const API_CONFIG = {
  BASE_URL:
    (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
      ? 'http://localhost:5000/api'
      : `${location.origin}/api`,
  ENDPOINTS: {
    REPORTS: '/reports',
    STATISTICS: '/reports/statistics',
    DISTRICTS: '/districts',
    REPORT_TYPES: '/report-types',
    UPDATE_STATUS: '/reports/:id/status',
    DELETE_REPORT: '/reports/:id'
  }
};

/* State */
let reportsData = [];
let currentPage = 1;
let totalPages = 1;
let totalReports = 0;
const itemsPerPage = 12;
let sortConfig = 'newest';
let isLoading = false;
let cachedDistricts = null;
let cachedReportTypes = null;

/* DOM */
const reportsTableBody = document.querySelector('.reports-table tbody');
const searchInput = document.getElementById('searchInput');
const issueTypeFilter = document.getElementById('issueTypeFilter');
const districtFilter = document.getElementById('districtFilter');
const statusFilter = document.getElementById('statusFilter');
const dateFromInput = document.getElementById('dateFrom');
const exportBtn = document.querySelector('.export-btn');
const filterBtn = document.querySelector('.filter-btn');
const paginationInfo = document.querySelector('.pagination-info span');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

/* Enums mapping (UI -> backend) */
const ALLOWED_ISSUES = ['pothole', 'lighting', 'drainage', 'traffic', 'safety', 'vandalism', 'garbage', 'other'];
const ISSUE_MAP = {
  lighting: 'lighting',
  roads: 'traffic',
  water: 'drainage',
  waste: 'garbage',
  parks: 'other'
};

/* Auth */
function getAuthToken() {
  return (
    localStorage.getItem('cityfix_token') ||
    sessionStorage.getItem('cityfix_token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('token') ||
    ''
  );
}

/* HTTP */
async function makeApiRequest(endpoint, options = {}) {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json', ...options.headers };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      let msg = `${res.status} ${res.statusText}`;
      try { const j = await res.json(); if (j?.message) msg = j.message; } catch {}
      throw new Error(msg);
    }
    try { return await res.json(); } catch { return {}; }
  } catch (e) { handleApiError(e, options.method); throw e; }
}
function handleApiError(error, method = 'GET') {
  let message = error?.message || 'Unexpected error';
  if (message.includes('Failed to fetch')) message = 'Failed to connect to server. Verify backend and BASE_URL.';
  else if (message.startsWith('404')) message = 'Endpoint not found. Check API routes.';
  else if (message.startsWith('401') && method !== 'GET') message = 'Unauthorized. Please login again.';
  toast(message, 'error');
}

/* UI utils */
function showLoading() {
  if (isLoading || !reportsTableBody) return;
  isLoading = true;
  reportsTableBody.innerHTML = `
    <tr>
      <td colspan="7" style="text-align:center;padding:40px">
        <div class="loading-container">
          <div class="spinner"></div>
          <div style="margin-top:15px;color:#666">Loading reports...</div>
        </div>
      </td>
    </tr>`;
}
function hideLoading() { isLoading = false; }
function showEmptyState() {
  if (!reportsTableBody) return;
  reportsTableBody.innerHTML = `
    <tr>
      <td colspan="7" style="text-align:center;padding:60px 20px;color:#6c757d">
        <div style="font-size:48px;margin-bottom:12px">📋</div>
        <div style="font-size:16px">No reports found. Try adjusting filters.</div>
      </td>
    </tr>`;
}
function showErrorInTable(message) {
  if (!reportsTableBody) return;
  reportsTableBody.innerHTML = `
    <tr>
      <td colspan="7" style="text-align:center;padding:60px 20px;color:#dc3545">
        <div style="font-size:48px;margin-bottom:12px">⚠️</div>
        <div style="font-size:16px">${escapeHtml(message)}</div>
      </td>
    </tr>`;
}
function toast(message, type = 'info') {
  const colors = { success: '#16a34a', error: '#dc2626', info: '#2563eb', warning: '#d97706' };
  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
  const old = document.querySelector('.notification-toast'); if (old) old.remove();
  const n = document.createElement('div');
  n.className = 'notification-toast';
  n.innerHTML = `
    <div style="background:${colors[type]};color:#fff;padding:14px 18px;border-radius:8px;
                position:fixed;top:20px;right:20px;z-index:10001;display:flex;gap:10px;
                box-shadow:0 4px 12px rgba(0,0,0,.15);min-width:280px;animation:slideIn .25s ease">
      <span style="font-size:18px">${icons[type]}</span>
      <span style="flex:1">${escapeHtml(message)}</span>
      <button style="background:none;border:none;color:#fff;font-size:18px;cursor:pointer">×</button>
    </div>`;
  n.querySelector('button').onclick = () => n.remove();
  document.body.appendChild(n);
  setTimeout(() => { if (n.parentNode) n.remove(); }, 4200);
}
function injectStyles() {
  if (document.getElementById('cf-reports-styles')) return;
  const s = document.createElement('style');
  s.id = 'cf-reports-styles';
  s.textContent = `
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:none;opacity:1}}
    .spinner{width:40px;height:40px;border-radius:50%;border:4px solid #f3f3f3;border-top-color:#2563eb;animation:spin 1s linear infinite;margin:0 auto}
    .action-menu-btn{background:none;border:none;font-size:18px;cursor:pointer;color:#6b7280;padding:6px 8px;border-radius:6px}
    .action-menu-btn:hover{background:#f3f4f6;color:#111827}
    .cf-action-menu{position:fixed;min-width:180px;background:#fff;border:1px solid #e5e7eb;border-radius:10px;
      box-shadow:0 10px 30px rgba(0,0,0,.08);padding:6px;z-index:9999}
    .cf-action-menu button{display:block;width:100%;text-align:left;background:none;border:none;padding:10px 12px;border-radius:8px;cursor:pointer}
    .cf-action-menu button:hover{background:#f3f4f6}
    .cf-action-menu .danger{color:#ef4444}
    .report-row{transition:background .15s ease}
    .report-row:hover{background:#f8f9fa}
  `;
  document.head.appendChild(s);
}

/* Formatters */
function escapeHtml(x) {
  return String(x ?? '').replace(/[&<>"']/g, (m) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
function fmtDate(d) {
  if (!d) return 'N/A';
  const date = new Date(d);
  return isNaN(date.getTime()) ? 'N/A' :
    date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function statusClass(s = 'pending') {
  return ({
    new: 'status-new',
    pending: 'status-pending',
    'in-progress': 'status-progress',
    resolved: 'status-resolved',
    rejected: 'status-rejected',
    closed: 'status-closed'
  }[String(s).toLowerCase()] || 'status-pending');
}
function statusText(s = 'pending') {
  return ({
    new: 'New',
    pending: 'Pending',
    'in-progress': 'In Progress',
    resolved: 'Resolved',
    rejected: 'Rejected',
    closed: 'Closed'
  }[String(s).toLowerCase()] || 'Pending');
}
function formatLocation(loc, fallbacks = {}) {
  if (!loc) {
    const { address, street, city } = fallbacks;
    if (address) return address;
    if (street && city) return `${street}, ${city}`;
    return street || city || '—';
  }
  if (typeof loc === 'string') return loc;
  if (Array.isArray(loc)) return loc.filter(Boolean).join(', ');
  if (typeof loc === 'object') {
    if (loc.formatted_address) return loc.formatted_address;
    if (loc.address) return loc.address;
    if (loc.name && loc.city) return `${loc.name}, ${loc.city}`;
    if (loc.street && loc.city) return `${loc.street}, ${loc.city}`;
    if (loc.city) return loc.city;
    if (loc.lat && loc.lng) return `${Number(loc.lat).toFixed(5)}, ${Number(loc.lng).toFixed(5)}`;
    if (loc.coordinates) {
      const c = loc.coordinates;
      if (Array.isArray(c) && c.length >= 2) {
        const [lng, lat] = c;
        return `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
      }
      if (c.lat && c.lng) return `${Number(c.lat).toFixed(5)}, ${Number(c.lng).toFixed(5)}`;
    }
    if (loc.geometry?.location?.lat && loc.geometry?.location?.lng) {
      const { lat, lng } = loc.geometry.location;
      return `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
    }
  }
  return '—';
}
function formatType(t, fb = {}) {
  if (!t) return fb.category || fb.typeName || fb.issueType || '—';
  if (typeof t === 'string') return t;
  if (Array.isArray(t)) return t.map((x) => x.name || x.title || x).join(', ');
  if (typeof t === 'object') return t.name || t.title || t.slug || '—';
  return '—';
}

/* Data loading */
async function loadReports() {
  try {
    showLoading();

    const params = new URLSearchParams({
      page: String(currentPage),
      limit: String(itemsPerPage),
      sort: sortConfig
    });

    if (searchInput?.value) params.append('search', searchInput.value);

    if (issueTypeFilter?.value) {
      const mapped = ISSUE_MAP[issueTypeFilter.value] || issueTypeFilter.value;
      if (ALLOWED_ISSUES.includes(mapped)) params.append('issueType', mapped);
    }

    if (districtFilter?.value) params.append('district', districtFilter.value);
    if (statusFilter?.value) params.append('status', statusFilter.value);
    if (dateFromInput?.value) params.append('dateFrom', dateFromInput.value);

    const endpoint = `${API_CONFIG.ENDPOINTS.REPORTS}?${params.toString()}`;
    const response = await makeApiRequest(endpoint);

    const list =
      (Array.isArray(response) && response) ||
      response.reports ||
      response.items ||
      response.data ||
      [];

    reportsData = list;

    totalReports = response.total ?? response.count ?? (Array.isArray(list) ? list.length : 0);
    totalPages = response.pages ?? Math.max(1, Math.ceil(totalReports / itemsPerPage));
    currentPage = response.page || currentPage;

    renderReportsTable();
    updatePaginationInfo();
  } catch (error) {
    console.error('loadReports error:', error);
    showErrorInTable(error.message || 'Failed to load reports.');
  } finally { hideLoading(); }
}

async function loadDropdownOptions() {
  try { await loadDistricts(); } catch { useDefaultDistricts(); }
  try { await loadReportTypes(); } catch { useDefaultReportTypes(); }
}
async function loadDistricts() {
  if (cachedDistricts) return populateDistrictsDropdown(cachedDistricts);
  const res = await makeApiRequest(API_CONFIG.ENDPOINTS.DISTRICTS);
  const arr = res.data || res.districts || res || [];
  cachedDistricts = arr; populateDistrictsDropdown(arr);
}
async function loadReportTypes() {
  if (cachedReportTypes) return populateReportTypesDropdown(cachedReportTypes);
  const res = await makeApiRequest(API_CONFIG.ENDPOINTS.REPORT_TYPES);
  const arr = res.data || res.reportTypes || res || [];
  cachedReportTypes = arr; populateReportTypesDropdown(arr);
}
function populateDistrictsDropdown(districts) {
  if (!districtFilter) return;
  districtFilter.innerHTML = '<option value="">All Districts</option>';
  districts.forEach((d) => {
    const opt = document.createElement('option');
    opt.value = d.value || d.id || d.slug || d.name || d;
    opt.textContent = d.name || d.title || d;
    districtFilter.appendChild(opt);
  });
}
function populateReportTypesDropdown(types) {
  if (!issueTypeFilter) return;
  issueTypeFilter.innerHTML = '<option value="">All Issue Types</option>';
  types.forEach((t) => {
    const opt = document.createElement('option');
    opt.value = t.value || t.id || t.slug || t.name || t;
    opt.textContent = t.name || t.title || t;
    issueTypeFilter.appendChild(opt);
  });
}
function useDefaultDistricts() {
  populateDistrictsDropdown(['Downtown', 'North Side', 'West End', 'East End', 'Suburbs']);
}
function useDefaultReportTypes() {
  populateReportTypesDropdown(['Lighting', 'Roads', 'Drainage', 'Sanitation', 'Parks']);
}

/* Render */
function renderReportsTable() {
  if (!reportsTableBody) return;
  if (!reportsData || reportsData.length === 0) { showEmptyState(); return; }

  reportsTableBody.innerHTML = reportsData.map((report) => {
    const id = report._id || report.id || report.reportId || '';
    const displayId = id ? `#${String(id).slice(-5).toUpperCase()}` : '#00000';
    const location = formatLocation(report.location, { address: report.address, street: report.street, city: report.city });
    const type = formatType(report.issueType || report.type, { category: report.category, typeName: report.typeName, issueType: report.issueType });
    const s = (report.status || 'pending').toLowerCase();
    const date = report.createdAt || report.timestamp || report.date;

    return `
      <tr class="report-row" data-report-id="${escapeHtml(id)}">
        <td class="report-id">${escapeHtml(displayId)}</td>
        <td class="report-title">${escapeHtml(report.title || 'Untitled')}</td>
        <td class="report-location">${escapeHtml(location)}</td>
        <td class="report-type">${escapeHtml(type)}</td>
        <td><span class="status-badge ${statusClass(s)}">${statusText(s)}</span></td>
        <td class="report-date">${fmtDate(date)}</td>
        <td class="actions-cell"><button class="action-menu-btn" aria-label="Actions">⋮</button></td>
      </tr>`;
  }).join('');
}

/* Pagination */
function updatePaginationInfo() {
  if (!paginationInfo) return;
  const startItem = Math.min((currentPage - 1) * itemsPerPage + 1, Math.max(totalReports, 0));
  const endItem = Math.min(currentPage * itemsPerPage, Math.max(totalReports, 0));
  paginationInfo.textContent = `Showing ${startItem} to ${endItem} of ${totalReports} entries`;
  if (prevBtn) { prevBtn.disabled = currentPage === 1; prevBtn.style.opacity = currentPage === 1 ? '0.5' : '1'; prevBtn.style.cursor = currentPage === 1 ? 'not-allowed' : 'pointer'; }
  if (nextBtn) { nextBtn.disabled = currentPage >= totalPages; nextBtn.style.opacity = currentPage >= totalPages ? '0.5' : '1'; nextBtn.style.cursor = currentPage >= totalPages ? 'not-allowed' : 'pointer'; }
}
function previousPage() { if (currentPage > 1) { currentPage--; loadReports(); scrollTo({ top: 0, behavior: 'smooth' }); } }
function nextPage() { if (currentPage < totalPages) { currentPage++; loadReports(); scrollTo({ top: 0, behavior: 'smooth' }); } }

/* Actions */
let openMenu = null;
function openActionMenu(btn, reportId) {
  closeActionMenu();
  const menu = document.createElement('div');
  menu.className = 'cf-action-menu';
  menu.innerHTML = `
    <button data-cmd="view" data-id="${reportId}">View details</button>
    <button data-cmd="status" data-id="${reportId}">Edit status</button>
    <button data-cmd="assign" data-id="${reportId}">Assign team</button>
    <button data-cmd="delete" class="danger" data-id="${reportId}">Delete</button>`;
  document.body.appendChild(menu);
  const r = btn.getBoundingClientRect();
  const mw = menu.offsetWidth, mh = menu.offsetHeight;
  let left = Math.max(8, r.right - mw), top = r.bottom + 6;
  if (top + mh > innerHeight - 8) top = r.top - mh - 6;
  menu.style.left = `${left}px`; menu.style.top = `${top}px`;
  menu.addEventListener('click', onMenuCommand);
  setTimeout(() => document.addEventListener('click', closeActionMenu, { once: true }), 0);
  openMenu = menu;
}
function closeActionMenu() {
  if (openMenu) { openMenu.removeEventListener('click', onMenuCommand); openMenu.remove(); openMenu = null; }
}
function onMenuCommand(e) {
  const b = e.target.closest('button[data-cmd]'); if (!b) return;
  const id = b.dataset.id; const cmd = b.dataset.cmd;
  if (cmd === 'view') navigateToReportDetails(id);
  if (cmd === 'status') showStatusModal(id);
  if (cmd === 'assign') assignReport(id);
  if (cmd === 'delete') deleteReport(id);
  closeActionMenu();
}
function navigateToReportDetails(reportId) { if (reportId) location.href = `ReportsDetails.html?id=${encodeURIComponent(reportId)}`; }
async function deleteReport(reportId) {
  if (!confirm('Delete this report?')) return;
  try { await makeApiRequest(API_CONFIG.ENDPOINTS.DELETE_REPORT.replace(':id', reportId), { method: 'DELETE' }); toast('Report deleted', 'success'); await loadReports(); } catch {}
}
async function updateReportStatus(reportId, newStatus) {
  try { await makeApiRequest(API_CONFIG.ENDPOINTS.UPDATE_STATUS.replace(':id', reportId), { method: 'PATCH', body: JSON.stringify({ status: newStatus }) }); toast('Status updated', 'success'); await loadReports(); } catch {}
}
function showStatusModal(reportId) {
  document.querySelector('.status-modal')?.remove();
  const modal = document.createElement('div');
  modal.className = 'status-modal';
  modal.innerHTML = `
    <div class="modal-backdrop" onclick="this.parentElement.remove()"></div>
    <div class="modal-content">
      <h3>Update Report Status</h3>
      <div class="status-options">
        <button class="status-option status-new" onclick="updateStatus('${reportId}','new')">New</button>
        <button class="status-option status-pending" onclick="updateStatus('${reportId}','pending')">Pending</button>
        <button class="status-option status-progress" onclick="updateStatus('${reportId}','in-progress')">In Progress</button>
        <button class="status-option status-resolved" onclick="updateStatus('${reportId}','resolved')">Resolved</button>
        <button class="status-option status-rejected" onclick="updateStatus('${reportId}','rejected')">Rejected</button>
      </div>
      <button class="modal-close" onclick="this.closest('.status-modal').remove()">Cancel</button>
    </div>`;
  document.body.appendChild(modal);
}
function updateStatus(reportId, status) { document.querySelector('.status-modal')?.remove(); updateReportStatus(reportId, status); }
function assignReport() { toast('Team assignment feature coming soon!', 'info'); }

/* PDF Export */
async function exportReportsPDF() {
  try {
    toast('Preparing PDF...', 'info');

    const params = new URLSearchParams();
    if (searchInput?.value) params.append('search', searchInput.value);

    if (issueTypeFilter?.value) {
      const mapped = ISSUE_MAP[issueTypeFilter.value] || issueTypeFilter.value;
      if (ALLOWED_ISSUES.includes(mapped)) params.append('issueType', mapped);
    }

    if (districtFilter?.value) params.append('district', districtFilter.value);
    if (statusFilter?.value) params.append('status', statusFilter.value);
    if (dateFromInput?.value) params.append('dateFrom', dateFromInput.value);
    params.append('limit', '1000'); params.append('page', '1'); params.append('sort', typeof sortConfig === 'string' ? sortConfig : 'newest');

    const endpoint = `${API_CONFIG.ENDPOINTS.REPORTS}?${params.toString()}`;

    let list = [];
    try {
      const res = await makeApiRequest(endpoint);
      list = res?.reports || res?.items || res?.data || (Array.isArray(res) ? res : []);
    } catch {
      const trs = [...document.querySelectorAll('.reports-table tbody tr')];
      list = trs.map((tr) => {
        const tds = tr.querySelectorAll('td');
        const idCell = (tds[0]?.textContent || '').trim(); // like #12345
        return {
          _id: idCell.replace('#',''),
          title: tds[1]?.textContent?.trim() || '',
          location: tds[2]?.textContent?.trim() || '',
          issueType: tds[3]?.textContent?.trim() || '',
          status: tds[4]?.textContent?.trim() || '',
          createdAt: tds[5]?.textContent?.trim() || ''
        };
      }).filter(r => r.title);
    }

    if (!list.length) { toast('Nothing to export', 'warning'); return; }

    if (!window.jspdf || !window.jspdf.jsPDF || !window.jspdf.jsPDF.prototype) {
      toast('jsPDF not loaded. Add jsPDF and autoTable scripts in HTML.', 'error');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

    const marginX = 40;
    const now = new Date();
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text('CityFix — Reports Export', marginX, 40);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text(`Generated: ${now.toLocaleString()}`, marginX, 58);

    const filtersSummary = [
      searchInput?.value ? `Search: "${searchInput.value}"` : null,
      issueTypeFilter?.value ? `Type: ${issueTypeFilter.value}` : null,
      districtFilter?.value ? `District: ${districtFilter.value}` : null,
      statusFilter?.value ? `Status: ${statusFilter.value}` : null,
      dateFromInput?.value ? `From: ${dateFromInput.value}` : null
    ].filter(Boolean).join('  •  ') || 'All records';
    doc.text(filtersSummary, marginX, 74);

    const body = list.map((r) => [
      String((r._id || r.id || '')).slice(-5).toUpperCase(),
      (r.title || '').toString().trim(),
      typeof r.location === 'string' ? r.location : formatLocation(r.location, { address: r.address, street: r.street, city: r.city }),
      typeof r.issueType === 'string' ? r.issueType : formatType(r.issueType || r.type, { category: r.category }),
      typeof r.status === 'string' ? r.status : statusText(r.status),
      typeof r.createdAt === 'string' ? r.createdAt : fmtDate(r.createdAt || r.timestamp || r.date)
    ]);

    doc.autoTable({
      startY: 92,
      head: [['ID', 'Title', 'Location', 'Type', 'Status', 'Date']],
      body,
      styles: { fontSize: 9, cellPadding: 6, overflow: 'linebreak', valign: 'middle' },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 240 }, 2: { cellWidth: 240 }, 3: { cellWidth: 110 }, 4: { cellWidth: 90, halign: 'center' }, 5: { cellWidth: 100 } },
      margin: { left: marginX, right: marginX },
      didDrawPage: (data) => {
        const pageSize = data.doc.internal.pageSize;
        const pageWidth = pageSize.getWidth(); const pageHeight = pageSize.getHeight();
        const pageNumber = data.doc.internal.getNumberOfPages();
        data.doc.setFontSize(9);
        data.doc.text(`Page ${pageNumber}`, pageWidth - marginX, pageHeight - 20, { align: 'right' });
      }
    });

    doc.save(`cityfix-reports-${now.toISOString().slice(0, 10)}.pdf`);
    toast('PDF downloaded', 'success');
  } catch (e) { console.error(e); toast('PDF export failed', 'error'); }
}

/* Filters + events */
function applyFilters() { currentPage = 1; loadReports(); }
function debounce(fn, wait = 400) { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); }; }
function resetFilters() {
  if (searchInput) searchInput.value = '';
  if (issueTypeFilter) issueTypeFilter.value = '';
  if (districtFilter) districtFilter.value = '';
  if (statusFilter) statusFilter.value = '';
  if (dateFromInput) dateFromInput.value = '';
  currentPage = 1; sortConfig = 'newest'; loadReports();
}

/* Stats (optional) */
async function loadStatistics() {
  try {
    const els = {
      total: document.querySelector('[data-stat="total"]'),
      resolved: document.querySelector('[data-stat="resolved"]'),
      inProgress: document.querySelector('[data-stat="in-progress"]'),
      pending: document.querySelector('[data-stat="pending"]')
    };
    if (!els.total) return;
    const res = await makeApiRequest(API_CONFIG.ENDPOINTS.STATISTICS);
    if (res) {
      if (els.total) els.total.textContent = res.total ?? 0;
      if (els.resolved) els.resolved.textContent = res.resolved ?? 0;
      if (els.inProgress) els.inProgress.textContent = res.inProgress ?? 0;
      if (els.pending) els.pending.textContent = res.pending ?? 0;
    }
  } catch {}
}

/* Boot */
document.addEventListener('DOMContentLoaded', async () => {
  injectStyles();

  reportsTableBody?.addEventListener('click', (e) => {
    const menuBtn = e.target.closest('.action-menu-btn');
    if (menuBtn) {
      e.stopPropagation();
      const row = menuBtn.closest('tr');
      openActionMenu(menuBtn, row?.dataset.reportId || row?.getAttribute('data-report-id'));
      return;
    }
    const row = e.target.closest('tr.report-row');
    if (row && !e.target.closest('.actions-cell')) navigateToReportDetails(row.dataset.reportId || row.getAttribute('data-report-id'));
  });

  searchInput?.addEventListener('input', debounce(applyFilters, 500));
  issueTypeFilter?.addEventListener('change', applyFilters);
  districtFilter?.addEventListener('change', applyFilters);
  statusFilter?.addEventListener('change', applyFilters);
  dateFromInput?.addEventListener('change', applyFilters);

  prevBtn?.addEventListener('click', previousPage);
  nextBtn?.addEventListener('click', nextPage);

  if (exportBtn) {
    try { exportBtn.replaceWith(exportBtn.cloneNode(true)); } catch {} // clear old listeners if any
  }
  const freshExportBtn = document.querySelector('.export-btn');
  freshExportBtn?.addEventListener('click', exportReportsPDF);

  filterBtn?.addEventListener('click', applyFilters);

  addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); searchInput?.focus(); }
    if (e.key === 'Escape') { closeActionMenu(); document.querySelector('.status-modal')?.remove(); }
  });

  await loadDropdownOptions();
  await loadReports();
  loadStatistics();
});

/* Expose */
window.updateStatus = updateStatus;
window.resetFilters = resetFilters;
window.loadReports = loadReports;
window.exportReportsPDF = exportReportsPDF;
