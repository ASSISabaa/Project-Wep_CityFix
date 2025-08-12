// =====================================================
// COMPLETE WORKING SERVER - server.js
// Save this as server.js in cityfix-backend folder
// =====================================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'cityfix-secret-key-2025';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cityfix';

// Authorized Admin IDs
const AUTHORIZED_ADMIN_IDS = [
    '123456789',
    '987654321',
    '111111111',
    '222222222',
    '333333333',
    '444444444',
    '555555555'
];

// Middleware
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create upload directories
const createDirs = () => {
    const dirs = ['uploads', 'uploads/profiles', 'uploads/reports'];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Created directory: ${dir}`);
        }
    });
};
createDirs();

// MongoDB Connection
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB Connected Successfully');
        console.log(`📊 Database: cityfix`);
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Failed:', err.message);
        process.exit(1);
    });

// User Schema
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters']
    },
    user_email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6
    },
    user_id: {
        type: String,
        default: null
    },
    userType: {
        type: String,
        enum: ['citizen', 'admin'],
        default: 'citizen'
    },
    user_photo: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};

const User = mongoose.model('User', userSchema);

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = 'uploads/profiles/';
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    },
    limits: { 
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

// Email Service (Simple - without nodemailer)
class EmailService {
    static async sendWelcomeEmail(email, username, userType) {
        // Just log the email that would be sent
        console.log('📧 Welcome email (simulated):', {
            to: email,
            username: username,
            userType: userType,
            message: 'Welcome to CityFix!'
        });
        
        // Return false to indicate email wasn't actually sent
        return false;
    }
}

// Helper function to validate email format
const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Helper function to validate password strength
const isStrongPassword = (password) => {
    return password.length >= 6 && /[A-Za-z]/.test(password) && /\d/.test(password);
};

// =====================================================
// ROUTES
// =====================================================

// Home route
app.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: '🚀 CityFix Backend Server is running!',
        version: '2.0.0',
        timestamp: new Date().toLocaleString('en-IL'),
        endpoints: {
            signup: 'POST /api/auth/signup',
            login: 'POST /api/auth/login',
            test: 'GET /api/test'
        }
    });
});

// Test route
app.get('/api/test', (req, res) => {
    res.json({
        status: 'success',
        message: '✅ API is working perfectly!',
        timestamp: new Date().toISOString()
    });
});

// SIGNUP ROUTE
app.post('/api/auth/signup', upload.single('user_photo'), async (req, res) => {
    console.log('📝 New signup request:', req.body.username);
    
    try {
        const { username, user_email, password, user_id, userType } = req.body;

        // Validation
        if (!username || !user_email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username, email and password are required'
            });
        }

        if (username.length < 3) {
            return res.status(400).json({
                success: false,
                error: 'Username must be at least 3 characters'
            });
        }

        if (!isValidEmail(user_email)) {
            return res.status(400).json({
                success: false,
                error: 'Please enter a valid email address'
            });
        }

        if (!isStrongPassword(password)) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters with letters and numbers'
            });
        }

        // Admin validation
        if (userType === 'admin') {
            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: 'National ID is required for admin registration'
                });
            }

            if (!/^\d{9}$/.test(user_id)) {
                return res.status(400).json({
                    success: false,
                    error: 'National ID must be exactly 9 digits'
                });
            }

            if (!AUTHORIZED_ADMIN_IDS.includes(user_id)) {
                console.log(`🚫 Unauthorized admin attempt with ID: ${user_id}`);
                return res.status(403).json({
                    success: false,
                    error: 'This National ID is not authorized for admin access'
                });
            }
        }

        // Check for existing user
        const existingUser = await User.findOne({
            $or: [
                { user_email: user_email.toLowerCase() },
                { username: username }
            ]
        });

        if (existingUser) {
            if (existingUser.user_email === user_email.toLowerCase()) {
                return res.status(400).json({
                    success: false,
                    error: 'This email is already registered'
                });
            }
            if (existingUser.username === username) {
                return res.status(400).json({
                    success: false,
                    error: 'This username is already taken'
                });
            }
        }

        // Create user data
        const userData = {
            username: username,
            user_email: user_email.toLowerCase(),
            password: password,
            userType: userType || 'citizen',
            user_id: user_id || undefined
        };

        // Add photo if uploaded
        if (req.file) {
            userData.user_photo = `/uploads/profiles/${req.file.filename}`;
            console.log(`📸 Profile photo uploaded: ${req.file.filename}`);
        }

        // Create new user
        const newUser = new User(userData);
        await newUser.save();

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: newUser._id,
                username: newUser.username,
                userType: newUser.userType
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Send welcome email (simulated)
        const emailSent = await EmailService.sendWelcomeEmail(
            newUser.user_email,
            newUser.username,
            newUser.userType
        );

        console.log(`✅ User registered successfully: ${newUser.username} (${newUser.userType})`);

        // Send response
        res.status(201).json({
            success: true,
            message: `Account created successfully! Welcome ${newUser.username}!`,
            data: {
                token: token,
                user: newUser.toJSON()
            },
            notifications: {
                emailSent: emailSent,
                message: emailSent ? 'Welcome email sent' : 'Account created (email service not configured)'
            }
        });

    } catch (error) {
        console.error('❌ Signup error:', error);

        // Clean up uploaded file if error
        if (req.file) {
            const filePath = path.join('uploads/profiles/', req.file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({
                success: false,
                error: `${field === 'user_email' ? 'Email' : 'Username'} already exists`
            });
        }

        res.status(500).json({
            success: false,
            error: 'Registration failed. Please try again.'
        });
    }
});

// LOGIN ROUTE
app.post('/api/auth/login', async (req, res) => {
    console.log('🔐 Login attempt:', req.body.email);

    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        // Find user
        const user = await User.findOne({ user_email: email.toLowerCase() });

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Account is deactivated'
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                username: user.username,
                userType: user.userType
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log(`✅ Login successful: ${user.username} (${user.userType})`);

        // Send response
        res.json({
            success: true,
            message: `Welcome back, ${user.username}!`,
            data: {
                token: token,
                user: user.toJSON()
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed. Please try again.'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: err.message || 'Something went wrong!'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log('\n🎯 =====================================');
    console.log('🚀 CityFix Backend Server Started!');
    console.log('🎯 =====================================');
    console.log(`📍 Server URL: http://localhost:${PORT}`);
    console.log(`📊 Database: MongoDB (${MONGODB_URI})`);
    console.log(`🔐 JWT configured`);
    console.log(`👥 Admin IDs: ${AUTHORIZED_ADMIN_IDS.length} authorized`);
    console.log('🎯 =====================================');
    console.log('📋 Available Endpoints:');
    console.log('   GET  / - Server status');
    console.log('   POST /api/auth/signup - Register');
    console.log('   POST /api/auth/login - Login');
    console.log('   GET  /api/test - Test API');
    console.log('🎯 =====================================\n');
});