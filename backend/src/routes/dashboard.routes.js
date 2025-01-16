import express from 'express';
import { validateToken } from '../middleware/validateToken.js';
import { getDashboardStats } from '../controllers/dashboard.controller.js';

const router = express.Router();

router.use(validateToken);
router.get('/stats', getDashboardStats);

export default router; 