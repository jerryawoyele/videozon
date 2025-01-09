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

// Gigs routes (must come before /:id route)
router.get('/gigs', validateToken, getProfessionalGigs);
router.post('/gigs', validateToken, createGig);
router.put('/gigs/:id', validateToken, updateGig);
router.delete('/gigs/:id', validateToken, deleteGig);

// Professional by ID route (must come after /gigs)
router.get('/:id', validateToken, getProfessionalById);

export default router;
