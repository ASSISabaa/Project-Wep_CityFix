const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) return res.status(401).json({ success: false, message: 'No token' });

    const token = authHeader.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cityfix-secret-key');
    const userId = decoded._id || decoded.id;
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    if (user.isActive === false) return res.status(403).json({ success: false, message: 'Account is deactivated' });

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') return res.status(401).json({ success: false, message: 'Invalid token' });
    if (error.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: 'Token expired' });
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = auth;
