const ActivityLog = require('../models/activityLog');

// Activity logging middleware
const activityLogger = (action, resource = null) => {
  return async (req, res, next) => {
    // Store original res.json method
    const originalJson = res.json;
    const startTime = Date.now();

    // Override res.json to capture response
    res.json = function(data) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Log the activity asynchronously
      setImmediate(async () => {
        try {
          const activityData = {
            user_id: req.user ? req.user.id : null,
            username: req.user ? req.user.username : 'anonymous',
            action: action,
            resource: resource,
            resource_id: extractResourceId(req),
            ip_address: getClientIP(req),
            user_agent: req.headers['user-agent'],
            details: {
              method: req.method,
              path: req.path,
              query: req.query,
              params: req.params,
              status_code: res.statusCode,
              response_time_ms: responseTime,
              success: res.statusCode < 400
            }
          };

          // Add specific details based on the action and resource
          if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            activityData.details.body_keys = req.body ? Object.keys(req.body) : [];
          }

          await ActivityLog.create(activityData);
        } catch (error) {
          console.error('Activity logging error:', error);
        }
      });

      // Call original res.json
      return originalJson.call(this, data);
    };

    next();
  };
};

// Specific activity loggers
const logLogin = async (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    setImmediate(async () => {
      try {
        const success = res.statusCode < 400;
        const username = req.body ? req.body.email || req.body.username : 'unknown';
        
        await ActivityLog.create({
          user_id: success && data.user ? data.user.id : null,
          username: username,
          action: ActivityLog.ACTIONS.LOGIN,
          resource: ActivityLog.RESOURCES.SYSTEM,
          ip_address: getClientIP(req),
          user_agent: req.headers['user-agent'],
          details: {
            success: success,
            method: 'LOGIN',
            status_code: res.statusCode,
            login_time: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('Login activity logging error:', error);
      }
    });

    return originalJson.call(this, data);
  };

  next();
};

const logLogout = async (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    setImmediate(async () => {
      try {
        await ActivityLog.create({
          user_id: req.user ? req.user.id : null,
          username: req.user ? req.user.username : 'unknown',
          action: ActivityLog.ACTIONS.LOGOUT,
          resource: ActivityLog.RESOURCES.SYSTEM,
          ip_address: getClientIP(req),
          user_agent: req.headers['user-agent'],
          details: {
            method: 'LOGOUT',
            logout_time: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('Logout activity logging error:', error);
      }
    });

    return originalJson.call(this, data);
  };

  next();
};

const logDataExport = (exportType) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
      setImmediate(async () => {
        try {
          await ActivityLog.create({
            user_id: req.user ? req.user.id : null,
            username: req.user ? req.user.username : 'unknown',
            action: ActivityLog.ACTIONS.EXPORT,
            resource: ActivityLog.RESOURCES.EXPORT,
            ip_address: getClientIP(req),
            user_agent: req.headers['user-agent'],
            details: {
              export_type: exportType,
              method: req.method,
              path: req.path,
              query: req.query,
              status_code: res.statusCode,
              export_time: new Date().toISOString()
            }
          });
        } catch (error) {
          console.error('Export activity logging error:', error);
        }
      });

      return originalJson.call(this, data);
    };

    next();
  };
};

const logFileUpload = async (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    setImmediate(async () => {
      try {
        const files = req.files || {};
        const fileInfo = Object.keys(files).map(key => ({
          fieldname: key,
          filename: files[key].name,
          size: files[key].size,
          mimetype: files[key].mimetype
        }));

        await ActivityLog.create({
          user_id: req.user ? req.user.id : null,
          username: req.user ? req.user.username : 'unknown',
          action: ActivityLog.ACTIONS.UPLOAD,
          resource: ActivityLog.RESOURCES.UPLOAD,
          ip_address: getClientIP(req),
          user_agent: req.headers['user-agent'],
          details: {
            method: req.method,
            path: req.path,
            files: fileInfo,
            status_code: res.statusCode,
            upload_time: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('File upload activity logging error:', error);
      }
    });

    return originalJson.call(this, data);
  };

  next();
};

// Helper functions
const extractResourceId = (req) => {
  // Try to extract resource ID from various sources
  if (req.params.id) return parseInt(req.params.id);
  if (req.params.userId) return parseInt(req.params.userId);
  if (req.params.roleId) return parseInt(req.params.roleId);
  if (req.params.pageId) return parseInt(req.params.pageId);
  if (req.body && req.body.id) return parseInt(req.body.id);
  return null;
};

const getClientIP = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].split(',')[0]) ||
         req.headers['x-real-ip'] ||
         'unknown';
};

// Middleware to track API response times
const responseTimeLogger = async (req, res, next) => {
  const startTime = Date.now();
  
  const originalJson = res.json;
  res.json = function(data) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Log to API stats table asynchronously
    setImmediate(async () => {
      try {
        const db = require('../config/db');
        await db.executeQuery(
          'INSERT INTO api_stats (endpoint, method, response_time_ms, status_code, user_id, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
          [
            req.path,
            req.method,
            responseTime,
            res.statusCode,
            req.user ? req.user.id : null,
            getClientIP(req)
          ]
        );
      } catch (error) {
        console.error('API stats logging error:', error);
      }
    });

    return originalJson.call(this, data);
  };

  next();
};

module.exports = {
  activityLogger,
  logLogin,
  logLogout,
  logDataExport,
  logFileUpload,
  responseTimeLogger,
  getClientIP
};