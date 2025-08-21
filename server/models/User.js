const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const NotificationItemSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    type: { type: String, default: 'info' },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30
    },
    fullName: { type: String, default: '' },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
    },
    password: {
      type: String,
      required: false,
      minlength: 6,
      select: false
    },
    passwordChangedAt: { type: Date },
    nationalId: { type: String, index: true, sparse: true },

    role: { type: String, enum: ['citizen', 'admin', 'moderator'], default: 'citizen' },
    roleTitle: { type: String, default: '' },
    department: { type: String, default: '' },

    presence: {
      status: { type: String, enum: ['active', 'away', 'offline'], default: 'offline' }
    },

    userId: { type: String, sparse: true },
    avatarUrl: { type: String, default: null },
    profilePicture: { type: String, default: null },
    phoneNumber: { type: String, default: null },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },

    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
    lastActiveAt: { type: Date, default: null },

    preferences: {
      sessionTimeout: { type: Number, default: 30 },
      autoSave: { type: Boolean, default: true },
      soundAlerts: { type: Boolean, default: false },
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      newsletter: { type: Boolean, default: false }
    },
    security: {
      twoFactor: { type: Boolean, default: false },
      rememberLogin: { type: Boolean, default: false }
    },
    notifications: {
      emailAlerts: { type: Boolean, default: true },
      dailyDigest: { type: Boolean, default: true },
      weeklyReport: { type: Boolean, default: false },
      browserNotifications: { type: Boolean, default: true },
      urgentOnly: { type: Boolean, default: false },
      notificationSound: { type: String, default: 'default' }
    },

    notificationsFeed: [NotificationItemSchema],

    reportsSubmitted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Report' }],

    statistics: {
      totalReports: { type: Number, default: 0 },
      resolvedReports: { type: Number, default: 0 },
      pendingReports: { type: Number, default: 0 },
      rejectedReports: { type: Number, default: 0 }
    },

    resetPasswordToken: String,
    resetPasswordExpire: Date,
    emailVerificationToken: String,
    emailVerificationExpire: Date,

    invited: { type: Boolean, default: false },
    invitedAt: Date
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ role: 1 });

userSchema.virtual('displayName').get(function () {
  return this.fullName || this.username;
});

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('User', userSchema);
