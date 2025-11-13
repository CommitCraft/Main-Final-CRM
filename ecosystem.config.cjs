// ecosystem.config.cjs
module.exports = {
  apps: [
    {
  name: 'cmscrm-frontend-dev',
  cwd: './frontend',
  script: 'start-dev.cjs',
  interpreter: 'node',

  instances: 1,
  exec_mode: 'fork',

  // ⬇️ your env here
  env: {
    NODE_ENV: 'development',
    VITE_HOST: '0.0.0.0',
    VITE_PORT: '8800'
  },
  env_production: {
    NODE_ENV: 'production',
    VITE_HOST: '0.0.0.0',
    VITE_PORT: '8800'
  },

  watch: false,
  autorestart: true,
  max_restarts: 10,
  min_uptime: '10s',

  log_file: '../logs/frontend-combined.log',
  out_file: '../logs/frontend-out.log',
  error_file: '../logs/frontend-error.log',
  log_date_format: 'YYYY-MM-DD HH:mm Z',

  max_memory_restart: '500M',
  ignore_watch: ['node_modules', 'dist', 'logs'],
  merge_logs: true,
  windowsHide: true
},

    // (Optional) only start this when you build
    // pm2 start ecosystem.config.cjs --only cmscrm-frontend-build
    // {
    //   name: 'cmscrm-frontend-build',
    //   cwd: './frontend',
    //   script: 'C:\\Windows\\System32\\cmd.exe',
    //   args: '/c npm run build',
    //   interpreter: 'none',

    //   instances: 1,
    //   exec_mode: 'fork',
    //   env: { NODE_ENV: 'production' },

    //   watch: false,
    //   autorestart: false,

    //   log_file: '../logs/build-combined.log',
    //   out_file: '../logs/build-out.log',
    //   error_file: '../logs/build-error.log',
    //   log_date_format: 'YYYY-MM-DD HH:mm Z',

    //   max_memory_restart: '500M',
    //   ignore_watch: ['node_modules', 'dist', 'logs'],
    //   merge_logs: true
    // },

    {
      name: 'cmscrm-backend',
      cwd: './backend',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',

      env: { NODE_ENV: 'development', PORT: 5000 },
      env_production: { NODE_ENV: 'production', PORT: 5000 },

      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',

      log_file: '../logs/backend-combined.log',
      out_file: '../logs/backend-out.log',
      error_file: '../logs/backend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',

      max_memory_restart: '500M',
      ignore_watch: ['node_modules', 'logs'],
      merge_logs: true
    }
  ]
};
