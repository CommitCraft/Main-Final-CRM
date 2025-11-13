const Page = require('../models/page');

// Role-based access control middleware
const checkRole = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const userRoles = req.user.roles || [];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${requiredRoles.join(', ')}`
      });
    }

    next();
  };
};

// Check if user has access to a specific page
const checkPageAccess = (pageUrl) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      // Super admin has access to everything
      if (req.user.roles.includes('super_admin')) {
        return next();
      }

      const hasAccess = await Page.checkPageAccess(req.user.id, pageUrl);
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to access this page.'
        });
      }

      next();
    } catch (error) {
      console.error('Page access check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking page access.'
      });
    }
  };
};

// Dynamic page access check based on request path
const checkDynamicPageAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Super admin has access to everything
    if (req.user.roles.includes('super_admin')) {
      return next();
    }

    // Extract page URL from request path
    // This assumes the page URL corresponds to the API endpoint
    const pagePath = req.path.replace('/api', '');
    
    const hasAccess = await Page.checkPageAccess(req.user.id, pagePath);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to access this resource.',
        requiredAccess: pagePath
      });
    }

    next();
  } catch (error) {
    console.error('Dynamic page access check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking page access.'
    });
  }
};

// Check if user can perform specific actions
const checkPermission = (action, resource) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const userRoles = req.user.roles || [];
    
    // Super admin has access to everything
    if (userRoles.includes('super_admin')) {
      return next();
    }
    
    // Define role permissions
    const permissions = {
      admin: [
        'create_user', 'update_user', 'delete_user', 'view_user',
        'create_role', 'update_role', 'delete_role', 'view_role',
        'create_page', 'update_page', 'delete_page', 'view_page',
        'view_stats', 'view_activity', 'export_data'
      ],
      manager: [
        'view_user', 'update_user',
        'view_role', 'view_page',
        'view_stats', 'view_activity'
      ],
      user: [
        'view_user', 'view_page', 'view_role'
      ]
    };

    const requiredPermission = `${action}_${resource}`;
    
    // Check if user has required permission
    let hasPermission = false;
    
    // Check role-based permissions first
    for (const role of userRoles) {
      const rolePermissions = permissions[role] || [];
      if (rolePermissions.includes(requiredPermission)) {
        hasPermission = true;
        break;
      }
    }

    // If no role-based permission, check if user has assigned pages for CRUD operations
    if (!hasPermission) {
      try {
        const userPages = await Page.getPagesByUser(req.user.id);
        console.log(`User ${req.user.id} has ${userPages?.length || 0} assigned pages`);
        if (userPages && userPages.length > 0) {
          // Users with assigned pages can perform CRUD operations on users, roles, and pages
          if (['user', 'role', 'page'].includes(resource)) {
            console.log(`Granting ${action}_${resource} permission to user with assigned pages`);
            hasPermission = true;
          }
        }
      } catch (error) {
        console.error('Error checking user pages for permission:', error);
      }
    }

    if (!hasPermission) {
      console.log(`Access denied for ${req.user.username}: Required permission ${requiredPermission}, roles: ${userRoles.join(', ')}`);
      return res.status(403).json({
        success: false,
        message: `Access denied. Required permission: ${requiredPermission}`,
        requiredPermission
      });
    }

    console.log(`Access granted for ${req.user.username}: ${requiredPermission}`);
    next();
  };
};

// Check if user can access their own data or if they're admin
const checkOwnershipOrAdmin = (userIdParam = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const targetUserId = req.params[userIdParam] || req.body.user_id;
    const currentUserId = req.user.id;
    const userRoles = req.user.roles || [];

    // Allow if user is admin or super_admin
    if (userRoles.includes('admin') || userRoles.includes('super_admin')) {
      return next();
    }

    // Allow if user is accessing their own data
    if (parseInt(targetUserId) === currentUserId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own data.'
    });
  };
};

// Middleware to add user permissions to request
const addUserPermissions = async (req, res, next) => {
  try {
    if (!req.user) {
      req.permissions = [];
      req.accessiblePages = [];
      return next();
    }

    const userRoles = req.user.roles || [];
    
    // Get user's accessible pages
    const accessiblePages = await Page.getPagesByUser(req.user.id);
    req.accessiblePages = accessiblePages;

    // Define permissions based on roles
    const allPermissions = [];
    
    if (userRoles.includes('super_admin')) {
      allPermissions.push('*');
    } else {
      const rolePermissions = {
        admin: [
          'create_user', 'update_user', 'delete_user', 'view_user',
          'create_role', 'update_role', 'delete_role', 'view_role',
          'create_page', 'update_page', 'delete_page', 'view_page',
          'view_stats', 'view_activity', 'export_data'
        ],
        manager: [
          'view_user', 'update_user',
          'view_role', 'view_page',
          'view_stats', 'view_activity'
        ],
        user: [
          'view_user', 'view_page'
        ]
      };

      userRoles.forEach(role => {
        const perms = rolePermissions[role] || [];
        allPermissions.push(...perms);
      });
    }

    req.permissions = [...new Set(allPermissions)]; // Remove duplicates
    next();
  } catch (error) {
    console.error('Error adding user permissions:', error);
    req.permissions = [];
    req.accessiblePages = [];
    next();
  }
};

// Helper function to check if user has specific permission
const hasPermission = (userPermissions, action, resource = null) => {
  if (userPermissions.includes('*')) return true;
  
  const requiredPermission = resource ? `${action}_${resource}` : action;
  return userPermissions.includes(requiredPermission);
};

module.exports = {
  checkRole,
  checkPageAccess,
  checkDynamicPageAccess,
  checkPermission,
  checkOwnershipOrAdmin,
  addUserPermissions,
  hasPermission
};