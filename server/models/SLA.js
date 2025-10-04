const mongoose = require('mongoose');

const slaSchema = new mongoose.Schema({
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: String,
    rules: [{
        condition: {
            field: String,
            operator: {
                type: String,
                enum: ['equals', 'notEquals', 'contains', 'greaterThan', 'lessThan']
            },
            value: mongoose.Schema.Types.Mixed
        },
        targets: {
            responseTime: {
                value: Number,
                unit: {
                    type: String,
                    enum: ['minutes', 'hours', 'days']
                }
            },
            resolutionTime: {
                value: Number,
                unit: {
                    type: String,
                    enum: ['minutes', 'hours', 'days']
                }
            },
            escalation: [{
                after: Number,
                unit: String,
                notifyRole: String,
                notifyUsers: [{
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User'
                }]
            }]
        }
    }],
    penalties: {
        lateResponse: {
            type: Number,
            description: String
        },
        lateResolution: {
            type: Number,
            description: String
        }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SLA', slaSchema);