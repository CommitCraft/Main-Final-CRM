const { validationResult } = require('express-validator');
const { handleValidationError } = require('../middleware/errorHandler');
const { exportToCSV, exportToJSON, exportToPDF } = require('../utils/exporters');
const User = require('../models/user');
const Role = require('../models/role');
const Page = require('../models/page');
const ActivityLog = require('../models/activityLog');
const LoginActivity = require('../models/loginActivity');

class ExportController {
  static async exportUsers(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(handleValidationError(errors));
      }

      const { format = 'csv', status = '', search = '' } = req.query;

      // Get all users (without pagination for export)
      const result = await User.findAll({
        page: 1,
        limit: 10000, // Large limit to get all users
        search,
        status
      });

      const users = result.users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        status: user.status,
        roles: user.roles.join(', '),
        created_at: user.created_at,
        last_login: user.last_login
      }));

      const filename = `users_export_${new Date().toISOString().split('T')[0]}`;
      
      let exportResult;
      switch (format.toLowerCase()) {
        case 'json':
          exportResult = await exportToJSON(users, filename);
          break;
        case 'pdf':
          exportResult = await exportToPDF(users, filename, 'Users Report');
          break;
        case 'csv':
        default:
          exportResult = await exportToCSV(users, filename);
          break;
      }

      // Log export activity
      await ActivityLog.logUserAction(
        req.user.id,
        req.user.username,
        ActivityLog.ACTIONS.EXPORT,
        ActivityLog.RESOURCES.USER,
        null,
        { format, count: users.length },
        req
      );

      res.status(200).json({
        success: true,
        message: 'Users exported successfully',
        data: {
          file_path: exportResult.filePath,
          file_size: exportResult.fileSize,
          record_count: users.length,
          format: format,
          filename: exportResult.filename
        }
      });
    } catch (error) {
      console.error('Export users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export users',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async exportRoles(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(handleValidationError(errors));
      }

      const { format = 'csv', search = '' } = req.query;

      const result = await Role.findAll({
        page: 1,
        limit: 10000,
        search
      });

      const roles = result.roles.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        user_count: role.user_count,
        page_count: role.page_count,
        assigned_pages: role.assigned_pages.join(', '),
        created_at: role.created_at
      }));

      const filename = `roles_export_${new Date().toISOString().split('T')[0]}`;
      
      let exportResult;
      switch (format.toLowerCase()) {
        case 'json':
          exportResult = await exportToJSON(roles, filename);
          break;
        case 'pdf':
          exportResult = await exportToPDF(roles, filename, 'Roles Report');
          break;
        case 'csv':
        default:
          exportResult = await exportToCSV(roles, filename);
          break;
      }

      await ActivityLog.logUserAction(
        req.user.id,
        req.user.username,
        ActivityLog.ACTIONS.EXPORT,
        ActivityLog.RESOURCES.ROLE,
        null,
        { format, count: roles.length },
        req
      );

      res.status(200).json({
        success: true,
        message: 'Roles exported successfully',
        data: {
          file_path: exportResult.filePath,
          file_size: exportResult.fileSize,
          record_count: roles.length,
          format: format,
          filename: exportResult.filename
        }
      });
    } catch (error) {
      console.error('Export roles error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export roles',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async exportPages(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(handleValidationError(errors));
      }

      const { format = 'csv', status = '', search = '' } = req.query;

      const result = await Page.findAll({
        page: 1,
        limit: 10000,
        search,
        status
      });

      const pages = result.pages.map(page => ({
        id: page.id,
        name: page.name,
        url: page.url,
        is_external: page.is_external ? 'Yes' : 'No',
        status: page.status,
        role_count: page.role_count,
        assigned_roles: page.assigned_roles.join(', '),
        created_at: page.created_at
      }));

      const filename = `pages_export_${new Date().toISOString().split('T')[0]}`;
      
      let exportResult;
      switch (format.toLowerCase()) {
        case 'json':
          exportResult = await exportToJSON(pages, filename);
          break;
        case 'pdf':
          exportResult = await exportToPDF(pages, filename, 'Pages Report');
          break;
        case 'csv':
        default:
          exportResult = await exportToCSV(pages, filename);
          break;
      }

      await ActivityLog.logUserAction(
        req.user.id,
        req.user.username,
        ActivityLog.ACTIONS.EXPORT,
        ActivityLog.RESOURCES.PAGE,
        null,
        { format, count: pages.length },
        req
      );

      res.status(200).json({
        success: true,
        message: 'Pages exported successfully',
        data: {
          file_path: exportResult.filePath,
          file_size: exportResult.fileSize,
          record_count: pages.length,
          format: format,
          filename: exportResult.filename
        }
      });
    } catch (error) {
      console.error('Export pages error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export pages',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async exportActivityLogs(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(handleValidationError(errors));
      }

      const { format = 'csv', days = 30, action = '', resource = '' } = req.query;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const result = await ActivityLog.findAll({
        page: 1,
        limit: 10000,
        action,
        resource,
        start_date: startDate.toISOString().split('T')[0]
      });

      const activities = result.logs.map(log => ({
        id: log.id,
        username: log.username || 'Unknown',
        action: log.action,
        resource: log.resource || 'N/A',
        resource_id: log.resource_id || 'N/A',
        ip_address: log.ip_address || 'Unknown',
        created_at: log.created_at,
        details: JSON.stringify(log.details || {})
      }));

      const filename = `activity_logs_export_${new Date().toISOString().split('T')[0]}`;
      
      let exportResult;
      switch (format.toLowerCase()) {
        case 'json':
          exportResult = await exportToJSON(activities, filename);
          break;
        case 'pdf':
          exportResult = await exportToPDF(activities, filename, 'Activity Logs Report');
          break;
        case 'csv':
        default:
          exportResult = await exportToCSV(activities, filename);
          break;
      }

      await ActivityLog.logUserAction(
        req.user.id,
        req.user.username,
        ActivityLog.ACTIONS.EXPORT,
        'activity_log',
        null,
        { format, count: activities.length, days },
        req
      );

      res.status(200).json({
        success: true,
        message: 'Activity logs exported successfully',
        data: {
          file_path: exportResult.filePath,
          file_size: exportResult.fileSize,
          record_count: activities.length,
          format: format,
          filename: exportResult.filename,
          date_range_days: parseInt(days)
        }
      });
    } catch (error) {
      console.error('Export activity logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export activity logs',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async exportLoginActivities(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(handleValidationError(errors));
      }

      const { format = 'csv', days = 30, success = '' } = req.query;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const result = await LoginActivity.findAll({
        page: 1,
        limit: 10000,
        success: success === '' ? null : success === 'true',
        start_date: startDate.toISOString().split('T')[0]
      });

      const loginActivities = result.activities.map(activity => ({
        id: activity.id,
        username: activity.username || 'Unknown',
        email: activity.email || 'N/A',
        ip_address: activity.ip_address || 'Unknown',
        success: activity.success ? 'Yes' : 'No',
        login_time: activity.login_time,
        logout_time: activity.logout_time || 'N/A',
        session_duration: activity.session_duration ? `${activity.session_duration}s` : 'N/A'
      }));

      const filename = `login_activities_export_${new Date().toISOString().split('T')[0]}`;
      
      let exportResult;
      switch (format.toLowerCase()) {
        case 'json':
          exportResult = await exportToJSON(loginActivities, filename);
          break;
        case 'pdf':
          exportResult = await exportToPDF(loginActivities, filename, 'Login Activities Report');
          break;
        case 'csv':
        default:
          exportResult = await exportToCSV(loginActivities, filename);
          break;
      }

      await ActivityLog.logUserAction(
        req.user.id,
        req.user.username,
        ActivityLog.ACTIONS.EXPORT,
        'login_activity',
        null,
        { format, count: loginActivities.length, days },
        req
      );

      res.status(200).json({
        success: true,
        message: 'Login activities exported successfully',
        data: {
          file_path: exportResult.filePath,
          file_size: exportResult.fileSize,
          record_count: loginActivities.length,
          format: format,
          filename: exportResult.filename,
          date_range_days: parseInt(days)
        }
      });
    } catch (error) {
      console.error('Export login activities error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export login activities',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async downloadFile(req, res) {
    try {
      const { filename } = req.params;
      const path = require('path');
      const fs = require('fs');
      
      // Sanitize filename to prevent directory traversal
      const sanitizedFilename = path.basename(filename);
      const filePath = path.join(__dirname, '../../exports', sanitizedFilename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      // Set appropriate headers
      const extension = path.extname(sanitizedFilename).toLowerCase();
      let contentType = 'application/octet-stream';
      
      switch (extension) {
        case '.csv':
          contentType = 'text/csv';
          break;
        case '.json':
          contentType = 'application/json';
          break;
        case '.pdf':
          contentType = 'application/pdf';
          break;
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}"`);
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      fileStream.on('end', () => {
        // Optionally delete the file after download
        // fs.unlinkSync(filePath);
      });

    } catch (error) {
      console.error('Download file error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download file',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = ExportController;