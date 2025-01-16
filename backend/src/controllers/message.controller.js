import Message from '../models/message.model.js';
import { successResponse, httpResponses } from '../utils/apiResponse.js';
import logger from '../config/logger.js';
import NotificationService from '../services/notification.service.js';
import User from '../models/user.model.js';
import Event from '../models/event.model.js';
import Gig from '../models/gig.model.js';
import Notification from '../models/notification.model.js';
import mongoose from 'mongoose';

export const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const allMessages = await Message.find({
      $or: [
        { sender: userId },
        { receiver: userId }
      ],
      isDeleted: false
    })
      .populate('sender', 'name avatar isOnline lastSeen role')
      .populate('receiver', 'name avatar isOnline lastSeen role')
      .populate('relatedEvent', 'title datetime')
      .sort({ createdAt: -1 });

    // Initialize maps to store conversations and unread counts
    const conversationsMap = new Map();
    const unreadConversationsCount = new Set();

    // Filter sent and received requests - include service_offer type
    const sentRequests = allMessages.filter(msg =>
      (msg.type === 'service_request' || 
       msg.type === 'hire_request' || 
       msg.type === 'service_offer') &&
      msg.sender._id.toString() === userId
    );

    const receivedRequests = allMessages.filter(msg =>
      (msg.type === 'service_request' || 
       msg.type === 'hire_request' || 
       msg.type === 'service_offer') &&
      msg.receiver._id.toString() === userId
    );

    // Process messages to build conversations
    allMessages.forEach(msg => {
      if (msg.type === 'message' || msg.type === 'hire_request') {
        const partnerId = msg.sender._id.toString() === userId ? msg.receiver._id.toString() : msg.sender._id.toString();
        const existingConv = conversationsMap.get(partnerId);

        if (!existingConv || new Date(msg.createdAt) > new Date(existingConv.message.createdAt)) {
          conversationsMap.set(partnerId, {
            message: msg,
            unreadCount: 0
          });
        }

        // Count unread messages for each conversation
        if (msg.receiver._id.toString() === userId && msg.status === 'unread') {
          const conv = conversationsMap.get(partnerId);
          if (conv) {
            conv.unreadCount = (conv.unreadCount || 0) + 1;
            unreadConversationsCount.add(partnerId);
          }
        }
      }
    });

    // Convert conversations map to array with unread counts
    const conversationsList = Array.from(conversationsMap.values()).map(({ message, unreadCount }) => ({
      ...message.toObject(),
      unreadCount
    }));

    return successResponse(res, 200, 'Messages retrieved successfully', {
      conversations: conversationsList,
      sentRequests,
      receivedRequests,
      unreadConversationsCount: unreadConversationsCount.size
    });
  } catch (error) {
    console.error('Get messages error details:', error);
    logger.error('Get messages error:', error);
    return httpResponses.serverError(res, 'Failed to fetch messages');
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await Message.find({
      $or: [
        { sender: userId, type: { $in: ['message', 'hire_request'] } },
        { receiver: userId, type: { $in: ['message', 'hire_request'] } }
      ],
      isDeleted: false
    })
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .populate('relatedEvent', 'title datetime')
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
      type: { $in: ['service_request', 'service_offer', 'hire_request'] },
      isDeleted: false
    })
      .populate('receiver', 'name avatar')
      .populate('relatedEvent', 'title datetime')
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
      type: { $in: ['service_request', 'service_offer', 'hire_request'] },
      isDeleted: false
    })
      .populate('sender', 'name avatar')
      .populate('relatedEvent', 'title datetime')
      .sort({ createdAt: -1 });

    return successResponse(res, 200, 'Received requests retrieved successfully', { requests });
  } catch (error) {
    logger.error('Get received requests error:', error);
    return httpResponses.serverError(res, 'Failed to fetch received requests');
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { receiverId, content, type = 'message', eventId, service, services, parentMessageId, gigTitle, paymentMethod, price } = req.body;
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
    if (services) messageData.services = services;
    if (parentMessageId) messageData.parentMessage = parentMessageId;
    if (gigTitle) messageData.gigTitle = gigTitle;
    if (paymentMethod) messageData.paymentMethod = paymentMethod;
    if (price) messageData.price = price;

    const message = new Message(messageData);
    await message.save();
    await message.populate('sender', 'name');
    await message.populate('relatedEvent', 'title');

    // Create notification for new message
    if (message.type === 'message') {
      await NotificationService.notifyNewMessage(message);
    } else if (message.type === 'hire_request') {
      await NotificationService.notifyHireRequested({
        professional: message.receiver,
        organizer: message.sender._id,
        event: message.relatedEvent
      });
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

    // Store the current version before marking as deleted
    message.versions.push({
      content: message.content,
      editedAt: new Date(),
      editedBy: userId
    });

    // Update message to be deleted
    message.isDeleted = true;
    message.content = ' '; // Empty space to maintain formatting
    message.deletedAt = new Date();
    message.deletedBy = userId;
    await message.save();

    const updatedMessage = await Message.findById(id)
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .populate('relatedEvent', 'title')
      .populate('versions.editedBy', 'name');

    return successResponse(res, 200, 'Message deleted successfully', { message: updatedMessage });
  } catch (error) {
    logger.error('Delete message error:', error);
    return httpResponses.serverError(res, 'Failed to delete message');
  }
};

export const acceptHireRequest = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    console.log('Starting acceptHireRequest with:', { messageId, userId });

    const message = await Message.findOne({
      _id: messageId,
      receiver: userId,
      type: 'hire_request',
      isDeleted: false
    }).populate('sender relatedEvent');

    if (!message) {
      console.log('Hire request not found with criteria:', { messageId, userId });
      return httpResponses.notFound(res, 'Hire request not found');
    }

    console.log('Found message:', {
      id: message._id,
      services: message.services,
      relatedEvent: message.relatedEvent?._id
    });

    if (!message.services || !Array.isArray(message.services) || message.services.length === 0) {
      console.log('Message has no services:', message.services);
      return httpResponses.badRequest(res, 'Hire request has no services specified');
    }

    if (!message.relatedEvent) {
      console.log('Message has no related event');
      return httpResponses.badRequest(res, 'Hire request has no related event');
    }

    // Update message status to show acceptance
    message.status = 'accepted';
    await message.save();
    console.log('Updated message status to accepted');

    // Add the professional to the event after accepting
    const event = await Event.findById(message.relatedEvent._id);
    if (!event) {
      console.log('Event not found:', message.relatedEvent._id);
      return httpResponses.notFound(res, 'Event not found');
    }

    console.log('Found event:', { eventId: event._id, title: event.title });

    console.log('Adding professional to event');
    // Add professional to event with all services
    event.professionals.push({
      professional: userId,
      services: message.services,
      status: 'accepted'
    });

    await event.save();
    console.log('Professional added to event');

    // Create a single gig with all services
    const servicesFormatted = message.services.map(service =>
      service.charAt(0).toUpperCase() + service.slice(1)
    ).join(', ');

    console.log('Creating gig with services:', servicesFormatted);

    const createdGig = new Gig({
      professional: userId,
      event: event._id,
      services: message.services,
      title: `${servicesFormatted} for ${event.title}`,
      description: message.content,
      status: 'active',
      price: message.price || event.budget || 0,
      startDate: event.datetime,
      endDate: event.datetime
    });

    await createdGig.save();
    console.log('Created gig successfully:', createdGig._id);

    // Create notification for accepted hire request
    console.log('Creating acceptance notification');
    await NotificationService.notifyHireAccepted({
      organizer: message.sender._id,
      professional: message.receiver,
      event: message.relatedEvent
    });
    console.log('Created acceptance notification');

    return successResponse(res, 200, 'Hire request accepted successfully', {
      gigId: createdGig._id
    });
  } catch (error) {
    console.error('Accept hire request error:', error);
    return httpResponses.serverError(res, 'Failed to accept hire request');
  }
};

export const rejectHireRequest = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findOne({
      _id: messageId,
      receiver: userId,
      type: 'hire_request',
      isDeleted: false
    }).populate('sender relatedEvent');

    if (!message) {
      return httpResponses.notFound(res, 'Hire request not found');
    }

    // Update message status to show rejection
    message.status = 'rejected';
    await message.save();

    // Create notification for rejected hire request
    await NotificationService.notifyHireRejected({
      organizer: message.sender._id,
      professional: message.receiver,
      event: message.relatedEvent
    });

    // Create a response message in the conversation
    const responseMessage = new Message({
      sender: userId,
      receiver: message.sender._id,
      content: `I apologize, but I must decline your hire request for ${message.relatedEvent.title}.`,
      type: 'message',
      relatedEvent: message.relatedEvent._id,
      services: message.services,
      status: 'unread',
      isResponseMessage: true
    });

    await responseMessage.save();

    return successResponse(res, 200, 'Hire request rejected successfully');
  } catch (error) {
    logger.error('Reject hire request error:', error);
    return httpResponses.serverError(res, 'Failed to reject hire request');
  }
};

export const createServiceRequest = async (req, res) => {
  try {
    const { receiverId, eventId, services = [], message } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!receiverId || !eventId || !services.length || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Create a conversation message for the service request
    const messageDoc = new Message({
      sender: userId,
      receiver: receiverId,
      content: message || `Request for ${services.join(', ')} services`,
      type: 'service_request',
      relatedEvent: eventId,
      services: services,
      status: 'unread'
    });

    await messageDoc.save();
    await messageDoc.populate('sender', 'name');
    await messageDoc.populate('relatedEvent', 'title');

    // Create notification for the service request
    await NotificationService.notifyServiceRequested({
      professional: receiverId,    // The professional receiving the request
      organizer: userId,          // The organizer (current user) sending the request
      event: eventId,             // The event ID
      message: message            // Optional message
    });

    return successResponse(res, 201, 'Service request sent successfully');
  } catch (error) {
    logger.error('Create service request error:', error);
    return httpResponses.serverError(res, 'Failed to create service request');
  }
};

export const createServiceOffer = async (req, res) => {
  try {
    const { receiverId, eventId, services, content, type } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!receiverId || !eventId || !services || !Array.isArray(services)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get event details
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Create the message
    const message = new Message({
      sender: userId,
      receiver: receiverId,
      content: content,
      type: type || 'service_offer',
      relatedEvent: eventId,
      services: services,
      status: 'unread'
    });

    await message.save();

    // Create notification for the receiver
    const notification = new Notification({
      recipient: receiverId,
      type: type || 'service_offer',
      title: 'New Service Offer',
      message: `New service offer for event: ${event.title}`,
      relatedEvent: eventId,
      relatedMessage: message._id,
      sender: userId,
      read: false
    });

    await notification.save();

    // Populate sender and receiver details
    await message.populate([
      { path: 'sender', select: 'name email avatar role' },
      { path: 'receiver', select: 'name email avatar role' },
      { path: 'relatedEvent', select: 'title description datetime location' }
    ]);

    return res.status(201).json({
      success: true,
      message: `${type === 'service_offer' ? 'Service offer' : 'Service request'} sent successfully`,
      data: { 
        message,
        eventId  // Add eventId to the response
      }
    });

  } catch (error) {
    console.error('Create service offer error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create service offer',
      error: error.message
    });
  }
};

export const getConversationMessages = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const userId = req.user.id;

    // First, get the partner's information
    const partner = await User.findById(partnerId).select('name avatar isOnline lastSeen role');
    if (!partner) {
      return httpResponses.notFound(res, 'User not found');
    }

    // Then get all messages between these two specific users only
    const messages = await Message.find({
      $and: [
        // Messages must be between these two users specifically
        {
          $or: [
            { sender: userId, receiver: partnerId },
            { sender: partnerId, receiver: userId }
          ]
        },
        // Messages must be either regular messages or hire requests
        {
          type: { $in: ['message', 'hire_request'] }
        }
      ]
    })
      .populate('sender', 'name avatar isOnline lastSeen role')
      .populate('receiver', 'name avatar isOnline lastSeen role')
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
    await message.populate('sender', 'name avatar isOnline lastSeen role');
    await message.populate('receiver', 'name avatar isOnline lastSeen role');

    // Create notification for new message
    await NotificationService.notifyNewMessage(message);

    return successResponse(res, 201, 'Reply sent successfully', { message });
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

export const markConversationAsRead = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const userId = req.user.id;

    if (!partnerId) {
      return httpResponses.badRequest(res, 'Partner ID is required');
    }

    // Update all unread messages from partner to read, excluding hire requests
    const result = await Message.updateMany(
      {
        sender: partnerId,
        receiver: userId,
        status: 'unread',
        // type: { $ne: 'hire_request' },  // Exclude hire request messages
        // $or: [
        //   { service: { $exists: false } },  // Regular messages
        //   { relatedEvent: { $exists: false } }  // Messages without events
        // ]
      },
      {
        $set: { status: 'read' }
      }
    );

    return successResponse(res, 200, 'Messages marked as read', {
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    logger.error('Mark conversation as read error:', error);
    return httpResponses.serverError(res, 'Failed to mark messages as read');
  }
};

export const checkRequest = async (req, res) => {
  try {
    const { professionalId, eventId } = req.params;
    const userId = req.user.id;

    console.log('Checking hire request:', {
      professionalId,
      eventId,
      userId
    });

    // Build the query to check for hire requests
    const query = {
      $and: [
        {
          sender: userId,
          receiver: professionalId,
          type: 'hire_request',  // Changed from service_request to hire_request
          relatedEvent: eventId
        }
      ]
    };

    const existingRequest = await Message.findOne(query)
      .populate('relatedEvent', 'title')
      .populate('sender', 'name')
      .populate('receiver', 'name');

    console.log('Found hire request:', existingRequest);

    return successResponse(res, 200, 'Request check completed', {
      hasRequest: !!existingRequest,
      request: existingRequest
    });
  } catch (error) {
    logger.error('Check request error:', error);
    return httpResponses.serverError(res, 'Failed to check request');
  }
};

export const getServiceRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { professionalId } = req.params;

    const requests = await Message.find({
      sender: userId,
      receiver: professionalId,
      type: 'service_request',
      isDeleted: false,
      status: { $nin: ['rejected', 'cancelled'] } // Only get active requests
    })
      .populate('relatedEvent', 'title datetime')
      .select('relatedEvent status services');

    return successResponse(res, 200, 'Service requests retrieved successfully', { requests });
  } catch (error) {
    logger.error('Get service requests error:', error);
    return httpResponses.serverError(res, 'Failed to fetch service requests');
  }
};

export const acceptServiceRequest = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findOne({
      _id: messageId,
      receiver: userId,
      type: 'service_request',
      status: 'unread',
      isDeleted: false
    }).populate('sender relatedEvent');

    if (!message) {
      return httpResponses.notFound(res, 'Service request not found');
    }

    // Update message status to show acceptance
    message.status = 'accepted';
    await message.save();

    // Create notification for accepted service request
    await NotificationService.notifyServiceAccepted({
      organizer: message.sender._id,
      professional: message.receiver,
      event: message.relatedEvent
    });

    return successResponse(res, 200, 'Service request accepted successfully');
  } catch (error) {
    logger.error('Accept service request error:', error);
    return httpResponses.serverError(res, 'Failed to accept service request');
  }
};

export const rejectServiceRequest = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findOne({
      _id: messageId,
      receiver: userId,
      type: 'service_request',
      status: 'unread',
      isDeleted: false
    }).populate('sender relatedEvent');

    if (!message) {
      return httpResponses.notFound(res, 'Service request not found');
    }

    // Update message status to show rejection
    message.status = 'rejected';
    await message.save();

    // Create notification for rejected service request
    await NotificationService.notifyServiceRejected({
      organizer: message.sender._id,
      professional: message.receiver,
      event: message.relatedEvent
    });

    return successResponse(res, 200, 'Service request rejected successfully');
  } catch (error) {
    logger.error('Reject service request error:', error);
    return httpResponses.serverError(res, 'Failed to reject service request');
  }
};

export const acceptServiceMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findOne({
      _id: messageId,
      receiver: userId,
      type: { $in: ['service_request', 'hire_request'] },
      status: 'unread',
      isDeleted: false
    }).populate('sender relatedEvent');

    if (!message) {
      return httpResponses.notFound(res, 'Request not found');
    }

    // Update message status to show acceptance
    message.status = 'accepted';
    await message.save();

    // If this is a hire request, create a gig
    if (message.type === 'hire_request') {
      // Add the professional to the event
      const event = await Event.findById(message.relatedEvent._id);
      if (event) {
        // Check if professional is already added
        const existingProfessional = event.professionals.find(
          p => p.professional.toString() === userId
        );

        if (!existingProfessional) {
          // Add professional to event
          event.professionals.push({
            professional: userId,
            service: message.service,
            status: 'accepted'
          });

          await event.save();

          // Create a new gig
          const gig = new Gig({
            professional: userId,
            event: event._id,
            service: message.service,
            title: `${message.service.charAt(0).toUpperCase() + message.service.slice(1)} Service for ${event.title}`,
            description: message.content,
            status: 'active',
            price: event.budget || 0,
            startDate: event.datetime,
            endDate: event.datetime
          });

          await gig.save();
        }
      }
    }

    // Create a conversation message to notify the sender
    const responseMessage = new Message({
      sender: userId,
      receiver: message.sender._id,
      content: `I have accepted your ${message.type === 'hire_request' ? 'hire' : 'service'} request${message.relatedEvent ? ` for ${message.relatedEvent.title}` : ''}.`,
      type: 'message',
      relatedEvent: message.relatedEvent?._id,
      services: message.services,
      status: 'unread'
    });

    await responseMessage.save();

    // Create notification for accepted request
    await NotificationService.notifyServiceAccepted({
      organizer: message.sender._id,
      professional: message.receiver,
      event: message.relatedEvent
    });

    return successResponse(res, 200, 'Request accepted successfully');
  } catch (error) {
    logger.error('Accept service message error:', error);
    return httpResponses.serverError(res, 'Failed to accept request');
  }
};

export const rejectServiceMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findOne({
      _id: messageId,
      receiver: userId,
      type: { $in: ['service_request', 'hire_request'] },
      status: 'unread',
      isDeleted: false
    }).populate('sender relatedEvent');

    if (!message) {
      return httpResponses.notFound(res, 'Request not found');
    }

    // Update message status to show rejection
    message.status = 'rejected';
    await message.save();

    // Create a conversation message to notify the sender
    const responseMessage = new Message({
      sender: userId,
      receiver: message.sender._id,
      content: `I have declined your ${message.type === 'hire_request' ? 'hire' : 'service'} request${message.relatedEvent ? ` for ${message.relatedEvent.title}` : ''}.`,
      type: 'message',
      relatedEvent: message.relatedEvent?._id,
      services: message.services,
      status: 'unread'
    });

    await responseMessage.save();

    // Create notification for rejected request
    await NotificationService.notifyServiceRejected({
      organizer: message.sender._id,
      professional: message.receiver,
      event: message.relatedEvent
    });

    return successResponse(res, 200, 'Request rejected successfully');
  } catch (error) {
    logger.error('Reject service message error:', error);
    return httpResponses.serverError(res, 'Failed to reject request');
  }
};

export const acceptServiceOffer = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId)
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .populate('relatedEvent', 'title');

    if (!message) {
      return httpResponses.notFound(res, 'Service offer not found');
    }

    // Only the event organizer can accept the service offer
    if (message.receiver._id.toString() !== userId) {
      return httpResponses.forbidden(res, 'Not authorized to accept this service offer');
    }

    // Update message status
    message.status = 'accepted';
    await message.save();

    // Create a response message to notify the professional
    const responseMessage = new Message({
      sender: userId,
      receiver: message.sender._id,
      content: `I have accepted your service offer for ${message.relatedEvent.title}.`,
      type: 'message',
      relatedEvent: message.relatedEvent._id,
      services: message.services,
      status: 'unread'
    });

    await responseMessage.save();

    // Create a notification for the professional
    await NotificationService.notifyServiceOfferAccepted({
      professional: message.sender._id,
      organizer: userId,
      event: message.relatedEvent
    });

    return successResponse(res, 200, 'Service offer accepted successfully', { message });
  } catch (error) {
    logger.error('Accept service offer error:', error);
    return httpResponses.serverError(res, 'Failed to accept service offer');
  }
};

export const rejectServiceOffer = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId)
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .populate('relatedEvent', 'title');

    if (!message) {
      return httpResponses.notFound(res, 'Service offer not found');
    }

    // Only the event organizer can reject the service offer
    if (message.receiver._id.toString() !== userId) {
      return httpResponses.forbidden(res, 'Not authorized to reject this service offer');
    }

    // Update message status
    message.status = 'rejected';
    await message.save();

    // Create a notification for the professional
    await NotificationService.notifyServiceOfferRejected({
      professional: message.sender._id,
      organizer: userId,
      event: message.relatedEvent
    });

    return successResponse(res, 200, 'Service offer rejected successfully', { message });
  } catch (error) {
    logger.error('Reject service offer error:', error);
    return httpResponses.serverError(res, 'Failed to reject service offer');
  }
};

export const markServiceOfferRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    console.log('Marking service offer as read:', {
      messageId,
      userId
    });

    const message = await Message.findOne({
      _id: messageId,
      receiver: userId,
      type: 'message',
      status: 'unread'
    });

    console.log('Found message:', message);

    if (!message) {
      console.log('Service offer not found or already read');
      return httpResponses.notFound(res, 'Service offer not found');
    }

    message.status = 'read';
    await message.save();
    console.log('Message marked as read successfully');

    return successResponse(res, 200, 'Service offer marked as read');
  } catch (error) {
    console.error('Mark service offer read error:', error);
    return httpResponses.serverError(res, 'Failed to mark service offer as read');
  }
};
