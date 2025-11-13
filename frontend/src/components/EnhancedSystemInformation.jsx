import React, { useState, useEffect, useCallback } from 'react';
import { 
  Monitor,
  Server,
  Clock,
  HardDrive,
  Activity,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Settings,
  Cpu,
  Database,
  MemoryStick,
  Network,
  Zap,
  Shield,
  Info,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { apiService, endpoints } from '../utils/api';
import LoadingSpinner from './LoadingSpinner';

const EnhancedSystemInformation = () => {
  const [systemInfo, setSystemInfo] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [healthData, setHealthData] = useState(null);
  const [networkStats, setNetworkStats] = useState([]);
  const [processStats, setProcessStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'processes', 'health', 'network'

  const fetchEnhancedSystemData = useCallback(async () => {
    try {
      setError(null);
      
      const [infoResponse, processesResponse, healthResponse, networkResponse, processStatsResponse] = await Promise.all([
        apiService.get(endpoints.system.info),
        apiService.get(endpoints.system.processes),
        apiService.get(endpoints.system.health),
        apiService.get('/system/network'),
        apiService.get('/system/process-stats')
      ]);
      
      setSystemInfo(infoResponse.data?.data);
      setProcesses(processesResponse.data?.data || []);
      setHealthData(healthResponse.data?.data);
      setNetworkStats(networkResponse.data?.data || []);
      setProcessStats(processStatsResponse.data?.data);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching enhanced system data:', err);
      setError('Failed to load enhanced system information');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnhancedSystemData();
    
    // Update every 30 seconds
    const interval = setInterval(fetchEnhancedSystemData, 30000);
    
    return () => clearInterval(interval);
  }, [fetchEnhancedSystemData]);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'critical':
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getHealthScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Monitor className="h-5 w-5 text-primary-600 dark:text-primary-400" />
           System Information
        </h3>
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error || !systemInfo) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Monitor className="h-5 w-5 text-primary-600 dark:text-primary-400" />
           System Information
        </h3>
        <div className="text-center py-8">
          <p className="text-red-500 dark:text-red-400 mb-4">{error || 'No data available'}</p>
          <button
            onClick={() => {
              setLoading(true);
              fetchEnhancedSystemData();
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Header with Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 lg:mb-6 gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
          <h3 className="text-base lg:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 truncate">
            <Monitor className="h-4 w-4 lg:h-5 lg:w-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
            <span className="truncate"> System Information</span>
          </h3>
          {healthData && (
            <span className={`text-xs px-2 py-1 rounded-full border inline-flex items-center gap-1 flex-shrink-0 ${
              healthData.status === 'healthy' 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700'
                : healthData.status === 'attention'
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700'
                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700'
            }`}>
              <span className="hidden sm:inline">Score: </span>{healthData.score}%
            </span>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab Navigation */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-2 lg:px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'overview' 
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Server className="h-3 w-3" />
              <span className="hidden sm:inline">Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('processes')}
              className={`px-2 lg:px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'processes' 
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Database className="h-3 w-3" />
              <span className="hidden sm:inline">Processes</span>
              <span className="text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded">
                {processes.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('health')}
              className={`px-2 lg:px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'health' 
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Shield className="h-3 w-3" />
              <span className="hidden sm:inline">Health</span>
            </button>
            <button
              onClick={() => setActiveTab('network')}
              className={`px-2 lg:px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'network' 
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Network className="h-3 w-3" />
              <span className="hidden sm:inline">Network</span>
            </button>
          </div>

          <button
            onClick={() => {
              setLoading(true);
              fetchEnhancedSystemData();
            }}
            className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
            {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700/50">
              <div className="flex items-center gap-2 mb-1">
                <Settings className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-900 dark:text-white truncate">Platform</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate" title={`${systemInfo.platform} (${systemInfo.arch})`}>
                {systemInfo.platform} ({systemInfo.arch})
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-3 border border-green-200 dark:border-green-700/50">
              <div className="flex items-center gap-2 mb-1">
                <Cpu className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-xs font-medium text-gray-900 dark:text-white">CPU Cores</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{systemInfo.cpuCount} cores</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-3 border border-purple-200 dark:border-purple-700/50">
              <div className="flex items-center gap-2 mb-1">
                <MemoryStick className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-medium text-gray-900 dark:text-white">Total RAM</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{formatBytes(systemInfo.totalMemory)}</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-3 border border-orange-200 dark:border-orange-700/50">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <span className="text-xs font-medium text-gray-900 dark:text-white">Uptime</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{systemInfo.systemUptimeFormatted}</p>
            </div>
          </div>

          {/* Detailed System Information */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Info className="h-4 w-4" />
              System Details
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 gap-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">Hostname</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white text-right truncate">{systemInfo.hostname}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 gap-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">OS Type</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white text-right truncate">{systemInfo.osInfo?.type}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 gap-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">OS Release</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white text-right truncate">{systemInfo.osInfo?.release}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 gap-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">Node.js Version</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white text-right truncate">{systemInfo.nodeVersion}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 gap-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">Process Uptime</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white text-right truncate">{systemInfo.uptimeFormatted}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 gap-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">Architecture</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white text-right truncate">{systemInfo.arch}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100 dark:border-gray-700 gap-1 sm:gap-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">Home Directory</span>
                  <span className="text-xs font-medium text-gray-900 dark:text-white font-mono break-all" title={systemInfo.osInfo?.homedir}>{systemInfo.osInfo?.homedir}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100 dark:border-gray-700 gap-1 sm:gap-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">Temp Directory</span>
                  <span className="text-xs font-medium text-gray-900 dark:text-white font-mono break-all" title={systemInfo.osInfo?.tmpdir}>{systemInfo.osInfo?.tmpdir}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Load Average with Enhanced Info */}
          {systemInfo.loadAverage && systemInfo.loadAverage.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                {systemInfo.isWindows ? 'CPU Load (Windows)' : 'Load Average (Unix)'}
                {systemInfo.isWindows && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                    Simulated
                  </span>
                )}
              </h4>
              
              {!systemInfo.loadAverageSupported && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700 mb-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                        Windows Load Information
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Windows doesn't provide traditional Unix load averages. Values shown are based on current CPU usage as an alternative system load indicator.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">1 min</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {systemInfo.loadAverage[0]?.toFixed(2) || '0.00'}
                  </p>
                  {systemInfo.isWindows && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">CPU-based</p>
                  )}
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">5 min</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {systemInfo.loadAverage[1]?.toFixed(2) || '0.00'}
                  </p>
                  {systemInfo.isWindows && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">Estimated</p>
                  )}
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">15 min</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {systemInfo.loadAverage[2]?.toFixed(2) || '0.00'}
                  </p>
                  {systemInfo.isWindows && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">Estimated</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'processes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Database className="h-4 w-4" />
              PM2 Processes ({processes.length})
            </h4>
            {processStats && (
              <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                <span>PID: {processStats.pid}</span>
                <span>Node: {processStats.version}</span>
                <span>Uptime: {systemInfo.uptimeFormatted}</span>
              </div>
            )}
          </div>
          
          {processes.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Database className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No PM2 processes found</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Start your application with PM2 to see process details</p>
            </div>
          ) : (
            <div className="space-y-3">
              {processes.map((process, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(process.status)}
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{process.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                            PID: {process.pid}
                          </span>
                          <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded">
                            ID: {process.pmId}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full border ${
                      process.status === 'online' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700'
                    }`}>
                      {process.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-3 w-3" />
                      <span>CPU: {process.cpu}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MemoryStick className="h-3 w-3" />
                      <span>Memory: {formatBytes(process.memory)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-3 w-3" />
                      <span>Restarts: {process.restarts}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Settings className="h-3 w-3" />
                      <span>Mode: {process.mode}</span>
                    </div>
                  </div>
                  
                  {process.version && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Version: {process.version}</span>
                        {process.created_at && (
                          <span className="text-gray-500 dark:text-gray-400">
                            Created: {new Date(process.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'health' && healthData && (
        <div className="space-y-6">
          {/* Health Score */}
          <div className="text-center">
            <div className={`text-6xl font-bold mb-2 ${getHealthScoreColor(healthData.score)}`}>
              {healthData.score}%
            </div>
            <p className="text-gray-600 dark:text-gray-400">Overall System Health</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              {getStatusIcon(healthData.status)}
              <span className={`text-sm font-medium ${getStatusColor(healthData.status)}`}>
                {healthData.status.charAt(0).toUpperCase() + healthData.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Alerts */}
          {healthData.alerts && healthData.alerts.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                System Alerts ({healthData.alerts.length})
              </h4>
              <div className="space-y-2">
                {healthData.alerts.map((alert, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${
                    alert.type === 'warning' 
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700'
                      : alert.type === 'info'
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                  }`}>
                    <div className="flex items-center gap-2">
                      {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                      {alert.type === 'info' && <Info className="h-4 w-4 text-blue-600" />}
                      {alert.type === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{alert.message}</span>
                      {alert.value && (
                        <span className="text-xs bg-white dark:bg-gray-700 px-2 py-1 rounded">{alert.value}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {healthData.recommendations && healthData.recommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Recommendations
              </h4>
              <div className="space-y-2">
                {healthData.recommendations.map((recommendation, index) => (
                  <div key={index} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                    <p className="text-sm text-green-800 dark:text-green-200">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'network' && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Network className="h-4 w-4" />
            Network Interfaces ({networkStats.length})
          </h4>
          
          {networkStats.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Network className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No network interfaces found</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {networkStats.map((iface, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Network className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{iface.interface}</span>
                    </div>
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                      {iface.family}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">IP Address:</span>
                      <p className="font-mono text-gray-900 dark:text-white">{iface.address}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Netmask:</span>
                      <p className="font-mono text-gray-900 dark:text-white">{iface.netmask}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">MAC Address:</span>
                      <p className="font-mono text-gray-900 dark:text-white">{iface.mac}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedSystemInformation;