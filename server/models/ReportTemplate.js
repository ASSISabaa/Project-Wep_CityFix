const mongoose = require('mongoose');

const reportTemplateSchema = new mongoose.Schema({
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    icon: String,
    color: String,
    fields: [{
        name: String,
        label: String,
        type: {
            type: String,
            enum: ['text', 'textarea', 'number', 'select', 'checkbox', 'radio', 'date', 'file', 'location']
        },
        required: Boolean,
        options: [String],
        validation: {
            min: Number,
            max: Number,
            pattern: String,
            message: String
        }
    }],
    workflow: {
        departments: [String],
        autoAssign: Boolean,
        priority: String,
        estimatedDuration: Number,
        sla: {
            response: Number,
            resolution: Number
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    usage: {
        count: {
            type: Number,
            default: 0
        },
        lastUsed: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ReportTemplate', reportTemplateSchema);