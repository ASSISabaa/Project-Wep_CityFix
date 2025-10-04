const Report = require('../models/Report');
const User = require('../models/User');
const NotificationService = require('../services/NotificationService');
const AIService = require('../services/AIService');
const { REPORT_STATUS, USER_ROLES } = require('../config/constants');

const createReport = async (req, res, next) => {
    try {
        const reportData = {
            ...req.body,
            tenant: req.user.tenant._id || req.user.tenant,
            reporter: req.user._id,
            images: req.files ? req.files.map(file => ({
                url: `/uploads/${req.user.tenant}/${file.filename}`,
                caption: file.originalname
            })) : []
        };

        if (req.body.lat && req.body.lng) {
            reportData.location = {
                ...reportData.location,
                coordinates: {
                    lat: parseFloat(req.body.lat),
                    lng: parseFloat(req.body.lng)
                }
            };
        }

        if (process.env.OPENAI_API_KEY) {
            try {
                const aiService = new AIService();
                const aiAnalysis = await aiService.analyzeReport(reportData);
                reportData.aiAnalysis = aiAnalysis;

                if (aiAnalysis.suggestedDepartment) {
                    reportData.department = aiAnalysis.suggestedDepartment;
                }
                if (aiAnalysis.suggestedPriority) {
                    reportData.priority = aiAnalysis.suggestedPriority;
                }
            } catch (aiError) {
                console.log('AI analysis failed, continuing without it');
            }
        }

        const report = await Report.create(reportData);
        
        await report.populate('reporter', 'username email');

        try {
            const notificationService = new NotificationService();
            await notificationService.notifyNewReport(report);
        } catch (notifError) {
            console.log('Notification failed, continuing');
        }

        res.status(201).json({
            success: true,
            data: report
        });
    } catch (error) {
        next(error);
    }
};

const getReports = async (req, res, next) => {
    try {
        const {
            status,
            type,
            priority,
            department,
            assignedTo,
            dateFrom,
            dateTo,
            search,
            page = 1,
            limit = 20,
            sort = '-createdAt'
        } = req.query;

        const query = { ...req.tenantFilter, isDeleted: false };

        if (status) query.status = status;
        if (type) query.type = type;
        if (priority) query.priority = priority;
        if (department) query.department = department;
        if (assignedTo) query.assignedTo = assignedTo;
        
        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
            if (dateTo) query.createdAt.$lte = new Date(dateTo);
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { reportNumber: { $regex: search, $options: 'i' } }
            ];
        }

        if (req.user.role === USER_ROLES.EMPLOYEE) {
            query.$or = [
                { assignedTo: req.user._id },
                { reporter: req.user._id }
            ];
        } else if (req.user.role === USER_ROLES.CITIZEN) {
            query.reporter = req.user._id;
        }

        const reports = await Report.find(query)
            .populate('reporter', 'username email profile.avatar')
            .populate('assignedTo', 'username email profile.avatar')
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Report.countDocuments(query);

        res.json({
            success: true,
            count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            data: reports
        });
    } catch (error) {
        next(error);
    }
};

const getReport = async (req, res, next) => {
    try {
        const report = await Report.findOne({
            _id: req.params.id,
            ...req.tenantFilter
        })
        .populate('reporter', 'username email profile')
        .populate('assignedTo', 'username email profile')
        .populate('timeline.user', 'username')
        .populate('internalNotes.user', 'username')
        .populate('publicComments.user', 'username profile.avatar');

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        if (req.user.role === USER_ROLES.CITIZEN && 
            report.reporter._id.toString() !== req.user._id.toString()) {
            report.internalNotes = undefined;
        }

        report.metadata.viewCount += 1;
        await report.save({ validateBeforeSave: false });

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        next(error);
    }
};

const updateReport = async (req, res, next) => {
    try {
        const report = await Report.findOne({
            _id: req.params.id,
            ...req.tenantFilter
        });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        const allowedUpdates = ['status', 'priority', 'assignedTo', 'department'];
        const updates = {};
        
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        if (updates.status && updates.status !== report.status) {
            report.timeline.push({
                status: updates.status,
                user: req.user._id,
                comment: req.body.statusComment || `Status changed to ${updates.status}`
            });
        }

        if (updates.assignedTo && updates.assignedTo !== report.assignedTo) {
            const assignedUser = await User.findById(updates.assignedTo);
            if (!assignedUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Assigned user not found'
                });
            }

            report.timeline.push({
                status: REPORT_STATUS.ASSIGNED,
                user: req.user._id,
                comment: `Assigned to ${assignedUser.username}`
            });

            try {
                const notificationService = new NotificationService();
                await notificationService.notifyAssignment(report, assignedUser);
            } catch (error) {
                console.log('Notification failed');
            }
        }

        if (updates.status === REPORT_STATUS.RESOLVED) {
            report.resolution = {
                resolvedBy: req.user._id,
                resolvedAt: new Date(),
                description: req.body.resolutionDescription
            };
            report.calculateResolutionTime();
        }

        Object.assign(report, updates);
        await report.save();

        await report.populate('reporter assignedTo');

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        next(error);
    }
};

const addComment = async (req, res, next) => {
    try {
        const report = await Report.findOne({
            _id: req.params.id,
            ...req.tenantFilter
        });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        const comment = {
            user: req.user._id,
            comment: req.body.comment
        };

        if (req.body.isInternal && req.user.role !== USER_ROLES.CITIZEN) {
            report.internalNotes.push({
                user: req.user._id,
                note: req.body.comment
            });
        } else {
            report.publicComments.push(comment);
        }

        await report.save();
        
        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        next(error);
    }
};

const deleteReport = async (req, res, next) => {
    try {
        const report = await Report.findOne({
            _id: req.params.id,
            ...req.tenantFilter
        });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        report.isDeleted = true;
        await report.save();

        res.json({
            success: true,
            message: 'Report deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

const getNearbyReports = async (req, res, next) => {
    try {
        const { lat, lng, radius = 5000 } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required'
            });
        }

        const reports = await Report.find({
            ...req.tenantFilter,
            'location.geoLocation': {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: parseInt(radius)
                }
            },
            isPublic: true,
            isDeleted: false
        })
        .limit(50)
        .populate('reporter', 'username');

        res.json({
            success: true,
            count: reports.length,
            data: reports
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createReport,
    getReports,
    getReport,
    updateReport,
    addComment,
    deleteReport,
    getNearbyReports
};