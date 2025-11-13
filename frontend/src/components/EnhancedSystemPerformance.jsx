import React, { useState, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { 
  Activity,
  Cpu,
  MemoryStick,
  Zap,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Info,
  BarChart3,
  PieChart,
  Monitor
} from 'lucide-react';
import { apiService, endpoints } from '../utils/api';
import LoadingSpinner from './LoadingSpinner';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

const SystemPerformance = () => {
  const [performanceData, setPerformanceData] = useState(null);
  const [cpuDetails, setCpuDetails] = useState(null);
  const [memoryDetails, setMemoryDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [chartType, setChartType] = useState('performance'); // 'performance', 'cpu', 'memory'

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      
      const [performanceRes, cpuRes, memoryRes] = await Promise.all([
        apiService.get(endpoints.system.performance),
        apiService.get('/system/cpu'),
        apiService.get('/system/memory')
      ]);
      
      if (performanceRes.data?.data) {
        setPerformanceData(performanceRes.data.data);
      }
      if (cpuRes.data?.data) {
        setCpuDetails(cpuRes.data.data);
      }
      if (memoryRes.data?.data) {
        setMemoryDetails(memoryRes.data.data);
      }
      
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching  performance data:', err);
      setError('Failed to load  performance data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchData, 15000); // 15 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchData, autoRefresh]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary-600 dark:text-primary-400" />
           System Performance
        </h3>
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error || !performanceData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary-600 dark:text-primary-400" />
           System Performance
        </h3>
        <div className="text-center py-8">
          <p className="text-red-500 dark:text-red-400 mb-4">{error || 'No data available'}</p>
          <button
            onClick={() => {
              setLoading(true);
              fetchData();
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { current, history, analytics } = performanceData;

  //  performance chart data
  const performanceChartData = {
    labels: history.timestamps.map(timestamp => {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
    }),
    datasets: [
      {
        label: 'CPU Usage (%)',
        data: history.cpu,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5
      },
      {
        label: 'Memory Usage (%)',
        data: history.memory,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5
      },
      {
        label: 'API Calls (Scaled)',
        data: history.apiCalls.map(calls => Math.min(calls / 10, 100)), // Scale for visibility
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
        yAxisID: 'y1'
      }
    ]
  };

  // CPU per-core chart data
  const cpuCoreChartData = cpuDetails ? {
    labels: cpuDetails.perCore.map(core => `Core ${core.core}`),
    datasets: [{
      label: 'CPU Usage per Core (%)',
      data: cpuDetails.perCore.map(core => core.usage),
      backgroundColor: cpuDetails.perCore.map((core, index) => {
        const colors = [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)'
        ];
        return colors[index % colors.length];
      }),
      borderColor: cpuDetails.perCore.map((core, index) => {
        const colors = [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(236, 72, 153, 1)'
        ];
        return colors[index % colors.length];
      }),
      borderWidth: 2
    }]
  } : null;

  // Memory breakdown chart data
  const memoryChartData = memoryDetails ? {
    labels: ['Heap Used', 'Heap Free', 'External', 'Array Buffers'],
    datasets: [{
      data: [
        memoryDetails.process.heapUsed,
        memoryDetails.process.heapTotal - memoryDetails.process.heapUsed,
        memoryDetails.process.external,
        memoryDetails.process.arrayBuffers
      ],
      backgroundColor: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(245, 158, 11, 0.8)'
      ],
      borderColor: [
        'rgba(239, 68, 68, 1)',
        'rgba(34, 197, 94, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(245, 158, 11, 1)'
      ],
      borderWidth: 2
    }]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time',
          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151'
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280',
          maxTicksLimit: 10
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Usage (%)',
          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151'
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280'
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'
        },
        min: 0,
        max: 100
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'API Calls (Scaled)',
          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151'
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280'
        },
        grid: {
          drawOnChartArea: false,
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'
        },
        min: 0
      }
    }
  };

  const getTrendIcon = (trend) => {
    if (trend > 5) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (trend < -5) return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const getStatusColor = (value, thresholds) => {
    if (value > thresholds.critical) return 'text-red-600 dark:text-red-400';
    if (value > thresholds.warning) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 lg:mb-6 gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-base lg:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 truncate">
            <Monitor className="h-4 w-4 lg:h-5 lg:w-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
            <span className="truncate"> System Performance</span>
            <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full flex-shrink-0 hidden sm:inline">
              Advanced
            </span>
          </h3>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 lg:gap-3">
          {/* Chart Type Selector */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 overflow-x-auto">
            <button
              onClick={() => setChartType('performance')}
              className={`px-2 lg:px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                chartType === 'performance' 
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="h-3 w-3 inline mr-1" />
              <span className="hidden sm:inline">Performance</span>
              <span className="sm:hidden">Perf</span>
            </button>
            <button
              onClick={() => setChartType('cpu')}
              className={`px-2 lg:px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                chartType === 'cpu' 
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Cpu className="h-3 w-3 inline mr-1" />
              <span className="hidden sm:inline">CPU Cores</span>
              <span className="sm:hidden">CPU</span>
            </button>
            <button
              onClick={() => setChartType('memory')}
              className={`px-2 lg:px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                chartType === 'memory' 
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <PieChart className="h-3 w-3 inline mr-1" />
              <span className="hidden sm:inline">Memory</span>
              <span className="sm:hidden">Mem</span>
            </button>
          </div>

          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 rounded-lg text-xs font-medium transition-colors ${
              autoRefresh 
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
            title={`Auto-refresh ${autoRefresh ? 'ON' : 'OFF'}`}
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
          </button>

          <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
            {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/*  Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-3 sm:p-4 border border-blue-200 dark:border-blue-700/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase truncate">CPU Usage</span>
            </div>
            {analytics?.trends?.cpu && getTrendIcon(analytics.trends.cpu)}
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {current.cpu?.overall?.toFixed(1) || '0.0'}%
          </p>
          {analytics?.averages?.cpu && (
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
              <span className="hidden sm:inline">Avg: {analytics.averages.cpu.toFixed(1)}% | Peak: {analytics.peaks?.cpu?.toFixed(1) || '0.0'}%</span>
              <span className="sm:hidden">Avg: {analytics.averages.cpu.toFixed(1)}%</span>
            </p>
          )}
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-3 sm:p-4 border border-green-200 dark:border-green-700/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MemoryStick className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase truncate">Memory</span>
            </div>
            {analytics?.trends?.memory && getTrendIcon(analytics.trends.memory)}
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {current.memory?.system?.percentage || 0}%
          </p>
          {memoryDetails && (
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
              {memoryDetails.formatted.usedGB}GB / {memoryDetails.formatted.totalGB}GB
            </p>
          )}
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-3 sm:p-4 border border-orange-200 dark:border-orange-700/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase truncate">API Calls</span>
            </div>
            {analytics?.trends?.apiCalls && getTrendIcon(analytics.trends.apiCalls)}
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {current.apiCalls || 0}
          </p>
          {analytics?.averages?.apiCalls && (
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
              <span className="hidden sm:inline">Avg: {Math.round(analytics.averages.apiCalls)} | Peak: {analytics.peaks?.apiCalls || 0}</span>
              <span className="sm:hidden">Avg: {Math.round(analytics.averages.apiCalls)}</span>
            </p>
          )}
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-3 sm:p-4 border border-purple-200 dark:border-purple-700/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase truncate">Health Score</span>
            </div>
            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {cpuDetails && memoryDetails ? 
              Math.max(0, 100 - Math.round((current.cpu?.overall || 0) + (current.memory?.system?.percentage || 0)) / 2)
              : '95'
            }%
          </p>
          <p className="text-xs text-green-600 dark:text-green-400">System Healthy</p>
        </div>
      </div>

      {/* Dynamic Chart Display */}
      <div>
        <div className="h-64 sm:h-80 lg:h-96 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 sm:p-4">
          {chartType === 'performance' && (
            <>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Real-time Performance Trends
              </h4>
              <Line data={performanceChartData} options={chartOptions} />
            </>
          )}

          {chartType === 'cpu' && cpuCoreChartData && (
            <>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                CPU Usage per Core
              </h4>
              <Bar 
                data={cpuCoreChartData} 
                options={{
                  ...chartOptions,
                  scales: {
                    ...chartOptions.scales,
                    y1: undefined
                  }
                }} 
              />
            </>
          )}

          {chartType === 'memory' && memoryChartData && (
            <>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Process Memory Breakdown
              </h4>
              <div className="flex items-center justify-center h-64">
                <Doughnut 
                  data={memoryChartData} 
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      tooltip: {
                        ...chartOptions.plugins.tooltip,
                        callbacks: {
                          label: (context) => {
                            const value = context.parsed;
                            const sizeGB = (value / (1024 * 1024 * 1024)).toFixed(2);
                            return `${context.label}: ${sizeGB}GB`;
                          }
                        }
                      }
                    },
                    scales: undefined
                  }} 
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* CPU Model Information */}
      {cpuDetails?.modelInfo && (
        <div className="mt-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm">
            <Info className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-900 dark:text-white">CPU Model:</span>
            <span className="text-gray-600 dark:text-gray-400">{cpuDetails.modelInfo.model}</span>
            <span className="text-gray-400 dark:text-gray-500">•</span>
            <span className="text-gray-600 dark:text-gray-400">{cpuDetails.modelInfo.speed} MHz</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemPerformance;