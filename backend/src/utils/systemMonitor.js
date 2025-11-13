const os = require('os');
const pm2 = require('pm2');
const { promisify } = require('util');

// Store historical data in memory (in production, use Redis or database)
const systemHistory = {
  cpu: [],
  memory: [],
  apiCalls: [],
  timestamps: []
};

const MAX_HISTORY_POINTS = 20; // Keep last 20 data points

class SystemMonitor {
  constructor() {
    this.startTime = Date.now();
    this.apiCallCount = 0;
    this.pm2Connected = false;
    this.connectToPM2();
  }

  async connectToPM2() {
    try {
      await new Promise((resolve, reject) => {
        pm2.connect((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      this.pm2Connected = true;
      console.log('Connected to PM2');
    } catch (error) {
      console.log('PM2 not available, using basic monitoring');
      this.pm2Connected = false;
    }
  }

  incrementApiCall() {
    this.apiCallCount++;
  }

  getCpuUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach((cpu) => {
      for (let type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);
    
    return Math.max(0, Math.min(100, usage));
  }

  getMemoryUsage() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    return {
      total,
      free,
      used,
      percentage: Math.round((used / total) * 100)
    };
  }

  getSystemInfo() {
    const uptime = process.uptime();
    const platform = os.platform();
    const loadAvg = os.loadavg();
    
    // Windows doesn't provide meaningful load averages, so we'll calculate alternatives
    const isWindows = platform === 'win32';
    const processLoad = isWindows ? this.getWindowsProcessLoad() : loadAvg;
    
    return {
      platform: platform,
      arch: os.arch(),
      nodeVersion: process.version,
      uptime: uptime,
      uptimeFormatted: this.formatUptime(uptime),
      loadAverage: processLoad,
      loadAverageSupported: !isWindows,
      cpuCount: os.cpus().length,
      hostname: os.hostname(),
      isWindows: isWindows
    };
  }

  getWindowsProcessLoad() {
    // For Windows, we'll use CPU usage as an alternative to load average
    const cpuUsage = this.getCpuUsage();
    const normalizedLoad = cpuUsage / 100; // Convert percentage to load-like value
    
    // Simulate 1min, 5min, 15min averages using current CPU usage
    // In a real implementation, you'd track these over time
    return [
      normalizedLoad,      // 1 min
      normalizedLoad * 0.8, // 5 min (slightly lower)
      normalizedLoad * 0.6  // 15 min (even lower)
    ];
  }

  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  async getPM2Processes() {
    if (!this.pm2Connected) {
      return [];
    }

    try {
      const processes = await new Promise((resolve, reject) => {
        pm2.list((err, list) => {
          if (err) reject(err);
          else resolve(list);
        });
      });

      return processes.map(proc => ({
        name: proc.name,
        pid: proc.pid,
        status: proc.pm2_env.status,
        cpu: proc.monit.cpu,
        memory: proc.monit.memory,
        uptime: proc.pm2_env.pm_uptime,
        restarts: proc.pm2_env.restart_time,
        mode: proc.pm2_env.exec_mode
      }));
    } catch (error) {
      console.error('Error getting PM2 processes:', error);
      return [];
    }
  }

  updateHistory() {
    const now = new Date();
    const cpu = this.getCpuUsage();
    const memory = this.getMemoryUsage();

    // Add new data point
    systemHistory.timestamps.push(now);
    systemHistory.cpu.push(cpu);
    systemHistory.memory.push(memory.percentage);
    systemHistory.apiCalls.push(this.apiCallCount);

    // Keep only last N points
    if (systemHistory.timestamps.length > MAX_HISTORY_POINTS) {
      systemHistory.timestamps.shift();
      systemHistory.cpu.shift();
      systemHistory.memory.shift();
      systemHistory.apiCalls.shift();
    }
  }

  getPerformanceData() {
    this.updateHistory();
    
    return {
      current: {
        cpu: this.getCpuUsage(),
        memory: this.getMemoryUsage(),
        apiCalls: this.apiCallCount,
        timestamp: new Date()
      },
      history: {
        timestamps: systemHistory.timestamps.map(t => t.toISOString()),
        cpu: systemHistory.cpu,
        memory: systemHistory.memory,
        apiCalls: systemHistory.apiCalls
      }
    };
  }

  async getCompleteSystemStatus() {
    const performance = this.getPerformanceData();
    const systemInfo = this.getSystemInfo();
    const processes = await this.getPM2Processes();

    return {
      performance,
      system: systemInfo,
      processes,
      timestamp: new Date().toISOString()
    };
  }
}

// Create singleton instance
const systemMonitor = new SystemMonitor();

// Update history every 30 seconds
setInterval(() => {
  systemMonitor.updateHistory();
}, 30000);

module.exports = systemMonitor;