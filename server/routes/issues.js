// server/routes/issues.js
const router = require('express').Router();
const Report = require('../models/Report');

router.get('/stats', async (_req, res) => {
  try {
    const agg = await Report.aggregate([
      {
        $group: {
          _id: { $toLower: { $ifNull: ['$issueType', 'other'] } },
          count: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $in: ['$status', ['resolved','closed']] }, 1, 0] } },
          pending:  { $sum: { $cond: [{ $in: ['$status', ['pending','new']] }, 1, 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const nameMap = {
      pothole: 'Potholes',
      lighting: 'Street Lighting',
      drainage: 'Drainage',
      traffic: 'Traffic',
      safety: 'Safety',
      vandalism: 'Vandalism',
      garbage: 'Garbage',
      other: 'Other'
    };

    const data = {};
    agg.forEach(t => {
      const key = t._id || 'other';
      data[key] = {
        name: nameMap[key] || (key.charAt(0).toUpperCase() + key.slice(1)),
        count: t.count || 0,
        resolved: t.resolved || 0,
        pending: t.pending || 0
      };
    });

    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to compute issue stats' });
  }
});

module.exports = router;
