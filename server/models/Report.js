// server/models/Report.js
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  trackingNumber: { type: String, required: true, unique: true, sparse: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 2000 },
  issueType: {
    type: String,
    required: true,
    enum: ['pothole', 'lighting', 'drainage', 'traffic', 'safety', 'vandalism', 'garbage', 'other']
  },
  status: {
    type: String,
    enum: ['new', 'pending', 'in-progress', 'resolved', 'rejected'],
    default: 'pending'
  },
  urgency: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },

  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: false } // [lng, lat]
  },
  address: { type: String },
  district: { type: String },

  images: [{ url: String, uploadedAt: { type: Date, default: Date.now } }],

  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],

  statusHistory: [{
    status: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    notes: String
  }],

  resolution: {
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: Date,
    resolutionNotes: String,
    resolutionImages: [String]
  },

  rejection: {
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: Date,
    rejectionReason: String
  },

  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  views: { type: Number, default: 0 },
  isAnonymous: { type: Boolean, default: false },

  metadata: { deviceType: String, browser: String, ipAddress: String },

  adminNotes: { type: String, default: '' },
  notesHistory: [{
    note: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

reportSchema.index({ location: '2dsphere' });
reportSchema.index({ status: 1 });
reportSchema.index({ issueType: 1 });
reportSchema.index({ district: 1 });
reportSchema.index({ reportedBy: 1 });
reportSchema.index({ createdAt: -1 });

reportSchema.virtual('age').get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

reportSchema.methods.toJSON = function () {
  const report = this.toObject();
  delete report.__v;
  return report;
};

module.exports = mongoose.model('Report', reportSchema);
