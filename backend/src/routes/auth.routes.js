import express from 'express';
import {
  register,
  login,
  verifyEmail,
  resendVerification,
  resetPassword
} from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/reset-password', resetPassword);

export default router; 