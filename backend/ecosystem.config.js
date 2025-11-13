module.exports = {
  apps: [
    {
      name: 'cmscrm-backend',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      // Restart configuration
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Logging configuration
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      
      // Memory and CPU monitoring
      max_memory_restart: '500M',
      
      // Advanced features
      ignore_watch: ['node_modules', 'logs'],
      merge_logs: true,
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true
    }
  ]
};