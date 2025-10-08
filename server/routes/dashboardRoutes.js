const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Report = require('../models/Report');
const User = require('../models/User');

router.use(authenticate);

router.get('/stats', async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let query = { isDeleted: false };
    if (req.user.tenant) query.tenant = req.user.tenant;

    if (req.user.role === 'EMPLOYEE') {
      query.assignedTo = req.user._id;
    } else if (req.user.role === 'CITIZEN') {
      query.reporter = req.user._id;
    }

    const [totalReports, newReports, inProgressReports, resolvedReports, todayReports] = await Promise.all([
      Report.countDocuments(query),
      Report.countDocuments({ ...query, status: 'new' }),
      Report.countDocuments({ ...query, status: 'inProgress' }),
      Report.countDocuments({ ...query, status: 'resolved' }),
      Report.countDocuments({ ...query, createdAt: { $gte: today } })
    ]);

    res.json({
      success: true,
      data: {
        totalReports,
        newReports,
        inProgressReports,
        resolvedReports,
        todayReports
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/recent-activity', async (req, res, next) => {
  try {
    let query = { isDeleted: false };
    if (req.user.tenant) query.tenant = req.user.tenant;

    if (req.user.role === 'EMPLOYEE') {
      query.$or = [{ assignedTo: req.user._id }, { reporter: req.user._id }];
    } else if (req.user.role === 'CITIZEN') {
      query.reporter = req.user._id;
    }

    const recentReports = await Report.find(query)
      .sort('-createdAt')
      .limit(10)
      .populate('reporter', 'username email')
      .populate('assignedTo', 'username')
      .select('title status reportNumber priority createdAt type');

    res.json({
      success: true,
      data: recentReports
    });
  } catch (error) {
    next(error);
  }
});

router.get('/chart-data', async (req, res, next) => {
  try {
    const { type = 'weekly' } = req.query;
    const now = new Date();
    let startDate;

    if (type === 'daily') {
      startDate = new Date(now.setDate(now.getDate() - 7));
    } else if (type === 'weekly') {
      startDate = new Date(now.setDate(now.getDate() - 30));
    } else {
      startDate = new Date(now.setMonth(now.getMonth() - 12));
    }

    let query = { createdAt: { $gte: startDate }, isDeleted: false };
    if (req.user.tenant) query.tenant = req.user.tenant;

    if (req.user.role === 'EMPLOYEE') {
      query.assignedTo = req.user._id;
    } else if (req.user.role === 'CITIZEN') {
      query.reporter = req.user._id;
    }

    const chartData = await Report.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: chartData
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;