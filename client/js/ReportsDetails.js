// js/ReportsDetails.js — safe selectors, no '$' global, OSM interactive fallback
(() => {
  'use strict';

  /* -------- API helper (no /api/api double-ups) -------- */
  const API = {
    base:
      (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
        ? 'http://localhost:5000/api'
        : location.origin + '/api',

    token() {
      const keys = ['cityfix_token', 'authToken', 'token', 'jwt', 'accessToken'];
      for (const store of [localStorage, sessionStorage]) {
        for (const k of keys) {
          const v = store.getItem(k);
          if (v) return v;
        }
      }
      const m = document.cookie.match(/(?:^|;)\s*(cityfix_token|authToken|token)=([^;]+)/);
      return m ? decodeURIComponent(m[2]) : '';
    },

    headers(json = true) {
      const h = json ? { 'Content-Type': 'application/json' } : {};
      const t = this.token();
      if (t) h.Authorization = 'Bearer ' + t;
      return h;
    },

    async get(p) {
      const r = await fetch(this.base + p, { headers: this.headers(false) });
      if (!r.ok) throw new Error(await r.text().catch(() => r.statusText));
      return r.json();
    },

    async patch(p, body) {
      const r = await fetch(this.base + p, {
        method: 'PATCH',
        headers: this.headers(),
        body: JSON.stringify(body || {})
      });
      if (!r.ok) throw new Error(await r.text().catch(() => r.statusText));
      return r.json();
    },

    async put(p, body) {
      const r = await fetch(this.base + p, {
        method: 'PUT',
        headers: this.headers(),
        body: JSON.stringify(body || {})
      });
      if (!r.ok) throw new Error(await r.text().catch(() => r.statusText));
      return r.json();
    }
  };

  /* -------- small utils -------- */
  const qs = (s) => document.querySelector(s);
  const escapeHtml = (x) => String(x ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const toast = (msg, type = 'info') => {
    const colors = { success:'#16a34a', error:'#dc2626', info:'#2563eb', warning:'#ca8a04' };
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;top:20px;right:20px;z-index:99999;padding:12px 14px;border-radius:10px;color:#fff;box-shadow:0 8px 24px rgba(0,0,0,.18)';
    el.style.background = colors[type] || colors.info;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  };

  /* -------- state -------- */
  const REPORT_ID = new URLSearchParams(location.search).get('id');
  let state = { report:null, map:null, marker:null, info:null, lat:null, lng:null };
  const MAP_ID = window.CF_MAP_ID || null; // optional Google vector mapId, if you have one

  /* -------- Google Maps loader -------- */
  function ensureMapsScript() {
    if (window.google?.maps) return;
    const exists = [...document.scripts].some(s => (s.src || '').includes('maps.googleapis.com/maps/api/js'));
    if (exists) return;
    const src = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')?.src;
    const key = src?.match(/key=([^&]+)/)?.[1] || (window.CF_MAPS_KEY || '');
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&v=weekly&libraries=marker,places&callback=initializeGoogleMap`;
    s.async = s.defer = true;
    document.head.appendChild(s);
  }

  function waitForGoogle(maxMs = 15000) {
    if (window.google?.maps) return Promise.resolve();
    ensureMapsScript();
    return new Promise((resolve) => {
      const t0 = Date.now();
      const id = setInterval(() => {
        if (window.google?.maps || Date.now() - t0 > maxMs) {
          clearInterval(id);
          resolve();
        }
      }, 80);
    });
  }

  /* -------- interactive OSM fallback (NOT an image) -------- */
  function osmEmbedFallback(container) {
    const lat = state.lat ?? 31.989;
    const lng = state.lng ?? 34.78;
    const bbox = `${lng-0.01}%2C${lat-0.01}%2C${lng+0.01}%2C${lat+0.01}`;
    container.innerHTML = `
      <iframe title="Map" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
        style="border:0;width:100%;height:360px;border-radius:12px"
        src="https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}">
      </iframe>`;
  }

  /* -------- data -------- */
  async function loadReport() {
    if (!REPORT_ID) { toast('Missing report id', 'error'); return; }
    try {
      const res = await API.get(`/reports/${encodeURIComponent(REPORT_ID)}`);
      state.report = res.report || res;
      fillUI();
      await initMap();
    } catch (e) {
      console.error(e);
      toast('Failed to load report', 'error');
    }
  }

  function fillUI() {
    const r = state.report; if (!r) return;

    const subtitle = r.trackingNumber
      ? `#${String(r.trackingNumber).replace(/^#?/, '')} ${r.title || ''}`
      : `#${String(r._id).slice(-5).toUpperCase()} ${r.title || ''}`;
    const subEl = document.querySelector('.dashboard-header p'); if (subEl) subEl.textContent = subtitle;

    const coords = r.location?.coordinates;
    state.lat = Number(coords?.[1] ?? r.lat ?? 31.989);
    state.lng = Number(coords?.[0] ?? r.lng ?? 34.78);

    const titleEl = document.querySelector('.report-details-title h2');
    if (titleEl) titleEl.textContent = (state.lat && state.lng) ? `${state.lat.toFixed(5)}, ${state.lng.toFixed(5)}` : (r.address || '—');

    const dateEl = document.querySelector('.report-id');
    if (dateEl) dateEl.textContent = new Date(r.createdAt || Date.now()).toLocaleDateString();

    const desc = document.querySelector('.description-text');
    if (desc) desc.textContent = r.description || '';

    const select = document.querySelector('.status-dropdown');
    if (select) {
      const norm = (v) => {
        const s = String(v || '').toLowerCase();
        if (s === 'progress') return 'in-progress';
        if (s === 'closed') return 'resolved';
        return s || 'pending';
      };
      select.value = norm(r.status);
    }

    const notes = document.querySelector('.notes-textarea');
    if (notes) notes.value = r.adminNotes || '';
  }

  /* -------- map (Google first; OSM interactive fallback) -------- */
  async function initMap() {
    const container = document.querySelector('.map-container'); if (!container) return;
    if (container.clientHeight < 220) container.style.height = '360px';

    await waitForGoogle();

    let MapCtor, AdvancedMarkerElement, LegacyMarker;
    if (window.google?.maps?.importLibrary) {
      try {
        const [{ Map }, markerLib] = await Promise.all([
          google.maps.importLibrary('maps'),
          google.maps.importLibrary('marker').catch(() => ({}))
        ]);
        MapCtor = Map;
        AdvancedMarkerElement = markerLib?.AdvancedMarkerElement;
        LegacyMarker = google.maps.Marker;
      } catch {}
    } else if (window.google?.maps) {
      MapCtor = google.maps.Map;
      LegacyMarker = google.maps.Marker;
    }

    if (!MapCtor) { osmEmbedFallback(container); return; }

    const opts = {
      center: { lat: state.lat, lng: state.lng },
      zoom: 16,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: true,
      ...(MAP_ID ? { mapId: MAP_ID } : {})
    };

    state.map = state.map ? (state.map.setOptions(opts), state.map) : new MapCtor(container, opts);

    if (state.marker) {
      if (state.marker.setPosition) state.marker.setPosition({ lat: state.lat, lng: state.lng });
      else state.marker.position = { lat: state.lat, lng: state.lng };
    } else if (MAP_ID && AdvancedMarkerElement) {
      state.marker = new AdvancedMarkerElement({ position: { lat: state.lat, lng: state.lng }, map: state.map });
    } else if (LegacyMarker) {
      state.marker = new LegacyMarker({ position: { lat: state.lat, lng: state.lng }, map: state.map });
    }

    const r = state.report;
    const content = `
      <div style="font:500 14px/1.2 Inter,system-ui">
        <div style="margin-bottom:4px">${escapeHtml(r.title || 'Report')}</div>
        <div style="color:#374151;font:400 12px/1.35 Inter,system-ui">
          <div>${escapeHtml(r.issueType || '')} • ${escapeHtml((r.status || '').toUpperCase())}</div>
          <div>${escapeHtml(r.address || '')}</div>
        </div>
      </div>`;
    if (!state.info && window.google?.maps?.InfoWindow) state.info = new google.maps.InfoWindow({ content });
    else if (state.info) state.info.setContent(content);

    if (state.marker?.addListener) {
      state.marker.addListener('click', () => state.info?.open({ anchor: state.marker, map: state.map }));
    }

    addEventListener('resize', () => state.map?.setCenter({ lat: state.lat, lng: state.lng }));
  }

  /* -------- actions -------- */
  const normalizeStatus = (v) => {
    const s = String(v || '').toLowerCase();
    if (s === 'progress') return 'in-progress';
    if (s === 'closed') return 'resolved';
    return s;
  };

  async function onStatusChange(e) {
    const picked = normalizeStatus(e.target.value);
    if (!API.token()) { toast('No token, please login', 'error'); e.target.value = state.report?.status || 'pending'; return; }
    try {
      await API.patch(`/reports/${encodeURIComponent(REPORT_ID)}/status`, { status: picked });
      if (state.report) state.report.status = picked;
      toast('Status updated', 'success');
    } catch (err) {
      console.error(err);
      toast('Failed to update status', 'error');
      if (state.report) e.target.value = state.report.status || 'pending';
    }
  }

  async function onSaveNotes() {
    const txt = qs('.notes-textarea')?.value ?? '';
    if (!txt.trim()) { toast('Nothing to save', 'warning'); return; }
    if (!API.token()) { toast('No token, please login', 'error'); return; }

    try {
      const existing = Array.isArray(state.report?.comments) ? state.report.comments : [];
      const next = [...existing, { text: txt, createdAt: new Date().toISOString() }];

      const res = await API.put(`/reports/${encodeURIComponent(REPORT_ID)}`, { comments: next });
      state.report = res.report || { ...(state.report || {}), comments: next, adminNotes: txt };
      toast('Saved', 'success');
    } catch (err) {
      console.error(err);
      toast('Failed to save', 'error');
    }
  }

  /* -------- boot -------- */
  document.addEventListener('DOMContentLoaded', () => {
    qs('.status-dropdown')?.addEventListener('change', onStatusChange);
    qs('.save-btn')?.addEventListener('click', onSaveNotes);
    loadReport();
  });

  // Called by the Google Maps script tag
  window.initializeGoogleMap = () => { if (state.report) initMap(); };
})();
