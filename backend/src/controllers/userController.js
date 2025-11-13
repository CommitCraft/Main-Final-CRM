const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/user');
const Role = require('../models/role');
const { UserRole } = require('../models/userRole');
const ActivityLog = require('../models/activityLog');
const { handleValidationError, AppError } = require('../middleware/errorHandler');

class UserController {
  // Get all users
  static async getUsers(req, res) {
    try {
      const { page = 1, limit = 1000, search = '', status = '' } = req.query;

      const result = await User.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status
      });

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve users',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get user by ID
  static async getUserById(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Remove password from response
      const { password_hash, ...userResponse } = user;

      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: {
          user: userResponse
        }
      });
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Create new user
  static async createUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(handleValidationError(errors));
      }

      const { username, email, password, roles = [], status = 'active' } = req.body;
      const createdBy = req.user.id;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, 12);

      // Create user
      const userData = {
        username,
        email,
        password_hash,
        status,
        created_by: createdBy
      };

      const newUser = await User.create(userData);

      // Assign roles if provided
      if (roles && roles.length > 0) {
        for (const roleId of roles) {
          // Verify role exists
          const role = await Role.findById(roleId);
          if (role) {
            await User.assignRole(newUser.id, roleId, createdBy);
          }
        }
      }

      // Get created user with roles
      const createdUser = await User.findById(newUser.id);
      const { password_hash: _, ...userResponse } = createdUser;

      // Log activity
      await ActivityLog.logUserAction(
        req.user.id,
        req.user.username,
        ActivityLog.ACTIONS.CREATE,
        ActivityLog.RESOURCES.USER,
        newUser.id,
        { username, email, roles, status },
        req
      );

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          user: userResponse
        }
      });
    } catch (error) {
      console.error('Create user error:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Username or email already exists'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create user',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Update user
  static async updateUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(handleValidationError(errors));
      }

      const { id } = req.params;
      const { username, email, password, roles, status } = req.body;
      const updatedBy = req.user.id;

      // Check if user exists
      const existingUser = await User.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const updateData = {};
      
      // Update basic fields
      if (username !== undefined) updateData.username = username;
      if (email !== undefined) updateData.email = email;
      if (status !== undefined) updateData.status = status;

      // Update password if provided
      if (password) {
        updateData.password_hash = await bcrypt.hash(password, 12);
      }

      // Update user basic info
      let updatedUser = existingUser;
      if (Object.keys(updateData).length > 0) {
        updatedUser = await User.update(id, updateData);
      }

      // Update roles if provided
      if (roles !== undefined) {
        // Remove existing roles
        await UserRole.deleteAllByUser(id);
        
        // Assign new roles
        if (roles.length > 0) {
          for (const roleId of roles) {
            // Verify role exists
            const role = await Role.findById(roleId);
            if (role) {
              await User.assignRole(id, roleId, updatedBy);
            }
          }
        }
      }

      // Get updated user with roles
      const finalUser = await User.findById(id);
      const { password_hash: _, ...userResponse } = finalUser;

      // Log activity
      await ActivityLog.logUserAction(
        req.user.id,
        req.user.username,
        ActivityLog.ACTIONS.UPDATE,
        ActivityLog.RESOURCES.USER,
        parseInt(id),
        { username, email, roles, status },
        req
      );

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: {
          user: userResponse
        }
      });
    } catch (error) {
      console.error('Update user error:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Username or email already exists'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update user',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Delete user
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // Check if user exists
      const existingUser = await User.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Prevent self-deletion
      if (parseInt(id) === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'You cannot delete your own account'
        });
      }

      // Delete user (this will cascade delete user roles)
      const deleted = await User.delete(id);
      
      if (!deleted) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete user'
        });
      }

      // Log activity
      await ActivityLog.logUserAction(
        req.user.id,
        req.user.username,
        ActivityLog.ACTIONS.DELETE,
        ActivityLog.RESOURCES.USER,
        parseInt(id),
        { username: existingUser.username, email: existingUser.email },
        req
      );

      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Assign role to user
  static async assignRole(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(handleValidationError(errors));
      }

      const { userId, roleId } = req.body;
      const assignedBy = req.user.id;

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if role exists
      const role = await Role.findById(roleId);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      // Assign role
      await User.assignRole(userId, roleId, assignedBy);

      // Log activity
      await ActivityLog.logUserAction(
        req.user.id,
        req.user.username,
        ActivityLog.ACTIONS.ROLE_ASSIGN,
        ActivityLog.RESOURCES.USER,
        userId,
        { role_name: role.name, role_id: roleId },
        req
      );

      res.status(200).json({
        success: true,
        message: `Role "${role.name}" assigned successfully`
      });
    } catch (error) {
      console.error('Assign role error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign role',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Remove role from user
  static async removeRole(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(handleValidationError(errors));
      }

      const { userId, roleId } = req.body;

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if role exists
      const role = await Role.findById(roleId);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      // Remove role
      const removed = await User.removeRole(userId, roleId);
      
      if (!removed) {
        return res.status(404).json({
          success: false,
          message: 'Role assignment not found'
        });
      }

      // Log activity
      await ActivityLog.logUserAction(
        req.user.id,
        req.user.username,
        ActivityLog.ACTIONS.ROLE_REMOVE,
        ActivityLog.RESOURCES.USER,
        userId,
        { role_name: role.name, role_id: roleId },
        req
      );

      res.status(200).json({
        success: true,
        message: `Role "${role.name}" removed successfully`
      });
    } catch (error) {
      console.error('Remove role error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove role',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get user roles
  static async getUserRoles(req, res) {
    try {
      const { id } = req.params;

      // Check if user exists
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const roles = await User.getUserRoles(id);

      res.status(200).json({
        success: true,
        message: 'User roles retrieved successfully',
        data: {
          user_id: parseInt(id),
          username: user.username,
          roles
        }
      });
    } catch (error) {
      console.error('Get user roles error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user roles',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get user's assigned pages
  static async getUserPages(req, res) {
    try {
      const { id } = req.params;
      const { hierarchy = 'false' } = req.query;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const db = require('../config/db');

      // Get user's pages with role-based hierarchy support
      if (hierarchy === 'true') {
        // Get all pages with their role-specific ordering
        const query = `
          SELECT DISTINCT 
            p.id as page_id,
            p.name,
            p.url,
            p.icon,
            p.is_external,
            p.status,
            rpo.parent_page_id,
            rpo.display_order
          FROM pages p
          JOIN role_pages_order rpo ON p.id = rpo.page_id
          JOIN user_roles ur ON rpo.role_id = ur.role_id
          WHERE ur.user_id = ? AND p.status = 'active'
          ORDER BY rpo.display_order ASC, p.name ASC
        `;
        
        const pages = await db.executeQuery(query, [id]);

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

        res.status(200).json({
          success: true,
          message: 'User pages retrieved successfully',
          data: { pages: rootPages }
        });
      } else {
        // Get flat list of pages
        const query = `
          SELECT DISTINCT p.id, p.name, p.url, p.icon, p.is_external, p.status
          FROM pages p
          JOIN role_pages rp ON p.id = rp.page_id
          JOIN user_roles ur ON rp.role_id = ur.role_id
          WHERE ur.user_id = ? AND p.status = 'active'
          ORDER BY p.name
        `;
        
        const pages = await db.executeQuery(query, [id]);

        res.status(200).json({
          success: true,
          message: 'User pages retrieved successfully',
          data: { pages }
        });
      }
    } catch (error) {
      console.error('Get user pages error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user pages',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get user statistics
  static async getUserStats(req, res) {
    try {
      const stats = await User.getStats();

      res.status(200).json({
        success: true,
        message: 'User statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = UserController;