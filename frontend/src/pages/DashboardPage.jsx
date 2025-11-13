import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Shield, 
  FileText, 
  Activity,
  TrendingUp,
  Clock,
  Calendar
} from 'lucide-react';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../context/AuthContext';
import { apiService, endpoints } from '../utils/api';
import { formatNumber } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import EnhancedSystemPerformance from '../components/EnhancedSystemPerformance';
import EnhancedSystemInformation from '../components/EnhancedSystemInformation';

const StatCard = ({ title, value, icon: Icon, trend, color = 'blue', suffix = '' }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600'
  };

  const bgClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20',
    green: 'bg-green-50 dark:bg-green-900/20',
    purple: 'bg-purple-50 dark:bg-purple-900/20',
    orange: 'bg-orange-50 dark:bg-orange-900/20'
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 transition-all duration-300 hover:-translate-y-1 ${bgClasses[color]} min-h-[120px] sm:min-h-[140px]`}>
      <div className="flex items-start justify-between h-full">
        <div className="flex-1 flex flex-col justify-between h-full">
          <div>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2 line-clamp-2">
              {title}
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white break-all">
              {formatNumber(value)}{suffix}
            </p>
          </div>
          {trend && (
            <div className="flex items-center mt-2 sm:mt-3">
              <div className="flex items-center px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400 mr-1" />
                <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                  +{trend}%
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 hidden sm:inline">vs last month</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 sm:hidden">vs prev</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br ${colorClasses[color]} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 ml-2 sm:ml-4`}>
          <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
        </div>
      </div>
    </div>
  );
};



const DashboardPage = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRoles: 0,
    totalPages: 0,
    activeUsers: 0
  });
  const [avgLatencyMs, setAvgLatencyMs] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      // Only fetch dashboard statistics if user is admin or superadmin
      if (isAdmin()) {
        const statsResponse = await apiService.get(endpoints.stats.dashboard);
        const statsData = statsResponse.data.data || {};
        
        // Set overview stats
        setStats({
          totalUsers: statsData.overview?.total_users || 0,
          totalRoles: statsData.overview?.total_roles || 0,
          totalPages: statsData.overview?.total_pages || 0,
          activeUsers: statsData.overview?.active_users || 0
        });
        setAvgLatencyMs(statsData.overview?.avg_api_latency_ms || 0);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  const currentDate = new Date();
  const greeting = () => {
    const hour = currentDate.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
              <span className="block sm:inline">{greeting()},</span>{' '}
              <span className="text-primary-600 dark:text-primary-400">{user?.username}!</span>
            </h1>
            <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">
                {currentDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
              <span className="sm:hidden">
                {currentDate.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>
          
          {/* Quick Actions - Only show on larger screens */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
              <div>Last updated</div>
              <div className="font-medium">{new Date().toLocaleTimeString('en-US', { hour12: false })}</div>
            </div>
          </div>
        </div>

        {/* Stats Grid - Only visible to Admin and Super Admin */}
        {isAdmin() && (
          <>
            {loading ? (
              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 min-h-[120px] sm:min-h-[140px]">
                    <LoadingSpinner size="sm" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
                <StatCard
                  title="Total Users"
                  value={stats.totalUsers || 0}
                  icon={Users}
                  trend={12}
                  color="blue"
                />
                <StatCard
                  title="Active Roles"
                  value={stats.totalRoles || 0}
                  icon={Shield}
                  trend={8}
                  color="green"
                />
                <StatCard
                  title="Total Pages"
                  value={stats.totalPages || 0}
                  icon={FileText}
                  trend={5}
                  color="purple"
                />
                <StatCard
                  title="Active Users"
                  value={stats.activeUsers || 0}
                  icon={Activity}
                  trend={15}
                  color="orange"
                />
                <StatCard
                  title="Avg API Latency"
                  value={avgLatencyMs || 0}
                  icon={Clock}
                  color="blue"
                  suffix=" ms"
                />
              </div>
            )}
          </>
        )}

        {/* Enhanced System Monitoring */}
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4 lg:gap-6">
          {/* Enhanced System Performance with Charts */}
          <EnhancedSystemPerformance />

          {/* Enhanced System Information with Tabs */}
          <EnhancedSystemInformation />
        </div>

        {/* System Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">System Status</h3>
            <div className="text-xs text-green-600 dark:text-green-400 font-medium">
              All systems operational
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-700/50 shadow-sm gap-3 sm:gap-0">
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Database</span>
              </div>
              <span className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400 px-3 py-1 bg-white dark:bg-green-900/30 rounded-full self-start sm:self-center">Online</span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-700/50 shadow-sm gap-3 sm:gap-0">
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">API Server</span>
              </div>
              <span className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400 px-3 py-1 bg-white dark:bg-green-900/30 rounded-full self-start sm:self-center">Online</span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-700/50 shadow-sm gap-3 sm:gap-0 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">File System</span>
              </div>
              <span className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400 px-3 py-1 bg-white dark:bg-green-900/30 rounded-full self-start sm:self-center">Online</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;