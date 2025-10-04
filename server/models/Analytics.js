const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    metrics: {
        totalReports: Number,
        newReports: Number,
        resolvedReports: Number,
        avgResolutionTime: Number,
        reportsByType: Map,
        reportsByPriority: Map,
        reportsByDepartment: Map,
        topReporters: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            count: Number
        }],
        topEmployees: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            resolved: Number,
            avgTime: Number
        }],
        peakHours: [{
            hour: Number,
            count: Number
        }],
        districtDistribution: Map
    },
    calculated: {
        resolutionRate: Number,
        satisfactionScore: Number,
        efficiencyScore: Number,
        responseTimeScore: Number
    }
}, {
    timestamps: true
});

analyticsSchema.index({ tenant: 1, date: -1 });

module.exports = mongoose.model('Analytics', analyticsSchema);