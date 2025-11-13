const express = require('express');
const router = express.Router();

const RoleController = require('../controllers/roleController');
const { auth, requireAdmin, requireAssignedPages } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { activityLogger, responseTimeLogger } = require('../middleware/activityLogger');
const {
  createRoleValidation,
  updateRoleValidation,
  roleIdValidation,
  assignPagesValidation,
  paginationValidation
} = require('../middleware/validation');

// Apply authentication and response time logging to all role routes
router.use(auth);
router.use(responseTimeLogger);

// Get all roles (simple list for dropdowns) - Authenticated users
router.get('/simple',
  activityLogger('view', 'role'),
  RoleController.getAllSimple
);

// Get all roles with pagination - Users with assigned pages can view
router.get('/',
  paginationValidation,
  requireAssignedPages,
  checkPermission('view', 'role'),
  activityLogger('view', 'role'),
  RoleController.getRoles
);

// Get role statistics - Admin only
router.get('/stats',
  requireAdmin,
  checkPermission('view', 'role'),
  activityLogger('view', 'role_stats'),
  RoleController.getStats
);

// Get role by ID - Users with assigned pages can view
router.get('/:id',
  roleIdValidation,
  requireAssignedPages,
  checkPermission('view', 'role'),
  activityLogger('view', 'role'),
  RoleController.getRoleById
);

// Create new role - Users with assigned pages can create
router.post('/',
  createRoleValidation,
  requireAssignedPages,
  checkPermission('create', 'role'),
  activityLogger('create', 'role'),
  RoleController.createRole
);

// Update role - Users with assigned pages can update
router.put('/:id',
  updateRoleValidation,
  requireAssignedPages,
  checkPermission('update', 'role'),
  activityLogger('update', 'role'),
  RoleController.updateRole
);

// Delete role - Users with assigned pages can delete
router.delete('/:id',
  roleIdValidation,
  requireAssignedPages,
  checkPermission('delete', 'role'),
  activityLogger('delete', 'role'),
  RoleController.deleteRole
);

// Get role pages
router.get('/:id/pages',
  roleIdValidation,
  requireAssignedPages,
  checkPermission('view', 'role'),
  activityLogger('view', 'role_pages'),
  RoleController.getRolePages
);

// Assign pages to role - Users with assigned pages can assign pages
router.post('/assign-pages',
  assignPagesValidation,
  requireAssignedPages,
  checkPermission('update', 'role'),
  activityLogger('page_assign', 'role'),
  RoleController.assignPages
);

// Get role page hierarchy
router.get('/:id/page-hierarchy',
  roleIdValidation,
  requireAssignedPages,
  checkPermission('view', 'role'),
  activityLogger('view', 'role_page_hierarchy'),
  RoleController.getRolePageHierarchy
);

// Get role page order (flat list with order info)
router.get('/:id/page-order',
  roleIdValidation,
  requireAssignedPages,
  checkPermission('view', 'role'),
  activityLogger('view', 'role_page_order'),
  RoleController.getRolePageOrder
);

// Update role page order
router.put('/:id/page-order',
  roleIdValidation,
  requireAssignedPages,
  checkPermission('update', 'role'),
  activityLogger('update', 'role_page_order'),
  RoleController.updateRolePageOrder
);

module.exports = router;