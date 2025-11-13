const db = require('../config/db');

class Role {
  static async create(roleData) {
    const { name, description = null, created_by = null } = roleData;
    
    const query = `
      INSERT INTO roles (name, description, created_by)
      VALUES (?, ?, ?)
    `;
    
    const result = await db.executeQuery(query, [name, description, created_by]);
    return { id: result.insertId, ...roleData };
  }

  static async findById(id) {
    const query = `
      SELECT r.*, COUNT(ur.user_id) as user_count,
             GROUP_CONCAT(p.name) as pages,
             GROUP_CONCAT(p.id) as page_ids
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.role_id
      LEFT JOIN role_pages rp ON r.id = rp.role_id
      LEFT JOIN pages p ON rp.page_id = p.id
      WHERE r.id = ?
      GROUP BY r.id
    `;
    
    const roles = await db.executeQuery(query, [id]);
    if (roles.length === 0) return null;
    
    const role = roles[0];
    role.pages = role.pages ? role.pages.split(',') : [];
    role.page_ids = role.page_ids ? role.page_ids.split(',').map(id => parseInt(id)) : [];
    return role;
  }

  static async findByName(name) {
    const query = `
      SELECT r.*, COUNT(ur.user_id) as user_count,
             GROUP_CONCAT(p.name) as pages,
             GROUP_CONCAT(p.id) as page_ids
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.role_id
      LEFT JOIN role_pages rp ON r.id = rp.role_id
      LEFT JOIN pages p ON rp.page_id = p.id
      WHERE r.name = ?
      GROUP BY r.id
    `;
    
    const roles = await db.executeQuery(query, [name]);
    if (roles.length === 0) return null;
    
    const role = roles[0];
    role.pages = role.pages ? role.pages.split(',') : [];
    role.page_ids = role.page_ids ? role.page_ids.split(',').map(id => parseInt(id)) : [];
    return role;
  }

  static async findAll(options = {}) {
    const { page = 1, limit = 10, search = '' } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search && search.trim()) {
      whereClause += ' AND (r.name LIKE ? OR r.description LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    const query = `
      SELECT r.id, r.name, r.description, r.created_at, r.updated_at,
             COUNT(DISTINCT ur.user_id) as user_count,
             COUNT(DISTINCT rp.page_id) as page_count,
             GROUP_CONCAT(DISTINCT p.name ORDER BY p.name) as assigned_pages,
             GROUP_CONCAT(DISTINCT p.id ORDER BY p.name) as page_ids
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.role_id
      LEFT JOIN role_pages rp ON r.id = rp.role_id
      LEFT JOIN pages p ON rp.page_id = p.id
      ${whereClause}
      GROUP BY r.id
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;

    // Ensure all parameters are proper types
    const finalParams = [...params, parseInt(limit), parseInt(offset)];
    const roles = await db.executeQuery(query, finalParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT r.id) as total
      FROM roles r
      ${whereClause}
    `;
    
    // Create count params without the limit and offset
    const countParams = [];
    if (search && search.trim()) {
      countParams.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }
    
    const countResult = await db.executeQuery(countQuery, countParams);
    const total = countResult[0].total;

    return {
      roles: roles.map(role => ({
        ...role,
        assigned_pages: role.assigned_pages ? role.assigned_pages.split(',') : [],
        pages: role.assigned_pages ? role.assigned_pages.split(',') : [],
        page_ids: role.page_ids ? role.page_ids.split(',').map(id => parseInt(id)) : []
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async update(id, roleData) {
    const { name, description } = roleData;
    
    let query = 'UPDATE roles SET updated_at = CURRENT_TIMESTAMP';
    const params = [];

    if (name !== undefined) {
      query += ', name = ?';
      params.push(name);
    }

    if (description !== undefined) {
      query += ', description = ?';
      params.push(description);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await db.executeQuery(query, params);
    return await Role.findById(id);
  }

  static async delete(id) {
    // Check if role has users assigned
    const userCountQuery = 'SELECT COUNT(*) as count FROM user_roles WHERE role_id = ?';
    const userCount = await db.executeQuery(userCountQuery, [id]);
    
    if (userCount[0].count > 0) {
      throw new Error('Cannot delete role with assigned users');
    }

    const query = 'DELETE FROM roles WHERE id = ?';
    const result = await db.executeQuery(query, [id]);
    return result.affectedRows > 0;
  }

  static async assignPage(roleId, pageId, assignedBy = null) {
    const query = `
      INSERT INTO role_pages (role_id, page_id, assigned_by)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE assigned_at = CURRENT_TIMESTAMP, assigned_by = VALUES(assigned_by)
    `;
    
    await db.executeQuery(query, [roleId, pageId, assignedBy]);
  }

  static async removePage(roleId, pageId) {
    const query = 'DELETE FROM role_pages WHERE role_id = ? AND page_id = ?';
    const result = await db.executeQuery(query, [roleId, pageId]);
    return result.affectedRows > 0;
  }

  static async assignPages(roleId, pageIds, assignedBy = null) {
    // Remove existing page assignments
    await db.executeQuery('DELETE FROM role_pages WHERE role_id = ?', [roleId]);
    
    // Assign new pages
    if (pageIds && pageIds.length > 0) {
      const values = pageIds.map(() => '(?, ?, ?)').join(', ');
      const params = [];
      
      pageIds.forEach(pageId => {
        params.push(roleId, pageId, assignedBy);
      });

      const query = `INSERT INTO role_pages (role_id, page_id, assigned_by) VALUES ${values}`;
      await db.executeQuery(query, params);
    }
  }

  // New methods for role-based page hierarchy
  static async assignPagesWithOrder(roleId, pagesWithOrder, assignedBy = null) {
    // pagesWithOrder is an array of { page_id, parent_page_id, display_order }
    
    // Remove existing page assignments from both tables
    await db.executeQuery('DELETE FROM role_pages WHERE role_id = ?', [roleId]);
    await db.executeQuery('DELETE FROM role_pages_order WHERE role_id = ?', [roleId]);
    
    if (pagesWithOrder && pagesWithOrder.length > 0) {
      // Insert into role_pages for backward compatibility
      const rolePageValues = pagesWithOrder.map(() => '(?, ?, ?)').join(', ');
      const rolePageParams = [];
      
      pagesWithOrder.forEach(item => {
        rolePageParams.push(roleId, item.page_id, assignedBy);
      });

      const rolePageQuery = `INSERT INTO role_pages (role_id, page_id, assigned_by) VALUES ${rolePageValues}`;
      await db.executeQuery(rolePageQuery, rolePageParams);
      
      // Insert into role_pages_order for hierarchy
      const orderValues = pagesWithOrder.map(() => '(?, ?, ?, ?)').join(', ');
      const orderParams = [];
      
      pagesWithOrder.forEach(item => {
        orderParams.push(
          roleId, 
          item.page_id, 
          item.parent_page_id || null, 
          item.display_order || 0
        );
      });

      const orderQuery = `
        INSERT INTO role_pages_order (role_id, page_id, parent_page_id, display_order) 
        VALUES ${orderValues}
      `;
      await db.executeQuery(orderQuery, orderParams);
    }
  }

  static async getRolePageHierarchy(roleId) {
    const query = `
      SELECT 
        rpo.id as order_id,
        rpo.page_id,
        rpo.parent_page_id,
        rpo.display_order,
        p.name,
        p.url,
        p.icon,
        p.is_external,
        p.status
      FROM role_pages_order rpo
      JOIN pages p ON rpo.page_id = p.id
      WHERE rpo.role_id = ? AND p.status = 'active'
      ORDER BY rpo.display_order ASC, p.name ASC
    `;
    
    const pages = await db.executeQuery(query, [roleId]);
    
    // Build hierarchy tree
    const pageMap = {};
    const rootPages = [];
    
    // First pass: create map of all pages
    pages.forEach(page => {
      pageMap[page.page_id] = { ...page, children: [] };
    });
    
    // Second pass: build tree structure
    pages.forEach(page => {
      if (page.parent_page_id === null) {
        rootPages.push(pageMap[page.page_id]);
      } else if (pageMap[page.parent_page_id]) {
        pageMap[page.parent_page_id].children.push(pageMap[page.page_id]);
      }
    });
    
    return rootPages;
  }

  static async updateRolePageOrder(roleId, pageId, parentPageId, displayOrder) {
    const query = `
      UPDATE role_pages_order 
      SET parent_page_id = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP
      WHERE role_id = ? AND page_id = ?
    `;
    
    await db.executeQuery(query, [parentPageId, displayOrder, roleId, pageId]);
  }

  static async getRolePageOrder(roleId) {
    const query = `
      SELECT 
        rpo.page_id,
        rpo.parent_page_id,
        rpo.display_order,
        p.name,
        p.url,
        p.icon
      FROM role_pages_order rpo
      JOIN pages p ON rpo.page_id = p.id
      WHERE rpo.role_id = ?
      ORDER BY rpo.display_order ASC
    `;
    
    return await db.executeQuery(query, [roleId]);
  }

  static async getRolePages(roleId) {
    const query = `
      SELECT p.*
      FROM pages p
      JOIN role_pages rp ON p.id = rp.page_id
      WHERE rp.role_id = ? AND p.status = 'active'
      ORDER BY p.name
    `;
    
    return await db.executeQuery(query, [roleId]);
  }

  static async getUsersByRole(roleId) {
    const query = `
      SELECT u.id, u.username, u.email, u.status, ur.assigned_at
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.role_id = ?
      ORDER BY ur.assigned_at DESC
    `;
    
    return await db.executeQuery(query, [roleId]);
  }

  static async getStats() {
    const queries = [
      'SELECT COUNT(*) as total FROM roles',
      `SELECT COUNT(*) as with_users FROM roles r 
       WHERE EXISTS (SELECT 1 FROM user_roles ur WHERE ur.role_id = r.id)`,
      `SELECT COUNT(*) as with_pages FROM roles r 
       WHERE EXISTS (SELECT 1 FROM role_pages rp WHERE rp.role_id = r.id)`
    ];

    const results = await Promise.all(queries.map(query => db.executeQuery(query)));
    
    return {
      total: results[0][0].total,
      with_users: results[1][0].with_users,
      with_pages: results[2][0].with_pages
    };
  }

  static async getAllSimple() {
    const query = 'SELECT id, name, description FROM roles ORDER BY name';
    return await db.executeQuery(query);
  }
}

module.exports = Role;