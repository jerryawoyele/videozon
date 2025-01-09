import express from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import eventRoutes from './event.routes.js';
import messageRoutes from './message.routes.js';
import notificationRoutes from './notification.routes.js';
import professionalRoutes from './professional.routes.js';
import gigRoutes from './gig.routes.js';
import paymentRoutes from './payment.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/events', eventRoutes);
router.use('/messages', messageRoutes);
router.use('/notifications', notificationRoutes);
router.use('/professionals', professionalRoutes);
router.use('/gigs', gigRoutes);
router.use('/payments', paymentRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
