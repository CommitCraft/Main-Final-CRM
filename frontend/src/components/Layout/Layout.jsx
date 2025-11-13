import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Sun,
  Moon,
  User,
  Globe,
  ExternalLink,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiService, endpoints } from '../../utils/api';
import ZoomableIframeModal from '../ZoomableIframeModal';

const Sidebar = ({ isOpen, onClose, onExternalPageOpen }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [myPages, setMyPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['Super Admin', 'Admin', 'Manager', 'User']
    },
    {
      name: 'Users',
      path: '/users',
      icon: Users,
      roles: ['Super Admin', 'Admin']
    },
    {
      name: 'Roles',
      path: '/roles',
      icon: Shield,
      roles: ['Super Admin', 'Admin']
    },
    {
      name: 'Pages',
      path: '/pages',
      icon: FileText,
      roles: ['Super Admin', 'Admin']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (!user?.roles) return false;
    // Handle both string roles and object roles
    return user.roles.some(role => {
      const roleName = typeof role === 'string' ? role : role.name;
      // Map backend role names to display names
      const roleMapping = {
        'super_admin': 'Super Admin',
        'admin': 'Admin', 
        'manager': 'Manager',
        'user': 'User'
      };
      const displayRole = roleMapping[roleName] || roleName;
      return item.roles.includes(displayRole);
    });
  });

  const isActive = (path) => location.pathname === path;

  const toggleMenu = (pageId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [pageId]: !prev[pageId]
    }));
  };

  const fetchMyPages = useCallback(async () => {
    try {
      if (!user?.id) {
        setMyPages([]);
        return;
      }
      setLoadingPages(true);
      // Fetch pages with hierarchy
      const res = await apiService.get('/pages/my-pages-hierarchy', { params: { _t: Date.now() } });
      const pages = res.data?.data?.pages || [];
      setMyPages(Array.isArray(pages) ? pages : []);
    } catch (err) {
      console.error('Failed to load my pages:', err);
      setMyPages([]);
    } finally {
      setLoadingPages(false);
    }
  }, [user?.id]);

  // Initial/identity-based fetch
  useEffect(() => {
    fetchMyPages();
  }, [fetchMyPages]);

  // Refresh when permissions are updated elsewhere in the app
  useEffect(() => {
    const handler = () => fetchMyPages();
    window.addEventListener('permissions-updated', handler);
    return () => window.removeEventListener('permissions-updated', handler);
  }, [fetchMyPages]);

  const formatUrl = (url) => {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    // For internal routes, return as-is for SPA navigation
    return url.startsWith('/') ? url : `/${url}`;
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
              Saral Tech Dashboard
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                      ${active
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md transform scale-[1.02]'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 hover:translate-x-1'
                      }
                    `}
                  >
                    <Icon className={`h-5 w-5 ${active ? 'text-white' : ''}`} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Assigned Pages section - reflects role->page assignments */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="px-2 mb-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Globe className="h-3.5 w-3.5" />
              Assigned Pages
            </div>
            {loadingPages ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg">Loading...</div>
            ) : myPages.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg">No pages assigned</div>
            ) : (
              <ul className={`space-y-1 overflow-y-auto ${myPages.length > 10 ? 'max-h-[400px]' : 'max-h-none'} scrollbar-hide`}>
  {myPages
    .filter(p => {
      const excludedPages = ['Activity Logs', 'Company Website', 'Documentation', 'Help Center'];
      return !excludedPages.includes(p.name);
    })
    .map((p) => {
      const isExternal = !!p.is_external || (typeof p.url === 'string' && (p.url.startsWith('http://') || p.url.startsWith('https://')));
      const href = formatUrl(p.url);
      const pageActive = isActive(href);
      const hasChildren = p.children && p.children.length > 0;
      const isExpanded = expandedMenus[p.id];

      return (
        <li key={p.id}>
          {/* Main menu item */}
          <div className="flex items-center">
            {hasChildren && (
              <button
                onClick={() => toggleMenu(p.id)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded mr-1 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                )}
              </button>
            )}
            
            {isExternal ? (
              <button
                onClick={() => onExternalPageOpen(p.name, href)}
                className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 text-left transition-all duration-200 hover:translate-x-1 group ${!hasChildren ? 'ml-0' : ''}`}
              >
                <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
                <span className="truncate">{p.name}</span>
              </button>
            ) : (
              <Link
                to={href}
                onClick={onClose}
                className={`flex items-center gap-3 flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pageActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 border-l-4 border-primary-600'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 hover:translate-x-1'
                }`}
              >
                <Globe className={`h-4 w-4 ${pageActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} />
                <span className="truncate">{p.name}</span>
              </Link>
            )}
          </div>

          {/* Submenu items */}
          {hasChildren && isExpanded && (
            <ul className="ml-8 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-2">
              {p.children.map((child) => {
                const childExternal = !!child.is_external || (typeof child.url === 'string' && (child.url.startsWith('http://') || child.url.startsWith('https://')));
                const childHref = formatUrl(child.url);
                const childActive = isActive(childHref);

                return (
                  <li key={child.id}>
                    {childExternal ? (
                      <button
                        onClick={() => onExternalPageOpen(child.name, childHref)}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 text-left transition-all duration-200 hover:translate-x-1 group"
                      >
                        <span className="text-gray-400">↳</span>
                        <ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
                        <span className="truncate">{child.name}</span>
                      </button>
                    ) : (
                      <Link
                        to={childHref}
                        onClick={onClose}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                          childActive
                            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 hover:translate-x-1'
                        }`}
                      >
                        <span className="text-gray-400">↳</span>
                        <Globe className={`h-3 w-3 ${childActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} />
                        <span className="truncate">{child.name}</span>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      );
    })}
</ul>
            )}
          </div>
        </nav>

        {/* User section */}
       <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50">
  <div className="flex flex-col gap-3">
    
    {/* Row 1 — User Info */}
    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-300">
  {/* Avatar + Info */}
  <div className="flex items-center gap-3 min-w-0">
    <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
      <User className="h-6 w-6 text-primary-600 dark:text-primary-400" />
    </div>

    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
        {user?.username}
      </p>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
        {user?.roles?.[0]
          ? (typeof user.roles[0] === 'string'
              ? user.roles[0]
                  .replace('_', ' ')
                  .replace(/\b\w/g, l => l.toUpperCase())
              : user.roles[0].name)
          : 'User'}
      </p>
    </div>
  </div>

  {/* Logout Button */}
  <button
  onClick={handleLogout}
  className="group relative flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg border border-transparent hover:border-red-200 dark:hover:border-red-800 transition-all duration-200"
>
  <LogOut className="h-5 w-5" />
  
  {/* Text only visible on hover */}
  <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-sm">
    Log out
  </span>
</button>

</div>


    {/* Row 2 — Logout Button */}
    {/* <button
      onClick={handleLogout}
      className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 border border-transparent hover:border-red-200 dark:hover:border-red-800"
    >
      <LogOut className="h-5 w-5" />
      Sign out
    </button> */}

  </div>
</div>

      </div>
    </>
  );
};

const Header = ({ onMenuClick }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Welcome back, <span className="text-primary-600 dark:text-primary-400">{user?.username}</span>!
            </h1>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 shadow-sm hover:shadow"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <Sun className="h-5 w-5 text-yellow-500" />
            )}
          </button>

          {/* User Avatar */}
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md">
            <User className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
};

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [externalPageModal, setExternalPageModal] = useState({
    isOpen: false,
    title: '',
    url: ''
  });

  const handleExternalPageOpen = (title, url) => {
    setExternalPageModal({
      isOpen: true,
      title,
      url
    });
    setSidebarOpen(false); // Close sidebar on mobile when opening modal
  };

  const handleExternalPageClose = () => {
    setExternalPageModal({
      isOpen: false,
      title: '',
      url: ''
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onExternalPageOpen={handleExternalPageOpen}
      />
      
      <div className="lg:pl-64 flex flex-col flex-1">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="p-6 flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 px-6">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} Saral Tech. All rights reserved.
          </div>
        </footer>
      </div>

      {/* Zoomable External Page Modal */}
      <ZoomableIframeModal
        isOpen={externalPageModal.isOpen}
        onClose={handleExternalPageClose}
        title={externalPageModal.title}
        url={externalPageModal.url}
      />
    </div>
  );
};

export default Layout;