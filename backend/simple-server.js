const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5001;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Simple test data
const mockData = {
  performance: {
    cpu: { usage: 45.2, cores: 8, speed: 2.4 },
    memory: { used: 8.5, total: 16, percentage: 53 },
    disk: { used: 256, total: 512, percentage: 50 }
  },
  systemInfo: {
    platform: 'Windows',
    arch: 'x64',
    hostname: 'localhost',
    uptime: 86400,
    loadAverage: [1.2, 1.1, 0.9]
  },
  processes: [
    { pid: 1234, name: 'node', cpu: 10.5, memory: 125 },
    { pid: 5678, name: 'chrome', cpu: 15.2, memory: 256 }
  ]
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// System endpoints with mock data
app.get('/api/system/performance', (req, res) => {
  res.json({ success: true, data: mockData.performance });
});

app.get('/api/system/info', (req, res) => {
  res.json({ success: true, data: mockData.systemInfo });
});

app.get('/api/system/cpu', (req, res) => {
  res.json({ success: true, data: mockData.performance.cpu });
});

app.get('/api/system/memory', (req, res) => {
  res.json({ success: true, data: mockData.performance.memory });
});

app.get('/api/system/network', (req, res) => {
  res.json({ success: true, data: { rx: 1024, tx: 512, connections: 25 } });
});

app.get('/api/system/processes', (req, res) => {
  res.json({ success: true, data: mockData.processes });
});

app.get('/api/system/process-stats', (req, res) => {
  res.json({ success: true, data: { totalProcesses: 150, activeProcesses: 120 } });
});

app.get('/api/system/health', (req, res) => {
  res.json({ success: true, data: { status: 'healthy', uptime: 86400 } });
});

// Mock pages endpoint for sidebar
app.get('/api/pages/my-pages', (req, res) => {
  res.json({ 
    success: true, 
    data: [
      { id: 1, name: 'Dashboard', url: '/dashboard', active: true },
      { id: 2, name: 'Users', url: '/users', active: true },
      { id: 3, name: 'Reports', url: '/reports', active: true }
    ]
  });
});

// Mock stats endpoints for dashboard
app.get('/api/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      totalUsers: 5,
      activeRoles: 4,
      totalPages: 5,
      activeUsers: 4,
      avgLatency: 8
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple test server running on http://localhost:${PORT}`);
  console.log(`🔗 CORS enabled for: http://localhost:5173`);
  console.log('\n📊 Available endpoints:');
  console.log('  GET /api/health');
  console.log('  GET /api/system/performance');
  console.log('  GET /api/system/info');
  console.log('  GET /api/system/cpu');
  console.log('  GET /api/system/memory');
  console.log('  GET /api/system/network');
  console.log('  GET /api/system/processes');
  console.log('  GET /api/system/process-stats');
  console.log('  GET /api/pages/my-pages');
  console.log('  GET /api/stats');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

module.exports = app;