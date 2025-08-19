const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Report = require('../models/Report');
const auth = require('../middleware/auth');
const { notifyReportStatus, notifyReportNote, notifyAdmins, notifyUser } = require('../utils/notify');

router.get('/all', async (_req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json({ success: true, reports, total: reports.length });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch reports' });
  }
});

router.get('/my-reports', auth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const reports = await Report.find({ reportedBy: userId }).sort({ createdAt: -1 });
    res.json({ success: true, reports, total: reports.length });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch user reports' });
  }
});

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

router.post('/', auth, async (req, res) => {
  try {
    const { title, description, issueType, location, address, district, coordinates, images } = req.body;
    const doc = new Report({
      trackingNumber: `R${Date.now()}`,
      title,
      description,
      issueType,
      location: location && location.coordinates ? location : undefined,
      address: address || (typeof location === 'string' ? location : undefined),
      district,
      images: images || [],
      status: 'pending',
      urgency: 'medium',
      reportedBy: req.user._id,
      metadata: {}
    });
    if (!doc.location && coordinates && typeof coordinates.lat === 'number' && typeof coordinates.lng === 'number') {
      doc.location = { type: 'Point', coordinates: [coordinates.lng, coordinates.lat] };
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

    Object.keys(updates).forEach(k => { if (!['_id', 'reportedBy'].includes(k)) report[k] = updates[k]; });
    report.updatedAt = new Date();
    await report.save();

    res.json({ success: true, message: 'Report updated successfully', report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update report', error: error.message });
  }
});

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

module.exports = router;
