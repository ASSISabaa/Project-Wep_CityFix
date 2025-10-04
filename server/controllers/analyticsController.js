const Report = require('../models/Report');
const User = require('../models/User');
const { REPORT_STATUS, REPORT_TYPES } = require('../config/constants');

const getOverview = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const dateFilter = {};
        
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) dateFilter.$lte = new Date(endDate);
        
        const matchStage = { ...req.tenantFilter };
        if (startDate || endDate) {
            matchStage.createdAt = dateFilter;
        }

        const overview = {
            totalReports: await Report.countDocuments(matchStage),
            statusBreakdown: await Report.aggregate([
                { $match: matchStage },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            typeBreakdown: await Report.aggregate([
                { $match: matchStage },
                { $group: { _id: '$type', count: { $sum: 1 } } }
            ]),
            priorityBreakdown: await Report.aggregate([
                { $match: matchStage },
                { $group: { _id: '$priority', count: { $sum: 1 } } }
            ]),
            departmentBreakdown: await Report.aggregate([
                { $match: matchStage },
                { $group: { _id: '$department', count: { $sum: 1 } } }
            ]),
            resolutionStats: await Report.aggregate([
                { $match: { ...matchStage, status: REPORT_STATUS.RESOLVED } },
                { $group: {
                    _id: null,
                    avgResolutionTime: { $avg: '$resolution.resolutionTime' },
                    minResolutionTime: { $min: '$resolution.resolutionTime' },
                    maxResolutionTime: { $max: '$resolution.resolutionTime' }
                }}
            ]),
            topReporters: await Report.aggregate([
                { $match: matchStage },
                { $group: { _id: '$reporter', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
                { $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }},
                { $unwind: '$user' },
                { $project: {
                    count: 1,
                    username: '$user.username',
                    email: '$user.email'
                }}
            ]),
            topEmployees: await Report.aggregate([
                { $match: { ...matchStage, status: REPORT_STATUS.RESOLVED } },
                { $group: { _id: '$resolution.resolvedBy', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
                { $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }},
                { $unwind: '$user' },
                { $project: {
                    count: 1,
                    username: '$user.username',
                    email: '$user.email'
                }}
            ])
        };

        res.json({
            success: true,
            data: overview
        });
    } catch (error) {
        next(error);
    }
};

const getTrends = async (req, res, next) => {
    try {
        const { period = 'month', limit = 12 } = req.query;
        
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
                    year: { $year: '$createdAt' },
                    week: { $week: '$createdAt' }
                };
                break;
            case 'month':
            default:
                groupBy = {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                };
        }

        const trends = await Report.aggregate([
            { $match: req.tenantFilter },
            { $group: {
                _id: groupBy,
                total: { $sum: 1 },
                resolved: {
                    $sum: {
                        $cond: [{ $eq: ['$status', REPORT_STATUS.RESOLVED] }, 1, 0]
                    }
                },
                avgResolutionTime: {
                    $avg: {
                        $cond: [
                            { $eq: ['$status', REPORT_STATUS.RESOLVED] },
                            '$resolution.resolutionTime',
                            null
                        ]
                    }
                }
            }},
            { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
            { $limit: parseInt(limit) }
        ]);

        res.json({
            success: true,
            data: trends
        });
    } catch (error) {
        next(error);
    }
};

const getHeatmapData = async (req, res, next) => {
    try {
        const reports = await Report.find({
            ...req.tenantFilter,
            'location.coordinates': { $exists: true }
        })
        .select('location.coordinates type status priority createdAt')
        .limit(1000);

        const heatmapData = reports.map(report => ({
            lat: report.location.coordinates.coordinates[1],
            lng: report.location.coordinates.coordinates[0],
            weight: report.priority === 'urgent' ? 3 : 
                    report.priority === 'high' ? 2 : 1,
            type: report.type,
            status: report.status
        }));

        res.json({
            success: true,
            data: heatmapData
        });
    } catch (error) {
        next(error);
    }
};

const getPerformanceMetrics = async (req, res, next) => {
    try {
        const { userId, startDate, endDate } = req.query;
        
        const matchStage = { ...req.tenantFilter };
        if (userId) matchStage.assignedTo = userId;
        if (startDate || endDate) {
            matchStage.createdAt = {};
            if (startDate) matchStage.createdAt.$gte = new Date(startDate);
            if (endDate) matchStage.createdAt.$lte = new Date(endDate);
        }

        const metrics = {
            totalAssigned: await Report.countDocuments(matchStage),
            totalResolved: await Report.countDocuments({
                ...matchStage,
                status: REPORT_STATUS.RESOLVED
            }),
            avgResolutionTime: await Report.aggregate([
                { $match: { ...matchStage, status: REPORT_STATUS.RESOLVED } },
                { $group: {
                    _id: null,
                    avg: { $avg: '$resolution.resolutionTime' }
                }}
            ]),
            resolutionRate: 0,
            ratings: await Report.aggregate([
                { $match: { ...matchStage, 'feedback.rating': { $exists: true } } },
                { $group: {
                    _id: null,
                    avgRating: { $avg: '$feedback.rating' },
                    totalRatings: { $sum: 1 }
                }}
            ])
        };

        if (metrics.totalAssigned > 0) {
            metrics.resolutionRate = (metrics.totalResolved / metrics.totalAssigned * 100).toFixed(2);
        }

        res.json({
            success: true,
            data: metrics
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getOverview,
    getTrends,
    getHeatmapData,
    getPerformanceMetrics
};