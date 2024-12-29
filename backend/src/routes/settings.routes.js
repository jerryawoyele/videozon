import express from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authenticateToken, getSettings);
router.patch('/', authenticateToken, updateSettings);

export default router;
