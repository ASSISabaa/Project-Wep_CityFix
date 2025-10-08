const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.id).select('-password').populate('tenant');
    
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    req.user = { _id: user._id, email: user.email, role: user.role, tenant: user.tenant?._id || user.tenant };
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

exports.protect = exports.authenticate;