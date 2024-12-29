import express from 'express';
import { validateToken } from '../middleware/validateToken.js';
import { upload, handleMulterError } from '../config/multer.js';
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  addProfessional,
  removeProfessional,
  getMyEvents,
  getAllEvents
} from '../controllers/event.controller.js';

const router = express.Router();

// Create event route with file upload middleware and error handling
router.post('/', 
  validateToken, 
  upload.array('images', 10), 
  handleMulterError, 
  createEvent
);

// Get events routes
router.get('/all', validateToken, getAllEvents);
router.get('/my-events', validateToken, getMyEvents); // This must come before /:id route
router.get('/', validateToken, getEvents);
router.get('/:id', validateToken, getEventById);

// Update and delete routes
router.put('/:id', validateToken, updateEvent);
router.delete('/:id', validateToken, deleteEvent);

// Professional management routes
router.post('/:eventId/professionals', validateToken, addProfessional);
router.delete('/:eventId/professionals/:professionalId', validateToken, removeProfessional);

export default router;
