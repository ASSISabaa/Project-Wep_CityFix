const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'http://localhost:5173',
    'file://'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://127.0.0.1:5500');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cityfix';

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('✅ Connected to MongoDB successfully');
    try {
      const initDB = require('./utils/seed');
      if (typeof initDB === 'function') await initDB();
    } catch (_) {}
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', server: 'CityFix Backend', timestamp: new Date(), uptime: process.uptime() });
});

app.get('/api/districts', (_req, res) => {
  res.json({
    success: true,
    data: [
      { name: 'Downtown', value: 'downtown' },
      { name: 'North Side', value: 'north-side' },
      { name: 'South Side', value: 'south-side' },
      { name: 'East End', value: 'east-end' },
      { name: 'West End', value: 'west-end' },
      { name: 'Central', value: 'central' },
      { name: 'Kafr Bara', value: 'kafr-bara' },
      { name: 'Netanya', value: 'netanya' },
      { name: 'Tel Aviv', value: 'tel-aviv' },
      { name: 'Jerusalem', value: 'jerusalem' }
    ]
  });
});

app.get('/api/report-types', (_req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'lighting', name: 'Lighting' },
      { id: 'roads', name: 'Roads' },
      { id: 'drainage', name: 'Drainage' },
      { id: 'sanitation', name: 'Sanitation' },
      { id: 'parks', name: 'Parks' }
    ]
  });
});

const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const contactRoutes = require('./routes/contact');
const settingsRoutes = require('./routes/settings');
const notificationRoutes = require('./routes/notifications');

let teamsRoutes;
try {
  teamsRoutes = require('./routes/teams');
} catch {
  teamsRoutes = express.Router();
  teamsRoutes.get('/members', (_req, res) => res.json({ success: true, data: [] }));
}

let impactRoutes;
try {
  impactRoutes = require('./routes/impact');
} catch {
  impactRoutes = express.Router();
  const auth = require('./middleware/auth');
  const Report = require('./models/Report');

  impactRoutes.get('/stats', auth, async (req, res) => {
    try {
      const userId = req.user._id;
      const reports = await Report.find({ userId });
      res.json({
        success: true,
        stats: {
          totalReports: reports.length,
          resolvedIssues: reports.filter(r => r.status === 'resolved').length,
          communityImpact: reports.length * 50,
          rating: 4.5
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  impactRoutes.get('/activities', auth, async (req, res) => {
    try {
      const userId = req.user._id;
      const reports = await Report.find({ userId }).sort({ createdAt: -1 }).limit(20);
      res.json({
        success: true,
        activities: reports.map(r => ({
          id: r._id,
          title: r.title || r.issueType,
          type: r.issueType,
          location: r.location,
          lat: r.coordinates?.lat,
          lng: r.coordinates?.lng,
          status: r.status,
          timestamp: r.createdAt,
          description: r.description
        }))
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  impactRoutes.get('/badges', auth, async (req, res) => {
    try {
      const userId = req.user._id;
      const reports = await Report.find({ userId });
      const totalReports = reports.length;
      const resolvedIssues = reports.filter(r => r.status === 'resolved').length;

      res.json({
        success: true,
        badges: [
          { id: 1, type: 'first-report', title: 'First Reporter', description: 'Submit your first report', earned: totalReports > 0, earnedDate: totalReports > 0 ? 'Earned' : null, progress: totalReports > 0 ? 100 : 0 },
          { id: 2, type: 'resolved-issues', title: 'Problem Solver', description: 'Get 10 issues resolved', earned: resolvedIssues >= 10, earnedDate: resolvedIssues >= 10 ? 'Earned' : null, progress: Math.min(100, (resolvedIssues / 10) * 100) },
          { id: 3, type: 'community-hero', title: 'Community Hero', description: 'Help 1000+ residents', earned: totalReports >= 20, earnedDate: totalReports >= 20 ? 'Earned' : null, progress: Math.min(100, (totalReports / 20) * 100) },
          { id: 4, type: 'top-reporter', title: 'Top Reporter', description: 'Submit 50 reports', earned: totalReports >= 50, earnedDate: totalReports >= 50 ? 'Earned' : null, progress: Math.min(100, (totalReports / 50) * 100) }
        ]
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
}

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/impact', impactRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/settings', settingsRoutes);

app.use((err, _req, res, _next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║         CityFix Backend Server v2.0.0          ║
╠════════════════════════════════════════════════╣
║   Server: http://localhost:${PORT}                  ║
║   API:    http://localhost:${PORT}/api              ║
║   Health: http://localhost:${PORT}/api/health       ║
╚════════════════════════════════════════════════╝
  `);
});

module.exports = app;
