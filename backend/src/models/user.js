const db = require('../config/db');

class User {
  static async create(userData) {
    const { username, email, password_hash, status = 'active', created_by = null } = userData;
    
    const query = `
      INSERT INTO users (username, email, password_hash, status, created_by)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const result = await db.executeQuery(query, [username, email, password_hash, status, created_by]);
    return { id: result.insertId, ...userData };
  }

  static async findById(id) {
    const query = `
      SELECT u.*, 
             GROUP_CONCAT(r.name) as roles,
             GROUP_CONCAT(r.id) as role_ids
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = ?
      GROUP BY u.id
    `;
    
    const users = await db.executeQuery(query, [id]);
    if (users.length === 0) return null;
    
    const user = users[0];
    user.roles = user.roles ? user.roles.split(',') : [];
    user.role_ids = user.role_ids ? user.role_ids.split(',').map(id => parseInt(id)) : [];
    // For single role selection in frontend, use the first role_id
    user.role_id = user.role_ids.length > 0 ? user.role_ids[0] : null;
    return user;
  }

  static async findByEmail(email) {
    const query = `
      SELECT u.*, GROUP_CONCAT(r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = ?
      GROUP BY u.id
    `;
    
    const users = await db.executeQuery(query, [email]);
    if (users.length === 0) return null;
    
    const user = users[0];
    user.roles = user.roles ? user.roles.split(',') : [];
    return user;
  }

  static async findByUsername(username) {
    const query = `
      SELECT u.*, GROUP_CONCAT(r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.username = ?
      GROUP BY u.id
    `;
    
    const users = await db.executeQuery(query, [username]);
    if (users.length === 0) return null;
    
    const user = users[0];
    user.roles = user.roles ? user.roles.split(',') : [];
    return user;
  }

  static async findAll(options = {}) {
    const { page = 1, limit = 10, search = '', status = '' } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search && search.trim()) {
      whereClause += ' AND (u.username LIKE ? OR u.email LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (status && status.trim()) {
      whereClause += ' AND u.status = ?';
      params.push(status.trim());
    }

    const query = `
      SELECT u.id, u.username, u.email, u.status, u.created_at, u.updated_at, u.last_login,
             GROUP_CONCAT(r.name) as roles,
             GROUP_CONCAT(r.id) as role_ids
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      ${whereClause}
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `;

    // Ensure all parameters are proper types
    const finalParams = [...params, parseInt(limit), parseInt(offset)];
    const users = await db.executeQuery(query, finalParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      ${whereClause}
    `;
    
    // Create count params without the limit and offset
    const countParams = [];
    if (search && search.trim()) {
      countParams.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }
    if (status && status.trim()) {
      countParams.push(status.trim());
    }
    
    const countResult = await db.executeQuery(countQuery, countParams);
    const total = countResult[0].total;

    return {
      users: users.map(user => ({
        ...user,
        roles: user.roles ? user.roles.split(',') : [],
        role_ids: user.role_ids ? user.role_ids.split(',').map(id => parseInt(id)) : [],
        role_id: user.role_ids ? parseInt(user.role_ids.split(',')[0]) : null
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async update(id, userData) {
    const { username, email, password_hash, status } = userData;
    
    let query = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
    const params = [];

    if (username !== undefined) {
      query += ', username = ?';
      params.push(username);
    }

    if (email !== undefined) {
      query += ', email = ?';
      params.push(email);
    }

    if (password_hash !== undefined) {
      query += ', password_hash = ?';
      params.push(password_hash);
    }

    if (status !== undefined) {
      query += ', status = ?';
      params.push(status);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await db.executeQuery(query, params);
    return await User.findById(id);
  }

  static async updateLastLogin(id) {
    const query = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?';
    await db.executeQuery(query, [id]);
  }

  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = ?';
    const result = await db.executeQuery(query, [id]);
    return result.affectedRows > 0;
  }

  static async assignRole(userId, roleId, assignedBy = null) {
    const query = `
      INSERT INTO user_roles (user_id, role_id, assigned_by)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE assigned_at = CURRENT_TIMESTAMP, assigned_by = VALUES(assigned_by)
    `;
    
    await db.executeQuery(query, [userId, roleId, assignedBy]);
  }

  static async removeRole(userId, roleId) {
    const query = 'DELETE FROM user_roles WHERE user_id = ? AND role_id = ?';
    const result = await db.executeQuery(query, [userId, roleId]);
    return result.affectedRows > 0;
  }

  static async getUserRoles(userId) {
    const query = `
      SELECT r.*
      FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ?
    `;
    
    return await db.executeQuery(query, [userId]);
  }

  static async getStats() {
    const queries = [
      'SELECT COUNT(*) as total FROM users',
      'SELECT COUNT(*) as active FROM users WHERE status = "active"',
      'SELECT COUNT(*) as inactive FROM users WHERE status = "inactive"'
    ];

    const results = await Promise.all(queries.map(query => db.executeQuery(query)));
    
    return {
      total: results[0][0].total,
      active: results[1][0].active,
      inactive: results[2][0].inactive
    };
  }
}

module.exports = User;