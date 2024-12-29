import express from 'express';
import {
  createOrder,
  getOrder,
  listOrders,
  updateOrderStatus,
  deliverOrder
} from '../controllers/order.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/', createOrder);
router.get('/:id', getOrder);
router.get('/', listOrders);
router.put('/:id/status', updateOrderStatus);
router.put('/:id/deliver', deliverOrder);

export default router; 