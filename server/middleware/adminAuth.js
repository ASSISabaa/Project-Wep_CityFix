// server/middleware/adminAuth.js
const adminAuth = (req, res, next) => {
    try {
        // Check if user exists (should be added by auth middleware)
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        
        // Check if user has admin or moderator role
        if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        
        next();
        
    } catch (error) {
        console.error('Admin auth error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = adminAuth;