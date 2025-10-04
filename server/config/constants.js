module.exports = {
    USER_ROLES: {
        SUPER_SUPER_ADMIN: 'superSuperAdmin',
        SUPER_ADMIN: 'superAdmin',
        ADMIN: 'admin',
        EMPLOYEE: 'employee',
        CITIZEN: 'citizen'
    },
    
    REPORT_STATUS: {
        NEW: 'new',
        ASSIGNED: 'assigned',
        IN_PROGRESS: 'inProgress',
        PENDING: 'pending',
        RESOLVED: 'resolved',
        CLOSED: 'closed',
        REJECTED: 'rejected'
    },
    
    REPORT_PRIORITY: {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
        URGENT: 'urgent'
    },
    
    REPORT_TYPES: {
        POTHOLE: 'pothole',
        STREETLIGHT: 'streetlight',
        DRAINAGE: 'drainage',
        GARBAGE: 'garbage',
        TRAFFIC_SIGNAL: 'trafficSignal',
        SIDEWALK: 'sidewalk',
        GRAFFITI: 'graffiti',
        NOISE: 'noise',
        ABANDONED_VEHICLE: 'abandonedVehicle',
        WATER_LEAK: 'waterLeak',
        PARK_MAINTENANCE: 'parkMaintenance',
        OTHER: 'other'
    },
    
    LANGUAGES: ['en', 'ar', 'he', 'ru'],
    
    DEFAULT_LANGUAGE: 'en',
    
    JWT_EXPIRE: '30d',
    
    EMAIL_FROM: 'CityFix <cityfix.contact@gmail.com>',
    
    PAGINATION: {
        DEFAULT_PAGE: 1,
        DEFAULT_LIMIT: 20,
        MAX_LIMIT: 100
    }
};