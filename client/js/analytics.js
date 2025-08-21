// CityFix - Analytics (backend-only data, header-safe)
(() => {
  // -------- API --------
  const API = {
    BASE: (() => {
      const isLocalHost = ["localhost", "127.0.0.1"].includes(location.hostname);
      if (location.protocol === "file:" || !location.origin || location.origin === "null") {
        return "http://localhost:5000/api";
      }
      return isLocalHost ? "http://localhost:5000/api" : `${location.origin}/api`;
    })(),
    REPORTS: "/reports?limit=1000",
    REPORT_TYPES: "/report-types",
    REPORT_STATS: "/reports/statistics"
  };

  // -------- DOM --------
  const els = {
    sidebar: document.getElementById("sidebar"),
    overlay: document.getElementById("overlay"),
    burger: document.querySelector(".hamburger-btn"),
    cards: document.querySelectorAll(".stat-card"),
    chartCanvas: document.getElementById("performanceChart"),
    chartBtns: document.querySelectorAll(".chart-btn"),
    summary: document.querySelector(".reports-list"),
    nav: document.querySelectorAll(".nav-item"),
    map: document.getElementById("analyticsMap") || document.getElementById("map")
  };

  // -------- State --------
  const state = {
    metric: "reports",
    chart: null,
    reports: [],
    types: [],
    stats: null,
    map: null,
    infoWin: null
  };

  // -------- Utils --------
  function authHeaders() {
    const t = localStorage.getItem("cityfix_token") || sessionStorage.getItem("cityfix_token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  }
  async function getJSON(path) {
    const res = await fetch(`${API.BASE}${path}`, {
      headers: { "Content-Type": "application/json", ...authHeaders() },
      credentials: "include",
      method: "GET",
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${path} ${txt ? "- " + txt : ""}`);
    }
    return res.json();
  }
  const asArray = (x) => (Array.isArray(x) ? x : []);
  const toNum = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
  function toast(msg) {
    let n = document.getElementById("cx-toast");
    if (!n) { n = document.createElement("div"); n.id = "cx-toast"; document.body.appendChild(n); }
    n.style.cssText = "position:fixed;top:16px;right:16px;z-index:9999;background:#111;color:#fff;padding:10px 14px;border-radius:10px;max-width:320px";
    n.textContent = msg;
    clearTimeout(n._t); n._t = setTimeout(() => (n.textContent = ""), 3200);
  }

  // -------- Sidebar helpers (do not overwrite global header) --------
  (function exposeSidebarHelpers() {
    const sidebar = els.sidebar;
    const overlay = els.overlay;

    if (typeof window.toggleSidebar !== "function") {
      window.toggleSidebar = function () {
        sidebar?.classList.toggle("active");
        overlay?.classList.toggle("active");
        syncScrollLock();
      };
    }
    if (typeof window.closeSidebar !== "function") {
      window.closeSidebar = function () {
        sidebar?.classList.remove("active");
        overlay?.classList.remove("active");
        syncScrollLock();
      };
    }
    function syncScrollLock() {
      const open = sidebar?.classList.contains("active");
      if (!open) {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        return;
      }
      if (window.innerWidth <= 1024) {
        const y = window.scrollY || 0;
        document.body.style.top = `-${y}px`;
        document.body.style.position = "fixed";
        document.body.style.width = "100%";
      }
    }
  })();

  // -------- Data (all from backend) --------
  async function loadData() {
    const [r1, r2, r3] = await Promise.allSettled([
      getJSON(API.REPORTS),
      getJSON(API.REPORT_TYPES),
      getJSON(API.REPORT_STATS)
    ]);

    state.reports =
      r1.status === "fulfilled"
        ? asArray(r1.value?.data || r1.value?.reports || r1.value || [])
        : [];
    state.types =
      r2.status === "fulfilled"
        ? asArray(r2.value?.data || r2.value?.types || r2.value || [])
        : [];
    state.stats = r3.status === "fulfilled" ? (r3.value?.data || r3.value || null) : null;

    if (!state.reports.length) {
      console.warn("No reports returned from backend.", { base: API.BASE });
    }
  }

  // -------- Cards --------
  function bindCards() {
    const total = state.reports.length;
    const byStatus = state.reports.reduce((m, r) => {
      const s = (r.status || r.state || "unknown").toLowerCase();
      m[s] = (m[s] || 0) + 1; return m;
    }, {});
    const resolved = (byStatus.resolved || 0) + (byStatus.closed || 0);
    const completionRate = total ? (resolved / total) * 100 : 0;

    if (els.cards[0]) {
      els.cards[0].querySelector(".stat-number")?.replaceChildren(document.createTextNode(`${completionRate.toFixed(1)}%`));
      els.cards[0].querySelector(".stat-trend")?.replaceChildren(document.createTextNode(""));
    }

    const teamEff = state.stats?.teamEfficiency;
    const satisfaction = state.stats?.satisfaction;
    const cost = state.stats?.costSavings;

    if (els.cards[1]) {
      const v = teamEff != null ? `${toNum(teamEff).toFixed(1)}%` : "—";
      els.cards[1].querySelector(".stat-number")?.replaceChildren(document.createTextNode(v));
      els.cards[1].querySelector(".stat-trend")?.replaceChildren(document.createTextNode(""));
    }
    if (els.cards[2]) {
      const v = satisfaction != null
        ? (String(satisfaction).includes("/") ? String(satisfaction) : `${toNum(satisfaction).toFixed(1)}/5`)
        : "—";
      els.cards[2].querySelector(".stat-number")?.replaceChildren(document.createTextNode(v));
      els.cards[2].querySelector(".stat-trend")?.replaceChildren(document.createTextNode(""));
    }
    if (els.cards[3]) {
      const v = cost != null ? `$${toNum(cost).toLocaleString()}` : "—";
      els.cards[3].querySelector(".stat-number")?.replaceChildren(document.createTextNode(v));
      els.cards[3].querySelector(".stat-trend")?.replaceChildren(document.createTextNode(""));
    }
  }

  // -------- Summary --------
  function bindSummary() {
    if (!els.summary) return;

    const items = [];

    const byType = state.reports.reduce((m, r) => {
      const t = r.issueType || r.type || r.category || "Other";
      m[t] = (m[t] || 0) + 1; return m;
    }, {});
    const typePairs = Object.entries(byType).sort((a,b)=>b[1]-a[1]).slice(0,4);
    if (typePairs.length) {
      items.push({
        title: "Issue Categories",
        line1: typePairs.slice(0,2).map(([k,v])=>`${k}: ${Math.round((v/state.reports.length)*100)}%`).join(" • "),
        line2: typePairs.slice(2,4).map(([k,v])=>`${k}: ${Math.round((v/state.reports.length)*100)}%`).join(" • "),
        tag: "Analysis"
      });
    }

    const byDistrict = state.reports.reduce((m, r) => {
      const d = r.district || r.location?.district || r.area || r.region || "Unknown";
      m[d] = (m[d] || 0) + 1; return m;
    }, {});
    const distPairs = Object.entries(byDistrict).sort((a,b)=>b[1]-a[1]).slice(0,4);
    if (distPairs.length) {
      items.push({
        title: "Geographic Distribution",
        line1: distPairs.slice(0,2).map(([k,v])=>`${k}: ${v}`).join(" • "),
        line2: distPairs.slice(2,4).map(([k,v])=>`${k}: ${v}`).join(" • "),
        tag: "Mapping"
      });
    }

    const times = state.reports
      .map(r => {
        const a = r.createdAt ? new Date(r.createdAt).getTime() : null;
        const b = r.resolvedAt ? new Date(r.resolvedAt).getTime() : null;
        return (a && b && b >= a) ? (b - a) / 3600000 : null;
      })
      .filter(x => typeof x === "number");
    if (times.length) {
      const avg = times.reduce((p,c)=>p+c,0)/times.length;
      const s = [...times].sort((a,b)=>a-b);
      const p99 = s[Math.max(0, Math.floor(s.length*0.99)-1)] || s.at(-1);
      items.push({ title: "Response Time Analysis", line1: `Average: ${avg.toFixed(1)}h`, line2: `99th Percentile: ${p99.toFixed(0)}h`, tag: "Metrics" });
    }

    els.summary.innerHTML = "";
    items.forEach(i => {
      const el = document.createElement("div");
      el.className = "report-item";
      el.innerHTML = `
        <div class="report-info">
          <h4>${i.title}</h4>
          <p>${i.line1 || ""}</p>
          <div class="report-time">${i.line2 || ""}</div>
        </div>
        <span class="report-status ${String(i.tag).toLowerCase()}">${i.tag}</span>
      `;
      els.summary.appendChild(el);
    });
  }

  // -------- Charts --------
  async function ensureChart() {
    if (window.Chart) return;
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js";
    s.defer = true; document.head.appendChild(s);
    await new Promise((ok, err) => { s.onload = ok; s.onerror = () => err(new Error("Chart.js load error")); });
  }

  function groupByDay(metric) {
    const map = new Map();
    state.reports.forEach(r => {
      const d = r.createdAt ? new Date(r.createdAt) : null;
      if (!d) return;
      const key = d.toISOString().slice(0,10);
      if (!map.has(key)) map.set(key, 0);
      if (metric === "reports") map.set(key, map.get(key) + 1);
      if (metric === "resolution") {
        const s = (r.status || r.state || "").toLowerCase();
        if (s === "resolved" || s === "closed") map.set(key, map.get(key) + 1);
      }
      if (metric === "response") {
        const a = r.createdAt ? new Date(r.createdAt).getTime() : null;
        const b = r.resolvedAt ? new Date(r.resolvedAt).getTime() : null;
        if (a && b && b >= a) map.set(key, map.get(key) + (b - a) / 3600000);
      }
    });
    const entries = Array.from(map.entries()).sort((a,b)=>a[0].localeCompare(b[0]));
    return { labels: entries.map(e=>e[0]), data: entries.map(e=>Number(e[1].toFixed ? e[1].toFixed(2) : e[1])) };
  }

  function drawChartSeries(metric) {
    const { labels, data } = groupByDay(metric);
    const ctx = els.chartCanvas?.getContext("2d");
    if (!ctx) return;
    if (!state.chart) {
      state.chart = new Chart(ctx, {
        type: "line",
        data: { labels, datasets: [{ label: "", data, borderWidth: 2, pointRadius: 2, tension: 0.25, fill: false }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
      });
    } else {
      state.chart.data.labels = labels;
      state.chart.data.datasets[0].data = data;
      state.chart.update();
    }
  }

  // -------- Map --------
  function extractLatLng(r) {
    const lat = r.lat ?? r.latitude ?? r.location?.lat ?? r.coords?.lat ?? r.coordinates?.lat;
    const lng = r.lng ?? r.longitude ?? r.location?.lng ?? r.coords?.lng ?? r.coordinates?.lng;
    return (typeof lat === "number" && typeof lng === "number") ? { lat, lng } : null;
  }
  function markerInfoHTML(r) {
    const id = r._id || r.id || r.reportId || "";
    const title = r.title || "Report";
    const addr = r.address || r.locationText || r.district || "";
    const status = r.status || r.state || "new";
    return `
      <div style="min-width:220px">
        <div style="font-weight:600;margin-bottom:4px">${title}</div>
        <div style="color:#555">${addr}</div>
        <div style="margin-top:6px;font-size:12px">Status: <b>${status}</b></div>
        <div style="margin-top:8px"><a href="ReportsDetails.html?id=${encodeURIComponent(id)}">Open details</a></div>
      </div>`;
  }
  async function buildMap() {
    if (!els.map || !window.google?.maps) return;
    state.map = new google.maps.Map(els.map, { center: { lat: 31.774, lng: 35.219 }, zoom: 11 });
    state.infoWin = new google.maps.InfoWindow();
    const bounds = new google.maps.LatLngBounds();
    let count = 0;

    state.reports.forEach(r => {
      const pos = extractLatLng(r);
      if (!pos) return;

      let marker;
      if (google?.maps?.marker?.AdvancedMarkerElement) {
        const chip = document.createElement("div");
        chip.style.cssText = "background:#1a73e8;color:#fff;padding:6px 8px;border-radius:12px;font:600 12px/1 Inter;box-shadow:0 2px 8px rgba(0,0,0,.2)";
        chip.textContent = r.issueType || r.type || r.category || "Report";
        marker = new google.maps.marker.AdvancedMarkerElement({ map: state.map, position: pos, title: r.title || "", content: chip });
        marker.addListener("gmp-click", () => { state.infoWin.setContent(markerInfoHTML(r)); state.infoWin.open({ map: state.map, anchor: marker }); });
      } else {
        marker = new google.maps.Marker({ map: state.map, position: pos, title: r.title || "" });
        marker.addListener("click", () => { state.infoWin.setContent(markerInfoHTML(r)); state.infoWin.open(state.map, marker); });
      }

      bounds.extend(pos);
      count++;
    });

    if (count) {
      state.map.fitBounds(bounds);
      if (state.map.getZoom && state.map.getZoom() > 16) state.map.setZoom(16);
    }
  }

  // -------- Ensure burger works on this page --------
  function ensureBurgerBinding() {
    if (!els.burger) return;
    const hasInline = !!els.burger.getAttribute("onclick");
    if (!hasInline) {
      els.burger.addEventListener("click", () => {
        if (typeof window.toggleSidebar === "function") window.toggleSidebar();
        else {
          els.sidebar?.classList.toggle("active");
          els.overlay?.classList.toggle("active");
        }
      });
    }
  }

  // Expose for Google Maps callback
  window.initializeGoogleMap = async function () {
    try {
      if (!state.reports.length) await loadData();
      await buildMap();
    } catch (e) {
      console.error(e); toast("Map data error");
    }
  };

  // -------- Bootstrap --------
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      ensureBurgerBinding();
      await loadData();
      bindCards();
      bindSummary();
      await ensureChart();

      const active = Array.from(els.chartBtns).find((b) => b.classList.contains("active"));
      state.metric = active?.dataset.chart || "reports";
      drawChartSeries(state.metric);

      els.chartBtns.forEach((b) => b.addEventListener("click", () => {
        const m = b.dataset.chart;
        if (!m || m === state.metric) return;
        els.chartBtns.forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        state.metric = m;
        drawChartSeries(m);
      }));

      els.nav.forEach((a) => a.addEventListener("click", () => {
        els.nav.forEach((n) => n.classList.remove("active"));
        a.classList.add("active");
        if (window.innerWidth <= 768) window.closeSidebar();
      }));

      if (els.map && window.google?.maps) await buildMap();
    } catch (e) {
      console.error(e);
      toast("Analytics data error");
    }
  });
})();
