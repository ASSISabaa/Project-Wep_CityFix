// geoRoutes.js
const express = require('express');
const router = express.Router();

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/reverse';
const BIGDATA_BASE = 'https://api.bigdatacloud.net/data/reverse-geocode-client';


const cache = new Map();
const TTL_MS = 10 * 60 * 1000; 

function cacheKey(lat, lng, lang, cc) {
  const r5 = (x) => Number.parseFloat(x).toFixed(5);
  return `${r5(lat)},${r5(lng)}|${lang || 'en'}|${cc || ''}`;
}
function setCache(key, value) { cache.set(key, { value, at: Date.now() }); }
function getCache(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > TTL_MS) { cache.delete(key); return null; }
  return hit.value;
}

function pickCity(addr = {}) {
  return (
    addr.city ||
    addr.town ||
    addr.village ||
    addr.municipality ||
    addr.county ||
    addr.state_district ||
    addr.state ||
    addr.region ||
    addr.province ||
    ''
  );
}

router.get('/geo/ip', async (req, res) => {
  try {
    const r = await fetch('https://ipwho.is/');
    const j = await r.json();
    if (!j.success) throw new Error('IP lookup failed');
    return res.json({ lat: j.latitude, lng: j.longitude, countryCode: j.country_code });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'ip lookup error' });
  }
});

// Reverse Geocoding 

router.get('/geo/reverse', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const lang = (req.query.lang || 'en').split(',')[0].trim() || 'en';
  const countrycodes = req.query.countrycodes; 

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ error: 'lat/lng required' });
  }

  const key = cacheKey(lat, lng, lang, countrycodes);
  const cached = getCache(key);
  if (cached) return res.json(cached);


  try {
    const ccParam = countrycodes ? `&countrycodes=${encodeURIComponent(countrycodes)}` : '';
    const url =
      `${NOMINATIM_BASE}?lat=${lat}&lon=${lng}` +
      `&format=json&addressdetails=1&zoom=19${ccParam}`;

    const r = await fetch(url, {
      headers: {
        'User-Agent': 'CityFix/1.0 (support@cityfix.local)',
        'Accept': 'application/json',
        'Accept-Language': `${lang},en;q=0.8`
      }
    });

    if (!r.ok) throw new Error(`nominatim status ${r.status}`);
    const d = await r.json();
    const a = d.address || {};

    const house = a.house_number || '';
    const street = a.road || a.street || a.pedestrian || a.footway || '';
    const neighborhood = a.neighbourhood || a.suburb || a.quarter || '';
    const city = pickCity(a);
    const state = a.state || a.state_district || '';
    const postcode = a.postcode || '';
    const country = a.country || '';
    const countryCode = (a.country_code || '').toUpperCase();

    const parts = [house, street, neighborhood, city, state, postcode, country].filter(Boolean);
    const payload = {
      formatted: parts.join(', '),
      components: { house, street, neighborhood, city, state, postcode, country, countryCode }
    };

    setCache(key, payload);
    return res.json(payload);
  } catch (e) {
   
    try {
      const r2 = await fetch(`${BIGDATA_BASE}?latitude=${lat}&longitude=${lng}&localityLanguage=${encodeURIComponent(lang)}`);
      const d2 = await r2.json();

      const neighborhood =
        d2?.localityInfo?.informative?.find(x => /neigh|suburb|quarter/i.test(x.description || x.name))?.name ||
        d2?.localityInfo?.locality?.[0]?.name ||
        '';

      const city = d2.locality || d2.city || '';
      const state = d2.principalSubdivision || '';
      const country = d2.countryName || '';
      const countryCode = (d2.countryCode || '').toUpperCase();
      const street = d2.street || '';
      const postcode = d2.postcode || '';

      const parts = [street, neighborhood, city, state, postcode, country].filter(Boolean);
      const payload = {
        formatted: parts.join(', '),
        components: { street, neighborhood, city, state, postcode, country, countryCode }
      };

      setCache(key, payload);
      return res.json(payload);
    } catch {
      return res.status(502).json({ error: 'reverse geocode failed' });
    }
  }
});

module.exports = router;
