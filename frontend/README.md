# CMSCRM Frontend

A modern, responsive CRM system frontend built with React, Vite, and Tailwind CSS.

## 🚀 Features

- **Modern UI/UX**: Clean, intuitive interface with responsive design
- **Light/Dark Mode**: Theme switching with system preference detection
- **Authentication**: JWT-based authentication with protected routes
- **Role-Based Access**: Different access levels based on user roles
- **Real-time Updates**: Live data updates and notifications
- **Mobile Responsive**: Optimized for all device sizes
- **Fast Performance**: Built with Vite for lightning-fast development and builds

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API running on port 5000

## 🛠️ Installation

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Preview production build**
   ```bash
   npm run preview
   ```

## 🔐 Demo Credentials

Use these credentials to test different user roles:

**Super Admin:**
- Email: `superadmin@cmscrm.com`
- Password: `SuperAdmin123!`
- Access: Full system access including system settings

**Admin:**
- Email: `admin@cmscrm.com`
- Password: `Admin123!`
- Access: User management, roles, pages, and reports

**Manager:**
- Email: `manager@cmscrm.com`
- Password: `Manager123!`
- Access: Limited user management and reporting

**User:**
- Email: `user@cmscrm.com`
- Password: `User123!`
- Access: Basic dashboard and profile management

## 📁 Project Structure

```
frontend/
├── public/                  # Static assets
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout/         # Layout components
│   │   ├── Forms/          # Form components
│   │   ├── Tables/         # Table components
│   │   └── Common/         # Common UI elements
│   ├── pages/              # Page components
│   │   ├── LoginPage.jsx   # Authentication page
│   │   ├── DashboardPage.jsx # Main dashboard
│   │   ├── UsersPage.jsx   # User management
│   │   ├── RolesPage.jsx   # Role management
│   │   └── PagesPage.jsx   # Page management
│   ├── context/            # React contexts
│   │   ├── AuthContext.jsx # Authentication state
│   │   └── ThemeContext.jsx # Theme management
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   │   ├── api.js          # API client setup
│   │   └── helpers.js      # Helper functions
│   ├── App.jsx             # Main app component
│   ├── main.jsx           # App entry point
│   └── index.css          # Global styles
├── tailwind.config.js      # Tailwind configuration
├── vite.config.js         # Vite configuration
└── package.json           # Dependencies
```

## 🎨 Theme System

The application supports both Light and Dark modes:

- **Auto Detection**: Respects system preference on first visit
- **Manual Toggle**: Theme toggle button in navigation
- **Persistence**: Theme choice saved in localStorage
- **Smooth Transitions**: Animated theme transitions

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Protected Routes**: Route-level access control
- **Role-Based Access**: Component-level permission checks
- **Auto Logout**: Automatic logout on token expiration
- **CSRF Protection**: Cross-site request forgery protection

## 📱 Responsive Design

- **Mobile First**: Designed for mobile devices first
- **Breakpoints**: Tailored for all screen sizes
- **Touch Friendly**: Optimized touch targets
- **Flexible Layouts**: Adaptive grid systems

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the frontend root:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=CMSCRM
VITE_APP_VERSION=1.0.0
```

### API Configuration

The API client is configured in `src/utils/api.js`:

- Base URL: `http://localhost:5000/api`
- Timeout: 10 seconds
- Automatic token attachment
- Error handling and retries

## 🚦 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- **ESLint**: Code linting with React rules
- **Prettier**: Code formatting (recommended)
- **Conventional Commits**: Commit message format

## 📊 Performance

- **Code Splitting**: Automatic route-based splitting
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Image and asset optimization
- **Caching**: Intelligent browser caching

## 🧪 Testing

### Testing Strategy

- **Unit Tests**: Component-level testing
- **Integration Tests**: Feature-level testing
- **E2E Tests**: End-to-end user flows

### Test Accounts

All demo accounts are pre-configured in the backend. Use the credentials above to test different user roles and permissions.

## 🚀 Deployment

### Build Process

1. **Environment Setup**
   ```bash
   npm install
   ```

2. **Production Build**
   ```bash
   npm run build
   ```

3. **Deploy Files**
   - Upload `dist/` folder contents
   - Configure web server
   - Set up SSL certificate

### Deployment Targets

- **Netlify**: Automatic deployments from Git
- **Vercel**: Zero-config deployments
- **Apache/Nginx**: Traditional web servers
- **Docker**: Containerized deployments

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Push branch (`git push origin feature/new-feature`)
5. Create Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Email: support@cmscrm.com
- Documentation: [Project Wiki]
- Issues: [GitHub Issues]
