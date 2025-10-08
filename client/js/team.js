(function () {
  const API_BASE = `${location.origin}/api`;

  function getToken() {
    return (
      window.CITYFIX?.getToken?.() ||
      localStorage.getItem("cityfix_token") ||
      sessionStorage.getItem("cityfix_token") ||
      ""
    );
  }

  // --- DOM cache
  const els = {
    total: document.getElementById("total-members"),
    active: document.getElementById("active-members"),
    depts: document.getElementById("departments-count"),
    avail: document.getElementById("availability-rate"),
    grid: document.getElementById("team-members-grid"),
    searchInput: document.querySelector(".team-controls .search-input"),
    filterBtn: document.querySelector(".team-controls .filter-btn"),
    addBtn: document.querySelector(".add-member-btn"),
  };

  // force id/name to avoid Lighthouse/DevTools warning
  function ensureIdentity(el, id, name, auto = null) {
    if (!el) return;
    if (!el.id) el.id = id;
    if (!el.name) el.name = name;
    if (auto !== null) el.setAttribute("autocomplete", auto);
    // also make sure it's associated with a label if one exists
    const label = el.closest("label") || document.querySelector(`label[for="${el.id}"]`);
    if (!label) el.setAttribute("aria-label", name.replace(/[-_]/g, " "));
  }

  const state = {
    roles: ["admin"], // admin only
    search: "",
    department: "",
    status: "",
    limit: 24,
    items: [],
    lastHash: "",
    filterSheet: null,
    refreshTimer: null,
  };

  async function api(path, options = {}) {
    const res = await fetch(
      path.startsWith("http") ? path : `${API_BASE}${path}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        ...options,
      }
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `HTTP ${res.status}`);
    }
    return res.json();
  }

  function normalizeUser(u) {
    const name = u.fullName || u.name || u.username || u.displayName || "";
    const roleTitle = u.roleTitle || u.role || u.position || "Member";
    const roleRaw = String(u.role || u.roleName || u.roleTitle || u.position || "member").toLowerCase();
    const department =
      (u.profile && (u.profile.department || u.profile.dept)) ||
      u.department ||
      "General";
    const rawStatus =
      (u.presence && u.presence.status) ||
      u.status ||
      (u.isActive ? "active" : "offline") ||
      "offline";
    const status = String(rawStatus).toLowerCase();
    const lastActiveAt =
      u.lastActiveAt || u.lastLoginAt || u.updatedAt || u.createdAt;
    const casesAssigned =
      u.casesAssigned ??
      (u.statistics && u.statistics.assignedReports) ??
      u.assignedCount ??
      0;
    return {
      _id: String(u._id || u.id || ""),
      name,
      roleTitle,
      roleRaw,
      department,
      status,
      email: u.email || "",
      phone: u.phone || "",
      avatarUrl: u.avatarUrl || u.avatar || "",
      casesAssigned,
      lastActiveAt,
    };
  }

  const isAdminUser = (m) =>
    m.roleRaw === "admin" || /\badmin\b/i.test(m.roleTitle);

  function computeStats(list) {
    const total = list.length;
    const active = list.filter((m) => m.status === "active").length;
    const depts = new Set(list.map((m) => m.department).filter(Boolean)).size;
    const availability = total ? Math.round((active / total) * 100) : 0;
    if (els.total) els.total.textContent = String(total);
    if (els.active) els.active.textContent = String(active);
    if (els.depts) els.depts.textContent = String(depts);
    if (els.avail) els.avail.textContent = `${availability}%`;
  }

  function hashItems(items) {
    try {
      const base = items
        .map((i) => `${i._id}:${i.status}:${i.casesAssigned}:${i.roleTitle}`)
        .join("|");
      let h = 0;
      for (let i = 0; i < base.length; i++) h = (h * 31 + base.charCodeAt(i)) | 0;
      return String(h);
    } catch {
      return String(Math.random());
    }
  }

  async function fetchMembers() {
    // Prefer server-side role filtering
    try {
      const params = new URLSearchParams({
        role: "admin",
        page: "1",
        limit: "1000",
      });
      if (state.search) params.set("search", state.search);
      if (state.department) params.set("department", state.department);
      if (state.status) params.set("status", state.status);

      const res = await api(`/admin/users?${params.toString()}`);
      const users = (res.users || res.data || []).map(normalizeUser).filter(isAdminUser);
      state.items = dedupeById(users);
      computeStats(state.items);
      renderMembers();
      return;
    } catch (e) {
      console.warn("admin filter not supported, falling back to client-side filter", e);
    }

    // Fallback: fetch all and filter client-side
    try {
      const params2 = new URLSearchParams({ page: "1", limit: "1000" });
      if (state.search) params2.set("search", state.search);
      if (state.department) params2.set("department", state.department);
      if (state.status) params2.set("status", state.status);

      const res2 = await api(`/admin/users?${params2.toString()}`);
      const users2 = (res2.users || res2.data || []).map(normalizeUser).filter(isAdminUser);
      state.items = dedupeById(users2);
      computeStats(state.items);
      renderMembers();
    } catch (e) {
      console.error("users fetch failed", e);
      state.items = [];
      computeStats(state.items);
      renderMembers();
    }
  }

  function dedupeById(list) {
    const map = new Map();
    list.forEach((u) => {
      if (!u._id) return;
      if (!map.has(u._id)) map.set(u._id, u);
      else {
        const prev = map.get(u._id);
        map.set(u._id, {
          ...prev,
          ...u,
          casesAssigned: Math.max(prev.casesAssigned || 0, u.casesAssigned || 0),
        });
      }
    });
    return [...map.values()];
  }

  function timeAgo(ts) {
    if (!ts) return "-";
    const d = new Date(ts);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return "just now";
    const m = Math.floor(diff / 60);
    if (m < 60) return `${m} min ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} hours ago`;
    const days = Math.floor(h / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  function memberCard(m) {
    const initials =
      (m.name || "")
        .split(" ")
        .map((s) => s[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "TM";
    const statusClass =
      m.status === "active"
        ? "status-active"
        : m.status === "away"
        ? "status-away"
        : "status-offline";
    const avatarStyle = m.avatarUrl
      ? `style="background-image:url('${m.avatarUrl}');background-size:cover;background-position:center;"`
      : "";
    return `
      <div class="team-member-card" data-id="${m._id}">
        <div class="member-header">
          <div class="member-avatar" ${avatarStyle}>${m.avatarUrl ? "" : initials}</div>
          <div class="member-info">
            <h3>${m.name}</h3>
            <div class="member-role">${m.roleTitle}</div>
          </div>
        </div>
        <div class="member-details">
          <div class="detail-item"><span class="detail-label">Department:</span><span class="detail-value">${m.department}</span></div>
          <div class="detail-item"><span class="detail-label">Status:</span><span class="status-badge ${statusClass}">${m.status}</span></div>
          <div class="detail-item"><span class="detail-label">Cases Assigned:</span><span class="detail-value">${m.casesAssigned ?? 0}</span></div>
          <div class="detail-item"><span class="detail-label">Last Active:</span><span class="detail-value">${timeAgo(m.lastActiveAt)}</span></div>
        </div>
        <div class="member-actions">
          <button class="action-btn btn-primary" data-action="view" name="view-profile">View Profile</button>
          <a class="action-btn btn-secondary ${m.email ? "" : "disabled"}" ${m.email ? `href="mailto:${m.email}"` : 'tabindex="-1" aria-disabled="true"'} name="contact">Contact</a>
        </div>
      </div>
    `;
  }

  function renderMembers() {
    if (!els.grid) return;
    let list = state.items;

    if (state.search) {
      const q = state.search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.roleTitle.toLowerCase().includes(q) ||
          m.department.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q)
      );
    }
    if (state.department) {
      const d = state.department.trim().toLowerCase();
      list = list.filter((m) => m.department.toLowerCase().includes(d));
    }
    if (state.status) {
      list = list.filter((m) => m.status === state.status);
    }

    list = list.slice(0, state.limit);

    const nextHash = hashItems(list);
    if (nextHash === state.lastHash) return;
    state.lastHash = nextHash;

    els.grid.innerHTML = list.length
      ? list.map(memberCard).join("")
      : `<div class="empty-state">No members found.</div>`;
  }

  function debounce(fn, ms) {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), ms);
    };
  }

  function placeSheetNearButton() {
    const sheet = state.filterSheet;
    if (!sheet || !els.filterBtn) return;
    const rect = els.filterBtn.getBoundingClientRect();
    const isMobile = window.innerWidth < 640;
    if (isMobile) {
      sheet.style.position = "fixed";
      sheet.style.left = "0";
      sheet.style.right = "0";
      sheet.style.bottom = "0";
      sheet.style.top = "auto";
      sheet.classList.add("mobile");
    } else {
      sheet.classList.remove("mobile");
      sheet.style.position = "absolute";
      sheet.style.top = `${rect.bottom + window.scrollY + 8}px`;
      sheet.style.left = `${Math.min(
        rect.left + window.scrollX,
        window.innerWidth - sheet.offsetWidth - 12
      )}px`;
    }
  }

  function closeFilterSheet() {
    const sheet = state.filterSheet;
    if (!sheet) return;
    sheet.classList.remove("open");
    sheet._cleanup && sheet._cleanup();
    setTimeout(() => {
      sheet.remove();
      state.filterSheet = null;
    }, 120);
  }

  function openFilterSheet() {
    if (state.filterSheet) {
      closeFilterSheet();
      return;
    }
    const sheet = document.createElement("div");
    sheet.id = "team-filter-menu";
    sheet.className = "team-filter-sheet";
    sheet.innerHTML = `
      <div class="sheet-body">
        <div class="filter-row"><label for="filter-dept">Department</label><input type="text" id="filter-dept" name="department" placeholder="e.g. Engineering" autocomplete="off"></div>
        <div class="filter-row">
          <label for="filter-status">Status</label>
          <select id="filter-status" name="status" autocomplete="off">
            <option value="">Any</option>
            <option value="active">active</option>
            <option value="away">away</option>
            <option value="offline">offline</option>
          </select>
        </div>
      </div>
      <div class="sheet-actions">
        <button id="apply-filter" class="action-btn btn-primary" name="apply-filter">Apply</button>
        <button id="clear-filter" class="action-btn btn-secondary" name="clear-filter">Clear</button>
      </div>
    `;
    document.body.appendChild(sheet);
    state.filterSheet = sheet;

    placeSheetNearButton();
    setTimeout(() => sheet.classList.add("open"), 10);

    const onDoc = (e) => {
      if (!sheet.contains(e.target) && e.target !== els.filterBtn) closeFilterSheet();
    };
    const onScroll = () => placeSheetNearButton();
    const onResize = () => placeSheetNearButton();
    document.addEventListener("click", onDoc, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    sheet._cleanup = () => {
      document.removeEventListener("click", onDoc, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };

    sheet.querySelector("#apply-filter").onclick = async () => {
      state.department = sheet.querySelector("#filter-dept").value.trim();
      state.status = sheet.querySelector("#filter-status").value;
      await fetchMembers();
      closeFilterSheet();
    };
    sheet.querySelector("#clear-filter").onclick = async () => {
      state.department = "";
      state.status = "";
      await fetchMembers();
      closeFilterSheet();
    };
  }

  function toast(msg, danger = false) {
    let t = document.getElementById("simple-toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "simple-toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.className = `toast ${danger ? "toast-danger" : "toast-ok"}`;
    setTimeout(() => {
      t.className = "toast";
      t.textContent = "";
    }, 1800);
  }

  function openAddMemberModal() {
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-label="Add Member">
        <div class="modal-header">
          <h3>Add Member</h3>
          <button class="modal-close" aria-label="Close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-row"><label for="am-email">Email</label><input id="am-email" name="email" type="email" required placeholder="name@cityfix.gov" autocomplete="email"></div>
          <div class="form-row"><label for="am-nid">National ID</label><input id="am-nid" name="national_id" type="text" required placeholder="ID number" autocomplete="off" inputmode="numeric"></div>
          <div class="form-row"><label for="am-role">Role</label>
            <select id="am-role" name="role" autocomplete="off"><option value="moderator" selected>moderator</option><option value="admin">admin</option></select>
          </div>
          <div class="hint">Only email and ID are required. Member completes profile on first sign-in.</div>
        </div>
        <div class="modal-actions">
          <button id="am-save" class="action-btn btn-primary" name="invite">Invite</button>
          <button class="action-btn btn-secondary modal-close" name="cancel">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelectorAll(".modal-close").forEach((b) => (b.onclick = () => modal.remove()));
    modal.querySelector("#am-save").onclick = async () => {
      const email = modal.querySelector("#am-email").value.trim();
      const nationalId = modal.querySelector("#am-nid").value.trim();
      const role = modal.querySelector("#am-role").value;
      if (!email || !nationalId) return;
      try {
        await api(`/admin/invite`, {
          method: "POST",
          body: JSON.stringify({ email, nationalId, role }),
        });
        modal.remove();
        await fetchMembers();
        toast("Invitation sent");
      } catch (e) {
        console.error(e);
        toast("Failed to invite", true);
      }
    };
  }

  function attachEvents() {
    // ensure search input has id/name to silence the DevTools warning
    ensureIdentity(els.searchInput, "team-search", "search", "off");

    els.searchInput?.addEventListener(
      "input",
      debounce(async (e) => {
        state.search = e.target.value;
        await fetchMembers();
      }, 250)
    );
    els.filterBtn?.addEventListener("click", openFilterSheet);
    els.addBtn?.addEventListener("click", openAddMemberModal);

    els.grid?.addEventListener("click", (e) => {
      const btn = e.target.closest('button[data-action="view"]');
      if (!btn) return;
      const id = e.target.closest(".team-member-card")?.dataset?.id;
      const m = state.items.find((x) => x._id === id);
      if (!id || !m) return;

      const modal = document.createElement("div");
      modal.className = "modal-overlay";
      modal.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true" aria-label="Member Profile">
          <div class="modal-header"><h3>${m.name}</h3><button class="modal-close" aria-label="Close">&times;</button></div>
          <div class="modal-body">
            <div class="modal-row"><strong>Role:</strong> ${m.roleTitle}</div>
            <div class="modal-row"><strong>Department:</strong> ${m.department}</div>
            <div class="modal-row"><strong>Status:</strong> ${m.status}</div>
            <div class="modal-row"><strong>Email:</strong> ${m.email || "-"}</div>
            <div class="modal-row"><strong>Phone:</strong> ${m.phone || "-"}</div>
            <div class="modal-row"><strong>Cases Assigned:</strong> ${m.casesAssigned ?? 0}</div>
            <div class="modal-row"><strong>Last Active:</strong> ${
              m.lastActiveAt ? new Date(m.lastActiveAt).toLocaleString() : "-"
            }</div>
          </div>
          <div class="modal-actions">
            ${m.email ? `<a class="action-btn btn-primary" href="mailto:${m.email}">Email</a>` : ""}
            <button class="action-btn btn-secondary modal-close">Close</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
      modal
        .querySelectorAll(".modal-close")
        .forEach((b) => (b.onclick = () => modal.remove()));
    });
  }

  async function init() {
    try {
      attachEvents();
      await fetchMembers();
      if (state.refreshTimer) clearInterval(state.refreshTimer);
      state.refreshTimer = setInterval(async () => {
        const prevHash = hashItems(state.items);
        await fetchMembers();
        const newHash = hashItems(state.items);
        if (newHash !== prevHash) renderMembers();
      }, 60000);
    } catch (e) {
      console.error("Team init error", e);
      if (els.grid)
        els.grid.innerHTML = `<div class="error-state">Failed to load team data.</div>`;
    }
  }

  document.addEventListener("DOMContentLoaded", init);

  window.CityfixTeam = {
    refresh: fetchMembers,
    setRoles: (arr) => {
      if (Array.isArray(arr) && arr.length) state.roles = arr.map(String);
      fetchMembers();
    },
  };
})();