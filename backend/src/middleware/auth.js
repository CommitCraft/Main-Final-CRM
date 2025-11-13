const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided or invalid format.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token is required.'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database to ensure they still exist and are active
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. User not found.'
        });
      }

      if (user.status !== 'active') {
        return res.status(401).json({
          success: false,
          message: 'Account is inactive. Please contact administrator.'
        });
      }

      // Attach user info to request object
      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles || [],
        status: user.status
      };

      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please login again.',
          code: 'TOKEN_EXPIRED'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token.',
          code: 'INVALID_TOKEN'
        });
      } else {
        throw jwtError;
      }
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);

    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (user && user.status === 'active') {
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          roles: user.roles || [],
          status: user.status
        };
      } else {
        req.user = null;
      }
    } catch (jwtError) {
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    next();
  }
};

// Admin only middleware
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  if (!req.user.roles.includes('admin') && !req.user.roles.includes('super_admin')) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required.'
    });
  }

  next();
};

// Check if user has assigned pages (allows access to users with pages but not CRUD operations)
const requireAssignedPages = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    console.log(`requireAssignedPages check for user: ${req.user.username} (ID: ${req.user.id}), roles: ${req.user.roles?.join(', ') || 'None'}`);

    // Super admin always has access
    if (req.user.roles.includes('super_admin')) {
      console.log('Access granted: User is super admin');
      return next();
    }

    // Admin also has access
    if (req.user.roles.includes('admin')) {
      console.log('Access granted: User is admin');
      return next();
    }

    // Check if user has any assigned pages
    const Page = require('../models/page');
    const userPages = await Page.getPagesByUser(req.user.id);
    console.log(`User has ${userPages?.length || 0} assigned pages`);
    
    // Allow all users with assigned pages to perform CRUD operations
    console.log('Access granted: User has assigned pages');
    return next();
    
    // Original logic (commented out for testing)
    /*
    if (!userPages || userPages.length === 0) {
      console.log('Access denied: No pages assigned');
      return res.status(403).json({
        success: false,
        message: 'Access denied. No pages assigned to your account.'
      });
    }

    console.log('Access granted: User has assigned pages');
    next();
    */
  } catch (error) {
    console.error('Assigned pages check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking assigned pages.'
    });
  }
};

// Generate JWT token
const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    roles: user.roles || []
  };

  const options = {
    expiresIn: process.env.JWT_EXPIRES_IN || '2d',
    issuer: 'cmscrm-backend',
    audience: 'cmscrm-frontend'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

// Verify token without middleware
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Decode token without verification (for expired tokens)
const decodeToken = (token) => {
  try {
    return jwt.decode(token, { complete: true });
  } catch (error) {
    return null;
  }
};

// Refresh token logic
const refreshToken = async (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded) return null;

    const user = await User.findById(decoded.id);
    if (!user || user.status !== 'active') return null;

    return generateToken(user);
  } catch (error) {
    return null;
  }
};

module.exports = {
  auth,
  optionalAuth,
  requireAdmin,
  requireAssignedPages,
  generateToken,
  verifyToken,
  decodeToken,
  refreshToken
};