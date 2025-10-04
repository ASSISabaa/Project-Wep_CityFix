const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    city: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    timezone: {
        type: String,
        default: 'UTC'
    },
    language: {
        type: String,
        default: 'en',
        enum: ['en', 'ar', 'he', 'ru']
    },
    settings: {
        emailNotifications: {
            type: Boolean,
            default: true
        },
        smsNotifications: {
            type: Boolean,
            default: false
        },
        autoAssignment: {
            type: Boolean,
            default: false
        },
        workingHours: {
            start: {
                type: String,
                default: '08:00'
            },
            end: {
                type: String,
                default: '17:00'
            }
        }
    },
    subscription: {
        plan: {
            type: String,
            enum: ['basic', 'pro', 'enterprise'],
            default: 'basic'
        },
        startDate: Date,
        endDate: Date,
        maxUsers: {
            type: Number,
            default: 50
        },
        maxReports: {
            type: Number,
            default: 1000
        }
    },
    statistics: {
        totalReports: {
            type: Number,
            default: 0
        },
        resolvedReports: {
            type: Number,
            default: 0
        },
        activeUsers: {
            type: Number,
            default: 0
        },
        avgResolutionTime: {
            type: Number,
            default: 0
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

tenantSchema.index({ code: 1 });
tenantSchema.index({ isActive: 1 });

module.exports = mongoose.model('Tenant', tenantSchema);