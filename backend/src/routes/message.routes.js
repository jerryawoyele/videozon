import express from 'express';
import { validateToken } from '../middleware/validateToken.js';
import {
  getMessages,
  getConversations,
  getSentRequests,
  getReceivedRequests,
  sendMessage,
  updateMessage,
  deleteMessage,
  acceptHireRequest,
  rejectHireRequest,
  createServiceRequest,
  createServiceOffer,
  getConversationMessages,
  replyToMessage,
  getMessageHistory,
  markConversationAsRead,
  checkRequest,
  getServiceRequests,
  acceptServiceMessage,
  rejectServiceMessage,
  acceptServiceOffer,
  rejectServiceOffer
} from '../controllers/message.controller.js';

const router = express.Router();

// Add debugging middleware
router.use((req, res, next) => {
  console.log('Message route accessed:', {
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    query: req.query,
    body: req.body
  });
  next();
});

router.use(validateToken);

// General message routes
router.get('/', async (req, res, next) => {
  try {
    await getMessages(req, res);
  } catch (error) {
    console.error('Route error:', error);
    next(error);
  }
});
router.get('/conversations', getConversations);
router.get('/sent-requests', getSentRequests);
router.get('/received-requests', getReceivedRequests);
router.post('/', sendMessage);

// Message actions
router.put('/:id', updateMessage);
router.put('/:id/delete', deleteMessage);
router.get('/:id/history', getMessageHistory);

// Request actions
router.get('/service-requests/:professionalId', getServiceRequests);
router.get('/check-request/:professionalId/:eventId', checkRequest);
router.put('/:messageId/accept-hire-request', acceptHireRequest);
router.put('/:messageId/reject-hire-request', rejectHireRequest);
router.put('/:messageId/accept-service-request', acceptServiceMessage);
router.put('/:messageId/reject-service-request', rejectServiceMessage);
router.put('/:messageId/accept-service-offer', acceptServiceOffer);
router.put('/:messageId/reject-service-offer', rejectServiceOffer);

// Service-specific routes
router.post('/service-request', createServiceRequest);
router.post('/service-offer', createServiceOffer);

// Conversation routes
router.get('/conversation/:partnerId', getConversationMessages);
router.post('/:partnerId/reply', replyToMessage);
router.put('/conversation/:partnerId/read', markConversationAsRead);

export default router;
