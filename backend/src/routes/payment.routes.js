import express from 'express';
import { validateToken } from '../middleware/validateToken.js';
import { verifyPayment, getPaymentsByGig } from '../controllers/payment.controller.js';

const router = express.Router();

router.use(validateToken);

// Payment verification route
router.post('/verify', verifyPayment);

// Get payments by gig
router.get('/gig/:gigId', getPaymentsByGig);

export default router; 