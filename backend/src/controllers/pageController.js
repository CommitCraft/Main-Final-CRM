const { validationResult } = require('express-validator');
const Page = require('../models/page');
const ActivityLog = require('../models/activityLog');
const { handleValidationError } = require('../middleware/errorHandler');
const path = require('path');

class PageController {
  static async getPages(req, res) {
    try {
      const { page = 1, limit = 1000, search = '', status = '' } = req.query;

      const result = await Page.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status
      });

      res.status(200).json({
        success: true,
        message: 'Pages retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Get pages error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve pages',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getPageById(req, res) {
    try {
      const { id } = req.params;
      const page = await Page.findById(id);
      
      if (!page) {
        return res.status(404).json({
          success: false,
          message: 'Page not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Page retrieved successfully',
        data: { page }
      });
    } catch (error) {
      console.error('Get page by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve page',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async createPage(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(handleValidationError(errors));
      }

      const { name, url, is_external = false, status = 'active' } = req.body;
      const createdBy = req.user.id;
      
      let iconPath = null;

      // Handle file upload if present
      if (req.files && req.files.icon) {
        const iconFile = req.files.icon;
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml'];
        
        if (!allowedTypes.includes(iconFile.mimetype)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid file type. Only PNG, JPG, JPEG, GIF, and SVG files are allowed.'
          });
        }

        const fileName = `page_${Date.now()}_${iconFile.name}`;
        const uploadPath = path.join(__dirname, '../../uploads/icons/', fileName);
        
        // Create uploads directory if it doesn't exist
        const fs = require('fs');
        const uploadsDir = path.dirname(uploadPath);
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        await iconFile.mv(uploadPath);
        iconPath = `/uploads/icons/${fileName}`;
      }

      const pageData = {
        name,
        url,
        icon: iconPath,
        is_external,
        status,
        created_by: createdBy
      };

      const newPage = await Page.create(pageData);
      const createdPage = await Page.findById(newPage.id);

      await ActivityLog.logUserAction(
        req.user.id, req.user.username, ActivityLog.ACTIONS.CREATE,
        ActivityLog.RESOURCES.PAGE, newPage.id, { name, url, is_external }, req
      );

      res.status(201).json({
        success: true,
        message: 'Page created successfully',
        data: { page: createdPage }
      });
    } catch (error) {
      console.error('Create page error:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Page URL already exists'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create page',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async updatePage(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(handleValidationError(errors));
      }

      const { id } = req.params;
      const { name, url, is_external, status } = req.body;

      // Debug logging
      console.log('📝 Update page request:', { id, name, url, is_external, status });

      const existingPage = await Page.findById(id);
      if (!existingPage) {
        return res.status(404).json({
          success: false,
          message: 'Page not found'
        });
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (url !== undefined) updateData.url = url;
      if (is_external !== undefined) updateData.is_external = is_external;
      if (status !== undefined) updateData.status = status;

      console.log('💾 Update data to be saved:', updateData);

      // Handle icon upload if present
      if (req.files && req.files.icon) {
        const iconFile = req.files.icon;
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml'];
        
        if (!allowedTypes.includes(iconFile.mimetype)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid file type. Only PNG, JPG, JPEG, GIF, and SVG files are allowed.'
          });
        }

        const fileName = `page_${Date.now()}_${iconFile.name}`;
        const uploadPath = path.join(__dirname, '../../uploads/icons/', fileName);
        
        const fs = require('fs');
        const uploadsDir = path.dirname(uploadPath);
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        await iconFile.mv(uploadPath);
        updateData.icon = `/uploads/icons/${fileName}`;

        // Delete old icon file if exists
        if (existingPage.icon) {
          const oldIconPath = path.join(__dirname, '../..', existingPage.icon);
          if (fs.existsSync(oldIconPath)) {
            fs.unlinkSync(oldIconPath);
          }
        }
      }

      const updatedPage = await Page.update(id, updateData);

      console.log('✅ Updated page returned:', updatedPage);

      await ActivityLog.logUserAction(
        req.user.id, req.user.username, ActivityLog.ACTIONS.UPDATE,
        ActivityLog.RESOURCES.PAGE, parseInt(id), updateData, req
      );

      res.status(200).json({
        success: true,
        message: 'Page updated successfully',
        data: { page: updatedPage }
      });
    } catch (error) {
      console.error('Update page error:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Page URL already exists'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update page',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async deletePage(req, res) {
    try {
      const { id } = req.params;

      const existingPage = await Page.findById(id);
      if (!existingPage) {
        return res.status(404).json({
          success: false,
          message: 'Page not found'
        });
      }

      const deleted = await Page.delete(id);
      
      if (!deleted) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete page'
        });
      }

      // Delete icon file if exists
      if (existingPage.icon) {
        const fs = require('fs');
        const iconPath = path.join(__dirname, '../..', existingPage.icon);
        if (fs.existsSync(iconPath)) {
          fs.unlinkSync(iconPath);
        }
      }

      await ActivityLog.logUserAction(
        req.user.id, req.user.username, ActivityLog.ACTIONS.DELETE,
        ActivityLog.RESOURCES.PAGE, parseInt(id), { name: existingPage.name, url: existingPage.url }, req
      );

      res.status(200).json({
        success: true,
        message: 'Page deleted successfully'
      });
    } catch (error) {
      console.error('Delete page error:', error);
      
      if (error.message.includes('assigned roles')) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete page with assigned roles'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete page',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getPagesByUser(req, res) {
    try {
      const userId = req.user.id;
      const pages = await Page.getPagesByUser(userId);

      res.status(200).json({
        success: true,
        message: 'User pages retrieved successfully',
        data: { pages }
      });
    } catch (error) {
      console.error('Get user pages error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user pages',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async checkPageAccess(req, res) {
    try {
      const { pageUrl } = req.params;
      const userId = req.user.id;

      const hasAccess = await Page.checkPageAccess(userId, pageUrl);

      res.status(200).json({
        success: true,
        message: 'Page access checked successfully',
        data: {
          user_id: userId,
          page_url: pageUrl,
          has_access: hasAccess
        }
      });
    } catch (error) {
      console.error('Check page access error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check page access',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getStats(req, res) {
    try {
      const stats = await Page.getStats();
      res.status(200).json({
        success: true,
        message: 'Page statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      console.error('Get page stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve page statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getAllSimple(req, res) {
    try {
      const { active_only = 'true' } = req.query;
      const activeOnly = active_only === 'true';
      
      const pages = await Page.getAllSimple(activeOnly);
      res.status(200).json({
        success: true,
        message: 'Pages retrieved successfully',
        data: { pages }
      });
    } catch (error) {
      console.error('Get simple pages error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve pages',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getUserPagesWithHierarchy(req, res) {
    try {
      const userId = req.user.id;
      
      // Get user's pages with role-based hierarchy
      const db = require('../config/db');
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
      
      const pages = await db.executeQuery(query, [userId]);

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
    } catch (error) {
      console.error('Get user pages error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user pages',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = PageController;