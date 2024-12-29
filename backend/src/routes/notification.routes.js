import express from 'express';
import { validateToken } from '../middleware/validateToken.js';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../controllers/notification.controller.js';

const router = express.Router();

router.get('/unread-count', validateToken, getUnreadCount);
router.get('/', validateToken, getNotifications);
router.patch('/:id/read', validateToken, markAsRead);
router.patch('/mark-all-read', validateToken, markAllAsRead);
router.delete('/:id', validateToken, deleteNotification);

export default router;
