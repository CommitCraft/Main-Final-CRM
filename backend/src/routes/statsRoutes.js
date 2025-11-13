const express = require('express');
const router = express.Router();

const StatsController = require('../controllers/statsController');
const { auth, requireAdmin, requireAssignedPages } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { activityLogger, responseTimeLogger } = require('../middleware/activityLogger');
const { statsValidation } = require('../middleware/validation');

// Apply authentication and response time logging to all stats routes
router.use(auth);
router.use(responseTimeLogger);

// Dashboard statistics - Users with assigned pages
router.get('/dashboard',
  requireAssignedPages,
  activityLogger('view', 'dashboard_stats'),
  StatsController.getDashboardStats
);

// Activity statistics - Users with assigned pages
router.get('/activity',
  statsValidation,
  requireAssignedPages,
  activityLogger('view', 'activity_stats'),
  StatsController.getActivityStats
);

// Login statistics - Users with assigned pages
router.get('/login',
  statsValidation,
  requireAssignedPages,
  activityLogger('view', 'login_stats'),
  StatsController.getLoginStats
);

// API performance statistics - Users with assigned pages
router.get('/api',
  statsValidation,
  requireAssignedPages,
  activityLogger('view', 'api_stats'),
  StatsController.getApiStats
);

// System health check - Users with assigned pages
router.get('/health',
  requireAssignedPages,
  activityLogger('view', 'system_health'),
  StatsController.getSystemHealth
);

// Recent activity - Users with assigned pages
router.get('/recent-activity',
  requireAssignedPages,
  activityLogger('view', 'recent_activity'),
  StatsController.getRecentActivity
);

// Active users - Users with assigned pages
router.get('/active-users',
  statsValidation,
  requireAssignedPages,
  activityLogger('view', 'active_users'),
  StatsController.getActiveUsers
);

module.exports = router;