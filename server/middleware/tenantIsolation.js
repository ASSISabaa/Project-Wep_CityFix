exports.isolateTenant = (req, res, next) => {
    if (req.user.role === 'super_admin') {
        return next();
    }

    if (!req.user.tenantId) {
        return res.status(403).json({
            success: false,
            message: 'No tenant assigned'
        });
    }

    req.tenantId = req.user.tenantId;
    next();
};

exports.addTenantFilter = (query, req) => {
    if (req.user.role === 'super_admin') {
        return query;
    }

    return {
        ...query,
        tenantId: req.user.tenantId
    };
};