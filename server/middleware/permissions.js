const permissions = {
    super_admin: {
        tenants: ['create', 'read', 'update', 'delete', 'all'],
        users: ['create', 'read', 'update', 'delete', 'all'],
        reports: ['create', 'read', 'update', 'delete', 'all'],
        analytics: ['read', 'all'],
        settings: ['read', 'update', 'all']
    },
    
    high_admin: {
        users: ['create', 'read', 'update', 'delete', 'tenant'],
        reports: ['create', 'read', 'update', 'delete', 'tenant'],
        analytics: ['read', 'tenant'],
        settings: ['read', 'update', 'tenant']
    },
    
    medium_admin: {
        users: ['create', 'read', 'tenant'],
        reports: ['read', 'update', 'tenant'],
        analytics: ['read', 'tenant']
    },
    
    employee: {
        reports: ['read', 'update', 'assigned'],
        analytics: ['read', 'limited']
    },
    
    citizen: {
        reports: ['create', 'read', 'own'],
        profile: ['read', 'update', 'own']
    }
};

function checkPermission(userRole, resource, action, permissionLevel = null) {
    if (userRole === 'super_admin') return true;
    
    const userPermissions = permissions[userRole === 'admin' ? permissionLevel + '_admin' : userRole];
    
    if (!userPermissions || !userPermissions[resource]) {
        return false;
    }
    
    return userPermissions[resource].includes(action) || 
           userPermissions[resource].includes('all');
}

function requirePermission(resource, action) {
    return (req, res, next) => {
        const { role, permissionLevel } = req.user;
        
        if (checkPermission(role, resource, action, permissionLevel)) {
            next();
        } else {
            res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }
    };
}

module.exports = { checkPermission, requirePermission };