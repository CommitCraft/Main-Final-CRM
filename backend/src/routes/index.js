const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const roleRoutes = require('./roleRoutes');
const pageRoutes = require('./pageRoutes');
const statsRoutes = require('./statsRoutes');
const exportRoutes = require('./exportRoutes');
const systemRoutes = require('./systemRoutes');

// API version and documentation info
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CMSCRM Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      roles: '/api/roles',
      pages: '/api/pages',
      stats: '/api/stats',
      exports: '/api/exports',
      system: '/api/system'
    },
    documentation: {
      swagger: '/api/docs',
      health: '/health',
      status: '/api/status'
    }
  });
});

// API status endpoint
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mount all routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/pages', pageRoutes);
router.use('/stats', statsRoutes);
router.use('/exports', exportRoutes);
router.use('/system', systemRoutes);

// API documentation placeholder
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'API Documentation',
    version: '1.0.0',
    endpoints: {
      '/api/auth': {
        'POST /login': 'User login',
        'POST /logout': 'User logout',
        'GET /profile': 'Get user profile',
        'PUT /profile': 'Update user profile',
        'POST /change-password': 'Change password',
        'GET /verify': 'Verify token',
        'GET /login-history': 'Get login history'
      },
      '/api/users': {
        'GET /': 'Get all users (admin)',
        'GET /:id': 'Get user by ID',
        'POST /': 'Create user (admin)',
        'PUT /:id': 'Update user (admin)',
        'DELETE /:id': 'Delete user (admin)',
        'GET /:id/roles': 'Get user roles',
        'POST /assign-role': 'Assign role to user (admin)',
        'POST /remove-role': 'Remove role from user (admin)',
        'GET /stats': 'Get user statistics (admin)'
      },
      '/api/roles': {
        'GET /': 'Get all roles (admin)',
        'GET /simple': 'Get simple roles list',
        'GET /:id': 'Get role by ID (admin)',
        'POST /': 'Create role (admin)',
        'PUT /:id': 'Update role (admin)',
        'DELETE /:id': 'Delete role (admin)',
        'GET /:id/pages': 'Get role pages (admin)',
        'POST /assign-pages': 'Assign pages to role (admin)',
        'GET /stats': 'Get role statistics (admin)'
      },
      '/api/pages': {
        'GET /': 'Get all pages (admin)',
        'GET /simple': 'Get simple pages list (admin)',
        'GET /my-pages': 'Get user accessible pages',
        'GET /:id': 'Get page by ID (admin)',
        'POST /': 'Create page (admin)',
        'PUT /:id': 'Update page (admin)',
        'DELETE /:id': 'Delete page (admin)',
        'GET /access/:pageUrl': 'Check page access',
        'GET /stats': 'Get page statistics (admin)'
      },
      '/api/stats': {
        'GET /dashboard': 'Get dashboard statistics',
        'GET /activity': 'Get activity statistics (admin)',
        'GET /login': 'Get login statistics (admin)',
        'GET /api': 'Get API statistics (admin)',
        'GET /health': 'Get system health (admin)',
        'GET /recent-activity': 'Get recent activity',
        'GET /active-users': 'Get active users (admin)'
      },
      '/api/exports': {
        'GET /users': 'Export users data (admin)',
        'GET /roles': 'Export roles data (admin)',
        'GET /pages': 'Export pages data (admin)',
        'GET /activity-logs': 'Export activity logs (admin)',
        'GET /login-activities': 'Export login activities (admin)',
        'GET /download/:filename': 'Download exported file (admin)'
      }
    }
  });
});

module.exports = router;