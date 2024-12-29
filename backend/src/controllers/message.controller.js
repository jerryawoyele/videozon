import Message from '../models/message.model.js';
import { successResponse, httpResponses } from '../utils/apiResponse.js';
import logger from '../config/logger.js';
import NotificationService from '../services/notification.service.js';
import User from '../models/user.model.js';

export const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all messages for the user
    const allMessages = await Message.find({
      $or: [
        { sender: userId },
        { receiver: userId }
      ],
      isDeleted: false
    })
    .populate('sender', 'name avatar')
    .populate('receiver', 'name avatar')
    .populate('relatedEvent', 'title')
    .populate('parentMessage', 'content type')
    .sort({ createdAt: -1 });

    // Filter and group conversations by latest message
    const conversationGroups = allMessages
      .filter(msg => msg.type === 'message')
      .reduce((groups, msg) => {
        const partnerId = msg.sender._id.toString() === userId ? 
          msg.receiver._id.toString() : 
          msg.sender._id.toString();
        
        if (!groups[partnerId] || new Date(msg.createdAt) > new Date(groups[partnerId].createdAt)) {
          groups[partnerId] = msg;
        }
        return groups;
      }, {});

    const conversations = Object.values(conversationGroups);
    
    const sentRequests = allMessages.filter(msg => 
      msg.type === 'service_request' && 
      msg.sender._id.toString() === userId
    );
    
    const receivedRequests = allMessages.filter(msg => 
      msg.type === 'service_request' && 
      msg.receiver._id.toString() === userId
    );

    return successResponse(res, 200, 'Messages retrieved successfully', {
      conversations,
      sentRequests,
      receivedRequests
    });
  } catch (error) {
    logger.error('Get messages error:', error);
    return httpResponses.serverError(res, 'Failed to fetch messages');
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await Message.find({
      $or: [
        { sender: userId, type: 'message' },
        { receiver: userId, type: 'message' }
      ],
      isDeleted: false
    })
    .populate('sender', 'name avatar')
    .populate('receiver', 'name avatar')
    .sort({ createdAt: -1 });

    return successResponse(res, 200, 'Conversations retrieved successfully', { conversations });
  } catch (error) {
    logger.error('Get conversations error:', error);
    return httpResponses.serverError(res, 'Failed to fetch conversations');
  }
};

export const getSentRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const requests = await Message.find({
      sender: userId,
      type: { $in: ['service_request', 'service_offer'] },
      isDeleted: false
    })
    .populate('receiver', 'name avatar')
    .populate('relatedEvent')
    .sort({ createdAt: -1 });

    return successResponse(res, 200, 'Sent requests retrieved successfully', { requests });
  } catch (error) {
    logger.error('Get sent requests error:', error);
    return httpResponses.serverError(res, 'Failed to fetch sent requests');
  }
};

export const getReceivedRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const requests = await Message.find({
      receiver: userId,
      type: { $in: ['service_request', 'service_offer'] },
      isDeleted: false
    })
    .populate('sender', 'name avatar')
    .populate('relatedEvent')
    .sort({ createdAt: -1 });

    return successResponse(res, 200, 'Received requests retrieved successfully', { requests });
  } catch (error) {
    logger.error('Get received requests error:', error);
    return httpResponses.serverError(res, 'Failed to fetch received requests');
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { receiverId, content, type = 'message', eventId, service, parentMessageId } = req.body;
    const userId = req.user.id;

    const messageData = {
      sender: userId,
      receiver: receiverId,
      content,
      type,
      status: 'unread'
    };

    // Only add optional fields if they exist
    if (eventId) messageData.relatedEvent = eventId;
    if (service) messageData.service = service;
    if (parentMessageId) messageData.parentMessage = parentMessageId;

    const message = new Message(messageData);
    await message.save();
    await message.populate('sender', 'name');
    await message.populate('relatedEvent', 'title');
    
    // Create notification for new message
    if (message.type === 'message') {
      await NotificationService.notifyNewMessage(message);
    } else if (message.type === 'service_request') {
      await NotificationService.notifyServiceRequested({
        professional: message.receiver,
        organizer: message.sender._id,
        event: message.relatedEvent
      });
    }

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .populate('relatedEvent', 'title')
      .populate('parentMessage', 'content type');

    return successResponse(res, 201, 'Message sent successfully', { message: populatedMessage });
  } catch (error) {
    logger.error('Send message error:', error);
    return httpResponses.serverError(res, 'Failed to send message');
  }
};

export const updateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const message = await Message.findById(id);

    if (!message) {
      return httpResponses.notFound(res, 'Message not found');
    }

    // Only sender can update their message
    if (message.sender.toString() !== userId) {
      return httpResponses.forbidden(res, 'Not authorized to update this message');
    }

    // Store the current version before updating
    message.versions.push({
      content: message.content,
      editedAt: new Date(),
      editedBy: userId
    });

    // Update message
    message.content = content;
    message.isEdited = true;
    await message.save();

    const updatedMessage = await Message.findById(id)
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .populate('relatedEvent', 'title')
      .populate('versions.editedBy', 'name');

    return successResponse(res, 200, 'Message updated successfully', { message: updatedMessage });
  } catch (error) {
    logger.error('Update message error:', error);
    return httpResponses.serverError(res, 'Failed to update message');
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(id);

    if (!message) {
      return httpResponses.notFound(res, 'Message not found');
    }

    // Only sender can delete their message
    if (message.sender.toString() !== userId) {
      return httpResponses.forbidden(res, 'Not authorized to delete this message');
    }

    // Soft delete the message
    message.isDeleted = true;
    message.deletedAt = new Date();
    message.deletedBy = userId;
    await message.save();

    return successResponse(res, 200, 'Message deleted successfully');
  } catch (error) {
    logger.error('Delete message error:', error);
    return httpResponses.serverError(res, 'Failed to delete message');
  }
};

export const acceptRequest = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findOne({
      _id: messageId,
      receiver: userId,
      type: 'service_request',
      isDeleted: false
    }).populate('sender relatedEvent');

    if (!message) {
      return httpResponses.notFound(res, 'Request not found');
    }

    // Update request status
    message.status = 'accepted';
    await message.save();
    await message.populate('sender', 'name');
    await message.populate('relatedEvent', 'title');

    // Create notification for accepted service request
    await NotificationService.notifyServiceAccepted({
      organizer: message.sender._id,
      professional: message.receiver,
      event: message.relatedEvent
    });

    // Create a new conversation message
    const conversationMessage = new Message({
      sender: userId,
      receiver: message.sender._id,
      content: `Request accepted for ${message.service}. You can now start messaging about the event: ${message.relatedEvent.title}`,
      type: 'message',
      relatedEvent: message.relatedEvent._id,
      service: message.service,
      status: 'unread'
    });

    await conversationMessage.save();

    return successResponse(res, 200, 'Request accepted successfully');
  } catch (error) {
    logger.error('Accept request error:', error);
    return httpResponses.serverError(res, 'Failed to accept request');
  }
};

export const rejectRequest = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findOne({
      _id: messageId,
      receiver: userId,
      type: 'service_request',
      status: 'unread',
      isDeleted: false
    });

    if (!message) {
      return httpResponses.notFound(res, 'Request not found');
    }

    message.status = 'rejected';
    await message.save();
    await message.populate('sender', 'name');
    await message.populate('relatedEvent', 'title');

    // Create notification for rejected service request
    await NotificationService.notifyServiceRejected({
      organizer: message.sender._id,
      professional: message.receiver,
      event: message.relatedEvent
    });

    const responseMessage = new Message({
      sender: userId,
      receiver: message.sender,
      content: `Service request rejected for ${message.service}`,
      type: 'message',
      relatedEvent: message.relatedEvent,
      service: message.service,
      status: 'unread',
      parentMessage: message._id
    });

    await responseMessage.save();

    return successResponse(res, 200, 'Request rejected successfully');
  } catch (error) {
    logger.error('Reject request error:', error);
    return httpResponses.serverError(res, 'Failed to reject request');
  }
};

export const createServiceRequest = async (req, res) => {
  try {
    const { receiverId, eventId, service, message: content } = req.body;
    const userId = req.user.id;

    const message = new Message({
      sender: userId,
      receiver: receiverId,
      content,
      type: 'service_request',
      relatedEvent: eventId,
      service,
      status: 'unread'
    });

    await message.save();

    return successResponse(res, 201, 'Service request sent successfully');
  } catch (error) {
    logger.error('Create service request error:', error);
    return httpResponses.serverError(res, 'Failed to create service request');
  }
};

export const createServiceOffer = async (req, res) => {
  try {
    const { receiverId, eventId, service, message } = req.body;
    const userId = req.user.id;

    const serviceOffer = new Message({
      sender: userId,
      receiver: receiverId,
      content: message,
      type: 'service_offer',
      event: eventId,
      service,
      status: 'pending'
    });

    await serviceOffer.save();

    return successResponse(res, 201, 'Service offer sent successfully');
  } catch (error) {
    logger.error('Create service offer error:', error);
    return httpResponses.serverError(res, 'Failed to create service offer');
  }
};

export const getConversationMessages = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const userId = req.user.id;

    // First, get the partner's information
    const partner = await User.findById(partnerId).select('name avatar isOnline lastSeen');
    if (!partner) {
      return httpResponses.notFound(res, 'User not found');
    }

    // Then get all messages between the users
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: partnerId },
        { sender: partnerId, receiver: userId }
      ],
      type: 'message',
      isDeleted: false
    })
    .populate('sender', 'name avatar isOnline lastSeen')
    .populate('receiver', 'name avatar isOnline lastSeen')
    .populate('relatedEvent', 'title')
    .sort({ createdAt: 1 });

    return successResponse(res, 200, 'Conversation messages retrieved successfully', { 
      partner,
      messages 
    });
  } catch (error) {
    logger.error('Get conversation messages error:', error);
    return httpResponses.serverError(res, 'Failed to fetch conversation messages');
  }
};

export const replyToMessage = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const message = new Message({
      sender: userId,
      receiver: partnerId,
      content,
      type: 'message',
      status: 'unread'
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name avatar isOnline lastSeen')
      .populate('receiver', 'name avatar isOnline lastSeen');

    return successResponse(res, 201, 'Reply sent successfully', { message: populatedMessage });
  } catch (error) {
    logger.error('Reply to message error:', error);
    return httpResponses.serverError(res, 'Failed to send reply');
  }
};

export const getMessageHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(id)
      .populate('versions.editedBy', 'name')
      .populate('deletedBy', 'name');

    if (!message) {
      return httpResponses.notFound(res, 'Message not found');
    }

    // Only sender and receiver can view message history
    if (message.sender.toString() !== userId && message.receiver.toString() !== userId) {
      return httpResponses.forbidden(res, 'Not authorized to view message history');
    }

    return successResponse(res, 200, 'Message history retrieved successfully', { message });
  } catch (error) {
    logger.error('Get message history error:', error);
    return httpResponses.serverError(res, 'Failed to fetch message history');
  }
};
