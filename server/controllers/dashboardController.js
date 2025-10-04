const Report = require('../models/Report');
const User = require('../models/User');
const Analytics = require('../models/Analytics');
const { REPORT_STATUS } = require('../config/constants');

const getDashboardWidgets = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const widgets = {};

        // Stats Widget
        widgets.stats = {
            totalReports: await Report.countDocuments(req.tenantFilter),
            todayReports: await Report.countDocuments({
                ...req.tenantFilter,
                createdAt: { $gte: today }
            }),
            pendingReports: await Report.countDocuments({
                ...req.tenantFilter,
                status: { $in: [REPORT_STATUS.NEW, REPORT_STATUS.ASSIGNED] }
            }),
            resolvedToday: await Report.countDocuments({
                ...req.tenantFilter,
                status: REPORT_STATUS.RESOLVED,
                'resolution.resolvedAt': { $gte: today }
            })
        };

        // Performance Widget
        const performance = await Report.aggregate([
            { $match: { ...req.tenantFilter, status: REPORT_STATUS.RESOLVED } },
            { $group: {
                _id: null,
                avgResolutionTime: { $avg: '$resolution.resolutionTime' },
                count: { $sum: 1 }
            }}
        ]);

        widgets.performance = {
            resolutionRate: (performance[0]?.count || 0) / (widgets.stats.totalReports || 1) * 100,
            avgResolutionTime: performance[0]?.avgResolutionTime || 0
        };

        // Recent Activity Widget
        widgets.recentActivity = await Report.find(req.tenantFilter)
            .sort('-createdAt')
            .limit(5)
            .populate('reporter', 'username')
            .select('title status createdAt reportNumber');

        // Top Performers Widget
        widgets.topPerformers = await User.aggregate([
            { $match: { tenant: req.tenantId, role: 'employee' } },
            { $lookup: {
                from: 'reports',
                let: { userId: '$_id' },
                pipeline: [
                    { $match: {
                        $expr: {
                            $and: [
                                { $eq: ['$resolution.resolvedBy', '$$userId'] },
                                { $eq: ['$status', 'resolved'] },
                                { $gte: ['$resolution.resolvedAt', today] }
                            ]
                        }
                    }}
                ],
                as: 'resolvedReports'
            }},
            { $project: {
                username: 1,
                profile: 1,
                resolved: { $size: '$resolvedReports' }
            }},
            { $sort: { resolved: -1 } },
            { $limit: 5 }
        ]);

        // Heatmap Data Widget
        widgets.heatmapData = await Report.find({
            ...req.tenantFilter,
            'location.coordinates': { $exists: true }
        })
        .select('location.coordinates type status')
        .limit(100);

        res.json({
            success: true,
            data: widgets
        });
    } catch (error) {
        next(error);
    }
};

const getCustomWidget = async (req, res, next) => {
    try {
        const { type, config } = req.query;
        let data;

        switch(type) {
            case 'chart':
                data = await getChartData(req.tenantFilter, config);
                break;
            case 'list':
                data = await getListData(req.tenantFilter, config);
                break;
            case 'metric':
                data = await getMetricData(req.tenantFilter, config);
                break;
            default:
                data = null;
        }

        res.json({
            success: true,
            data
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboardWidgets,
    getCustomWidget
};