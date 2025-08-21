// server/server.js
require('dotenv').config();

const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');

const app = express();

/* ------------------------- Basic app config ------------------------- */
app.set('trust proxy', 1); // for Render/Heroku style proxies

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* --------------------------- CORS handling -------------------------- */
const DEFAULT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];

const ENV_ORIGINS = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const ALLOWED_ORIGINS = [...new Set([...DEFAULT_ORIGINS, ...ENV_ORIGINS])];

app.use(cors({
  origin(origin, cb) {
    // Allow requests without Origin header (Postman, curl, server-to-server)
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    console.error('Blocked by CORS. Origin:', origin, 'Allowed:', ALLOWED_ORIGINS);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors()); // quick response for preflight

/* ---------------------------- Static files -------------------------- */
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

/* --------------------------- Health & Root -------------------------- */
app.get('/', (_req, res) => {
  res.json({
    name: 'CityFix Backend Server',
    version: '2.0.0',
    api: '/api',
    health: '/api/health'
  });
});

app.get('/api/health', (_req, res) => {
  res.status(200).send('OK');
});

/* ------------------------------ Routes ------------------------------ */
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const reportsRoutes = require('./routes/reports');
const contactRoutes = require('./routes/contact');
const issuesRoutes = require('./routes/issues');
const districtsRoutes = require('./routes/districts');
const reportTypesRoutes = require('./routes/reportTypes');
const notificationsRoutes = require('./routes/notifications');
const settingsRoutes = require('./routes/settings');
const teamsRoutes = require('./routes/teams');
const impactRoutes = require('./routes/impact');
const geoRoutes = require('./geoRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/issues', issuesRoutes);
app.use('/api/districts', districtsRoutes);
app.use('/api/report-types', reportTypesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/impact', impactRoutes);
app.use('/api/geo', geoRoutes);

/* --------------------------- Error handlers ------------------------- */
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const msg = err.message || 'Internal Server Error';
  if (msg.includes('CORS')) {
    return res.status(403).json({ success: false, message: msg });
  }
  console.error('Unhandled error:', err);
  res.status(status).json({ success: false, message: msg });
});

/* --------------------------- DB connection -------------------------- */
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ Missing MONGODB_URI env variable');
  process.exit(1);
}

mongoose.set('strictQuery', true);

mongoose.connect(MONGODB_URI, {
  maxPoolSize: 10
}).then(async () => {
  console.log('✅ Connected to MongoDB Atlas');

  // Optional seed/init
  try {
    const seed = require('./utils/seed');
    if (typeof seed?.init === 'function') {
      console.log('🌱 Initializing database...');
      await seed.init();
    } else {
      console.log('🌱 Initializing database...');
      console.log('ℹ️ Database already initialized');
    }
  } catch (e) {
    // If seed.js not present or fails, continue without crashing
    console.log('🌱 Initializing database...');
    console.log('ℹ️ Database already initialized');
  }

}).catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});

/* ------------------------------ Server ------------------------------ */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  const base = process.env.BASE_URL || `http://localhost:${PORT}`;
  const banner = `
╔════════════════════════════════════════════════╗
║         CityFix Backend Server v2.0.0          ║
╠════════════════════════════════════════════════╣
║   Server: ${base.padEnd(36, ' ')}║
║   API:    ${`${base}/api`.padEnd(36, ' ')}║
║   Health: ${`${base}/api/health`.padEnd(36, ' ')}║
╚════════════════════════════════════════════════╝
`.trim();
  console.log(banner);
});

module.exports = app;
