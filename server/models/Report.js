const mongoose = require('mongoose');
const { REPORT_STATUS, REPORT_PRIORITY, REPORT_TYPES } = require('../config/constants');

const reportSchema = new mongoose.Schema({
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true
    },
    reportNumber: {
        type: String,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: Object.values(REPORT_TYPES),
        required: true
    },
    status: {
        type: String,
        enum: Object.values(REPORT_STATUS),
        default: REPORT_STATUS.NEW
    },
    priority: {
        type: String,
        enum: Object.values(REPORT_PRIORITY),
        default: REPORT_PRIORITY.MEDIUM
    },
    location: {
        address: String,
        coordinates: {
            lat: Number,
            lng: Number
        },
        geoLocation: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number],
                default: [0, 0]
            }
        },
        district: String,
        landmark: String
    },
    images: [{
        url: String,
        caption: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    department: {
        type: String,
        enum: ['maintenance', 'infrastructure', 'sanitation', 'parks', 'traffic', 'general']
    },
    timeline: [{
        status: String,
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        comment: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    internalNotes: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        note: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    publicComments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        comment: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    resolution: {
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        resolvedAt: Date,
        resolutionTime: Number,
        description: String,
        images: [{
            url: String,
            caption: String
        }]
    },
    feedback: {
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: String,
        submittedAt: Date
    },
    metadata: {
        viewCount: {
            type: Number,
            default: 0
        },
        duplicateOf: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Report'
        },
        duplicates: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Report'
        }],
        tags: [String],
        estimatedCost: Number,
        actualCost: Number,
        estimatedDuration: Number
    },
    aiAnalysis: {
        category: String,
        severity: String,
        suggestedPriority: String,
        suggestedDepartment: String,
        keywords: [String],
        sentiment: String,
        analyzedAt: Date
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

reportSchema.index({ tenant: 1, status: 1 });
reportSchema.index({ tenant: 1, type: 1 });
reportSchema.index({ tenant: 1, reporter: 1 });
reportSchema.index({ tenant: 1, assignedTo: 1 });
reportSchema.index({ 'location.geoLocation': '2dsphere' });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ reportNumber: 1 });

reportSchema.pre('save', async function(next) {
    if (this.isNew) {
        const count = await this.constructor.countDocuments({ tenant: this.tenant });
        const tenantCode = await mongoose.model('Tenant').findById(this.tenant).select('code');
        this.reportNumber = `${tenantCode.code}-${String(count + 1).padStart(6, '0')}`;
        
        if (this.location && this.location.coordinates) {
            if (this.location.coordinates.lat && this.location.coordinates.lng) {
                this.location.geoLocation = {
                    type: 'Point',
                    coordinates: [this.location.coordinates.lng, this.location.coordinates.lat]
                };
            }
        }
    }
    next();
});

reportSchema.methods.calculateResolutionTime = function() {
    if (this.resolution && this.resolution.resolvedAt) {
        const resolutionTime = Math.floor((this.resolution.resolvedAt - this.createdAt) / (1000 * 60 * 60));
        this.resolution.resolutionTime = resolutionTime;
        return resolutionTime;
    }
    return null;
};

module.exports = mongoose.model('Report', reportSchema);