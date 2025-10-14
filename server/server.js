// server/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const aiRoutes = require('./routes/aiRoutes');
require('dotenv').config();

const app = express();

// ===== Middleware =====
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
app.use(cors({
    origin: function(origin, callback) {
        const allowedOrigins = [
            'http://localhost:5500',
            'http://127.0.0.1:5500',
            'http://localhost:3000',
            'http://127.0.0.1:3000'
        ];
        
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, true);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== Database Connection =====
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cityfix', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// ===== Import Routes =====
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const publicRoutes = require('./routes/publicRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// ===== Health Check =====
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// ===== Districts Endpoint =====
app.get('/api/districts', (req, res) => {
    const districts = [
        { value: 'downtown', name: 'Downtown' },
        { value: 'north', name: 'North District' },
        { value: 'south', name: 'South District' },
        { value: 'east', name: 'East District' },
        { value: 'west', name: 'West District' },
        { value: 'central', name: 'Central District' }
    ];
    
    res.json({
        success: true,
        data: districts,
        count: districts.length
    });
});

// ===== Report Types Endpoint =====
app.get('/api/report-types', (req, res) => {
    const types = [
        { value: 'pothole', name: 'Pothole', icon: '🕳️' },
        { value: 'lighting', name: 'Street Lighting', icon: '💡' },
        { value: 'drainage', name: 'Drainage', icon: '🚰' },
        { value: 'traffic', name: 'Traffic', icon: '🚦' },
        { value: 'vandalism', name: 'Vandalism', icon: '🎨' },
        { value: 'garbage', name: 'Garbage', icon: '🗑️' },
        { value: 'noise', name: 'Noise', icon: '🔊' },
        { value: 'other', name: 'Other', icon: '📋' }
    ];
    
    res.json({
        success: true,
        data: types,
        count: types.length
    });
});

// ===== Locales Endpoint =====
app.get('/api/locales/:lang', (req, res) => {
    const { lang } = req.params;
    const supportedLanguages = ['en', 'ar', 'he'];
    
    if (!supportedLanguages.includes(lang)) {
        return res.status(404).json({
            success: false,
            message: 'Language not supported'
        });
    }
    
    try {
        const translations = require(`./locales/${lang}.json`);
        res.json(translations);
    } catch (error) {
        res.status(404).json({
            success: false,
            message: 'Language file not found'
        });
    }
});

// ===== API Routes =====
// IMPORTANT: Public routes FIRST (no authentication required)
app.use('/api/public', publicRoutes);

// Protected routes
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);

// ===== Error Handling =====
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ===== Start Server =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 API available at http://localhost:${PORT}/api`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});