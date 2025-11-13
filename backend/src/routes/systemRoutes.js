const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { auth } = require('../middleware/auth');

// All system routes require authentication
router.use(auth);

// Enhanced system performance routes
router.get('/performance', systemController.getSystemPerformance);
router.get('/info', systemController.getSystemInfo);
router.get('/processes', systemController.getProcesses);
router.get('/status', systemController.getCompleteStatus);
router.get('/health', systemController.getHealthCheck);

// Detailed metrics routes
router.get('/cpu', systemController.getCpuMetrics);
router.get('/memory', systemController.getMemoryMetrics);
router.get('/network', systemController.getNetworkStats);
router.get('/process-stats', systemController.getProcessStats);

module.exports = router;