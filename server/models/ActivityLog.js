const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        enum: ['create', 'read', 'update', 'delete', 'login', 'logout', 
                'export', 'import', 'assign', 'resolve', 'comment'],
        required: true
    },
    resource: {
        type: String,
        enum: ['report', 'user', 'tenant', 'settings', 'notification'],
        required: true
    },
    resourceId: mongoose.Schema.Types.ObjectId,
    details: {
        before: mongoose.Schema.Types.Mixed,
        after: mongoose.Schema.Types.Mixed,
        changes: [String]
    },
    metadata: {
        ipAddress: String,
        userAgent: String,
        browser: String,
        os: String,
        device: String,
        location: {
            country: String,
            city: String,
            coordinates: {
                lat: Number,
                lng: Number
            }
        }
    },
    duration: Number,
    success: {
        type: Boolean,
        default: true
    },
    error: String
}, {
    timestamps: true
});

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ tenant: 1, resource: 1 });
activityLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);