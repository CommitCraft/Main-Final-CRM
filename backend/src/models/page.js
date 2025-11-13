const db = require('../config/db');

class Page {
  static async create(pageData) {
    const { name, url, icon = null, is_external = false, status = 'active', created_by = null } = pageData;
    
    const query = `
      INSERT INTO pages (name, url, icon, is_external, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const result = await db.executeQuery(query, [name, url, icon, is_external, status, created_by]);
    return { id: result.insertId, ...pageData };
  }

  static async findById(id) {
    const query = `
      SELECT p.*, 
             COUNT(rp.role_id) as role_count,
             GROUP_CONCAT(r.name) as roles
      FROM pages p
      LEFT JOIN role_pages rp ON p.id = rp.page_id
      LEFT JOIN roles r ON rp.role_id = r.id
      WHERE p.id = ?
      GROUP BY p.id
    `;
    
    const pages = await db.executeQuery(query, [id]);
    if (pages.length === 0) return null;
    
    const page = pages[0];
    page.roles = page.roles ? page.roles.split(',') : [];
    return page;
  }

  static async findByUrl(url) {
    const query = `
      SELECT p.*, 
             COUNT(rp.role_id) as role_count,
             GROUP_CONCAT(r.name) as roles
      FROM pages p
      LEFT JOIN role_pages rp ON p.id = rp.page_id
      LEFT JOIN roles r ON rp.role_id = r.id
      WHERE p.url = ?
      GROUP BY p.id
    `;
    
    const pages = await db.executeQuery(query, [url]);
    if (pages.length === 0) return null;
    
    const page = pages[0];
    page.roles = page.roles ? page.roles.split(',') : [];
    return page;
  }

  static async findAll(options = {}) {
    const { page = 1, limit = 10, search = '', status = '' } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search && search.trim()) {
      whereClause += ' AND (p.name LIKE ? OR p.url LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (status && status.trim()) {
      whereClause += ' AND p.status = ?';
      params.push(status.trim());
    }

    const query = `
      SELECT p.*,
             COUNT(DISTINCT rp.role_id) as role_count,
             GROUP_CONCAT(DISTINCT r.name ORDER BY r.name) as assigned_roles
      FROM pages p
      LEFT JOIN role_pages rp ON p.id = rp.page_id
      LEFT JOIN roles r ON rp.role_id = r.id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    // Ensure all parameters are proper types
    const finalParams = [...params, parseInt(limit), parseInt(offset)];
    const pages = await db.executeQuery(query, finalParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM pages p
      LEFT JOIN role_pages rp ON p.id = rp.page_id
      LEFT JOIN roles r ON rp.role_id = r.id
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
      pages: pages.map(page => ({
        ...page,
        assigned_roles: page.assigned_roles ? page.assigned_roles.split(',') : []
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async update(id, pageData) {
    const { name, url, icon, is_external, status } = pageData;
    
    let query = 'UPDATE pages SET updated_at = CURRENT_TIMESTAMP';
    const params = [];

    if (name !== undefined) {
      query += ', name = ?';
      params.push(name);
    }

    if (url !== undefined) {
      query += ', url = ?';
      params.push(url);
    }

    if (icon !== undefined) {
      query += ', icon = ?';
      params.push(icon);
    }

    if (is_external !== undefined) {
      query += ', is_external = ?';
      params.push(is_external);
    }

    if (status !== undefined) {
      query += ', status = ?';
      params.push(status);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await db.executeQuery(query, params);
    return await Page.findById(id);
  }

  static async delete(id) {
    // Check if page has roles assigned
    const roleCountQuery = 'SELECT COUNT(*) as count FROM role_pages WHERE page_id = ?';
    const roleCount = await db.executeQuery(roleCountQuery, [id]);
    
    if (roleCount[0].count > 0) {
      throw new Error('Cannot delete page with assigned roles');
    }

    const query = 'DELETE FROM pages WHERE id = ?';
    const result = await db.executeQuery(query, [id]);
    return result.affectedRows > 0;
  }

  static async getPagesByRole(roleId) {
    const query = `
      SELECT p.*
      FROM pages p
      JOIN role_pages rp ON p.id = rp.page_id
      WHERE rp.role_id = ? AND p.status = 'active'
      ORDER BY p.name
    `;
    
    return await db.executeQuery(query, [roleId]);
  }

  static async getPagesByUser(userId) {
    const query = `
      SELECT DISTINCT p.*
      FROM pages p
      JOIN role_pages rp ON p.id = rp.page_id
      JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = ? AND p.status = 'active'
      ORDER BY p.name
    `;
    
    return await db.executeQuery(query, [userId]);
  }

  static async getRolesByPage(pageId) {
    const query = `
      SELECT r.id, r.name, r.description, rp.assigned_at
      FROM roles r
      JOIN role_pages rp ON r.id = rp.role_id
      WHERE rp.page_id = ?
      ORDER BY rp.assigned_at DESC
    `;
    
    return await db.executeQuery(query, [pageId]);
  }

  static async getStats() {
    const queries = [
      'SELECT COUNT(*) as total FROM pages',
      'SELECT COUNT(*) as active FROM pages WHERE status = "active"',
      'SELECT COUNT(*) as inactive FROM pages WHERE status = "inactive"',
      'SELECT COUNT(*) as internal_pages FROM pages WHERE is_external = FALSE',
      'SELECT COUNT(*) as external_pages FROM pages WHERE is_external = TRUE'
    ];

    const results = await Promise.all(queries.map(query => db.executeQuery(query)));
    
    return {
      total: results[0][0].total,
      active: results[1][0].active,
      inactive: results[2][0].inactive,
      internal: results[3][0].internal_pages,
      external: results[4][0].external_pages
    };
  }

  static async getAllSimple(activeOnly = true) {
    let query = 'SELECT id, name, url, is_external FROM pages';
    if (activeOnly) {
      query += ' WHERE status = "active"';
    }
    query += ' ORDER BY name';
    
    return await db.executeQuery(query);
  }

  static async checkPageAccess(userId, pageUrl) {
    const query = `
      SELECT COUNT(*) as access_count
      FROM pages p
      JOIN role_pages rp ON p.id = rp.page_id
      JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = ? AND p.url = ? AND p.status = 'active'
    `;
    
    const result = await db.executeQuery(query, [userId, pageUrl]);
    return result[0].access_count > 0;
  }
}

module.exports = Page;