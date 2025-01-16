import express from 'express';
import { validateToken } from '../middleware/validateToken.js';
import { upload } from '../middleware/upload.js';
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
  getUserStatus,
  getSettings,
  updateSettings,
  getBanks,
  verifyBankAccount,
  getProfessionalDetails
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
router.patch('/profile', validateToken, upload.single('avatar'), updateProfile);
router.post('/status', validateToken, updateUserStatus);
router.get('/:userId/status', validateToken, getUserStatus);
router.get('/settings', validateToken, getSettings);
router.patch('/settings', validateToken, updateSettings);
router.get('/banks', validateToken, getBanks);
router.post('/verify-bank-account', validateToken, verifyBankAccount);
router.get('/professionals/:id', validateToken, getProfessionalDetails);

export default router; 