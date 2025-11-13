const { validationResult } = require('express-validator');
const Role = require('../models/role');
const Page = require('../models/page');
const { RolePage } = require('../models/userRole');
const ActivityLog = require('../models/activityLog');
const { handleValidationError } = require('../middleware/errorHandler');

class RoleController {
  static async getRoles(req, res) {
    try {
      console.log('📥 GET /roles request - Query params:', req.query);
      
      const { page = 1, limit = 1000, search = '' } = req.query;

      const result = await Role.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search
      });

      console.log('📊 Roles query result:', result.roles?.length, 'roles found');

      res.status(200).json({
        success: true,
        message: 'Roles retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Get roles error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve roles',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getRoleById(req, res) {
    try {
      const { id } = req.params;
      const role = await Role.findById(id);
      
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Role retrieved successfully',
        data: { role }
      });
    } catch (error) {
      console.error('Get role by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve role',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async createRole(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(handleValidationError(errors));
      }

      const { name, description, pages = [], pagesWithOrder = [] } = req.body;
      const createdBy = req.user.id;

      const roleData = { name, description, created_by: createdBy };
      const newRole = await Role.create(roleData);

      // Assign pages with order if provided, otherwise use simple assignment
      if (pagesWithOrder.length > 0) {
        await Role.assignPagesWithOrder(newRole.id, pagesWithOrder, createdBy);
      } else if (pages.length > 0) {
        await Role.assignPages(newRole.id, pages, createdBy);
      }

      const createdRole = await Role.findById(newRole.id);

      await ActivityLog.logUserAction(
        req.user.id, req.user.username, ActivityLog.ACTIONS.CREATE,
        ActivityLog.RESOURCES.ROLE, newRole.id, { name, pages: pagesWithOrder.length > 0 ? pagesWithOrder : pages }, req
      );

      res.status(201).json({
        success: true,
        message: 'Role created successfully',
        data: { role: createdRole }
      });
    } catch (error) {
      console.error('Create role error:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Role name already exists'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create role',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async updateRole(req, res) {
    try {
      console.log('🔄 Updating role with ID:', req.params.id, 'Data:', req.body);
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(handleValidationError(errors));
      }

      const { id } = req.params;
      const { name, description, pages, pagesWithOrder } = req.body;
      const updatedBy = req.user.id;

      const existingRole = await Role.findById(id);
      console.log('📋 Existing role:', existingRole);
      if (!existingRole) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;

      let updatedRole = existingRole;
      if (Object.keys(updateData).length > 0) {
        updatedRole = await Role.update(id, updateData);
      }

      // Assign pages with order if provided, otherwise use simple assignment
      if (pagesWithOrder !== undefined) {
        await Role.assignPagesWithOrder(id, pagesWithOrder, updatedBy);
      } else if (pages !== undefined) {
        await Role.assignPages(id, pages, updatedBy);
      }

      const finalRole = await Role.findById(id);
      console.log('✅ Final updated role:', finalRole);

      await ActivityLog.logUserAction(
        req.user.id, req.user.username, ActivityLog.ACTIONS.UPDATE,
        ActivityLog.RESOURCES.ROLE, parseInt(id), { name, pages: pagesWithOrder || pages }, req
      );

      res.status(200).json({
        success: true,
        message: 'Role updated successfully',
        data: { role: finalRole }
      });
      
      console.log('📤 Response sent for role update');
    } catch (error) {
      console.error('Update role error:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Role name already exists'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update role',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async deleteRole(req, res) {
    try {
      const { id } = req.params;

      const existingRole = await Role.findById(id);
      if (!existingRole) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      const deleted = await Role.delete(id);
      
      if (!deleted) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete role'
        });
      }

      await ActivityLog.logUserAction(
        req.user.id, req.user.username, ActivityLog.ACTIONS.DELETE,
        ActivityLog.RESOURCES.ROLE, parseInt(id), { name: existingRole.name }, req
      );

      res.status(200).json({
        success: true,
        message: 'Role deleted successfully'
      });
    } catch (error) {
      console.error('Delete role error:', error);
      
      if (error.message.includes('users assigned')) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete role with assigned users'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete role',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getRolePages(req, res) {
    try {
      const { id } = req.params;
      
      const role = await Role.findById(id);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      const pages = await Role.getRolePages(id);

      res.status(200).json({
        success: true,
        message: 'Role pages retrieved successfully',
        data: {
          role_id: parseInt(id),
          role_name: role.name,
          pages
        }
      });
    } catch (error) {
      console.error('Get role pages error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve role pages',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async assignPages(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(handleValidationError(errors));
      }

      const { roleId, pageIds } = req.body;
      const assignedBy = req.user.id;

      const role = await Role.findById(roleId);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      await Role.assignPages(roleId, pageIds, assignedBy);

      await ActivityLog.logUserAction(
        req.user.id, req.user.username, ActivityLog.ACTIONS.PAGE_ASSIGN,
        ActivityLog.RESOURCES.ROLE, roleId, { pages: pageIds }, req
      );

      res.status(200).json({
        success: true,
        message: 'Pages assigned to role successfully'
      });
    } catch (error) {
      console.error('Assign pages error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign pages',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getStats(req, res) {
    try {
      const stats = await Role.getStats();
      res.status(200).json({
        success: true,
        message: 'Role statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      console.error('Get role stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve role statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getAllSimple(req, res) {
    try {
      const roles = await Role.getAllSimple();
      res.status(200).json({
        success: true,
        message: 'Roles retrieved successfully',
        data: { roles }
      });
    } catch (error) {
      console.error('Get simple roles error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve roles',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getRolePageHierarchy(req, res) {
    try {
      const { id } = req.params;
      
      const role = await Role.findById(id);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      const hierarchy = await Role.getRolePageHierarchy(id);

      res.status(200).json({
        success: true,
        message: 'Role page hierarchy retrieved successfully',
        data: {
          role_id: parseInt(id),
          role_name: role.name,
          pages: hierarchy
        }
      });
    } catch (error) {
      console.error('Get role page hierarchy error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve role page hierarchy',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getRolePageOrder(req, res) {
    try {
      const { id } = req.params;
      
      const role = await Role.findById(id);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      let pages = await Role.getRolePageOrder(id);

      // If no pages in role_pages_order, fallback to role_pages and create default ordering
      if (!pages || pages.length === 0) {
        const rolePages = await Role.getRolePages(id);
        pages = rolePages.map((page, index) => ({
          page_id: page.id,
          parent_page_id: null,
          display_order: index,
          name: page.name,
          url: page.url,
          icon: page.icon
        }));
      }

      res.status(200).json({
        success: true,
        message: 'Role page order retrieved successfully',
        data: {
          role_id: parseInt(id),
          role_name: role.name,
          pages
        }
      });
    } catch (error) {
      console.error('Get role page order error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve role page order',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async updateRolePageOrder(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(handleValidationError(errors));
      }

      const { id } = req.params;
      const { pagesWithOrder } = req.body;
      const updatedBy = req.user.id;

      const role = await Role.findById(id);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      await Role.assignPagesWithOrder(id, pagesWithOrder, updatedBy);

      await ActivityLog.logUserAction(
        req.user.id, req.user.username, ActivityLog.ACTIONS.UPDATE,
        ActivityLog.RESOURCES.ROLE, parseInt(id), { pagesWithOrder }, req
      );

      res.status(200).json({
        success: true,
        message: 'Role page order updated successfully'
      });
    } catch (error) {
      console.error('Update role page order error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update role page order',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = RoleController;