# CMSCRM Backend API

A comprehensive CRM system backend built with Node.js, Express, and MySQL.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Complete CRUD operations with role assignments
- **Role & Permission System**: Flexible role-based page access control
- **Page Management**: Dynamic page creation with icon uploads
- **Activity Logging**: Comprehensive audit trail and user activity tracking
- **Statistics & Monitoring**: Dashboard stats, API performance monitoring
- **Data Export**: Multiple format exports (CSV, JSON, PDF)
- **Security**: Rate limiting, input validation, password hashing

## 📋 Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your database credentials:
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

4. **Create MySQL database**
   ```sql
   CREATE DATABASE cmscrm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

5. **Run database migrations and seed data**
   ```bash
   npm run seed
   ```

6. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/verify` - Verify token
- `GET /api/auth/login-history` - Get login history

### User Management Endpoints
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (admin)
- `PUT /api/users/:id` - Update user (admin)
- `DELETE /api/users/:id` - Delete user (admin)
- `GET /api/users/:id/roles` - Get user roles
- `POST /api/users/assign-role` - Assign role to user (admin)
- `POST /api/users/remove-role` - Remove role from user (admin)

### Role Management Endpoints
- `GET /api/roles` - Get all roles (admin)
- `GET /api/roles/simple` - Get simple roles list
- `GET /api/roles/:id` - Get role by ID (admin)
- `POST /api/roles` - Create role (admin)
- `PUT /api/roles/:id` - Update role (admin)
- `DELETE /api/roles/:id` - Delete role (admin)
- `GET /api/roles/:id/pages` - Get role pages (admin)
- `POST /api/roles/assign-pages` - Assign pages to role (admin)

### Page Management Endpoints
- `GET /api/pages` - Get all pages (admin)
- `GET /api/pages/simple` - Get simple pages list (admin)
- `GET /api/pages/my-pages` - Get user accessible pages
- `GET /api/pages/:id` - Get page by ID (admin)
- `POST /api/pages` - Create page (admin)
- `PUT /api/pages/:id` - Update page (admin)
- `DELETE /api/pages/:id` - Delete page (admin)
- `GET /api/pages/access/:pageUrl` - Check page access

### Statistics Endpoints
- `GET /api/stats/dashboard` - Get dashboard statistics
- `GET /api/stats/activity` - Get activity statistics (admin)
- `GET /api/stats/login` - Get login statistics (admin)
- `GET /api/stats/api` - Get API statistics (admin)
- `GET /api/stats/health` - Get system health (admin)
- `GET /api/stats/recent-activity` - Get recent activity
- `GET /api/stats/active-users` - Get active users (admin)

### Export Endpoints
- `GET /api/exports/users` - Export users data (admin)
- `GET /api/exports/roles` - Export roles data (admin)
- `GET /api/exports/pages` - Export pages data (admin)
- `GET /api/exports/activity-logs` - Export activity logs (admin)
- `GET /api/exports/login-activities` - Export login activities (admin)
- `GET /api/exports/download/:filename` - Download exported file (admin)

## 🔐 Default Credentials

After seeding the database, use these credentials:

**Super Admin:**
- Email: `superadmin@cmscrm.com`
- Password: `SuperAdmin123!`

**Admin:**
- Email: `admin@cmscrm.com`
- Password: `Admin123!`

**Manager:**
- Email: `manager@cmscrm.com`
- Password: `Manager123!`

**User:**
- Email: `user@cmscrm.com`
- Password: `User123!`

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js                 # Database configuration
│   ├── controllers/
│   │   ├── authController.js     # Authentication logic
│   │   ├── userController.js     # User management
│   │   ├── roleController.js     # Role management
│   │   ├── pageController.js     # Page management
│   │   ├── statsController.js    # Statistics & monitoring
│   │   └── exportController.js   # Data export
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── rbac.js              # Role-based access control
│   │   ├── activityLogger.js    # Activity logging
│   │   ├── errorHandler.js      # Error handling
│   │   └── validation.js        # Input validation
│   ├── models/
│   │   ├── user.js              # User model
│   │   ├── role.js              # Role model
│   │   ├── page.js              # Page model
│   │   ├── activityLog.js       # Activity log model
│   │   ├── loginActivity.js     # Login activity model
│   │   ├── userRole.js          # User-Role relations
│   │   └── index.js             # Model exports
│   ├── routes/
│   │   ├── authRoutes.js        # Auth routes
│   │   ├── userRoutes.js        # User routes
│   │   ├── roleRoutes.js        # Role routes
│   │   ├── pageRoutes.js        # Page routes
│   │   ├── statsRoutes.js       # Stats routes
│   │   ├── exportRoutes.js      # Export routes
│   │   └── index.js             # Route aggregator
│   ├── seed/
│   │   └── seed.js              # Database seeding
│   └── utils/
│       ├── exporters.js         # Export utilities
│       └── paginator.js         # Pagination utilities
├── uploads/                     # File uploads
├── exports/                     # Export files
├── .env                         # Environment variables
├── package.json                 # Dependencies
└── server.js                    # Main server file
```

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt with salt rounds
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: Express-validator for all inputs
- **CORS Protection**: Configurable CORS policies
- **Helmet.js**: Security headers
- **Role-based Access**: Fine-grained permission control

## 📊 Database Schema

### Core Tables:
- `users` - User accounts
- `roles` - System roles
- `pages` - Application pages
- `user_roles` - User-role assignments
- `role_pages` - Role-page permissions

### Logging Tables:
- `activity_logs` - User activity tracking
- `login_activities` - Login/logout tracking
- `api_stats` - API performance metrics

## 🔧 Configuration

### Environment Variables:
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `DB_*` - Database connection settings
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRES_IN` - Token expiration time
- `CORS_ORIGIN` - Allowed CORS origins
- `RATE_LIMIT_*` - Rate limiting configuration

### Features Configuration:
- File upload limits
- Export formats
- Pagination defaults
- Logging retention

## 🚦 Health Monitoring

- **Health Check**: `GET /health`
- **API Status**: `GET /api/status`
- **System Health**: `GET /api/stats/health`
- **Performance Metrics**: Automatic API latency tracking

## 📈 Performance

- **Connection Pooling**: MySQL connection pool
- **Response Compression**: Gzip compression
- **Caching Headers**: Appropriate cache control
- **Query Optimization**: Indexed database queries

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

For support, email support@cmscrm.com or create an issue in the repository.