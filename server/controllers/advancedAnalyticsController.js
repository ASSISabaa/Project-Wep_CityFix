// server/controllers/advancedAnalyticsController.js
const Report = require('../models/Report');
const User = require('../models/User');
const { REPORT_STATUS } = require('../config/constants');

const getComprehensiveOverview = async (req, res, next) => {
  try {
    const { startDate, endDate, department } = req.query;
    const dateFilter = {};
    
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    
    let matchStage = { ...req.tenantFilter };
    if (startDate || endDate) {
      matchStage.createdAt = dateFilter;
    }
    if (department) {
      matchStage.department = department;
    }

    if (req.user.role === 'DEPARTMENT_MANAGER') {
      matchStage.department = req.user.department;
    }

    const [
      totalReports,
      statusBreakdown,
      typeBreakdown,
      priorityBreakdown,
      departmentBreakdown,
      resolutionStats,
      timeToResolve,
      satisfactionScores
    ] = await Promise.all([
      Report.countDocuments(matchStage),
      
      Report.aggregate([
        { $match: matchStage },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      Report.aggregate([
        { $match: matchStage },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      Report.aggregate([
        { $match: matchStage },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      Report.aggregate([
        { $match: matchStage },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      Report.aggregate([
        { $match: { ...matchStage, status: REPORT_STATUS.RESOLVED } },
        {
          $group: {
            _id: null,
            avgResolutionTime: { $avg: '$resolution.resolutionTime' },
            minResolutionTime: { $min: '$resolution.resolutionTime' },
            maxResolutionTime: { $max: '$resolution.resolutionTime' },
            totalResolved: { $sum: 1 }
          }
        }
      ]),
      
      Report.aggregate([
        { $match: { ...matchStage, status: REPORT_STATUS.RESOLVED } },
        {
          $bucket: {
            groupBy: '$resolution.resolutionTime',
            boundaries: [0, 24, 48, 72, 168, 336, Infinity],
            default: 'Other',
            output: {
              count: { $sum: 1 },
              reports: { $push: '$reportNumber' }
            }
          }
        }
      ]),
      
      Report.aggregate([
        { $match: { ...matchStage, 'feedback.rating': { $exists: true } } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$feedback.rating' },
            totalRatings: { $sum: 1 },
            distribution: {
              $push: '$feedback.rating'
            }
          }
        }
      ])
    ]);

    const topReporters = await Report.aggregate([
      { $match: matchStage },
      { $group: { _id: '$reporter', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          count: 1,
          username: '$user.username',
          email: '$user.email'
        }
      }
    ]);

    const topPerformers = await Report.aggregate([
      { $match: { ...matchStage, status: REPORT_STATUS.RESOLVED } },
      { $group: { _id: '$resolution.resolvedBy', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          count: 1,
          username: '$user.username',
          email: '$user.email'
        }
      }
    ]);

    const overview = {
      summary: {
        totalReports,
        resolutionRate: totalReports > 0 
          ? ((resolutionStats[0]?.totalResolved || 0) / totalReports * 100).toFixed(2)
          : 0,
        avgResolutionTime: resolutionStats[0]?.avgResolutionTime || 0,
        avgSatisfaction: satisfactionScores[0]?.avgRating || 0
      },
      breakdowns: {
        status: statusBreakdown,
        type: typeBreakdown,
        priority: priorityBreakdown,
        department: departmentBreakdown
      },
      resolutionMetrics: {
        stats: resolutionStats[0] || {},
        timeDistribution: timeToResolve
      },
      satisfaction: satisfactionScores[0] || {},
      topContributors: {
        reporters: topReporters,
        solvers: topPerformers
      }
    };

    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    next(error);
  }
};

const getTrendAnalysis = async (req, res, next) => {
  try {
    const { period = 'month', limit = 12, metric = 'all' } = req.query;
    
    let groupBy;
    switch(period) {
      case 'day':
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'week':
        groupBy = {
          year: { $isoWeekYear: '$createdAt' },
          week: { $isoWeek: '$createdAt' }
        };
        break;
      case 'month':
      default:
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
    }

    let matchStage = { ...req.tenantFilter };
    if (req.user.role === 'DEPARTMENT_MANAGER') {
      matchStage.department = req.user.department;
    }

    const trends = await Report.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupBy,
          total: { $sum: 1 },
          new: {
            $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'inProgress'] }, 1, 0] }
          },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          avgResolutionTime: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'resolved'] },
                '$resolution.resolutionTime',
                null
              ]
            }
          },
          urgent: {
            $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] }
          },
          high: {
            $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.week': -1, '_id.day': -1 } },
      { $limit: parseInt(limit) }
    ]);

    const typesTrend = await Report.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            period: groupBy,
            type: '$type'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.period.year': -1, '_id.period.month': -1 } },
      { $limit: parseInt(limit) * 5 }
    ]);

    res.json({
      success: true,
      data: {
        overall: trends,
        byType: typesTrend
      }
    });
  } catch (error) {
    next(error);
  }
};

const getHeatmapData = async (req, res, next) => {
  try {
    const { days = 30, types, priorities } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    let matchStage = {
      ...req.tenantFilter,
      'location.coordinates': { $exists: true },
      createdAt: { $gte: startDate }
    };

    if (types) {
      matchStage.type = { $in: types.split(',') };
    }
    if (priorities) {
      matchStage.priority = { $in: priorities.split(',') };
    }

    if (req.user.role === 'DEPARTMENT_MANAGER') {
      matchStage.department = req.user.department;
    }

    const reports = await Report.find(matchStage)
      .select('location.coordinates type status priority createdAt')
      .limit(2000)
      .lean();

    const heatmapData = reports.map(report => ({
      lat: report.location.coordinates.lat,
      lng: report.location.coordinates.lng,
      weight: report.priority === 'urgent' ? 4 : 
              report.priority === 'high' ? 3 :
              report.priority === 'medium' ? 2 : 1,
      type: report.type,
      status: report.status,
      date: report.createdAt
    }));

    const clusters = await Report.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            lat: { $round: ['$location.coordinates.lat', 3] },
            lng: { $round: ['$location.coordinates.lng', 3] }
          },
          count: { $sum: 1 },
          types: { $push: '$type' },
          avgPriority: {
            $avg: {
              $switch: {
                branches: [
                  { case: { $eq: ['$priority', 'urgent'] }, then: 4 },
                  { case: { $eq: ['$priority', 'high'] }, then: 3 },
                  { case: { $eq: ['$priority', 'medium'] }, then: 2 }
                ],
                default: 1
              }
            }
          }
        }
      },
      { $match: { count: { $gte: 3 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    res.json({
      success: true,
      data: {
        points: heatmapData,
        clusters: clusters.map(c => ({
          lat: c._id.lat,
          lng: c._id.lng,
          count: c.count,
          severity: c.avgPriority
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

const getPerformanceMetrics = async (req, res, next) => {
  try {
    const { userId, startDate, endDate, detailed = false } = req.query;
    
    let matchStage = { ...req.tenantFilter };
    
    if (userId) {
      matchStage.assignedTo = userId;
    } else if (req.user.role === 'EMPLOYEE') {
      matchStage.assignedTo = req.user._id;
    }
    
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const [basicMetrics, resolutionMetrics, qualityMetrics] = await Promise.all([
      Report.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalAssigned: { $sum: 1 },
            resolved: {
              $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
            },
            inProgress: {
              $sum: { $cond: [{ $eq: ['$status', 'inProgress'] }, 1, 0] }
            },
            pending: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            }
          }
        }
      ]),
      
      Report.aggregate([
        { $match: { ...matchStage, status: 'resolved' } },
        {
          $group: {
            _id: null,
            avgResolutionTime: { $avg: '$resolution.resolutionTime' },
            minResolutionTime: { $min: '$resolution.resolutionTime' },
            maxResolutionTime: { $max: '$resolution.resolutionTime' },
            under24h: {
              $sum: { $cond: [{ $lte: ['$resolution.resolutionTime', 24] }, 1, 0] }
            },
            under48h: {
              $sum: { $cond: [{ $lte: ['$resolution.resolutionTime', 48] }, 1, 0] }
            },
            under72h: {
              $sum: { $cond: [{ $lte: ['$resolution.resolutionTime', 72] }, 1, 0] }
            }
          }
        }
      ]),
      
      Report.aggregate([
        { $match: { ...matchStage, 'feedback.rating': { $exists: true } } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$feedback.rating' },
            totalRatings: { $sum: 1 },
            rating5: {
              $sum: { $cond: [{ $eq: ['$feedback.rating', 5] }, 1, 0] }
            },
            rating4: {
              $sum: { $cond: [{ $eq: ['$feedback.rating', 4] }, 1, 0] }
            },
            rating3: {
              $sum: { $cond: [{ $eq: ['$feedback.rating', 3] }, 1, 0] }
            },
            rating2: {
              $sum: { $cond: [{ $eq: ['$feedback.rating', 2] }, 1, 0] }
            },
            rating1: {
              $sum: { $cond: [{ $eq: ['$feedback.rating', 1] }, 1, 0] }
            }
          }
        }
      ])
    ]);

    const basic = basicMetrics[0] || {};
    const resolution = resolutionMetrics[0] || {};
    const quality = qualityMetrics[0] || {};

    const metrics = {
      workload: {
        totalAssigned: basic.totalAssigned || 0,
        resolved: basic.resolved || 0,
        inProgress: basic.inProgress || 0,
        pending: basic.pending || 0,
        resolutionRate: basic.totalAssigned > 0
          ? ((basic.resolved / basic.totalAssigned) * 100).toFixed(2)
          : 0
      },
      efficiency: {
        avgResolutionTime: resolution.avgResolutionTime || 0,
        minResolutionTime: resolution.minResolutionTime || 0,
        maxResolutionTime: resolution.maxResolutionTime || 0,
        slaCompliance: {
          under24h: resolution.under24h || 0,
          under48h: resolution.under48h || 0,
          under72h: resolution.under72h || 0
        }
      },
      quality: {
        avgRating: quality.avgRating || 0,
        totalRatings: quality.totalRatings || 0,
        distribution: {
          5: quality.rating5 || 0,
          4: quality.rating4 || 0,
          3: quality.rating3 || 0,
          2: quality.rating2 || 0,
          1: quality.rating1 || 0
        },
        satisfactionRate: quality.totalRatings > 0
          ? (((quality.rating5 + quality.rating4) / quality.totalRatings) * 100).toFixed(2)
          : 0
      }
    };

    if (detailed === 'true') {
      const recentActivity = await Report.find(matchStage)
        .sort('-updatedAt')
        .limit(10)
        .select('title status reportNumber priority updatedAt')
        .lean();
      
      metrics.recentActivity = recentActivity;
    }

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    next(error);
  }
};

const getComparativeAnalysis = async (req, res, next) => {
  try {
    const { compareWith = 'departments', period = 'month' } = req.query;

    let matchStage = { ...req.tenantFilter };
    const periodDate = new Date();
    periodDate.setMonth(periodDate.getMonth() - (period === 'month' ? 1 : 3));
    matchStage.createdAt = { $gte: periodDate };

    let groupField;
    switch(compareWith) {
      case 'departments':
        groupField = '$department';
        break;
      case 'types':
        groupField = '$type';
        break;
      case 'priorities':
        groupField = '$priority';
        break;
      default:
        groupField = '$department';
    }

    const comparison = await Report.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupField,
          total: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          avgResolutionTime: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'resolved'] },
                '$resolution.resolutionTime',
                null
              ]
            }
          },
          urgent: {
            $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          category: '$_id',
          total: 1,
          resolved: 1,
          resolutionRate: {
            $multiply: [
              { $divide: ['$resolved', '$total'] },
              100
            ]
          },
          avgResolutionTime: 1,
          urgent: 1
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getComprehensiveOverview,
  getTrendAnalysis,
  getHeatmapData,
  getPerformanceMetrics,
  getComparativeAnalysis
};