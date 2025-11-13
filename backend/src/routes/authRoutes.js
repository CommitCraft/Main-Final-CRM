const express = require('express');
const router = express.Router();

const AuthController = require('../controllers/authController');
const { auth, optionalAuth } = require('../middleware/auth');
const { activityLogger, logLogin, logLogout, responseTimeLogger } = require('../middleware/activityLogger');
const {
  loginValidation,
  updateProfileValidation,
  changePasswordValidation
} = require('../middleware/validation');

// Apply response time logging to all auth routes
router.use(responseTimeLogger);

// Public routes (no authentication required)
router.post('/login', 
  loginValidation,
  logLogin,
  activityLogger('login', 'system'),
  AuthController.login
);

router.post('/refresh', 
  AuthController.refresh
);

// Protected routes (authentication required)
router.use(auth); // All routes below this require authentication

router.post('/logout',
  logLogout,
  activityLogger('logout', 'system'),
  AuthController.logout
);

router.get('/profile',
  activityLogger('view', 'profile'),
  AuthController.getProfile
);

router.put('/profile',
  updateProfileValidation,
  activityLogger('update', 'profile'),
  AuthController.updateProfile
);

router.post('/change-password',
  changePasswordValidation,
  activityLogger('password_change', 'user'),
  AuthController.changePassword
);

router.get('/verify',
  AuthController.verifyToken
);

router.get('/login-history',
  activityLogger('view', 'login_history'),
  AuthController.getLoginHistory
);

module.exports = router;