import express from 'express';
import { 
  createGig, 
  updateGig, 
  deleteGig, 
  getGig, 
  listGigs,
  searchGigs 
} from '../controllers/gig.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateGig } from '../middleware/validation.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.get('/search', searchGigs);
router.get('/:id', getGig);
router.get('/', listGigs);

router.use(authenticate); // Protected routes below

router.post('/', upload.array('images', 5), validateGig, createGig);
router.put('/:id', upload.array('images', 5), validateGig, updateGig);
router.delete('/:id', deleteGig);

export default router; 