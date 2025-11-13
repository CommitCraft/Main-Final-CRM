const express = require('express');
const router = express.Router();

const UserController = require('../controllers/userController');
const { auth, requireAdmin, requireAssignedPages } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { activityLogger, responseTimeLogger } = require('../middleware/activityLogger');
const {
  createUserValidation,
  updateUserValidation,
  userIdValidation,
  assignRoleValidation,
  paginationValidation
} = require('../middleware/validation');

// Apply authentication and response time logging to all user routes
router.use(auth);
router.use(responseTimeLogger);

// Get all users - Users with assigned pages can view
router.get('/',
  paginationValidation,
  requireAssignedPages,
  checkPermission('view', 'user'),
  activityLogger('view', 'user'),
  UserController.getUsers
);

// Get user statistics - Users with assigned pages can view
router.get('/stats',
  requireAssignedPages,
  checkPermission('view', 'user'),
  activityLogger('view', 'user_stats'),
  UserController.getUserStats
);

// Get user by ID - Users with assigned pages can view
router.get('/:id',
  userIdValidation,
  requireAssignedPages,
  checkPermission('view', 'user'),
  activityLogger('view', 'user'),
  UserController.getUserById
);

// Create new user - Users with assigned pages can create
router.post('/',
  createUserValidation,
  requireAssignedPages,
  checkPermission('create', 'user'),
  activityLogger('create', 'user'),
  UserController.createUser
);

// Update user - Users with assigned pages can update
router.put('/:id',
  updateUserValidation,
  requireAssignedPages,
  checkPermission('update', 'user'),
  activityLogger('update', 'user'),
  UserController.updateUser
);

// Delete user - Users with assigned pages can delete
router.delete('/:id',
  userIdValidation,
  requireAssignedPages,
  checkPermission('delete', 'user'),
  activityLogger('delete', 'user'),
  UserController.deleteUser
);

// Get user roles
router.get('/:id/roles',
  userIdValidation,
  requireAssignedPages,
  checkPermission('view', 'user'),
  activityLogger('view', 'user_roles'),
  UserController.getUserRoles
);

// Get user pages
router.get('/:id/pages',
  userIdValidation,
  requireAssignedPages,
  checkPermission('view', 'user'),
  activityLogger('view', 'user_pages'),
  UserController.getUserPages
);

// Assign role to user - Users with assigned pages can assign roles
router.post('/assign-role',
  assignRoleValidation,
  requireAssignedPages,
  checkPermission('update', 'user'),
  activityLogger('role_assign', 'user'),
  UserController.assignRole
);

// Remove role from user - Users with assigned pages can remove roles
router.post('/remove-role',
  assignRoleValidation,
  requireAssignedPages,
  checkPermission('update', 'user'),
  activityLogger('role_remove', 'user'),
  UserController.removeRole
);

module.exports = router;