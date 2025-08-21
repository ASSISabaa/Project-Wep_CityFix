// server/routes/impact.js
const express = require('express');
const { isValidObjectId } = require('mongoose');
const Report = require('../models/Report');

const router = express.Router();

/* ------------ helpers ------------ */
const esc = s => String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const toDate = v => (v ? new Date(v) : null);

function buildBaseQuery(qs = {}) {
  const q = {};
  // user scope
  if (qs.userId && isValidObjectId(qs.userId)) q.reportedBy = qs.userId;

  // time window
  const from = toDate(qs.from);
  const to = toDate(qs.to);
  if (from || to) {
    q.createdAt = {};
    if (from) q.createdAt.$gte = from;
    if (to) q.createdAt.$lte = to;
  }

  // issueType (single or array)
  const types = Array.isArray(qs.issueType) ? qs.issueType : (qs.issueType ? [qs.issueType] : []);
  if (types.length) q.issueType = { $in: types };

  // district OR city/place (address contains)
  if (qs.district) q.district = new RegExp(`^${esc(qs.district)}$`, 'i');
  const place = qs.city || qs.place;
  if (place) {
    const rx = new RegExp(esc(place), 'i');
    q.$or = [{ address: rx }, { district: rx }];
  }

  // bbox = lng1,lat1,lng2,lat2 (W,S,E,N)
  if (qs.bbox) {
    const parts = String(qs.bbox).split(',').map(Number);
    if (parts.length === 4 && parts.every(n => Number.isFinite(n))) {
      const [w, s, e, n] = parts;
      q.location = { $geoWithin: { $box: [[w, s], [e, n]] } };
    }
  }

  return q;
}

function pickLatLng(doc) {
  const c = doc.location?.coordinates;
  // schema stores [lng, lat]
  const lng = Array.isArray(c) ? Number(c[0]) : undefined;
  const lat = Array.isArray(c) ? Number(c[1]) : undefined;
  return { lat, lng };
}

/* ------------ GET /api/impact/summary ------------ */
/* Query: ?userId=&district=&city=&from=&to=&issueType=... */
router.get('/summary', async (req, res) => {
  try {
    const q = buildBaseQuery(req.query);

    const [total, byStatus, votes] = await Promise.all([
      Report.countDocuments(q),
      Report.aggregate([
        { $match: q },
        { $group: { _id: '$status', c: { $sum: 1 } } }
      ]),
      Report.aggregate([
        { $match: q },
        { $project: { upvotesCount: { $size: { $ifNull: ['$upvotes', []] } } } },
        { $group: { _id: null, upvotes: { $sum: '$upvotesCount' } } }
      ])
    ]);

    const statusMap = byStatus.reduce((acc, x) => (acc[x._id] = x.c, acc), {});
    const resolved = statusMap['resolved'] || 0;

    // simple community impact heuristic — adjust to your business logic
    const communityImpact = total * 50;
    const rating = total ? 4.5 : 0;

    // city metrics (purely from reports)
    let cityMetrics = null;
    if (req.query.city || req.query.district || req.query.place) {
      const cq = buildBaseQuery({ ...req.query, userId: undefined, from: undefined, to: undefined });
      const [contributors, allByStatus] = await Promise.all([
        Report.distinct('reportedBy', cq),
        Report.aggregate([{ $match: cq }, { $group: { _id: '$status', c: { $sum: 1 } } }])
      ]);
      const cityStatus = allByStatus.reduce((a, x) => (a[x._id] = x.c, a), {});
      const cityAll = Object.values(cityStatus).reduce((a, b) => a + b, 0) || 0;
      const cityResolved = cityStatus['resolved'] || 0;

      cityMetrics = {
        name: req.query.city || req.query.district || req.query.place,
        contributors: contributors.length,
        reports: cityAll,
        resolved: cityResolved,
        resolutionRate: cityAll ? Math.round((cityResolved / cityAll) * 100) : 0
      };
    }

    res.json({
      success: true,
      data: {
        totalReports: total,
        resolvedIssues: resolved,
        inProgress: statusMap['in-progress'] || 0,
        pending: (statusMap['pending'] || 0) + (statusMap['new'] || 0),
        rejected: statusMap['rejected'] || 0,
        upvotes: votes[0]?.upvotes || 0,
        communityImpact,
        rating,
        city: cityMetrics
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ------------ GET /api/impact/activities ------------ */
/* Query: ?userId=&limit=&from=&to=&district=&city= */
router.get('/activities', async (req, res) => {
  try {
    const q = buildBaseQuery(req.query);
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);

    const docs = await Report.find(q)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const data = docs.map(d => {
      const { lat, lng } = pickLatLng(d);
      return {
        id: d._id,
        title: d.title || d.issueType || 'Report',
        type: d.issueType,
        status: d.status,
        location: d.address || d.district || '',
        address: d.address || '',
        lat, lng,
        timestamp: d.createdAt,
        description: d.description || ''
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ------------ GET /api/impact/markers ------------ */
/* Query: ?userId=&district=&city=&from=&to=&issueType=&bbox=lng1,lat1,lng2,lat2 */
router.get('/markers', async (req, res) => {
  try {
    const q = buildBaseQuery(req.query);

    const docs = await Report.find(q, {
      title: 1, issueType: 1, status: 1, address: 1, district: 1, location: 1, createdAt: 1, description: 1
    })
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean();

    const data = docs.map(d => {
      const { lat, lng } = pickLatLng(d);
      return {
        id: d._id,
        title: d.title || d.issueType || 'Report',
        type: d.issueType,
        status: d.status,
        address: d.address || '',
        location: d.district || '',
        lat, lng,
        timestamp: d.createdAt,
        description: d.description || ''
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ------------ GET /api/impact/city ------------ */
/* Query: ?city=Kafr%20Bara  OR  ?district=Central */
router.get('/city', async (req, res) => {
  try {
    const place = req.query.city || req.query.district || req.query.place;
    if (!place) return res.status(400).json({ success: false, message: 'city or district is required' });

    const q = buildBaseQuery({ place }); // only place filter
    const [contributors, byStatus] = await Promise.all([
      Report.distinct('reportedBy', q),
      Report.aggregate([{ $match: q }, { $group: { _id: '$status', c: { $sum: 1 } } }])
    ]);

    const t = byStatus.reduce((a, x) => (a[x._id] = x.c, a), {});
    const total = Object.values(t).reduce((a, b) => a + b, 0) || 0;
    const resolved = t['resolved'] || 0;

    res.json({
      success: true,
      data: {
        name: place,
        contributors: contributors.length,
        reports: total,
        resolved,
        resolutionRate: total ? Math.round((resolved / total) * 100) : 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
