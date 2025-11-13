const db = require('../config/db');

// User-Role relationship model
class UserRole {
  static async create(userRoleData) {
    const { user_id, role_id, assigned_by = null } = userRoleData;
    
    const query = `
      INSERT INTO user_roles (user_id, role_id, assigned_by)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE assigned_at = CURRENT_TIMESTAMP, assigned_by = VALUES(assigned_by)
    `;
    
    const result = await db.executeQuery(query, [user_id, role_id, assigned_by]);
    return { id: result.insertId, ...userRoleData };
  }

  static async findByUserAndRole(userId, roleId) {
    const query = `
      SELECT ur.*, u.username, r.name as role_name
      FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ? AND ur.role_id = ?
    `;
    
    const result = await db.executeQuery(query, [userId, roleId]);
    return result.length > 0 ? result[0] : null;
  }

  static async findByUser(userId) {
    const query = `
      SELECT ur.*, r.name as role_name, r.description
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ?
      ORDER BY ur.assigned_at DESC
    `;
    
    return await db.executeQuery(query, [userId]);
  }

  static async findByRole(roleId) {
    const query = `
      SELECT ur.*, u.username, u.email, u.status
      FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      WHERE ur.role_id = ?
      ORDER BY ur.assigned_at DESC
    `;
    
    return await db.executeQuery(query, [roleId]);
  }

  static async delete(userId, roleId) {
    const query = 'DELETE FROM user_roles WHERE user_id = ? AND role_id = ?';
    const result = await db.executeQuery(query, [userId, roleId]);
    return result.affectedRows > 0;
  }

  static async deleteAllByUser(userId) {
    const query = 'DELETE FROM user_roles WHERE user_id = ?';
    const result = await db.executeQuery(query, [userId]);
    return result.affectedRows;
  }

  static async deleteAllByRole(roleId) {
    const query = 'DELETE FROM user_roles WHERE role_id = ?';
    const result = await db.executeQuery(query, [roleId]);
    return result.affectedRows;
  }

  static async replaceUserRoles(userId, roleIds, assignedBy = null) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Remove existing roles
      await connection.execute('DELETE FROM user_roles WHERE user_id = ?', [userId]);

      // Add new roles
      if (roleIds && roleIds.length > 0) {
        const values = roleIds.map(() => '(?, ?, ?)').join(', ');
        const params = [];
        
        roleIds.forEach(roleId => {
          params.push(userId, roleId, assignedBy);
        });

        const query = `INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES ${values}`;
        await connection.execute(query, params);
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getStats() {
    const queries = [
      'SELECT COUNT(*) as total FROM user_roles',
      'SELECT COUNT(DISTINCT user_id) as users_with_roles FROM user_roles',
      'SELECT COUNT(DISTINCT role_id) as roles_in_use FROM user_roles'
    ];

    const results = await Promise.all(queries.map(query => db.executeQuery(query)));
    
    return {
      total: results[0][0].total,
      users_with_roles: results[1][0].users_with_roles,
      roles_in_use: results[2][0].roles_in_use
    };
  }
}

// Role-Page relationship model
class RolePage {
  static async create(rolePageData) {
    const { role_id, page_id, assigned_by = null } = rolePageData;
    
    const query = `
      INSERT INTO role_pages (role_id, page_id, assigned_by)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE assigned_at = CURRENT_TIMESTAMP, assigned_by = VALUES(assigned_by)
    `;
    
    const result = await db.executeQuery(query, [role_id, page_id, assigned_by]);
    return { id: result.insertId, ...rolePageData };
  }

  static async findByRoleAndPage(roleId, pageId) {
    const query = `
      SELECT rp.*, r.name as role_name, p.name as page_name
      FROM role_pages rp
      JOIN roles r ON rp.role_id = r.id
      JOIN pages p ON rp.page_id = p.id
      WHERE rp.role_id = ? AND rp.page_id = ?
    `;
    
    const result = await db.executeQuery(query, [roleId, pageId]);
    return result.length > 0 ? result[0] : null;
  }

  static async findByRole(roleId) {
    const query = `
      SELECT rp.*, p.name as page_name, p.url, p.icon, p.is_external
      FROM role_pages rp
      JOIN pages p ON rp.page_id = p.id
      WHERE rp.role_id = ?
      ORDER BY rp.assigned_at DESC
    `;
    
    return await db.executeQuery(query, [roleId]);
  }

  static async findByPage(pageId) {
    const query = `
      SELECT rp.*, r.name as role_name, r.description
      FROM role_pages rp
      JOIN roles r ON rp.role_id = r.id
      WHERE rp.page_id = ?
      ORDER BY rp.assigned_at DESC
    `;
    
    return await db.executeQuery(query, [pageId]);
  }

  static async delete(roleId, pageId) {
    const query = 'DELETE FROM role_pages WHERE role_id = ? AND page_id = ?';
    const result = await db.executeQuery(query, [roleId, pageId]);
    return result.affectedRows > 0;
  }

  static async deleteAllByRole(roleId) {
    const query = 'DELETE FROM role_pages WHERE role_id = ?';
    const result = await db.executeQuery(query, [roleId]);
    return result.affectedRows;
  }

  static async deleteAllByPage(pageId) {
    const query = 'DELETE FROM role_pages WHERE page_id = ?';
    const result = await db.executeQuery(query, [pageId]);
    return result.affectedRows;
  }

  static async replaceRolePages(roleId, pageIds, assignedBy = null) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Remove existing pages
      await connection.execute('DELETE FROM role_pages WHERE role_id = ?', [roleId]);

      // Add new pages
      if (pageIds && pageIds.length > 0) {
        const values = pageIds.map(() => '(?, ?, ?)').join(', ');
        const params = [];
        
        pageIds.forEach(pageId => {
          params.push(roleId, pageId, assignedBy);
        });

        const query = `INSERT INTO role_pages (role_id, page_id, assigned_by) VALUES ${values}`;
        await connection.execute(query, params);
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getStats() {
    const queries = [
      'SELECT COUNT(*) as total FROM role_pages',
      'SELECT COUNT(DISTINCT role_id) as roles_with_pages FROM role_pages',
      'SELECT COUNT(DISTINCT page_id) as pages_assigned FROM role_pages'
    ];

    const results = await Promise.all(queries.map(query => db.executeQuery(query)));
    
    return {
      total: results[0][0].total,
      roles_with_pages: results[1][0].roles_with_pages,
      pages_assigned: results[2][0].pages_assigned
    };
  }
}

module.exports = {
  UserRole,
  RolePage
};