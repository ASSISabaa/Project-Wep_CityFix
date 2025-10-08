// server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  role: {
    type: String,
    enum: ['SUPER_SUPER_ADMIN', 'MUNICIPALITY_ADMIN', 'DEPARTMENT_MANAGER', 'SUPERVISOR', 'EMPLOYEE', 'CITIZEN'],
    default: 'CITIZEN'
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant'
  },
  department: {
    type: String,
    enum: ['maintenance', 'infrastructure', 'sanitation', 'parks', 'traffic', 'general']
  },
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    avatar: String,
    language: {
      type: String,
      enum: ['en', 'ar', 'he', 'ru'],
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    address: {
      street: String,
      city: String,
      district: String,
      postalCode: String
    },
    bio: String
  },
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    reportAssigned: {
      type: Boolean,
      default: true
    },
    reportUpdated: {
      type: Boolean,
      default: true
    },
    reportResolved: {
      type: Boolean,
      default: true
    },
    comments: {
      type: Boolean,
      default: true
    }
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    dashboardLayout: {
      type: String,
      default: 'default'
    },
    mapStyle: {
      type: String,
      default: 'standard'
    },
    itemsPerPage: {
      type: Number,
      default: 20
    }
  },
  statistics: {
    reportsCreated: {
      type: Number,
      default: 0
    },
    reportsAssigned: {
      type: Number,
      default: 0
    },
    reportsResolved: {
      type: Number,
      default: 0
    },
    avgResolutionTime: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      default: 0
    },
    totalRatings: {
      type: Number,
      default: 0
    }
  },
  permissions: {
    canCreateUsers: {
      type: Boolean,
      default: false
    },
    canDeleteReports: {
      type: Boolean,
      default: false
    },
    canViewAnalytics: {
      type: Boolean,
      default: false
    },
    canExportData: {
      type: Boolean,
      default: false
    },
    canManageTenant: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  verificationToken: String,
  verificationExpires: Date
}, {
  timestamps: true
});

userSchema.index({ email: 1 });
userSchema.index({ tenant: 1, role: 1 });
userSchema.index({ tenant: 1, department: 1 });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      role: this.role,
      tenant: this.tenant
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '30d' }
  );
};

userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

userSchema.methods.incrementLoginAttempts = async function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000;
  
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }
  
  return await this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = async function() {
  return await this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

module.exports = mongoose.model('User', userSchema);