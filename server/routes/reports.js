// server/routes/reports.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Report = require('../models/Report');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { notifyReportStatus, notifyReportNote, notifyAdmins, notifyUser } = require('../utils/notify');

/* ---------- Multer ---------- */
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/reports');
    await fs.mkdir(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `report-${unique}${path.extname(file.originalname)}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => file.mimetype.startsWith('image/')
    ? cb(null, true)
    : cb(new Error('Only images allowed'))
});

/* ---------- Helpers ---------- */
function parseCoordinates(inputObj) {
  if (!inputObj) return null;

  if (typeof inputObj === 'object' && inputObj.lat != null && inputObj.lng != null) {
    const lat = Number(inputObj.lat);
    const lng = Number(inputObj.lng);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return [lng, lat];
  }

  if (typeof inputObj === 'string') {
    const s = inputObj.trim();
    try {
      const j = JSON.parse(s);
      if (Array.isArray(j) && j.length === 2) {
        const a = Number(j[0]), b = Number(j[1]);
        if (!Number.isNaN(a) && !Number.isNaN(b)) return [a, b]; // assume [lng, lat]
      } else if (j && (j.lat != null || j.latitude != null) && (j.lng != null || j.longitude != null)) {
        const lat = Number(j.lat ?? j.latitude);
        const lng = Number(j.lng ?? j.longitude);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) return [lng, lat];
      }
    } catch { /* not JSON */ }

    if (s.includes(',')) {
      const parts = s.split(',').map(x => Number(x.trim()));
      if (parts.length === 2 && parts.every(n => !Number.isNaN(n))) {
        const lat = parts[0], lng = parts[1];
        return [lng, lat];
      }
    }
  }

  if (Array.isArray(inputObj) && inputObj.length === 2) {
    const a = Number(inputObj[0]), b = Number(inputObj[1]);
    if (!Number.isNaN(a) && !Number.isNaN(b)) return [a, b];
  }

  return null;
}

function buildGeoPoint(coords) {
  return coords ? { type: 'Point', coordinates: coords } : null;
}

/* ---------- Test & Count ---------- */
router.get('/test', (_req, res) => {
  res.json({ success: true, message: 'Reports API is working!' });
});

router.get('/count', async (_req, res) => {
  try {
    const count = await Report.countDocuments();
    res.json({ success: true, count });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/* ---------- Public submission (no auth) ---------- */
router.post('/public', upload.array('images', 5), async (req, res) => {
  console.log('=== PUBLIC REPORT SUBMISSION ===');
  console.log('Body fields:', Object.keys(req.body));
  console.log('Files received:', req.files?.length || 0);

  try {
    const { title, description, issueType, address, district, urgency } = req.body;

    let coords = null;
    if (req.body['coordinates[lat]'] && req.body['coordinates[lng]']) {
      const lat = Number(req.body['coordinates[lat]']);
      const lng = Number(req.body['coordinates[lng]']);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) coords = [lng, lat];
    } else if (req.body.coordinates) {
      coords = parseCoordinates(req.body.coordinates);
    }

    const location = buildGeoPoint(coords);

    let images = [];
    if (Array.isArray(req.files) && req.files.length) {
      images = req.files.map(f => ({
        url: `/uploads/reports/${f.filename}`,
        uploadedAt: new Date()
      }));
      console.log('Images processed:', images.length);
    }

    const publicUserId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');

    if (!location) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing coordinates. Expected [lng,lat] or {lat,lng}.'
      });
    }

    const doc = new Report({
      trackingNumber: `R${Date.now()}`,
      title: title || 'Public Report',
      description: description || 'No description provided',
      issueType: issueType || 'other',
      status: 'pending',
      urgency: urgency || 'medium',
      location,
      address: address || 'Not specified',
      district: district || 'Unknown',
      images,
      reportedBy: publicUserId,
      upvotes: [],
      views: 0,
      metadata: { source: 'public_form', submittedAt: new Date() }
    });

    console.log('Saving report to database...');
    const saved = await doc.save();
    console.log('Report saved successfully:', saved._id);

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      report: {
        id: saved._id,
        trackingNumber: saved.trackingNumber,
        title: saved.title,
        status: saved.status
      },
      trackingNumber: saved.trackingNumber
    });
  } catch (e) {
    console.error('Error saving report:', e);
    res.status(500).json({ success: false, message: 'Failed to submit report', error: e.message });
  }
});

/* ---------- Fetch all ---------- */
router.get('/all', async (_req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json({ success: true, reports, total: reports.length });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch reports' });
  }
});

/* ---------- My reports ---------- */
router.get('/my-reports', auth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const reports = await Report.find({ reportedBy: userId }).sort({ createdAt: -1 });
    res.json({ success: true, reports, total: reports.length });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch user reports' });
  }
});

/* ---------- Statistics ---------- */
router.get('/statistics', async (_req, res) => {
  try {
    const now = new Date();
    const since30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    const [
      total, resolved, inProgress, pending,
      byTypeAgg, byDistrictAgg, ratingAgg, savingsAgg, perAssigneeAgg
    ] = await Promise.all([
      Report.countDocuments({}),
      Report.countDocuments({ status: { $in: ['resolved', 'closed'] } }),
      Report.countDocuments({ status: 'in-progress' }),
      Report.countDocuments({ status: 'pending' }),
      Report.aggregate([{ $group: { _id: { $ifNull: ['$issueType', { $ifNull: ['$type', { $ifNull: ['$category', 'Other'] }] }] }, count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Report.aggregate([{ $group: { _id: { $ifNull: ['$district', { $ifNull: ['$location.district', 'Unknown'] }] }, count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Report.aggregate([{ $match: { rating: { $type: 'number' } } }, { $group: { _id: null, avg: { $avg: '$rating' } } }]),
      Report.aggregate([{ $match: { costSavings: { $type: 'number' } } }, { $group: { _id: null, total: { $sum: '$costSavings' } } }]),
      Report.aggregate([{ $match: { createdAt: { $gte: since30 } } }, { $group: { _id: '$assignee', totalAssigned: { $sum: 1 }, resolved: { $sum: { $cond: [{ $in: ['$status', ['resolved','closed']] }, 1, 0] } } } }, { $match: { _id: { $ne: null } } }])
    ]);

    const completionRate = total ? (resolved / total) * 100 : 0;
    let teamEfficiency = null;
    if (perAssigneeAgg.length) {
      const ratios = perAssigneeAgg.map(a => (a.totalAssigned ? a.resolved / a.totalAssigned : 0));
      teamEfficiency = Number(((ratios.reduce((p, c) => p + c, 0) / ratios.length) * 100).toFixed(1));
    }
    const satisfaction = ratingAgg[0]?.avg != null ? Number(ratingAgg[0].avg.toFixed(1)) : null;
    const costSavings = savingsAgg[0]?.total != null ? Number(savingsAgg[0].total.toFixed(0)) : null;
    const byType = byTypeAgg.map(x => ({ type: x._id || 'Other', count: x.count }));
    const byDistrict = byDistrictAgg.map(x => ({ district: x._id || 'Unknown', count: x.count }));

    res.json({
      success: true,
      total, resolved, inProgress, pending,
      completionRate: Number(completionRate.toFixed(1)),
      teamEfficiency, satisfaction, costSavings, byType, byDistrict
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
});

/* ---------- List with filters ---------- */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, sort = 'newest', issueType, district, status, search } = req.query;
    const query = {};
    if (issueType && issueType !== 'all') query.issueType = issueType;
    if (district && district !== 'all') query.district = district;
    if (status && status !== 'all') query.status = status;
    if (search) query.$or = [{ title: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }];

    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    else if (sort === 'most-reported') sortOption = { upvotes: -1 };
    else if (sort === 'resolved') sortOption = { status: 1, createdAt: -1 };

    const skip = (page - 1) * limit;
    const total = await Report.countDocuments(query);
    const reports = await Report.find(query).sort(sortOption).limit(parseInt(limit)).skip(skip).lean();

    const formatted = reports.map(r => ({
      _id: r._id,
      id: r._id,
      title: r.title,
      description: r.description,
      issueType: r.issueType,
      location: r.location,
      address: r.address || r.location,
      district: r.district,
      status: r.status || 'pending',
      priority: r.priority || 'medium',
      images: r.images || [],
      upvotes: Array.isArray(r.upvotes) ? r.upvotes.length : r.upvotes || 0,
      createdAt: r.createdAt,
      timestamp: r.createdAt,
      userId: r.reportedBy || r.userId,
      userName: 'Anonymous',
      coordinates: r.coordinates || {},
      lat: r.coordinates?.lat,
      lng: r.coordinates?.lng
    }));

    res.json({ success: true, reports: formatted, total, page: parseInt(page), pages: Math.ceil(total / limit), limit: parseInt(limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch reports', error: error.message });
  }
});

/* ---------- Single ---------- */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid report ID format' });
    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch report', error: error.message });
  }
});

/* ---------- Create (auth) ---------- */
router.post('/', [auth, upload.array('images', 5)], async (req, res) => {
  try {
    const { title, description, issueType, location, address, district, coordinates, urgency, images } = req.body;

    let processedImages = [];
    if (Array.isArray(req.files) && req.files.length) {
      processedImages = req.files.map(file => ({ url: `/uploads/reports/${file.filename}`, uploadedAt: new Date() }));
    } else if (images && Array.isArray(images)) {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (img.url && img.url.startsWith('data:image')) {
          const base64Data = img.url.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          const filename = `report-${Date.now()}-${i}.jpg`;
          const filepath = path.join(__dirname, '../uploads/reports', filename);
          await fs.mkdir(path.dirname(filepath), { recursive: true });
          await fs.writeFile(filepath, buffer);
          processedImages.push({ url: `/uploads/reports/${filename}`, uploadedAt: new Date() });
        } else if (img.url) {
          processedImages.push(img);
        }
      }
    }

    const doc = new Report({
      trackingNumber: `R${Date.now()}`,
      title,
      description,
      issueType: issueType || 'other',
      location: location && location.coordinates ? location : undefined,
      address: address || (typeof location === 'string' ? location : undefined),
      district: district || 'Unknown',
      images: processedImages,
      status: 'pending',
      urgency: urgency || 'medium',
      reportedBy: req.user._id,
      metadata: {}
    });

    if (!doc.location) {
      let coords = null;
      if (coordinates && typeof coordinates === 'object' && coordinates.lat != null && coordinates.lng != null) {
        const lat = Number(coordinates.lat), lng = Number(coordinates.lng);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) coords = [lng, lat];
      } else if (typeof coordinates === 'string') {
        coords = parseCoordinates(coordinates);
      }
      if (coords) doc.location = buildGeoPoint(coords);
    }

    if (!doc.location) {
      return res.status(400).json({ success: false, message: 'Missing or invalid coordinates' });
    }

    await doc.save();

    await notifyAdmins({
      title: 'New report',
      body: doc.title || doc.issueType || 'Report submitted',
      type: 'report_update',
      priority: 'high',
      link: `/reports.html?id=${doc._id}`,
      data: { reportId: doc._id }
    });

    await notifyUser(req.user._id, {
      title: 'Report received',
      body: 'Your report has been submitted.',
      type: 'report_update',
      priority: 'normal',
      link: `/reports.html?id=${doc._id}`,
      data: { reportId: doc._id }
    });

    res.status(201).json({ success: true, message: 'Report created successfully', report: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create report', error: error.message });
  }
});

/* ---------- Update ---------- */
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid report ID' });

    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    const isAdmin = req.user?.role === 'admin';
    const isOwner = report.reportedBy?.toString() === req.user?._id?.toString();
    if (!isAdmin && !isOwner) return res.status(403).json({ success: false, message: 'Not authorized' });

    Object.keys(updates).forEach(k => {
      if (!['_id', 'reportedBy'].includes(k)) report[k] = updates[k];
    });
    report.updatedAt = new Date();
    await report.save();

    res.json({ success: true, message: 'Report updated successfully', report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update report', error: error.message });
  }
});

/* ---------- Delete ---------- */
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid report ID' });

    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    const isAdmin = req.user?.role === 'admin';
    const isOwner = report.reportedBy?.toString() === req.user?._id?.toString();
    if (!isAdmin && !isOwner) return res.status(403).json({ success: false, message: 'Not authorized' });

    await report.deleteOne();
    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete report', error: error.message });
  }
});

/* ---------- Votes ---------- */
router.post('/:id/upvote', auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid report ID' });
    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    report.upvotes = Array.isArray(report.upvotes) ? [...report.upvotes, req.user._id] : (report.upvotes || 0) + 1;
    await report.save();
    res.json({ success: true, message: 'Report upvoted', upvotes: Array.isArray(report.upvotes) ? report.upvotes.length : report.upvotes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to upvote report', error: error.message });
  }
});

router.delete('/:id/upvote', auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid report ID' });
    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    if (Array.isArray(report.upvotes)) {
      report.upvotes = report.upvotes.filter(u => u.toString() !== req.user._id.toString());
    } else {
      report.upvotes = Math.max(0, (report.upvotes || 0) - 1);
    }
    await report.save();
    res.json({ success: true, message: 'Upvote removed', upvotes: Array.isArray(report.upvotes) ? report.upvotes.length : report.upvotes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove upvote', error: error.message });
  }
});

/* ---------- Status ---------- */
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const raw = String(req.body.status || '').toLowerCase().replace(/\s+/g, '-');
    const status = raw === 'progress' ? 'in-progress' : raw;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid report ID' });

    const allowed = new Set(['new', 'pending', 'in-progress', 'resolved', 'rejected']);
    if (!allowed.has(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    const isAdmin = req.user?.role === 'admin';
    const isOwner = report.reportedBy?.toString() === req.user?._id?.toString();
    if (!isAdmin && !isOwner) return res.status(403).json({ success: false, message: 'Not authorized' });

    const oldStatus = report.status;
    report.status = status;
    report.statusHistory = report.statusHistory || [];
    report.statusHistory.push({ status, changedBy: req.user._id, changedAt: new Date() });
    report.updatedAt = new Date();
    await report.save();

    notifyReportStatus({ report, oldStatus, newStatus: status, actorId: req.user._id });

    res.json({ success: true, message: 'Status updated', report });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

/* ---------- Notes ---------- */
router.patch('/:id/notes', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const note = String(req.body.adminNotes ?? '').trim();
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid report ID' });

    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    const isAdmin = req.user?.role === 'admin';
    const isOwner = report.reportedBy?.toString() === req.user?._id?.toString();
    if (!isAdmin && !isOwner) return res.status(403).json({ success: false, message: 'Not authorized' });

    report.adminNotes = note;
    report.notesHistory = report.notesHistory || [];
    report.notesHistory.push({ note, author: req.user._id, createdAt: new Date() });
    await report.save();

    notifyReportNote({ report, note, actorId: req.user._id });

    res.json({ success: true, message: 'Notes updated', report });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update notes' });
  }
});

/* ---------- Map markers ---------- */
router.get('/markers', async (req, res) => {
  try {
    const { startDate, endDate, district, issueTypes } = req.query;
    const q = {};

    if (startDate || endDate) {
      const createdAt = {};
      if (startDate) createdAt.$gte = new Date(startDate);
      if (endDate) {
        const d = new Date(endDate);
        d.setHours(23, 59, 59, 999);
        createdAt.$lte = d;
      }
      q.createdAt = createdAt;
    }

    if (district) q.district = district;

    if (issueTypes) {
      const arr = String(issueTypes).split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      if (arr.length) q.issueType = { $in: arr };
    }

    const reports = await Report.find(q).select('title description issueType status address district createdAt location');

    const data = reports
      .filter(r => r?.location?.coordinates?.length >= 2)
      .map(r => ({
        id: r._id,
        lat: r.location.coordinates[1],
        lng: r.location.coordinates[0],
        title: r.title || 'Report',
        description: r.description || '',
        type: (r.issueType || 'other').toLowerCase(),
        status: (r.status || 'pending').toLowerCase(),
        createdAt: r.createdAt,
        address: r.address || r.district || ''
      }));

    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to load markers' });
  }
});

module.exports = router;
