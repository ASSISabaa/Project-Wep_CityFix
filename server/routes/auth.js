// server/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// ==================== SIGNUP ROUTE ====================
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password, role, userId } = req.body;
        
        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }
        
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }
        
        // Check if user exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
            if (existingUser.username === username) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already taken'
                });
            }
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const user = new User({
            username,
            email,
            password: hashedPassword,
            role: role || 'citizen',
            userId: userId || undefined,
            isVerified: true
        });
        
        await user.save();
        
        // Generate token
        const token = jwt.sign(
            { 
                _id: user._id, 
                email: user.email,
                role: user.role,
                username: user.username
            },
            process.env.JWT_SECRET || 'cityfix-secret-key',
            { expiresIn: '30d' }
        );
        
        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating account',
            error: error.message
        });
    }
});

// ==================== LOGIN ROUTE ====================
router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        
        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }
        
        // Find user and include password
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        // Check role if specified
        if (role && user.role !== role) {
            return res.status(403).json({
                success: false,
                message: `Access denied. This login is for ${role}s only.`
            });
        }
        
        // Update last login - FIX: Don't save the document, just update
        await User.findByIdAndUpdate(
            user._id,
            { lastLogin: new Date() },
            { new: true }
        );
        
        // Generate token
        const token = jwt.sign(
            { 
                _id: user._id, 
                email: user.email,
                role: user.role,
                username: user.username
            },
            process.env.JWT_SECRET || 'cityfix-secret-key',
            { expiresIn: '30d' }
        );
        
        res.json({
            success: true,
            message: 'Login successful',
            token,
            data: {
                token,
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during login',
            error: error.message
        });
    }
});

// ==================== VERIFY TOKEN ROUTE ====================
router.get('/verify', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            valid: true,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Verify error:', error);
        res.status(401).json({
            success: false,
            valid: false,
            message: 'Invalid token'
        });
    }
});

// ==================== LOGOUT ROUTE ====================
router.post('/logout', auth, (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// ==================== FORGOT PASSWORD ROUTE ====================
router.post('/forgotpassword', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an email address'
            });
        }
        
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this email'
            });
        }
        
        // TODO: Implement email sending
        console.log(`Password reset requested for: ${email}`);
        
        res.json({
            success: true,
            message: 'Password reset instructions sent to your email'
        });
        
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing request',
            error: error.message
        });
    }
});

module.exports = router;