const mongoose = require('mongoose');

const TeamMemberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true, index: true },
    phone: { type: String, trim: true },
    roleTitle: { type: String, required: true, trim: true, index: true },
    department: { type: String, required: true, trim: true, index: true },
    status: { type: String, enum: ['active', 'away', 'offline'], default: 'offline', index: true },
    casesAssigned: { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: Date.now, index: true },
    isActive: { type: Boolean, default: true, index: true },
    avatarUrl: { type: String, trim: true }
  },
  { timestamps: true }
);

TeamMemberSchema.index({ name: 'text', email: 'text', roleTitle: 'text', department: 'text' });

module.exports = mongoose.model('TeamMember', TeamMemberSchema);
