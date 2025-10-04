const User = require('../models/User');
const Tenant = require('../models/Tenant');
const EmailService = require('../services/EmailService');
const { USER_ROLES } = require('../config/constants');
const crypto = require('crypto');

const signup = async (req, res, next) => {
    try {
        const { username, email, password, role, tenantCode, userId } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        let tenant;
        if (role !== USER_ROLES.SUPER_SUPER_ADMIN) {
            if (tenantCode) {
                tenant = await Tenant.findOne({ code: tenantCode });
                if (!tenant) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid tenant code'
                    });
                }
            } else {
                tenant = await Tenant.findOne({ code: 'DEFAULT' });
                if (!tenant) {
                    tenant = await Tenant.create({
                        name: 'Default Municipality',
                        code: 'DEFAULT',
                        city: 'Default City',
                        country: 'Default Country'
                    });
                }
            }
        }

        const user = await User.create({
            username,
            email,
            password,
            role: role || USER_ROLES.CITIZEN,
            tenant: tenant?._id,
            profile: {
                firstName: username.split(' ')[0],
                lastName: username.split(' ')[1] || ''
            }
        });

        const token = user.generateAuthToken();

        const emailService = new EmailService();
        await emailService.sendWelcomeEmail(user.email, user.username);

        res.status(201).json({
            success: true,
            token,
            user: {
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

const login = async (req, res, next) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        const user = await User.findOne({ email })
            .select('+password')
            .populate('tenant', 'name code');

        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        if (role && user.role !== role) {
            return res.status(401).json({
                success: false,
                message: `Invalid login for ${role} role`
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been deactivated'
            });
        }

        user.lastLogin = Date.now();
        user.loginAttempts = 0;
        await user.save({ validateBeforeSave: false });

        const token = user.generateAuthToken();

        res.json({
            success: true,
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                tenant: user.tenant,
                profile: user.profile
            }
        });
    } catch (error) {
        next(error);
    }
};

const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('tenant', 'name code city')
            .populate('supervisor', 'username email');

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const fieldsToUpdate = {
            'profile.firstName': req.body.firstName,
            'profile.lastName': req.body.lastName,
            'profile.phone': req.body.phone,
            'profile.language': req.body.language,
            'profile.timezone': req.body.timezone,
            'profile.address': req.body.address,
            'notifications': req.body.notifications
        };

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: fieldsToUpdate },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

const forgotPassword = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No user found with that email'
            });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        user.passwordResetToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000;

        await user.save({ validateBeforeSave: false });

        const emailService = new EmailService();
        await emailService.sendPasswordResetEmail(user.email, resetToken);

        res.json({
            success: true,
            message: 'Email sent with password reset instructions'
        });
    } catch (error) {
        next(error);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const hashedToken = crypto
            .createHash('sha256')
            .update(req.params.resettoken)
            .digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        user.password = req.body.password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        const token = user.generateAuthToken();

        res.json({
            success: true,
            token
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    signup,
    login,
    getMe,
    updateProfile,
    forgotPassword,
    resetPassword
};