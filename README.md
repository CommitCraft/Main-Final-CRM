# CMSCRM - Content Management System with Role-Based Access Control

A modern, comprehensive Content Management System built with Node.js, React 19, and MySQL. Features advanced role-based access control, real-time dashboard with pagination, user management, and extensive activity logging capabilities.

## ✨ Key Features Implemented

### 🔐 Advanced Permission System
- **Page-Based Access Control**: Users with assigned pages can perform CRUD operations
- **Flexible Role Management**: Super Admin, Admin, Manager, and User roles
- **Dynamic Permission Checking**: Real-time permission validation
- **Seamless Access**: No "Access Denied" messages for users with assigned pages

### 📊 Enhanced Dashboard with System Monitoring
- **Real-Time System Graphs**: Live CPU, memory, and API call charts with Chart.js
- **Performance History**: Historical performance data with interactive line charts
- **System Information Panel**: Detailed system specs, uptime, and health status
- **PM2 Process Monitoring**: Live PM2 process status and resource usage
- **Memory Visualization**: Doughnut charts showing memory distribution
- **Auto-Refresh**: Real-time data updates every 30-60 seconds

## 🚀 Features

### 🖥️ Backend Features
- **RESTful API**: Complete REST API with JWT authentication
- **Advanced RBAC**: `requireAssignedPages` middleware for flexible access control
- **Activity Logging**: Comprehensive audit trail with pagination support
- **Smart Permissions**: Users with assigned pages get full CRUD permissions
- **System Monitoring**: Real-time CPU, memory, and process monitoring
- **PM2 Integration**: Production-ready process management with clustering
- **Performance Analytics**: API call tracking and latency monitoring
- **Health Checks**: Comprehensive system health endpoints
- **Secure Middleware**: Authentication, authorization, and activity logging
- **API Rate Limiting**: Protection against abuse with express-rate-limit
- **Input Validation**: Comprehensive data validation with express-validator
- **Error Handling**: Centralized error management and graceful degradation

### 🎨 Frontend Features
- **Modern React 19**: Latest React with Vite 7.1.9 for optimal performance
- **Interactive Charts**: Chart.js integration with responsive data visualization
- **Real-time Monitoring**: Live system performance graphs and metrics
- **Tailwind CSS**: Utility-first styling with dark mode support
- **Responsive Design**: Mobile-first with smooth animations and adaptive charts
- **Protected Routes**: Dynamic access control based on user permissions
- **Real-time Updates**: Live data synchronization with loading states
- **Enhanced Dashboard**: System information panels and performance analytics
- **Enhanced UX**: Seamless navigation with rich visual feedback
- **Form Validation**: Client-side validation with real-time feedback

## 🏗️ Architecture

```
CMSCRM/
├── backend/                 # Node.js/Express API Server
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # API controllers
│   │   ├── middleware/     # Custom middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── seed/          # Database seeding
│   │   └── utils/         # Utility functions
│   ├── uploads/           # File uploads directory
│   ├── exports/           # Export files directory
│   └── server.js          # Main server file
├── frontend/              # React/Vite Frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
└── README.md              # This file
```

## 📋 Prerequisites

- **Node.js** v16 or higher
- **MySQL** v8.0 or higher
- **npm** or **yarn**

## 🛠️ Installation & Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd CMSCRM
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Environment setup
cp .env.example .env
```

Edit `.env` file with your database credentials:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_password
DB_NAME=cmscrm

JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=2d
```

```bash
# Create database
mysql -u root -p
CREATE DATABASE cmscrm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Seed database
npm run seed

# Start backend server
npm run dev
```

### 3. Frontend Setup

```bash
# Navigate to frontend (in new terminal)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## � Demo Accounts

The system includes pre-configured demo accounts demonstrating the enhanced permission system:

### 🛡️ Super Admin Account
- **Username:** `superadmin@cmscrm.com`
- **Password:** `SuperAdmin123!`
- **Access:** Complete system control, all pages, all operations

### 👤 Regular User Account ⭐ **Enhanced Features**
- **Username:** `user@cmscrm.com`
- **Password:** `User123!`
- **Key Features:** 
  - ✅ **5 Assigned Pages** - Full CRUD access to users, roles, and pages
  - ✅ **No Access Denied Messages** - Seamless navigation experience
  - ✅ **Dashboard Access** - Real-time statistics and recent activity
  - ✅ **Perfect Pagination** - Test the enhanced Recent Activity (shows ~33 pages for 320+ items)

> **🎯 Testing Highlight**: Login as `user` to experience the core improvement - users with assigned pages can perform all CRUD operations without permission restrictions, demonstrating the enhanced flexible access control system.

## 📈 Recent Enhancements (October 2025)

### ✅ Latest Features - System Monitoring & PM2 Integration
1. **Interactive Dashboard Overhaul**
   - Replaced Recent Activity with real-time system performance graphs
   - Integrated Chart.js for CPU, memory, and API call visualization
   - Added system information panel with PM2 process monitoring
   - Live data refresh every 30-60 seconds with loading states

2. **PM2 Process Management**
   - Production-ready process management with ecosystem configuration
   - Auto-restart, memory limits, and log management
   - Comprehensive monitoring commands and health checks
   - Zero-downtime deployments and clustering support

3. **Enhanced System APIs**
   - New `/system/*` endpoints for performance, info, processes, health
   - Real-time CPU and memory usage monitoring
   - PM2 process status integration and resource tracking
   - Historical performance data with proper pagination

### ✅ Previous Features
1. **Permission System Overhaul**
   - Removed "Access Denied" blocks for users with assigned pages
   - Implemented `requireAssignedPages` middleware
   - Enhanced RBAC with flexible page-based permissions

2. **API & Performance Enhancements**
   - Fixed parameter passing and improved backend validation
   - Updated all routes to use consistent permission middleware
   - Added comprehensive system monitoring and analytics

## 🚦 Quick Start

### Development Mode
1. **Start Backend Server**
   ```bash
   cd backend && npm run dev
   # ✅ Server runs on http://localhost:5000
   # ✅ Database connects automatically
   # ✅ System monitoring endpoints active
   ```

2. **Start Frontend Development Server**
   ```bash
   cd frontend && npm run dev
   # ✅ App runs on http://localhost:5173
   # ✅ Vite 7.1.9 with React 19.1.1 + Chart.js
   # ✅ Hot reload enabled with live charts
   ```

### Production Mode with PM2
1. **Start with PM2**
   ```bash
   cd backend && npm run pm2:start
   # ✅ Production process management
   # ✅ Auto-restart and monitoring
   # ✅ Log management and clustering
   ```

2. **Monitor System Performance**
   ```bash
   npm run pm2:monit    # Terminal monitoring
   npm run pm2:logs     # View logs
   npm run pm2:status   # Check status
   ```

3. **Test the Enhanced System**
   - Open browser to `http://localhost:5173`
   - Login as **`user`** (password: `User123!`)
   - ✅ **Access Dashboard** - No permission errors
   - ✅ **Test Recent Activity** - Click Next/Previous buttons
   - ✅ **CRUD Operations** - Full access to Users, Roles, Pages management
   - ✅ **Seamless Navigation** - No "Access Denied" messages

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password

### User Management Endpoints
- `GET /api/users` - Get all users (admin)
- `POST /api/users` - Create user (admin)
- `PUT /api/users/:id` - Update user (admin)
- `DELETE /api/users/:id` - Delete user (admin)
- `POST /api/users/assign-role` - Assign role to user (admin)

### Role Management Endpoints
- `GET /api/roles` - Get all roles (admin)
- `POST /api/roles` - Create role (admin)
- `PUT /api/roles/:id` - Update role (admin)
- `DELETE /api/roles/:id` - Delete role (admin)
- `POST /api/roles/assign-pages` - Assign pages to role (admin)

### Statistics Endpoints
- `GET /api/stats/dashboard` - Dashboard statistics
- `GET /api/stats/activity` - Activity statistics (admin)
- `GET /api/stats/login` - Login statistics (admin)
- `GET /api/stats/health` - System health (admin)

## 🗄️ Database Schema

### Core Tables
- **users** - User accounts and authentication
- **roles** - System roles and permissions
- **pages** - Application pages and navigation
- **user_roles** - User-role assignments (many-to-many)
- **role_pages** - Role-page permissions (many-to-many)

### Logging Tables
- **activity_logs** - User activity tracking
- **login_activities** - Login/logout tracking
- **api_stats** - API performance metrics

## 🔒 Security Features

- **JWT Authentication** with refresh tokens
- **bcrypt Password Hashing** with salt rounds
- **Rate Limiting** to prevent brute force attacks
- **Input Validation** using express-validator
- **CORS Protection** with configurable origins
- **Helmet.js Security Headers**
- **Role-Based Access Control** (RBAC)
- **Activity Logging** for audit trails

## 🎨 UI/UX Features

- **Responsive Design** - Mobile-first approach
- **Dark/Light Theme** - System preference detection
- **Loading States** - Smooth user experience
- **Form Validation** - Real-time feedback
- **Toast Notifications** - Success/error messages
- **Accessible Design** - WCAG compliance
- **Progressive Enhancement** - Works without JavaScript

## 📱 Supported Browsers

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🚀 Production Deployment

### Backend Deployment
1. Set `NODE_ENV=production` in environment
2. Configure production database
3. Set secure JWT secret
4. Enable HTTPS
5. Configure reverse proxy (nginx/Apache)

### Frontend Deployment
1. Build production bundle: `npm run build`
2. Deploy `dist/` folder to web server
3. Configure routing for SPA
4. Set up SSL certificate

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

### Frontend Testing
```bash
cd frontend
npm test                # Run component tests
npm run test:e2e        # End-to-end tests
```

## 📈 Performance

- **Backend**: Express.js with connection pooling
- **Frontend**: React with Vite bundler
- **Database**: MySQL with optimized indexes
- **Caching**: Response caching and compression
- **CDN**: Static asset optimization

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=password
DB_NAME=cmscrm
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=2d
CORS_ORIGIN=http://localhost:5173
```

**Frontend (.env):**
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=CMSCRM
VITE_APP_VERSION=1.0.0
```

## 📝 Development

### Code Style
- **ESLint** for code linting
- **Prettier** for code formatting
- **Conventional Commits** for commit messages

### Available Scripts

**Backend:**
- `npm start` - Start production server
- `npm run dev` - Start development server
- `npm run seed` - Seed database
- `npm test` - Run tests

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'Add new feature'`
4. Push branch: `git push origin feature/new-feature`
5. Submit pull request

## 📄 License

This project is licensed under the ISC License. See the LICENSE file for details.

## 🆘 Support

For support and questions:
- **Email**: support@cmscrm.com
- **Documentation**: [Wiki](https://github.com/your-repo/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)

## 📊 System Requirements

### Minimum Requirements
- **RAM**: 4GB
- **Storage**: 2GB free space
- **CPU**: Dual-core 2GHz

### Recommended Requirements
- **RAM**: 8GB or more
- **Storage**: 10GB free space
- **CPU**: Quad-core 2.5GHz or better

---

**Version**: 1.0.0  
**Last Updated**: October 2025  
**Status**: Production Ready