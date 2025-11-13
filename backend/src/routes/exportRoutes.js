const express = require('express');
const router = express.Router();

const ExportController = require('../controllers/exportController');
const { auth, requireAdmin } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { activityLogger, responseTimeLogger, logDataExport } = require('../middleware/activityLogger');
const { exportValidation } = require('../middleware/validation');

// Apply authentication and response time logging to all export routes
router.use(auth);
router.use(responseTimeLogger);

// Export users - Admin only
router.get('/users',
  exportValidation,
  requireAdmin,
  checkPermission('export', 'data'),
  logDataExport('users'),
  activityLogger('export', 'user'),
  ExportController.exportUsers
);

// Export roles - Admin only
router.get('/roles',
  exportValidation,
  requireAdmin,
  checkPermission('export', 'data'),
  logDataExport('roles'),
  activityLogger('export', 'role'),
  ExportController.exportRoles
);

// Export pages - Admin only
router.get('/pages',
  exportValidation,
  requireAdmin,
  checkPermission('export', 'data'),
  logDataExport('pages'),
  activityLogger('export', 'page'),
  ExportController.exportPages
);

// Export activity logs - Admin only
router.get('/activity-logs',
  exportValidation,
  requireAdmin,
  checkPermission('export', 'data'),
  logDataExport('activity-logs'),
  activityLogger('export', 'activity_log'),
  ExportController.exportActivityLogs
);

// Export login activities - Admin only
router.get('/login-activities',
  exportValidation,
  requireAdmin,
  checkPermission('export', 'data'),
  logDataExport('login-activities'),
  activityLogger('export', 'login_activity'),
  ExportController.exportLoginActivities
);

// Download exported file - Admin only
router.get('/download/:filename',
  requireAdmin,
  checkPermission('export', 'data'),
  activityLogger('download', 'export'),
  ExportController.downloadFile
);

module.exports = router;