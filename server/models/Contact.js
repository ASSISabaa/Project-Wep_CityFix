const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, minlength: 2, trim: true },
    lastName:  { type: String, required: true, minlength: 2, trim: true },
    email:     { type: String, required: true, lowercase: true, trim: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    subject:   { type: String, required: true, enum: ['general','report-issue','technical','feedback','partnership','other'] },
    message:   { type: String, required: true, minlength: 10, maxlength: 1000, trim: true },
    priority:  { type: String, enum: ['low','medium','high'], default: 'medium' },

    status:    { type: String, enum: ['new','read','replied','closed'], default: 'new' },

    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reply:     { type: String, default: null },
    repliedAt: { type: Date, default: null },

    ipAddress: { type: String },
    userAgent: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contact', contactSchema);
