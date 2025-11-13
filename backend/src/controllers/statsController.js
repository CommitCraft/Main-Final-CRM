const db = require('../config/db');
const User = require('../models/user');
const Role = require('../models/role');
const Page = require('../models/page');
const ActivityLog = require('../models/activityLog');
const LoginActivity = require('../models/loginActivity');

class StatsController {
  static async getDashboardStats(req, res) {
    try {
      // Get basic counts
      const [userStats, roleStats, pageStats] = await Promise.all([
        User.getStats(),
        Role.getStats(),
        Page.getStats()
      ]);

      // Get API latency
      const latencyQuery = `
        SELECT AVG(response_time_ms) as avg_latency
        FROM api_stats 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      `;
      const latencyResult = await db.executeQuery(latencyQuery);
      const avgLatency = latencyResult[0]?.avg_latency || 0;

      // Get recent activity
      const recentActivity = await ActivityLog.getRecentActivity(10);

      // Get login stats for today
      const todayLoginQuery = `
        SELECT COUNT(*) as today_logins
        FROM login_activities 
        WHERE DATE(login_time) = CURDATE() AND success = TRUE
      `;
      const todayLoginResult = await db.executeQuery(todayLoginQuery);
      const todayLogins = todayLoginResult[0]?.today_logins || 0;

      const stats = {
        overview: {
          total_users: userStats.total,
          active_users: userStats.active,
          total_roles: roleStats.total,
          total_pages: pageStats.total,
          avg_api_latency_ms: Math.round(avgLatency),
          today_logins: todayLogins
        },
        users: userStats,
        roles: roleStats,
        pages: pageStats,
        recent_activity: recentActivity
      };

      res.status(200).json({
        success: true,
        message: 'Dashboard statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve dashboard statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getActivityStats(req, res) {
    try {
      const { days = 7 } = req.query;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const stats = await ActivityLog.getActivityStats({
        start_date: startDate.toISOString().split('T')[0]
      });

      res.status(200).json({
        success: true,
        message: 'Activity statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      console.error('Get activity stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve activity statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getLoginStats(req, res) {
    try {
      const { days = 7 } = req.query;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const stats = await LoginActivity.getLoginStats({
        start_date: startDate.toISOString().split('T')[0]
      });

      res.status(200).json({
        success: true,
        message: 'Login statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      console.error('Get login stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve login statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getApiStats(req, res) {
    try {
      const { hours = 24 } = req.query;
      
      const queries = [
        // Total API calls in time period
        `SELECT COUNT(*) as total_calls 
         FROM api_stats 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)`,
        
        // Average response time
        `SELECT AVG(response_time_ms) as avg_response_time 
         FROM api_stats 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)`,
        
        // Response time by endpoint
        `SELECT endpoint, AVG(response_time_ms) as avg_time, COUNT(*) as call_count
         FROM api_stats 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
         GROUP BY endpoint 
         ORDER BY avg_time DESC 
         LIMIT 10`,
        
        // Status code distribution
        `SELECT status_code, COUNT(*) as count
         FROM api_stats 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
         GROUP BY status_code 
         ORDER BY count DESC`,
        
        // Hourly API usage
        `SELECT HOUR(created_at) as hour, COUNT(*) as calls, AVG(response_time_ms) as avg_time
         FROM api_stats 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
         GROUP BY HOUR(created_at) 
         ORDER BY hour`
      ];

      const [totalCalls, avgTime, endpointStats, statusStats, hourlyStats] = await Promise.all(
        queries.map(query => db.executeQuery(query, [parseInt(hours)]))
      );

      const stats = {
        summary: {
          total_calls: totalCalls[0]?.total_calls || 0,
          avg_response_time: Math.round(avgTime[0]?.avg_response_time || 0),
          time_period_hours: parseInt(hours)
        },
        endpoints: endpointStats,
        status_codes: statusStats,
        hourly_usage: hourlyStats
      };

      res.status(200).json({
        success: true,
        message: 'API statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      console.error('Get API stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve API statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getSystemHealth(req, res) {
    try {
      // Database connection test
      let dbStatus = 'healthy';
      let dbResponseTime = 0;
      
      try {
        const start = Date.now();
        await db.execute('SELECT 1');
        dbResponseTime = Date.now() - start;
      } catch (error) {
        dbStatus = 'unhealthy';
        console.error('Database health check failed:', error);
      }

      // Memory usage
      const memoryUsage = process.memoryUsage();
      
      // System uptime
      const uptime = process.uptime();

      // Get recent error count
      const errorQuery = `
        SELECT COUNT(*) as error_count
        FROM activity_logs 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
        AND JSON_EXTRACT(details, '$.status_code') >= 400
      `;
      
      const errorResult = await db.executeQuery(errorQuery);
      const recentErrors = errorResult[0]?.error_count || 0;

      const health = {
        status: dbStatus === 'healthy' && recentErrors < 100 ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        database: {
          status: dbStatus,
          response_time_ms: dbResponseTime
        },
        system: {
          uptime_seconds: Math.floor(uptime),
          memory_usage: {
            rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
            heap_used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
            heap_total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          },
          node_version: process.version,
          environment: process.env.NODE_ENV
        },
        metrics: {
          recent_errors_1h: recentErrors
        }
      };

      res.status(200).json({
        success: true,
        message: 'System health retrieved successfully',
        data: health
      });
    } catch (error) {
      console.error('Get system health error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve system health',
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error.message
        }
      });
    }
  }

  static async getRecentActivity(req, res) {
    try {
      // Handle both direct params and nested params structure (for backward compatibility)
      let limit = 10;
      let page = 1;
      let user_id = null;
      let action = null;

      // Check if params are nested under 'params' key (from older axios calls)
      if (req.query.params) {
        limit = req.query.params.limit || 10;
        page = req.query.params.page || 1;
        user_id = req.query.params.user_id || null;
        action = req.query.params.action || null;
      } else {
        // Direct params (correct format)
        limit = req.query.limit || 10;
        page = req.query.page || 1;
        user_id = req.query.user_id || null;
        action = req.query.action || null;
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit)
      };

      if (user_id) options.user_id = parseInt(user_id);
      if (action) options.action = action;

      const result = await ActivityLog.findAll(options);

      res.status(200).json({
        success: true,
        message: 'Recent activity retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Get recent activity error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve recent activity',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getActiveUsers(req, res) {
    try {
      const { minutes = 30 } = req.query;
      const activeUsers = await LoginActivity.getActiveUsers(parseInt(minutes));

      res.status(200).json({
        success: true,
        message: 'Active users retrieved successfully',
        data: {
          active_users: activeUsers,
          time_window_minutes: parseInt(minutes),
          count: activeUsers.length
        }
      });
    } catch (error) {
      console.error('Get active users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve active users',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = StatsController;