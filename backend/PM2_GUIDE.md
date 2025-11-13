# PM2 Process Management Guide

## Overview

PM2 is a production-ready runtime and process manager for Node.js applications that provides advanced features like load balancing, monitoring, and zero-downtime deployments.

## Installation & Setup

PM2 is already installed as a development dependency. The ecosystem configuration file (`ecosystem.config.js`) is pre-configured for the CMSCRM backend.

## Available Commands

### Start the Application
```bash
npm run pm2:start
```
This starts the application using PM2 with the ecosystem configuration.

### Monitor Processes
```bash
npm run pm2:monit
```
Opens the PM2 monitoring dashboard in your terminal.

### View Logs
```bash
npm run pm2:logs
```
Shows real-time logs from the application.

### Check Status
```bash
npm run pm2:status
```
Displays the status of all PM2 processes.

### Restart Application
```bash
npm run pm2:restart
```
Performs a zero-downtime restart of the application.

### Stop Application
```bash
npm run pm2:stop
```
Stops the application but keeps it in PM2's process list.

### Delete Process
```bash
npm run pm2:delete
```
Completely removes the application from PM2.

## Ecosystem Configuration

The `ecosystem.config.js` file contains the following configuration:

- **Process Name**: `cmscrm-backend`
- **Script**: `server.js`
- **Instances**: 1 (can be scaled as needed)
- **Auto-restart**: Enabled
- **Memory Limit**: 500MB (restarts if exceeded)
- **Log Management**: Separate files for output and errors

## Production Deployment

### 1. Start with PM2
```bash
NODE_ENV=production npm run pm2:start
```

### 2. Save PM2 Configuration
```bash
pm2 save
pm2 startup
```

### 3. Enable Auto-startup (Linux/macOS)
Follow the command output from `pm2 startup` to enable automatic startup on system reboot.

## Monitoring & Debugging

### Web-based Monitoring
PM2 provides built-in monitoring accessible through:
- Terminal: `npm run pm2:monit`
- Web interface: Install PM2 Plus for advanced monitoring

### Log Files
Logs are stored in the `logs/` directory:
- `combined.log` - All logs
- `out.log` - Standard output
- `error.log` - Error logs

### Health Checks
The application includes health check endpoints:
- Basic health: `GET /health`
- System health: `GET /api/system/health`

## Scaling

To run multiple instances:

```bash
# Update ecosystem.config.js
apps: [{
  instances: 'max', // or specific number
  exec_mode: 'cluster'
}]

# Restart
npm run pm2:restart
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   npm run pm2:stop
   npm run pm2:start
   ```

2. **Memory Issues**
   ```bash
   npm run pm2:monit
   # Check memory usage and adjust max_memory_restart in ecosystem.config.js
   ```

3. **View Detailed Logs**
   ```bash
   pm2 logs cmscrm-backend --lines 100
   ```

4. **Reset PM2**
   ```bash
   pm2 kill
   npm run pm2:start
   ```

## Integration with System Monitoring

The CMSCRM dashboard now includes:
- Real-time system performance graphs (CPU, Memory, API calls)
- PM2 process information and status
- System health monitoring
- Resource utilization charts

These features are automatically available when PM2 is running and provide comprehensive insights into application performance.