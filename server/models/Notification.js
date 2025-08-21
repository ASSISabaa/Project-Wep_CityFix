const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    title:   { type: String, required: true },
    body:    { type: String, required: true },
    type:    { type: String, default: 'general', index: true },
    priority:{ type: String, enum: ['low','normal','high'], default: 'normal', index: true },
    link:    { type: String, default: '' },
    icon:    { type: String, default: '' },
    data:    { type: Object, default: {} },
    read:    { type: Boolean, default: false }
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
