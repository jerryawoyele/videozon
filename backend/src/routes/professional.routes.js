import express from 'express';
import { validateToken } from '../middleware/validateToken.js';
import { 
  getAllProfessionals,
  getProfessionalById,
  getProfessionalGigs,
  createGig,
  updateGig,
  deleteGig
} from '../controllers/professional.controller.js';

const router = express.Router();

// Professional routes
router.get('/', validateToken, getAllProfessionals);
router.get('/:id', validateToken, getProfessionalById);

// Gigs routes (nested under professionals)
router.get('/gigs', validateToken, getProfessionalGigs);
router.post('/gigs', validateToken, createGig);
router.put('/gigs/:id', validateToken, updateGig);
router.delete('/gigs/:id', validateToken, deleteGig);

export default router;
