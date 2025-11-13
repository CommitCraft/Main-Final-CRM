const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const fileUpload = require('express-fileupload');
const path = require('path');
const os = require('os');
require('dotenv').config();

const db = require('./src/config/db');
const routes = require('./src/routes');
const { errorHandler } = require('./src/middleware/errorHandler');
const enhancedSystemMonitor = require('./src/utils/enhancedSystemMonitor');

const app = express();

// 🌐 Environment Variables
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST_IP || '0.0.0.0';

// 📊 Dynamic local IP (fallback for console logs)
const networkInterfaces = os.networkInterfaces();
let localIP = 'localhost';
for (const iface of Object.values(networkInterfaces)) {
  for (const info of iface) {
    if (info.family === 'IPv4' && !info.internal) {
      localIP = info.address;
      break;
    }
  }
}

// 🛡️ Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: 'Too many requests from this IP, please try again later.'
});

// 🔧 Middlewares
app.use(limiter);
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors({
  origin: process.env.CORS_ORIGIN || `http://${localIP}:8800`,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(fileUpload({
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
  abortOnLimit: true,
  responseOnLimit: 'File size limit exceeded'
}));

// 🗂️ Static File Serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 📡 API Monitoring
app.use('/api', (req, res, next) => {
  enhancedSystemMonitor.incrementApiCall();
  next();
});

// 🧭 Routes
app.use('/api', routes);

// 🩺 Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CMSCRM Backend Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// 🏠 Root Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to CMSCRM Backend API',
    version: '1.0.0',
    documentation: '/api/docs'
  });
});

// ❌ 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// 🧯 Error Handler (must be last)
app.use(errorHandler);

// 🚀 Start Server
const startServer = async () => {
  try {
    await db.execute('SELECT 1');
    console.log('✅ Database connected successfully');

    app.listen(PORT, HOST, () => {
      const displayHost = HOST === '0.0.0.0' ? localIP : HOST;
      console.log(`🚀 CMSCRM Backend Server running on http://${displayHost}:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health Check: http://${displayHost}:${PORT}/health`);
      console.log(`📚 API Base: http://${displayHost}:${PORT}/api`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// 🧩 Process Handlers
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

startServer();
