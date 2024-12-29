import express from 'express';
import userRoutes from './user.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import eventRoutes from './event.routes.js';
import settingsRoutes from './settings.routes.js';
import messageRoutes from './message.routes.js';
import notificationRoutes from './notification.routes.js';
import professionalRoutes from './professional.routes.js';
import authRoutes from './auth.routes.js';

const router = express.Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/events', eventRoutes);
router.use('/users/settings', settingsRoutes);
router.use('/professionals', professionalRoutes); // This will include gigs routes
router.use('/messages', messageRoutes);
router.use('/notifications', notificationRoutes);

export default router;
