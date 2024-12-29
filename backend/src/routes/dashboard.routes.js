import express from 'express';
import { validateToken } from '../middleware/validateToken.js';
import { getDashboardData } from '../controllers/dashboard.controller.js';

const router = express.Router();

router.get('/', validateToken, getDashboardData);

export default router; 