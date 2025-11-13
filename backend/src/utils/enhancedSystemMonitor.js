const os = require('os');
const fs = require('fs');
const { promisify } = require('util');
const pm2 = require('pm2');

// Enhanced historical data storage
const systemHistory = {
  cpu: [],
  cpuPerCore: [],
  memory: [],
  memoryDetailed: [],
  apiCalls: [],
  networkStats: [],
  diskStats: [],
  processCount: [],
  timestamps: []
};

const MAX_HISTORY_POINTS = 50; // Increased for better trend analysis
const SAMPLING_INTERVAL = 10000; // 10 seconds

class EnhancedSystemMonitor {
  constructor() {
    this.startTime = Date.now();
    this.apiCallCount = 0;
    this.pm2Connected = false;
    this.previousCpuInfo = null;
    this.previousNetworkStats = null;
    this.alertThresholds = {
      cpu: 80,
      memory: 85,
      disk: 90
    };
    this.connectToPM2();
    this.initializeMonitoring();
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
      console.log('✅ Enhanced System Monitor: Connected to PM2');
    } catch (error) {
      console.log('⚠️ Enhanced System Monitor: PM2 not available, using basic monitoring');
      this.pm2Connected = false;
    }
  }

  initializeMonitoring() {
    // Initialize previous CPU measurements for accurate delta calculations
    this.previousCpuInfo = os.cpus();
    
    // Start continuous monitoring
    setInterval(() => {
      this.updateHistory();
    }, SAMPLING_INTERVAL);
    
    console.log('🔄 Enhanced System Monitor: Continuous monitoring started');
  }

  incrementApiCall() {
    this.apiCallCount++;
  }

  // Enhanced CPU monitoring with per-core usage
  getDetailedCpuUsage() {
    const cpus = os.cpus();
    const currentTime = Date.now();
    
    // Overall CPU calculation
    let totalIdle = 0;
    let totalTick = 0;
    let perCoreUsage = [];

    cpus.forEach((cpu, index) => {
      let coreIdle = 0;
      let coreTick = 0;
      
      for (let type in cpu.times) {
        coreTick += cpu.times[type];
        if (type === 'idle') {
          coreIdle += cpu.times[type];
        }
      }
      
      totalIdle += coreIdle;
      totalTick += coreTick;
      
      // Calculate per-core usage if we have previous data
      let coreUsage = 0;
      if (this.previousCpuInfo && this.previousCpuInfo[index]) {
        const prevCore = this.previousCpuInfo[index];
        let prevCoreTick = 0;
        let prevCoreIdle = 0;
        
        for (let type in prevCore.times) {
          prevCoreTick += prevCore.times[type];
          if (type === 'idle') {
            prevCoreIdle += prevCore.times[type];
          }
        }
        
        const tickDiff = coreTick - prevCoreTick;
        const idleDiff = coreIdle - prevCoreIdle;
        
        if (tickDiff > 0) {
          coreUsage = Math.max(0, Math.min(100, 100 - (100 * idleDiff / tickDiff)));
        }
      }
      
      perCoreUsage.push({
        core: index,
        model: cpu.model,
        speed: cpu.speed,
        usage: Math.round(coreUsage * 100) / 100,
        times: cpu.times
      });
    });

    // Update previous CPU info for next calculation
    this.previousCpuInfo = JSON.parse(JSON.stringify(cpus));

    const overallUsage = totalTick > 0 ? Math.max(0, Math.min(100, 100 - (100 * totalIdle / totalTick))) : 0;

    return {
      overall: Math.round(overallUsage * 100) / 100,
      perCore: perCoreUsage,
      coreCount: cpus.length,
      modelInfo: cpus[0] ? {
        model: cpus[0].model,
        speed: cpus[0].speed
      } : null,
      timestamp: currentTime
    };
  }

  // Enhanced memory monitoring
  getDetailedMemoryUsage() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    // Node.js process memory usage
    const processMemory = process.memoryUsage();
    
    // Calculate memory pressure
    const memoryPressure = this.calculateMemoryPressure(usedMem / totalMem);
    
    return {
      system: {
        total: totalMem,
        free: freeMem,
        used: usedMem,
        percentage: Math.round((usedMem / totalMem) * 100),
        pressure: memoryPressure
      },
      process: {
        rss: processMemory.rss, // Resident Set Size
        heapTotal: processMemory.heapTotal,
        heapUsed: processMemory.heapUsed,
        external: processMemory.external,
        arrayBuffers: processMemory.arrayBuffers || 0
      },
      formatted: {
        totalGB: (totalMem / (1024 * 1024 * 1024)).toFixed(2),
        usedGB: (usedMem / (1024 * 1024 * 1024)).toFixed(2),
        freeGB: (freeMem / (1024 * 1024 * 1024)).toFixed(2)
      }
    };
  }

  calculateMemoryPressure(ratio) {
    if (ratio < 0.6) return 'low';
    if (ratio < 0.8) return 'moderate';
    if (ratio < 0.9) return 'high';
    return 'critical';
  }

  // Network interface monitoring (basic implementation)
  getNetworkStats() {
    const interfaces = os.networkInterfaces();
    const stats = [];
    
    Object.keys(interfaces).forEach(name => {
      const iface = interfaces[name];
      iface.forEach(details => {
        if (details.family === 'IPv4' && !details.internal) {
          stats.push({
            interface: name,
            address: details.address,
            netmask: details.netmask,
            mac: details.mac,
            family: details.family
          });
        }
      });
    });
    
    return stats;
  }

  // Process monitoring
  getProcessStats() {
    return {
      pid: process.pid,
      ppid: process.ppid,
      platform: process.platform,
      arch: process.arch,
      version: process.version,
      uptime: process.uptime(),
      argv: process.argv.slice(0, 3), // Limit for security
      execPath: process.execPath,
      title: process.title,
      versions: process.versions
    };
  }

  // System health analysis
  analyzeSystemHealth() {
    const cpu = this.getDetailedCpuUsage();
    const memory = this.getDetailedMemoryUsage();
    
    const alerts = [];
    const recommendations = [];
    
    // CPU alerts
    if (cpu.overall > this.alertThresholds.cpu) {
      alerts.push({
        type: 'warning',
        category: 'cpu',
        message: `High CPU usage: ${cpu.overall.toFixed(1)}%`,
        threshold: this.alertThresholds.cpu
      });
      recommendations.push('Consider optimizing CPU-intensive processes or scaling resources');
    }
    
    // Memory alerts
    if (memory.system.percentage > this.alertThresholds.memory) {
      alerts.push({
        type: 'warning',
        category: 'memory',
        message: `High memory usage: ${memory.system.percentage}%`,
        threshold: this.alertThresholds.memory
      });
      recommendations.push('Consider increasing available memory or optimizing memory usage');
    }
    
    // Process memory alerts
    const heapUsageRatio = memory.process.heapUsed / memory.process.heapTotal;
    if (heapUsageRatio > 0.9) {
      alerts.push({
        type: 'info',
        category: 'process',
        message: 'High heap memory usage in Node.js process',
        value: `${(heapUsageRatio * 100).toFixed(1)}%`
      });
    }
    
    return {
      status: alerts.length === 0 ? 'healthy' : 'attention',
      alerts,
      recommendations,
      score: this.calculateHealthScore(cpu, memory),
      timestamp: Date.now()
    };
  }

  calculateHealthScore(cpu, memory) {
    // Simple health scoring algorithm (0-100)
    const cpuScore = Math.max(0, 100 - cpu.overall);
    const memoryScore = Math.max(0, 100 - memory.system.percentage);
    
    return Math.round((cpuScore + memoryScore) / 2);
  }

  // Enhanced system information
  getDetailedSystemInfo() {
    const uptime = process.uptime();
    const platform = os.platform();
    const loadAvg = os.loadavg();
    
    // Windows compatibility
    const isWindows = platform === 'win32';
    const processLoad = isWindows ? this.getWindowsProcessLoad() : loadAvg;
    
    return {
      platform: platform,
      arch: os.arch(),
      hostname: os.hostname(),
      nodeVersion: process.version,
      uptime: uptime,
      uptimeFormatted: this.formatUptime(uptime),
      loadAverage: processLoad,
      loadAverageSupported: !isWindows,
      cpuCount: os.cpus().length,
      totalMemory: os.totalmem(),
      isWindows: isWindows,
      osInfo: {
        type: os.type(),
        release: os.release(),
        version: os.version ? os.version() : 'Unknown',
        homedir: os.homedir(),
        tmpdir: os.tmpdir()
      },
      systemUptime: os.uptime(),
      systemUptimeFormatted: this.formatUptime(os.uptime())
    };
  }

  getWindowsProcessLoad() {
    const cpu = this.getDetailedCpuUsage();
    const normalizedLoad = cpu.overall / 100;
    
    return [
      normalizedLoad,
      normalizedLoad * 0.8,
      normalizedLoad * 0.6
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
      return `${minutes}m ${Math.floor(seconds % 60)}s`;
    }
  }

  // Enhanced PM2 process monitoring
  async getDetailedPM2Processes() {
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
        mode: proc.pm2_env.exec_mode,
        instances: proc.pm2_env.instances || 1,
        pmId: proc.pm2_env.pm_id,
        version: proc.pm2_env.version,
        node_args: proc.pm2_env.node_args,
        args: proc.pm2_env.args,
        exec_interpreter: proc.pm2_env.exec_interpreter,
        unstable_restarts: proc.pm2_env.unstable_restarts,
        created_at: proc.pm2_env.created_at,
        pm_uptime: proc.pm2_env.pm_uptime,
        axm_actions: proc.pm2_env.axm_actions?.length || 0,
        axm_monitor: proc.pm2_env.axm_monitor || {}
      }));
    } catch (error) {
      console.error('Error getting detailed PM2 processes:', error);
      return [];
    }
  }

  updateHistory() {
    const now = new Date();
    const cpu = this.getDetailedCpuUsage();
    const memory = this.getDetailedMemoryUsage();
    const network = this.getNetworkStats();

    // Add new data points
    systemHistory.timestamps.push(now);
    systemHistory.cpu.push(cpu.overall);
    systemHistory.cpuPerCore.push(cpu.perCore.map(core => core.usage));
    systemHistory.memory.push(memory.system.percentage);
    systemHistory.memoryDetailed.push(memory);
    systemHistory.apiCalls.push(this.apiCallCount);
    systemHistory.networkStats.push(network);
    systemHistory.processCount.push(this.pm2Connected ? 1 : 0);

    // Maintain history size
    if (systemHistory.timestamps.length > MAX_HISTORY_POINTS) {
      Object.keys(systemHistory).forEach(key => {
        systemHistory[key].shift();
      });
    }
  }

  getEnhancedPerformanceData() {
    this.updateHistory();
    
    const current = {
      cpu: this.getDetailedCpuUsage(),
      memory: this.getDetailedMemoryUsage(),
      apiCalls: this.apiCallCount,
      network: this.getNetworkStats(),
      timestamp: new Date()
    };

    const history = {
      timestamps: systemHistory.timestamps.map(t => t.toISOString()),
      cpu: systemHistory.cpu,
      cpuPerCore: systemHistory.cpuPerCore,
      memory: systemHistory.memory,
      memoryDetailed: systemHistory.memoryDetailed,
      apiCalls: systemHistory.apiCalls,
      networkStats: systemHistory.networkStats,
      processCount: systemHistory.processCount
    };

    return {
      current,
      history,
      analytics: {
        trends: this.calculateTrends(history),
        averages: this.calculateAverages(history),
        peaks: this.findPeaks(history)
      }
    };
  }

  calculateTrends(history) {
    if (history.cpu.length < 2) return {};
    
    const recentCpu = history.cpu.slice(-10);
    const recentMemory = history.memory.slice(-10);
    
    return {
      cpu: this.calculateTrend(recentCpu),
      memory: this.calculateTrend(recentMemory),
      apiCalls: this.calculateTrend(history.apiCalls.slice(-10))
    };
  }

  calculateTrend(values) {
    if (values.length < 2) return 0;
    const first = values[0];
    const last = values[values.length - 1];
    return ((last - first) / first) * 100;
  }

  calculateAverages(history) {
    return {
      cpu: this.average(history.cpu),
      memory: this.average(history.memory),
      apiCalls: this.average(history.apiCalls)
    };
  }

  average(arr) {
    return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  }

  findPeaks(history) {
    return {
      cpu: Math.max(...history.cpu, 0),
      memory: Math.max(...history.memory, 0),
      apiCalls: Math.max(...history.apiCalls, 0)
    };
  }

  async getCompleteSystemStatus() {
    const performance = this.getEnhancedPerformanceData();
    const systemInfo = this.getDetailedSystemInfo();
    const processes = await this.getDetailedPM2Processes();
    const processStats = this.getProcessStats();
    const health = this.analyzeSystemHealth();

    return {
      performance,
      system: systemInfo,
      processes,
      processStats,
      health,
      monitoring: {
        sampleInterval: SAMPLING_INTERVAL,
        historyPoints: MAX_HISTORY_POINTS,
        alertThresholds: this.alertThresholds
      },
      timestamp: new Date().toISOString()
    };
  }
}

// Create singleton instance
const enhancedSystemMonitor = new EnhancedSystemMonitor();

module.exports = enhancedSystemMonitor;