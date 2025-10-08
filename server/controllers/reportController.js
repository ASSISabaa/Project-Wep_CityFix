const Report = require('../models/Report');

exports.createReport = async (req, res) => {
  try {
    const data = { ...req.body, tenant: req.user.tenant, reporter: req.user._id };
    
    if (req.body.lat && req.body.lng) {
      data.location = {
        address: req.body.address || '',
        district: req.body.district || '',
        coordinates: { lat: parseFloat(req.body.lat), lng: parseFloat(req.body.lng) },
        geoLocation: { type: 'Point', coordinates: [parseFloat(req.body.lng), parseFloat(req.body.lat)] }
      };
    }

    const report = await Report.create(data);
    await report.populate('reporter', 'username email');
    res.status(201).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getReports = async (req, res) => {
  try {
    const query = { isDeleted: false };
    if (req.user.tenant) query.tenant = req.user.tenant;
    if (req.user.role === 'CITIZEN') query.reporter = req.user._id;

    const reports = await Report.find(query).populate('reporter', 'username').sort('-createdAt').limit(50);
    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate('reporter assignedTo');
    if (!report) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Not found' });
    
    Object.assign(report, req.body);
    await report.save();
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Not found' });
    
    report.isDeleted = true;
    await report.save();
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addComment = exports.updateReport;
exports.getNearbyReports = exports.getReports;
