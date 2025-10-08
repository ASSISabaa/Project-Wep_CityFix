const User = require('../models/User');
const Tenant = require('../models/Tenant');

exports.signup = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    let tenant = await Tenant.findOne({ code: 'TLVMUN' });
    if (!tenant) {
      tenant = await Tenant.create({
        name: 'Default Municipality',
        code: 'DEFAULT',
        city: 'Default City',
        country: 'Default'
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      role: role || 'CITIZEN',
      tenant: role === 'SUPER_SUPER_ADMIN' ? null : tenant._id,
      profile: { firstName: username.split(' ')[0], lastName: username.split(' ')[1] || '', language: 'en' }
    });

    const token = user.generateAuthToken();
    res.status(201).json({ success: true, token, user: { _id: user._id, username: user.username, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.register = exports.signup;

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password').populate('tenant');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account deactivated' });
    }

    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    const token = user.generateAuthToken();
    res.json({ success: true, token, user: { _id: user._id, username: user.username, email: user.email, role: user.role, tenant: user.tenant } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyToken = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('tenant');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMe = exports.verifyToken;
