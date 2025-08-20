// server/routes/districts.js
const express = require('express');
const router = express.Router();

const DISTRICTS = [
  { id: 'downtown', name: 'Downtown', value: 'downtown' },
  { id: 'northside', name: 'Northside', value: 'northside' },
  { id: 'westend', name: 'West End', value: 'westend' },
  { id: 'eastside', name: 'Eastside', value: 'eastside' },
  { id: 'suburbs', name: 'Suburbs', value: 'suburbs' },
];

router.get('/', async (_req, res) => {
  res.json({ success: true, data: DISTRICTS });
});

// =====  /api/districts/stats =====
const Report = require('../models/Report');

router.get('/stats', async (_req, res) => {
  try {
    const agg = await Report.aggregate([
      {
        $group: {
          _id: { $ifNull: ['$district', 'Unknown'] },
          reports: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $in: ['$status', ['resolved','closed']] }, 1, 0] } },
          pending:  { $sum: { $cond: [{ $in: ['$status', ['pending','new']] }, 1, 0] } }
        }
      },
      { $sort: { reports: -1 } }
    ]);

    const data = {};
    agg.forEach(d => {
      const key = (d._id || 'unknown').toString().toLowerCase();
      data[key] = {
        name: d._id || 'Unknown',
        reports: d.reports || 0,
        resolved: d.resolved || 0,
        pending: d.pending || 0
      };
    });

    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to compute district stats' });
  }
});
// =============================================

module.exports = router;
