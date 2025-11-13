const express = require('express');
const router = express.Router();

const PageController = require('../controllers/pageController');
const { auth, requireAdmin, requireAssignedPages } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { activityLogger, responseTimeLogger, logFileUpload } = require('../middleware/activityLogger');
const {
  createPageValidation,
  updatePageValidation,
  pageIdValidation,
  pageUrlValidation,
  paginationValidation
} = require('../middleware/validation');

// Apply authentication and response time logging to all page routes
router.use(auth);
router.use(responseTimeLogger);

// Get user's accessible pages - Authenticated users
router.get('/my-pages',
  activityLogger('view', 'user_pages'),
  PageController.getPagesByUser
);

// Get user's accessible pages with hierarchy - Authenticated users
router.get('/my-pages-hierarchy',
  activityLogger('view', 'user_pages_hierarchy'),
  PageController.getUserPagesWithHierarchy
);

// Get all pages (simple list for dropdowns) - Users with assigned pages can view
router.get('/simple',
  requireAssignedPages,
  checkPermission('view', 'page'),
  activityLogger('view', 'page'),
  PageController.getAllSimple
);

// Get all pages with pagination - Users with assigned pages can view
router.get('/',
  paginationValidation,
  requireAssignedPages,
  checkPermission('view', 'page'),
  activityLogger('view', 'page'),
  PageController.getPages
);

// Get page statistics - Admin only
router.get('/stats',
  requireAdmin,
  checkPermission('view', 'page'),
  activityLogger('view', 'page_stats'),
  PageController.getStats
);

// Check page access for current user
router.get('/access/:pageUrl',
  pageUrlValidation,
  activityLogger('view', 'page_access'),
  PageController.checkPageAccess
);

// Get page by ID - Users with assigned pages can view
router.get('/:id',
  pageIdValidation,
  requireAssignedPages,
  checkPermission('view', 'page'),
  activityLogger('view', 'page'),
  PageController.getPageById
);

// Create new page - Users with assigned pages can create
router.post('/',
  createPageValidation,
  requireAssignedPages,
  checkPermission('create', 'page'),
  logFileUpload,
  activityLogger('create', 'page'),
  PageController.createPage
);

// Update page - Users with assigned pages can update
router.put('/:id',
  updatePageValidation,
  requireAssignedPages,
  checkPermission('update', 'page'),
  logFileUpload,
  activityLogger('update', 'page'),
  PageController.updatePage
);

// Delete page - Users with assigned pages can delete
router.delete('/:id',
  pageIdValidation,
  requireAssignedPages,
  checkPermission('delete', 'page'),
  activityLogger('delete', 'page'),
  PageController.deletePage
);

module.exports = router;