const db = require('../config/db');

class LoginActivity {
  static async create(loginData) {
    const {
      user_id = null,
      username = null,
      ip_address = null,
      user_agent = null,
      success = true
    } = loginData;

    const query = `
      INSERT INTO login_activities (user_id, username, ip_address, user_agent, success)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const result = await db.executeQuery(query, [
      user_id, username, ip_address, user_agent, success
    ]);

    return { id: result.insertId, ...loginData };
  }

  static async findById(id) {
    const query = 'SELECT * FROM login_activities WHERE id = ?';
    const activities = await db.executeQuery(query, [id]);
    return activities.length > 0 ? activities[0] : null;
  }

  static async findAll(options = {}) {
    const { 
      page = 1, 
      limit = 20, 
      user_id = null, 
      username = null,
      success = null,
      start_date = null,
      end_date = null
    } = options;
    
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (user_id) {
      whereClause += ' AND user_id = ?';
      params.push(user_id);
    }

    if (username) {
      whereClause += ' AND username LIKE ?';
      params.push(`%${username}%`);
    }

    if (success !== null) {
      whereClause += ' AND success = ?';
      params.push(success);
    }

    if (start_date) {
      whereClause += ' AND login_time >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND login_time <= ?';
      params.push(end_date);
    }

    const query = `
      SELECT la.*, u.email
      FROM login_activities la
      LEFT JOIN users u ON la.user_id = u.id
      ${whereClause}
      ORDER BY la.login_time DESC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const activities = await db.executeQuery(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM login_activities la
      ${whereClause.replace('ORDER BY la.login_time DESC LIMIT ? OFFSET ?', '')}
    `;
    
    const countResult = await db.executeQuery(countQuery, params.slice(0, -2));
    const total = countResult[0].total;

    return {
      activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getRecentLogins(limit = 10) {
    const query = `
      SELECT la.*, u.email
      FROM login_activities la
      LEFT JOIN users u ON la.user_id = u.id
      WHERE la.success = TRUE
      ORDER BY la.login_time DESC
      LIMIT ?
    `;

    return await db.executeQuery(query, [limit]);
  }

  static async getUserLoginHistory(userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const query = `
      SELECT *
      FROM login_activities
      WHERE user_id = ?
      ORDER BY login_time DESC
      LIMIT ? OFFSET ?
    `;

    const activities = await db.executeQuery(query, [userId, limit, offset]);

    // Get total count
    const countQuery = 'SELECT COUNT(*) as total FROM login_activities WHERE user_id = ?';
    const countResult = await db.executeQuery(countQuery, [userId]);
    const total = countResult[0].total;

    return {
      activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async recordLogout(loginId) {
    const query = `
      UPDATE login_activities 
      SET logout_time = CURRENT_TIMESTAMP,
          session_duration = TIMESTAMPDIFF(SECOND, login_time, CURRENT_TIMESTAMP)
      WHERE id = ?
    `;
    
    const result = await db.executeQuery(query, [loginId]);
    return result.affectedRows > 0;
  }

  static async getLoginStats(options = {}) {
    const { start_date = null, end_date = null } = options;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (start_date) {
      whereClause += ' AND login_time >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND login_time <= ?';
      params.push(end_date);
    }

    const queries = [
      `SELECT COUNT(*) as total_attempts FROM login_activities ${whereClause}`,
      `SELECT COUNT(*) as successful_logins FROM login_activities ${whereClause} AND success = TRUE`,
      `SELECT COUNT(*) as failed_logins FROM login_activities ${whereClause} AND success = FALSE`,
      `SELECT COUNT(DISTINCT user_id) as unique_users FROM login_activities ${whereClause} AND success = TRUE`,
      `SELECT AVG(session_duration) as avg_session_duration FROM login_activities ${whereClause} AND session_duration IS NOT NULL`,
      `SELECT DATE(login_time) as date, COUNT(*) as logins 
       FROM login_activities ${whereClause} AND success = TRUE 
       GROUP BY DATE(login_time) ORDER BY date DESC LIMIT 7`,
      `SELECT HOUR(login_time) as hour, COUNT(*) as logins 
       FROM login_activities ${whereClause} AND success = TRUE 
       GROUP BY HOUR(login_time) ORDER BY hour`,
      `SELECT ip_address, COUNT(*) as login_count 
       FROM login_activities ${whereClause} AND success = TRUE 
       GROUP BY ip_address ORDER BY login_count DESC LIMIT 10`
    ];

    const results = await Promise.all(
      queries.map(query => db.executeQuery(query, params))
    );

    return {
      total_attempts: results[0][0].total_attempts,
      successful_logins: results[1][0].successful_logins,
      failed_logins: results[2][0].failed_logins,
      unique_users: results[3][0].unique_users,
      avg_session_duration: results[4][0].avg_session_duration || 0,
      daily_logins: results[5],
      hourly_distribution: results[6],
      top_ip_addresses: results[7]
    };
  }

  static async getFailedLoginAttempts(options = {}) {
    const { 
      minutes = 15, 
      ip_address = null, 
      username = null 
    } = options;

    let whereClause = 'WHERE success = FALSE AND login_time >= DATE_SUB(NOW(), INTERVAL ? MINUTE)';
    const params = [minutes];

    if (ip_address) {
      whereClause += ' AND ip_address = ?';
      params.push(ip_address);
    }

    if (username) {
      whereClause += ' AND username = ?';
      params.push(username);
    }

    const query = `
      SELECT COUNT(*) as failed_attempts
      FROM login_activities
      ${whereClause}
    `;

    const result = await db.executeQuery(query, params);
    return result[0].failed_attempts;
  }

  static async cleanup(daysToKeep = 180) {
    const query = 'DELETE FROM login_activities WHERE login_time < DATE_SUB(NOW(), INTERVAL ? DAY)';
    const result = await db.executeQuery(query, [daysToKeep]);
    return result.affectedRows;
  }

  static async logLogin(userData, success = true, req = null) {
    const loginData = {
      user_id: userData.id || null,
      username: userData.username || userData.email,
      success: success
    };

    if (req) {
      loginData.ip_address = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
      loginData.user_agent = req.headers['user-agent'];
    }

    return await LoginActivity.create(loginData);
  }

  static async getActiveUsers(minutes = 30) {
    const query = `
      SELECT DISTINCT u.id, u.username, u.email, la.login_time
      FROM users u
      JOIN login_activities la ON u.id = la.user_id
      WHERE la.success = TRUE 
        AND la.login_time >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
        AND (la.logout_time IS NULL OR la.logout_time >= DATE_SUB(NOW(), INTERVAL ? MINUTE))
      ORDER BY la.login_time DESC
    `;

    return await db.executeQuery(query, [minutes, minutes]);
  }

  static async getLastLogin(userId) {
    const query = `
      SELECT *
      FROM login_activities
      WHERE user_id = ? AND success = TRUE
      ORDER BY login_time DESC
      LIMIT 1
    `;

    const result = await db.executeQuery(query, [userId]);
    return result.length > 0 ? result[0] : null;
  }
}

module.exports = LoginActivity;