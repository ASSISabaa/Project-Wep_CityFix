const User = require('../models/User');
const { USER_ROLES } = require('../config/constants');

const getUsers = async (req, res, next) => {
    try {
        const { role, department, isActive, search, page = 1, limit = 20 } = req.query;
        
        const query = { ...req.tenantFilter };
        
        if (role) query.role = role;
        if (department) query.department = department;
        if (isActive !== undefined) query.isActive = isActive === 'true';
        
        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { 'profile.firstName': { $regex: search, $options: 'i' } },
                { 'profile.lastName': { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .populate('supervisor', 'username email')
            .populate('tenant', 'name code')
            .sort('-createdAt')
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await User.countDocuments(query);

        res.json({
            success: true,
            count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            data: users
        });
    } catch (error) {
        next(error);
    }
};

const getUser = async (req, res, next) => {
    try {
        const user = await User.findOne({
            _id: req.params.id,
            ...req.tenantFilter
        })
        .select('-password')
        .populate('supervisor', 'username email')
        .populate('tenant', 'name code city');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

const createUser = async (req, res, next) => {
    try {
        const { username, email, password, role, department, supervisor } = req.body;

        if ([USER_ROLES.SUPER_SUPER_ADMIN, USER_ROLES.SUPER_ADMIN].includes(role) &&
            req.user.role !== USER_ROLES.SUPER_SUPER_ADMIN) {
            return res.status(403).json({
                success: false,
                message: 'You cannot create users with this role'
            });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        const userData = {
            username,
            email,
            password,
            role,
            department,
            supervisor,
            tenant: req.user.tenant._id || req.user.tenant
        };

        if (req.user.role === USER_ROLES.SUPER_SUPER_ADMIN && req.body.tenant) {
            userData.tenant = req.body.tenant;
        }

        const user = await User.create(userData);

        res.status(201).json({
            success: true,
            data: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                tenant: user.tenant
            }
        });
    } catch (error) {
        next(error);
    }
};

const updateUser = async (req, res, next) => {
    try {
        const user = await User.findOne({
            _id: req.params.id,
            ...req.tenantFilter
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const allowedUpdates = ['username', 'role', 'department', 'supervisor', 'isActive', 'permissions'];
        const updates = {};
        
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        if (updates.role && 
            [USER_ROLES.SUPER_SUPER_ADMIN, USER_ROLES.SUPER_ADMIN].includes(updates.role) &&
            req.user.role !== USER_ROLES.SUPER_SUPER_ADMIN) {
            return res.status(403).json({
                success: false,
                message: 'You cannot assign this role'
            });
        }

        Object.assign(user, updates);
        await user.save();

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const user = await User.findOne({
            _id: req.params.id,
            ...req.tenantFilter
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role === USER_ROLES.SUPER_SUPER_ADMIN) {
            return res.status(403).json({
                success: false,
                message: 'Cannot delete super admin'
            });
        }

        user.isActive = false;
        await user.save();

        res.json({
            success: true,
            message: 'User deactivated successfully'
        });
    } catch (error) {
        next(error);
    }
};

const getUserStatistics = async (req, res, next) => {
    try {
        const user = await User.findOne({
            _id: req.params.id,
            ...req.tenantFilter
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const Report = require('../models/Report');
        
        const stats = {
            totalReports: await Report.countDocuments({ reporter: user._id }),
            assignedReports: await Report.countDocuments({ assignedTo: user._id }),
            resolvedReports: await Report.countDocuments({ 
                assignedTo: user._id,
                status: 'resolved'
            }),
            averageResolutionTime: user.statistics.avgResolutionTime,
            rating: user.statistics.rating,
            totalRatings: user.statistics.totalRatings
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
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    getUserStatistics
};