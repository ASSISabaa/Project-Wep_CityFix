const Tenant = require('../models/Tenant');
const User = require('../models/User');

const createTenant = async (req, res, next) => {
    try {
        const { name, code, city, country, language, timezone } = req.body;

        const existingTenant = await Tenant.findOne({ 
            $or: [{ code }, { name }] 
        });

        if (existingTenant) {
            return res.status(400).json({
                success: false,
                message: 'Tenant with this name or code already exists'
            });
        }

        const tenant = await Tenant.create({
            name,
            code,
            city,
            country,
            language,
            timezone,
            createdBy: req.user._id
        });

        res.status(201).json({
            success: true,
            data: tenant
        });
    } catch (error) {
        next(error);
    }
};

const getTenants = async (req, res, next) => {
    try {
        const { isActive, search, page = 1, limit = 20 } = req.query;
        
        const query = {};
        
        if (isActive !== undefined) query.isActive = isActive === 'true';
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } }
            ];
        }

        const tenants = await Tenant.find(query)
            .populate('createdBy', 'username email')
            .sort('-createdAt')
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Tenant.countDocuments(query);

        res.json({
            success: true,
            count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            data: tenants
        });
    } catch (error) {
        next(error);
    }
};

const getTenant = async (req, res, next) => {
    try {
        const tenant = await Tenant.findById(req.params.id)
            .populate('createdBy', 'username email');

        if (!tenant) {
            return res.status(404).json({
                success: false,
                message: 'Tenant not found'
            });
        }

        const userCount = await User.countDocuments({ tenant: tenant._id });
        const Report = require('../models/Report');
        const reportCount = await Report.countDocuments({ tenant: tenant._id });

        res.json({
            success: true,
            data: {
                ...tenant.toObject(),
                userCount,
                reportCount
            }
        });
    } catch (error) {
        next(error);
    }
};

const updateTenant = async (req, res, next) => {
    try {
        const tenant = await Tenant.findById(req.params.id);

        if (!tenant) {
            return res.status(404).json({
                success: false,
                message: 'Tenant not found'
            });
        }

        const allowedUpdates = ['name', 'city', 'country', 'language', 'timezone', 'settings', 'subscription', 'isActive'];
        const updates = {};
        
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        Object.assign(tenant, updates);
        await tenant.save();

        res.json({
            success: true,
            data: tenant
        });
    } catch (error) {
        next(error);
    }
};

const deleteTenant = async (req, res, next) => {
    try {
        const tenant = await Tenant.findById(req.params.id);

        if (!tenant) {
            return res.status(404).json({
                success: false,
                message: 'Tenant not found'
            });
        }

        tenant.isActive = false;
        await tenant.save();

        await User.updateMany(
            { tenant: tenant._id },
            { isActive: false }
        );

        res.json({
            success: true,
            message: 'Tenant deactivated successfully'
        });
    } catch (error) {
        next(error);
    }
};

const getTenantStatistics = async (req, res, next) => {
    try {
        const tenant = await Tenant.findById(req.params.id);

        if (!tenant) {
            return res.status(404).json({
                success: false,
                message: 'Tenant not found'
            });
        }

        const Report = require('../models/Report');
        const { REPORT_STATUS } = require('../config/constants');

        const stats = {
            totalUsers: await User.countDocuments({ tenant: tenant._id }),
            activeUsers: await User.countDocuments({ tenant: tenant._id, isActive: true }),
            totalReports: await Report.countDocuments({ tenant: tenant._id }),
            newReports: await Report.countDocuments({ 
                tenant: tenant._id, 
                status: REPORT_STATUS.NEW 
            }),
            inProgressReports: await Report.countDocuments({ 
                tenant: tenant._id, 
                status: REPORT_STATUS.IN_PROGRESS 
            }),
            resolvedReports: await Report.countDocuments({ 
                tenant: tenant._id, 
                status: REPORT_STATUS.RESOLVED 
            }),
            reportsByType: await Report.aggregate([
                { $match: { tenant: tenant._id } },
                { $group: { _id: '$type', count: { $sum: 1 } } }
            ]),
            reportsByMonth: await Report.aggregate([
                { $match: { tenant: tenant._id } },
                { $group: {
                    _id: { 
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }},
                { $sort: { '_id.year': -1, '_id.month': -1 } },
                { $limit: 12 }
            ])
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createTenant,
    getTenants,
    getTenant,
    updateTenant,
    deleteTenant,
    getTenantStatistics
};