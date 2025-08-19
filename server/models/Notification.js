const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    type: { type: String, enum: ['system','report_update','report_resolved','team','security','general'], default: 'general', index: true },
    priority: { type: String, enum: ['low','normal','high'], default: 'normal', index: true },
    read: { type: Boolean, default: false, index: true },
    archived: { type: Boolean, default: false, index: true },
    dismissed: { type: Boolean, default: false, index: true },
    link: { type: String, default: '' },
    icon: { type: String, default: '' },
    data: { type: Object, default: {} }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', NotificationSchema);
