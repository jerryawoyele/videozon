import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getGig, getGigsByProfessional, getGigsByClient } from '../controllers/gig.controller.js';

const router = express.Router();

// Get gigs where user is the professional
router.get('/professional', authenticate, getGigsByProfessional);

// Get gigs where user is the client
router.get('/client', authenticate, getGigsByClient);

// Get a specific gig by ID
router.get('/:id', authenticate, getGig);

export default router; 