const enhancedSystemMonitor = require('../utils/enhancedSystemMonitor');

class SystemController {
  // Get enhanced system performance metrics
  async getSystemPerformance(req, res) {
    try {
      const performance = enhancedSystemMonitor.getEnhancedPerformanceData();
      res.json({
        success: true,
        data: performance
      });
    } catch (error) {
      console.error('Error getting system performance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get system performance data'
      });
    }
  }

  // Get detailed system information
  async getSystemInfo(req, res) {
    try {
      const systemInfo = enhancedSystemMonitor.getDetailedSystemInfo();
      res.json({
        success: true,
        data: systemInfo
      });
    } catch (error) {
      console.error('Error getting system info:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get system information'
      });
    }
  }

  // Get enhanced PM2 processes information
  async getProcesses(req, res) {
    try {
      const processes = await enhancedSystemMonitor.getDetailedPM2Processes();
      res.json({
        success: true,
        data: processes
      });
    } catch (error) {
      console.error('Error getting processes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get process information'
      });
    }
  }

  // Get complete enhanced system status for dashboard
  async getCompleteStatus(req, res) {
    try {
      const status = await enhancedSystemMonitor.getCompleteSystemStatus();
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Error getting complete status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get complete system status'
      });
    }
  }

  // Get enhanced system health analysis
  async getHealthCheck(req, res) {
    try {
      const health = enhancedSystemMonitor.analyzeSystemHealth();
      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      console.error('Error getting health check:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get health check data'
      });
    }
  }

  // Get detailed CPU metrics
  async getCpuMetrics(req, res) {
    try {
      const cpuData = enhancedSystemMonitor.getDetailedCpuUsage();
      res.json({
        success: true,
        data: cpuData
      });
    } catch (error) {
      console.error('Error getting CPU metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get CPU metrics'
      });
    }
  }

  // Get detailed memory metrics
  async getMemoryMetrics(req, res) {
    try {
      const memoryData = enhancedSystemMonitor.getDetailedMemoryUsage();
      res.json({
        success: true,
        data: memoryData
      });
    } catch (error) {
      console.error('Error getting memory metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get memory metrics'
      });
    }
  }

  // Get network statistics
  async getNetworkStats(req, res) {
    try {
      const networkData = enhancedSystemMonitor.getNetworkStats();
      res.json({
        success: true,
        data: networkData
      });
    } catch (error) {
      console.error('Error getting network stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get network statistics'
      });
    }
  }

  // Get process statistics
  async getProcessStats(req, res) {
    try {
      const processData = enhancedSystemMonitor.getProcessStats();
      res.json({
        success: true,
        data: processData
      });
    } catch (error) {
      console.error('Error getting process stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get process statistics'
      });
    }
  }
}

module.exports = new SystemController();