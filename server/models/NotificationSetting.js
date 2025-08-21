const mongoose = require('mongoose');

const ChannelSchema = new mongoose.Schema(
  { enabled: { type: Boolean, default: false }, lastSentAt: { type: Date, default: null }, notes: { type: String, trim: true } },
  { _id: false }
);

const NotificationSettingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, index: true },
    email: { type: ChannelSchema, default: () => ({ enabled: true }) },
    push: { type: ChannelSchema, default: () => ({ enabled: true }) },
    sms: { type: ChannelSchema, default: () => ({ enabled: false }) },
    dailyDigest: { enabled: { type: Boolean, default: true }, hour: { type: Number, default: 8 }, minute: { type: Number, default: 0 } },
    teamUpdates: { type: ChannelSchema, default: () => ({ enabled: true }) },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('NotificationSetting', NotificationSettingSchema);
