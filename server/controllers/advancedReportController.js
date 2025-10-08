// server/controllers/advancedReportController.js
const Report = require('../models/Report');
const AdvancedAIService = require('../services/AdvancedAIService');
const { TranslationService } = require('../services/TranslationService');
const NotificationService = require('../services/NotificationService');
const { PermissionManager } = require('../config/roles');

const translationService = new TranslationService();
const notificationService = new NotificationService();

const createReport = async (req, res, next) => {
  try {
    const userLanguage = req.user.profile?.language || 'en';
    
    let reportData = {
      ...req.body,
      tenant: req.user.tenant,
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
        const aiAnalysis = await AdvancedAIService.analyzeReport(reportData, userLanguage);
        reportData.aiAnalysis = aiAnalysis;

        if (aiAnalysis.suggestedDepartment) {
          reportData.department = aiAnalysis.suggestedDepartment;
        }
        if (aiAnalysis.suggestedPriority) {
          reportData.priority = aiAnalysis.suggestedPriority;
        }
      } catch (aiError) {
        console.log('AI analysis skipped');
      }
    }

    const report = await Report.create(reportData);
    await report.populate('reporter', 'username email profile');

    try {
      await notificationService.notifyNewReport(report);
    } catch (error) {
      console.log('Notification failed');
    }

    const translatedReport = await translationService.translateObject(
      report.toObject(),
      ['title', 'description'],
      'en',
      userLanguage
    );

    res.status(201).json({
      success: true,
      data: translatedReport
    });
  } catch (error) {
    next(error);
  }
};

const getReports = async (req, res, next) => {
  try {
    const userLanguage = req.user.profile?.language || 'en';
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

    const userRole = req.user.role;
    if (userRole === 'EMPLOYEE') {
      query.$or = [
        { assignedTo: req.user._id },
        { reporter: req.user._id }
      ];
    } else if (userRole === 'CITIZEN') {
      query.reporter = req.user._id;
    } else if (userRole === 'DEPARTMENT_MANAGER') {
      query.department = req.user.department;
    }

    const reports = await Report.find(query)
      .populate('reporter', 'username email profile.avatar')
      .populate('assignedTo', 'username email profile.avatar')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Report.countDocuments(query);

    const translatedReports = await translationService.translateBatch(
      reports,
      ['title', 'description'],
      'en',
      userLanguage
    );

    res.json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: translatedReports
    });
  } catch (error) {
    next(error);
  }
};

const getReport = async (req, res, next) => {
  try {
    const userLanguage = req.user.profile?.language || 'en';
    
    const report = await Report.findOne({
      _id: req.params.id,
      ...req.tenantFilter
    })
    .populate('reporter', 'username email profile')
    .populate('assignedTo', 'username email profile')
    .populate('timeline.user', 'username')
    .populate('internalNotes.user', 'username')
    .populate('publicComments.user', 'username profile.avatar')
    .lean();

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (req.user.role === 'CITIZEN' && 
        report.reporter._id.toString() !== req.user._id.toString()) {
      delete report.internalNotes;
    }

    const translatedReport = await translationService.translateObject(
      report,
      ['title', 'description', 'resolution.description'],
      'en',
      userLanguage
    );

    await Report.updateOne(
      { _id: req.params.id },
      { $inc: { 'metadata.viewCount': 1 } }
    );

    res.json({
      success: true,
      data: translatedReport
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

    if (updates.assignedTo && updates.assignedTo !== report.assignedTo?.toString()) {
      const User = require('../models/User');
      const assignedUser = await User.findById(updates.assignedTo);
      
      if (!assignedUser) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user not found'
        });
      }

      report.timeline.push({
        status: 'assigned',
        user: req.user._id,
        comment: `Assigned to ${assignedUser.username}`
      });

      try {
        await notificationService.notifyAssignment(report, assignedUser);
      } catch (error) {
        console.log('Notification failed');
      }
    }

    if (updates.status === 'resolved') {
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

const getAIInsights = async (req, res, next) => {
  try {
    const userLanguage = req.user.profile?.language || 'en';
    const { reportId } = req.params;

    const report = await Report.findOne({
      _id: reportId,
      ...req.tenantFilter
    }).lean();

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const insights = await AdvancedAIService.analyzeReport(report, userLanguage);

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    next(error);
  }
};

const getSimilarReports = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    
    const report = await Report.findById(reportId).lean();
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const similar = await Report.find({
      _id: { $ne: reportId },
      tenant: report.tenant,
      type: report.type,
      'location.geoLocation': {
        $near: {
          $geometry: report.location.geoLocation,
          $maxDistance: 1000
        }
      },
      isDeleted: false
    })
    .limit(5)
    .select('title reportNumber status location createdAt')
    .lean();

    res.json({
      success: true,
      data: similar
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
  getAIInsights,
  getSimilarReports
};