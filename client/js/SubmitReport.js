(() => {
  'use strict';

  const API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : `${location.origin}/api`;
  const IMAGE_FIELD_NAME = 'images';
  const FORCE_JSON_FALLBACK = true;

  const el = {
    form: document.getElementById('reportForm'),
    problemType: document.getElementById('problemType'),
    location: document.getElementById('location'),
    description: document.getElementById('description'),
    submitBtn: document.getElementById('submitBtn'),
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    uploadedFiles: document.getElementById('uploadedFiles'),
    mapContainer: document.getElementById('mapContainer'),
    successMessage: document.getElementById('successMessage'),
  };

  const state = {
    files: [],
    coords: null,
    address: '',
    street: '',
    village: '',
    city: '',
    userLocation: null,
    token: localStorage.getItem('cityfix_token') || sessionStorage.getItem('cityfix_token') ||
            localStorage.getItem('token') || sessionStorage.getItem('token'),
    maps: { autocomplete: null, sessionToken: null, geocoder: null }
  };

  const issueLabel = (v) => ({
    pothole: 'Pothole', streetlight: 'Street Light', drainage: 'Drainage Issue',
    garbage: 'Garbage Collection', traffic: 'Traffic Signal', sidewalk: 'Sidewalk Damage',
    graffiti: 'Graffiti', noise: 'Noise Complaint', abandoned_vehicle: 'Abandoned Vehicle',
    water_leak: 'Water Leak', park_maintenance: 'Park Maintenance', other: 'Other'
  }[v] || (v ? v[0].toUpperCase()+v.slice(1).replace('_',' ') : 'Issue'));

  const priorityFor = (v) => (['water_leak','traffic','abandoned_vehicle'].includes(v) ? 'High'
    : ['pothole','streetlight','drainage','garbage'].includes(v) ? 'Medium' : 'Low');

  const buildTitle = () => {
    const label = issueLabel(el.problemType.value.trim());
    const where = [state.street, state.village || state.city].filter(Boolean).join(', ');
    return where ? `${label} at ${where}` : `${label} report`;
  };

  function toast(message, type='error') {
    const d = document.createElement('div');
    d.textContent = message;
    d.style = `position:fixed;top:16px;right:16px;z-index:99999;padding:10px 14px;border-radius:10px;
      font:600 14px Inter;background:${type==='success'?'#ECFDF5':'#FEF2F2'};
      color:${type==='success'?'#065F46':'#7F1D1D'};border:1px solid ${type==='success'?'#10B981':'#EF4444'};`;
    document.body.appendChild(d); 
    setTimeout(()=>d.remove(), 4500);
  }

  function setBtnLoading(b) {
    if (!el.submitBtn) return;
    if (b) { 
      el.submitBtn.disabled = true; 
      el.submitBtn.innerHTML = `<span class="loading-spinner"></span> Submitting...`; 
    } else { 
      el.submitBtn.disabled = false; 
      el.submitBtn.textContent = 'Submit Report'; 
    }
  }

  function bindUploads() {
    if (!el.uploadArea || !el.fileInput) return;
    const browse = el.uploadArea.querySelector('.browse-btn');
    browse?.addEventListener('click', (e)=>{ 
      e.stopPropagation(); 
      el.fileInput.click();
    });
    el.uploadArea.addEventListener('click', ()=> el.fileInput.click());
    el.uploadArea.addEventListener('dragover', e=>{ 
      e.preventDefault(); 
      el.uploadArea.classList.add('dragover'); 
    });
    el.uploadArea.addEventListener('dragleave', e=>{ 
      e.preventDefault(); 
      el.uploadArea.classList.remove('dragover'); 
    });
    el.uploadArea.addEventListener('drop', e=>{
      e.preventDefault(); 
      el.uploadArea.classList.remove('dragover'); 
      handleFiles(e.dataTransfer.files);
    });
    el.fileInput.addEventListener('change', ()=> handleFiles(el.fileInput.files));
  }

  function handleFiles(list) {
    const incoming = Array.from(list||[]).filter(f => /^image\//.test(f.type));
    if (!incoming.length) return toast('Please select image files.', 'error');
    state.files.push(...incoming);
    renderFiles();
    updateProgress();
  }

  function renderFiles() {
    el.uploadedFiles.innerHTML = '';
    state.files.forEach((f,i)=>{
      const row = document.createElement('div');
      row.className='file-item';
      row.innerHTML = `<span>📷 ${f.name.length>22?f.name.slice(0,22)+'…':f.name}</span>
                       <button type="button" class="file-remove" data-i="${i}">×</button>`;
      el.uploadedFiles.appendChild(row);
    });
    el.uploadedFiles.querySelectorAll('.file-remove').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const i = +btn.getAttribute('data-i'); 
        state.files.splice(i,1); 
        renderFiles(); 
        updateProgress();
      });
    });
  }

  function parseAddressComponents(components) {
    const out = { 
      street_number: '',
      route: '', 
      neighborhood: '',
      locality: '', 
      sublocality: '', 
      admin3: '', 
      admin2: '',
      admin1: '',
      country: ''
    };
    
    (components||[]).forEach(c => {
      const types = c.types || [];
      if (types.includes('street_number')) out.street_number = c.long_name;
      if (types.includes('route')) out.route = c.long_name;
      if (types.includes('neighborhood')) out.neighborhood = c.long_name;
      if (types.includes('locality')) out.locality = c.long_name;
      if (types.includes('sublocality') || types.includes('sublocality_level_1')) out.sublocality = c.long_name;
      if (types.includes('administrative_area_level_3')) out.admin3 = c.long_name;
      if (types.includes('administrative_area_level_2')) out.admin2 = c.long_name;
      if (types.includes('administrative_area_level_1')) out.admin1 = c.long_name;
      if (types.includes('country')) out.country = c.short_name;
    });
    
    const street = [out.street_number, out.route].filter(Boolean).join(' ') || out.neighborhood || '';
    const village = out.sublocality || out.neighborhood || out.admin3 || '';
    const city = out.locality || out.admin2 || '';
    
    return { 
      street: street, 
      village: village,
      city: city 
    };
  }

  function getUserLocationAndSetup() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          state.userLocation = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          state.coords = state.userLocation;
          
          setupPlacesWithLocation();
          
          enhancedReverseGeocode(state.userLocation.lat, state.userLocation.lng);
        },
        err => {
          console.error('Location error:', err);
          setupPlacesWithLocation();
        },
        { 
          enableHighAccuracy: true, 
          timeout: 5000, 
          maximumAge: 0 
        }
      );
    } else {
      setupPlacesWithLocation();
    }
  }

  function setupPlacesWithLocation() {
    if (!window.google?.maps?.places || !el.location) return;
    
    state.maps.sessionToken = new google.maps.places.AutocompleteSessionToken();
    state.maps.geocoder = new google.maps.Geocoder();

    const options = {
      fields: ['formatted_address', 'geometry', 'address_components', 'place_id', 'name'],
      types: ['geocode'],
      componentRestrictions: { country: ['IL', 'PS'] },
      sessionToken: state.maps.sessionToken
    };

    if (state.userLocation) {
      const bounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(state.userLocation.lat - 0.05, state.userLocation.lng - 0.05),
        new google.maps.LatLng(state.userLocation.lat + 0.05, state.userLocation.lng + 0.05)
      );
      options.bounds = bounds;
      options.strictBounds = false;
    }

    state.maps.autocomplete = new google.maps.places.Autocomplete(el.location, options);

    state.maps.autocomplete.addListener('place_changed', () => {
      const place = state.maps.autocomplete.getPlace();
      if (place?.formatted_address) {
        state.address = place.formatted_address;
        el.location.value = state.address;
        setMapPreview(state.address);
      }
      if (place?.address_components) {
        const p = parseAddressComponents(place.address_components);
        state.street = p.street; 
        state.village = p.village;
        state.city = p.city;
      }
      if (place?.geometry?.location) {
        state.coords = { 
          lat: place.geometry.location.lat(), 
          lng: place.geometry.location.lng() 
        };
      }
      updateProgress();
      state.maps.sessionToken = new google.maps.places.AutocompleteSessionToken();
    });
  }

  function enhancedReverseGeocode(lat, lng) {
    if (!window.google?.maps || !state.maps.geocoder) {
      state.maps.geocoder = new google.maps.Geocoder();
    }
    
    const latlng = { lat: parseFloat(lat), lng: parseFloat(lng) };
    
    state.maps.geocoder.geocode({ 
      location: latlng,
      language: 'en',
      region: 'IL'
    }, (results, status) => {
      if (status === 'OK' && results?.length > 0) {
        let bestResult = null;
        let bestScore = -1;
        
        for (const result of results) {
          const types = result.types || [];
          let score = 0;
          
          if (types.includes('street_address')) score += 10;
          if (types.includes('route')) score += 8;
          if (types.includes('premise')) score += 7;
          if (types.includes('establishment')) score += 5;
          if (types.includes('point_of_interest')) score += 3;
          
          if (!types.includes('plus_code') && !types.includes('country') && score > bestScore) {
            bestScore = score;
            bestResult = result;
          }
        }
        
        if (!bestResult) bestResult = results[0];
        
        state.address = bestResult.formatted_address || '';
        const p = parseAddressComponents(bestResult.address_components || []);
        state.street = p.street; 
        state.village = p.village;
        state.city = p.city;
        
        el.location.value = state.address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        setMapPreview(state.address || el.location.value);
      } else {
        el.location.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        state.address = el.location.value;
        setMapPreview(state.address);
      }
      state.coords = { lat, lng };
      updateProgress();
    });
  }

  function setMapPreview(text) {
    const t = text || 'Get Current Location';
    el.mapContainer.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;cursor:pointer;${text?'color:#2563EB;':''}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        ${t}
      </div>`;
  }

  const valid = () => ({
    issue: !!el.problemType?.value.trim(),
    loc: !!(el.location?.value.trim() || state.address),
    desc: (el.description?.value.trim().length || 0) >= 3,
    img: state.files.length > 0
  });

  function updateProgress() {
    const v = valid();
    const done = [v.issue,v.loc,v.desc,v.img].filter(Boolean).length;
    el.submitBtn.disabled = done !== 4;
    el.submitBtn.textContent = done===4 ? 'Submit Report' : `Fill Required Fields (${done}/4)`;
  }

  async function filesToBase64(files) {
    const run = f => new Promise((res,rej)=>{ 
      const r=new FileReader(); 
      r.onload=()=>res(String(r.result)); 
      r.onerror=rej; 
      r.readAsDataURL(f); 
    });
    const arr=[]; 
    for (const f of files) arr.push(await run(f)); 
    return arr;
  }

  async function submit(e) {
    e.preventDefault();
    const v = valid();
    if (!(v.issue&&v.loc&&v.desc&&v.img)) return toast('Missing required fields', 'error');

    setBtnLoading(true);

    const fd = new FormData();
    fd.append('title', buildTitle());
    fd.append('issueType', el.problemType.value.trim());
    fd.append('description', el.description.value.trim());
    fd.append('address', (state.address || el.location.value || '').trim());
    if (state.coords) { 
      fd.append('latitude', String(state.coords.lat)); 
      fd.append('longitude', String(state.coords.lng)); 
    }
    fd.append('priority', priorityFor(el.problemType.value.trim()));
    state.files.forEach((f,i)=> fd.append(IMAGE_FIELD_NAME, f, f.name || `image_${i}.jpg`));

    const headers = state.token ? { Authorization: `Bearer ${state.token}` } : {};

    try {
      const r = await fetch(`${API_BASE}/reports`, { 
        method:'POST', 
        headers, 
        body: fd, 
        credentials:'include' 
      });
      const t = await r.text(); 
      let data={}; 
      try{ data=t?JSON.parse(t):{}; }catch{ data={ raw:t }; }
      if (!r.ok) throw new Error(data?.message || data?.error || `HTTP ${r.status}`);
      onSuccess(data);
    } catch (err) {
      if (!FORCE_JSON_FALLBACK) { 
        setBtnLoading(false); 
        return toast(`Failed to create report: ${err.message}`, 'error'); 
      }
      try {
        const imagesBase64 = await filesToBase64(state.files);
        const payload = {
          title: buildTitle(),
          issueType: el.problemType.value.trim(),
          description: el.description.value.trim(),
          address: (state.address || el.location.value || '').trim(),
          latitude: state.coords?.lat ?? null,
          longitude: state.coords?.lng ?? null,
          priority: priorityFor(el.problemType.value.trim()),
          imagesBase64
        };
        const r2 = await fetch(`${API_BASE}/reports`, {
          method:'POST',
          headers: { 'Content-Type':'application/json', ...headers },
          body: JSON.stringify(payload),
          credentials:'include'
        });
        const t2 = await r2.text(); 
        let data2={}; 
        try{ data2=t2?JSON.parse(t2):{}; }catch{ data2={ raw:t2 }; }
        if (!r2.ok) throw new Error(data2?.message || data2?.error || `HTTP ${r2.status}`);
        onSuccess(data2);
      } catch (e2) {
        setBtnLoading(false);
        toast(`Failed to create report: ${e2.message}`, 'error');
      }
    }
  }

  function onSuccess(payload) {
    setBtnLoading(false);
    if (el.successMessage) el.successMessage.classList.add('show');
  }

  function bindInputs() {
    el.problemType?.addEventListener('change', updateProgress);
    el.description?.addEventListener('input', updateProgress);
    el.location?.addEventListener('input', ()=>{ 
      state.address = el.location.value.trim(); 
      setMapPreview(state.address); 
      updateProgress(); 
    });
    el.mapContainer?.addEventListener('click', ()=>{
      if (!navigator.geolocation) return toast('Geolocation not supported.','error');
      el.mapContainer.innerHTML = `<div style="color:#6B7280;">Getting location...</div>`;
      navigator.geolocation.getCurrentPosition(
        pos => { 
          state.coords={ lat:pos.coords.latitude, lng:pos.coords.longitude }; 
          enhancedReverseGeocode(pos.coords.latitude, pos.coords.longitude); 
        },
        err => {
          toast('Cannot access location. Enter address manually.','error');
          setMapPreview('');
        },
        { enableHighAccuracy:true, timeout:10000, maximumAge:0 }
      );
    });
  }

  window.initializeGoogleMap = () => { 
    getUserLocationAndSetup();
  };

  function init() {
    bindInputs(); 
    bindUploads(); 
    updateProgress();
    el.form?.addEventListener('submit', submit);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init,0);
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();