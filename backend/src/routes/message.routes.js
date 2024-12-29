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
  acceptRequest,
  rejectRequest,
  createServiceRequest,
  createServiceOffer,
  getConversationMessages,
  replyToMessage,
  getMessageHistory
} from '../controllers/message.controller.js';

const router = express.Router();

router.use(validateToken);

// General message routes
router.get('/', getMessages);
router.get('/conversations', getConversations);
router.get('/sent-requests', getSentRequests);
router.get('/received-requests', getReceivedRequests);
router.post('/', sendMessage);

// Message actions
router.put('/:id', updateMessage);
router.delete('/:id', deleteMessage);
router.get('/:id/history', getMessageHistory);

// Request actions
router.put('/:messageId/accept', acceptRequest);
router.put('/:messageId/reject', rejectRequest);

// Service-specific routes
router.post('/service-request', createServiceRequest);
router.post('/service-offer', createServiceOffer);

// Conversation routes
router.get('/conversation/:partnerId', getConversationMessages);
router.post('/:partnerId/reply', replyToMessage);

export default router;
