import express from 'express';
import { validateToken } from '../middleware/validateToken.js';
import { getDashboardData } from '../controllers/dashboard.controller.js';

const router = express.Router();

router.use(validateToken);

// Get dashboard data
router.get('/', getDashboardData);

export default router; 