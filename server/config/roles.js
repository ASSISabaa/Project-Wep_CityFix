// server/config/roles.js 

const ROLES_HIERARCHY = {
  SUPER_SUPER_ADMIN: {
    level: 100,
    nameAr: 'المدير الأعلى للنظام',
    nameEn: 'System Super Administrator',
    nameHe: 'מנהל העל של המערכת',
    nameRu: 'Главный системный администратор',
    permissions: ['*'], 
    canManage: ['*'],
    features: [
      'manage_all_tenants',
      'view_all_data',
      'system_settings',
      'create_municipalities',
      'delete_municipalities',
      'view_financial_reports',
      'manage_licenses',
      'access_system_logs'
    ]
  },

  MUNICIPALITY_ADMIN: {
    level: 80,
    nameAr: 'مدير البلدية',
    nameEn: 'Municipality Administrator',
    nameHe: 'מנהל העירייה',
    nameRu: 'Администратор муниципалитета',
    permissions: [
      'tenant:*', 
      'users:create',
      'users:read',
      'users:update',
      'users:delete',
      'reports:*',
      'analytics:*',
      'settings:update'
    ],
    canManage: ['DEPARTMENT_MANAGER', 'SUPERVISOR', 'EMPLOYEE', 'CITIZEN'],
    features: [
      'manage_departments',
      'manage_employees',
      'view_all_reports',
      'manage_priorities',
      'configure_workflows',
      'view_analytics',
      'manage_budget',
      'export_data',
      'ai_insights',
      'chat_bot_admin'
    ]
  },

  DEPARTMENT_MANAGER: {
    level: 60,
    nameAr: 'مدير القسم',
    nameEn: 'Department Manager',
    nameHe: 'מנהל מחלקה',
    nameRu: 'Начальник отдела',
    permissions: [
      'department:*', 
      'reports:read',
      'reports:update',
      'reports:assign',
      'users:read',
      'analytics:department'
    ],
    canManage: ['SUPERVISOR', 'EMPLOYEE'],
    features: [
      'assign_tasks',
      'view_department_reports',
      'manage_team',
      'view_department_analytics',
      'approve_reports',
      'chat_bot_manager',
      'ai_suggestions'
    ]
  },

  SUPERVISOR: {
    level: 40,
    nameAr: 'مشرف',
    nameEn: 'Supervisor',
    nameHe: 'מפקח',
    nameRu: 'Супервайзер',
    permissions: [
      'reports:read',
      'reports:update',
      'reports:comment',
      'users:read',
      'analytics:team'
    ],
    canManage: ['EMPLOYEE'],
    features: [
      'monitor_employees',
      'view_assigned_reports',
      'add_internal_notes',
      'basic_analytics'
    ]
  },

  EMPLOYEE: {
    level: 20,
    nameAr: 'موظف',
    nameEn: 'Employee',
    nameHe: 'עובד',
    nameRu: 'Сотрудник',
    permissions: [
      'reports:read:assigned',
      'reports:update:assigned',
      'reports:comment',
      'profile:update:own'
    ],
    canManage: [],
    features: [
      'view_my_tasks',
      'update_report_status',
      'add_comments',
      'upload_resolution_photos',
      'chat_bot_employee'
    ]
  },

  CITIZEN: {
    level: 10,
    nameAr: 'مواطن',
    nameEn: 'Citizen',
    nameHe: 'אזרח',
    nameRu: 'Гражданин',
    permissions: [
      'reports:create',
      'reports:read:own', 
      'reports:comment:own',
      'profile:update:own'
    ],
    canManage: [],
    features: [
      'submit_reports',
      'view_my_reports',
      'track_status',
      'add_feedback',
      'chat_bot_citizen',
      'view_public_map'
    ]
  }
};

// Middleware 
class PermissionManager {
  static hasPermission(userRole, permission, resource = null) {
    const role = ROLES_HIERARCHY[userRole];
    if (!role) return false;

    // Super admin 
    if (role.permissions.includes('*')) return true;

  
    if (role.permissions.includes(permission)) return true;

    const permissionParts = permission.split(':');
    const wildcardPermission = `${permissionParts[0]}:*`;
    
    return role.permissions.includes(wildcardPermission);
  }

  static canManageRole(managerRole, targetRole) {
    const manager = ROLES_HIERARCHY[managerRole];
    const target = ROLES_HIERARCHY[targetRole];

    if (!manager || !target) return false;

    if (manager.level <= target.level) return false;

    return manager.canManage.includes('*') || 
           manager.canManage.includes(targetRole);
  }

  static hasFeature(userRole, feature) {
    const role = ROLES_HIERARCHY[userRole];
    return role && role.features.includes(feature);
  }

  static getRoleLevel(role) {
    return ROLES_HIERARCHY[role]?.level || 0;
  }

  static getRoleName(role, language = 'en') {
    const roleData = ROLES_HIERARCHY[role];
    if (!roleData) return role;

    const langKey = `name${language.charAt(0).toUpperCase() + language.slice(1)}`;
    return roleData[langKey] || roleData.nameEn;
  }
}

// Middleware 
const requirePermission = (permission, options = {}) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    const { checkOwnership = false, ownerField = 'userId' } = options;

    if (!PermissionManager.hasPermission(userRole, permission)) {
      return res.status(403).json({
        success: false,
        message: req.t ? req.t('errors.insufficient_permissions') : 'Insufficient permissions',
        requiredPermission: permission
      });
    }

    if (checkOwnership) {
      req.checkOwnership = {
        required: true,
        field: ownerField
      };
    }

    next();
  };
};

const requireFeature = (feature) => {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!PermissionManager.hasFeature(userRole, feature)) {
      return res.status(403).json({
        success: false,
        message: 'Feature not available for your role',
        requiredFeature: feature
      });
    }

    next();
  };
};

const requireRoleLevel = (minLevel) => {
  return (req, res, next) => {
    const userLevel = PermissionManager.getRoleLevel(req.user?.role);

    if (userLevel < minLevel) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient role level',
        requiredLevel: minLevel,
        yourLevel: userLevel
      });
    }

    next();
  };
};

module.exports = {
  ROLES_HIERARCHY,
  PermissionManager,
  requirePermission,
  requireFeature,
  requireRoleLevel
};