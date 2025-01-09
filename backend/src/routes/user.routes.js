import express from 'express';
import { validateToken } from '../middleware/validateToken.js';
import {upload} from '../middleware/upload.js';
import {
  getProfessionals,
  getProfessionalProfile,
  updateAvailability,
  getAvailability,
  addPortfolioItem,
  getPortfolio,
  getProfile,
  updateProfile,
  updateUserStatus,
  getUserStatus
} from '../controllers/user.controller.js';

const router = express.Router();

router.get('/professionals', validateToken, getProfessionals);
router.get('/professionals/:id', validateToken, getProfessionalProfile);
router.post('/availability', validateToken, updateAvailability);
router.put('/availability', validateToken, updateAvailability);
router.get('/availability', validateToken, getAvailability);
router.get('/portfolio', validateToken, getPortfolio);
router.post('/portfolio', validateToken, upload.single('image'), addPortfolioItem);
router.get('/profile', validateToken, getProfile);
router.put('/profile', validateToken, upload.single('avatar'), updateProfile);
router.post('/status', validateToken, updateUserStatus);
router.get('/:userId/status', validateToken, getUserStatus);

export default router; 