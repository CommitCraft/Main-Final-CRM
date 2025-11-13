const db = require('../config/db');

class ActivityLog {
  static async create(activityData) {
    const {
      user_id = null,
      username = null,
      action,
      resource = null,
      resource_id = null,
      ip_address = null,
      user_agent = null,
      details = null
    } = activityData;

    const query = `
      INSERT INTO activity_logs (user_id, username, action, resource, resource_id, ip_address, user_agent, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const detailsJson = details ? JSON.stringify(details) : null;
    
    const result = await db.executeQuery(query, [
      user_id, username, action, resource, resource_id, ip_address, user_agent, detailsJson
    ]);

    return { id: result.insertId, ...activityData };
  }

  static async findById(id) {
    const query = 'SELECT * FROM activity_logs WHERE id = ?';
    const logs = await db.executeQuery(query, [id]);
    
    if (logs.length === 0) return null;
    
    const log = logs[0];
    if (log.details) {
      try {
        log.details = JSON.parse(log.details);
      } catch (error) {
        log.details = null;
      }
    }
    
    return log;
  }

  static async findAll(options = {}) {
    const { 
      page = 1, 
      limit = 20, 
      user_id = null, 
      action = null, 
      resource = null,
      start_date = null,
      end_date = null
    } = options;
    
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (user_id) {
      whereClause += ' AND al.user_id = ?';
      params.push(user_id);
    }

    if (action) {
      whereClause += ' AND al.action = ?';
      params.push(action);
    }

    if (resource) {
      whereClause += ' AND al.resource = ?';
      params.push(resource);
    }

    if (start_date) {
      whereClause += ' AND al.created_at >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND al.created_at <= ?';
      params.push(end_date);
    }

    const query = `
      SELECT al.*, u.email as user_email, u.last_login as user_last_login
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const logs = await db.executeQuery(query, params);

    // Parse JSON details
    const parsedLogs = logs.map(log => {
      if (log.details) {
        try {
          log.details = JSON.parse(log.details);
        } catch (error) {
          log.details = null;
        }
      }
      return log;
    });

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM activity_logs al
      ${whereClause}
    `;
    
    const countResult = await db.executeQuery(countQuery, params.slice(0, -2));
    const total = countResult[0].total;

    return {
      logs: parsedLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total),
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getRecentActivity(limit = 10) {
    // Ensure limit is a valid number
    const validLimit = Math.max(1, Math.min(100, parseInt(limit) || 10));

    const query = `
      SELECT al.*, u.email
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT ?
    `;

    const logs = await db.executeQuery(query, [validLimit]);
    
    return logs.map(log => {
      if (log.details) {
        try {
          log.details = JSON.parse(log.details);
        } catch (error) {
          log.details = null;
        }
      }
      return log;
    });
  }

  static async getUserActivity(userId, options = {}) {
    const { page = 1, limit = 20, action = null } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE user_id = ?';
    const params = [userId];

    if (action) {
      whereClause += ' AND action = ?';
      params.push(action);
    }

    const query = `
      SELECT *
      FROM activity_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const logs = await db.executeQuery(query, params);

    // Parse JSON details
    const parsedLogs = logs.map(log => {
      if (log.details) {
        try {
          log.details = JSON.parse(log.details);
        } catch (error) {
          log.details = null;
        }
      }
      return log;
    });

    return parsedLogs;
  }

  static async getActivityStats(options = {}) {
    const { start_date = null, end_date = null } = options;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (start_date) {
      whereClause += ' AND created_at >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND created_at <= ?';
      params.push(end_date);
    }

    const queries = [
      `SELECT COUNT(*) as total FROM activity_logs ${whereClause}`,
      `SELECT action, COUNT(*) as count FROM activity_logs ${whereClause} GROUP BY action ORDER BY count DESC LIMIT 10`,
      `SELECT resource, COUNT(*) as count FROM activity_logs ${whereClause} WHERE resource IS NOT NULL GROUP BY resource ORDER BY count DESC LIMIT 10`,
      `SELECT DATE(created_at) as date, COUNT(*) as count FROM activity_logs ${whereClause} GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 7`
    ];

    const results = await Promise.all(
      queries.map(query => db.executeQuery(query, params))
    );

    return {
      total: results[0][0].total,
      top_actions: results[1],
      top_resources: results[2],
      daily_activity: results[3]
    };
  }

  static async cleanup(daysToKeep = 90) {
    const query = 'DELETE FROM activity_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)';
    const result = await db.executeQuery(query, [daysToKeep]);
    return result.affectedRows;
  }

  static async logUserAction(userId, username, action, resource = null, resourceId = null, details = null, req = null) {
    const activityData = {
      user_id: userId,
      username: username,
      action: action,
      resource: resource,
      resource_id: resourceId,
      details: details
    };

    if (req) {
      activityData.ip_address = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
      activityData.user_agent = req.headers['user-agent'];
    }

    return await ActivityLog.create(activityData);
  }

  // Predefined action types for consistency
  static get ACTIONS() {
    return {
      LOGIN: 'login',
      LOGOUT: 'logout',
      CREATE: 'create',
      UPDATE: 'update',
      DELETE: 'delete',
      VIEW: 'view',
      EXPORT: 'export',
      IMPORT: 'import',
      UPLOAD: 'upload',
      DOWNLOAD: 'download',
      ROLE_ASSIGN: 'role_assign',
      ROLE_REMOVE: 'role_remove',
      PAGE_ASSIGN: 'page_assign',
      PAGE_REMOVE: 'page_remove',
      PASSWORD_CHANGE: 'password_change',
      STATUS_CHANGE: 'status_change',
      SETTINGS_UPDATE: 'settings_update'
    };
  }

  // Predefined resource types for consistency
  static get RESOURCES() {
    return {
      USER: 'user',
      ROLE: 'role',
      PAGE: 'page',
      SYSTEM: 'system',
      EXPORT: 'export',
      UPLOAD: 'upload'
    };
  }
}

module.exports = ActivityLog;