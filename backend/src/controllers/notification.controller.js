import Notification from '../models/notification.model.js';
import { successResponse, httpResponses } from '../utils/apiResponse.js';
import logger from '../config/logger.js';

export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
      viewed: false
    });

    return successResponse(res, 200, 'Unread count retrieved successfully', { count });
  } catch (error) {
    logger.error('Get unread count error:', error);
    return httpResponses.serverError(res, 'Failed to get unread count');
  }
};

export const getNotifications = async (req, res) => {
  try {
    const { type, unread } = req.query;
    
    let query = { recipient: req.user._id };

    // Add type filter
    if (type) {
      query.type = type;
    }

    // Add unread filter
    if (unread === 'true') {
      query.read = false;
    }

    // Mark all fetched notifications as viewed with retry logic
    const maxRetries = 3;
    let retries = 0;
    let success = false;

    while (!success && retries < maxRetries) {
      try {
        await Notification.updateMany(
          { recipient: req.user._id, viewed: false },
          { $set: { viewed: true } }
        ).maxTimeMS(5000); // Set maximum execution time to 5 seconds
        success = true;
      } catch (error) {
        retries++;
        if (retries === maxRetries) {
          logger.error('Failed to mark notifications as viewed after retries:', error);
          // Continue without marking as viewed rather than failing the whole request
          break;
        }
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
      }
    }

    // Fetch notifications with timeout
    const notifications = await Notification.find(query)
      .populate('metadata.eventId', 'title datetime location')
      .populate('metadata.messageId')
      .populate('metadata.userId', 'name')
      .populate('metadata.paymentId')
      .populate('metadata.reviewId')
      .sort({ createdAt: -1 })
      .lean()
      .maxTimeMS(5000); // Set maximum execution time to 5 seconds

    // Format notifications with proper context
    const formattedNotifications = notifications.map(notification => {
      // If notification already has title and message, return as is
      if (notification.title && notification.message) {
        return notification;
      }

      const formattedNotification = { ...notification };
      const userName = notification.metadata?.userId?.name || 'Someone';
      const eventTitle = notification.metadata?.eventId?.title || 'an event';

      try {
        // Format based on type
        switch (notification.type) {
        // Event notifications
        case 'event_created':
          formattedNotification.title = 'New Event Created';
          formattedNotification.message = `${userName} created a new event: ${eventTitle}`;
          break;
        case 'event_updated':
          formattedNotification.title = 'Event Updated';
          formattedNotification.message = `${eventTitle} has been updated`;
          break;
        case 'event_cancelled':
          formattedNotification.title = 'Event Cancelled';
          formattedNotification.message = `${eventTitle} has been cancelled`;
          break;
        case 'event_completed':
          formattedNotification.title = 'Event Completed';
          formattedNotification.message = `${eventTitle} has been marked as completed`;
          break;

        // Service notifications
        case 'service_request':
          formattedNotification.title = 'Service Request';
          formattedNotification.message = `${userName} requested your services for ${eventTitle}`;
          break;
        case 'service_accepted':
          formattedNotification.title = 'Service Request Accepted';
          formattedNotification.message = `${userName} accepted your service request for ${eventTitle}`;
          break;
        case 'service_rejected':
          formattedNotification.title = 'Service Request Rejected';
          formattedNotification.message = `${userName} declined your service request for ${eventTitle}`;
          break;

        // Professional notifications
        case 'professional_joined':
          formattedNotification.title = 'Professional Joined';
          formattedNotification.message = `${userName} joined ${eventTitle}`;
          break;
        case 'professional_left':
          formattedNotification.title = 'Professional Left';
          formattedNotification.message = `${userName} left ${eventTitle}`;
          break;
        case 'professional_reviewed':
          formattedNotification.title = 'New Review';
          formattedNotification.message = `${userName} left you a review for ${eventTitle}`;
          break;

        // Message notifications
        case 'message_received':
          formattedNotification.title = 'New Message';
          formattedNotification.message = `You have a new message from ${userName}`;
          break;
        case 'message_request':
          formattedNotification.title = 'New Message Request';
          formattedNotification.message = `${userName} wants to start a conversation`;
          break;

        // Payment notifications
        case 'payment_received':
          formattedNotification.title = 'Payment Received';
          formattedNotification.message = `You received a payment of $${notification.metadata?.amount || 0} for ${eventTitle}`;
          break;
        case 'payment_sent':
          formattedNotification.title = 'Payment Sent';
          formattedNotification.message = `Your payment of $${notification.metadata?.amount || 0} for ${eventTitle} was sent`;
          break;
        case 'payment_failed':
          formattedNotification.title = 'Payment Failed';
          formattedNotification.message = `Payment for ${eventTitle} failed. Please try again.`;
          break;

        // Review notifications
        case 'review_received':
          formattedNotification.title = 'New Review';
          formattedNotification.message = `${userName} gave you a ${notification.metadata?.rating}-star review`;
          break;

        // System notifications
        case 'system_update':
          formattedNotification.title = 'System Update';
          formattedNotification.message = notification.message;
          break;
        case 'account_update':
          formattedNotification.title = 'Account Update';
          formattedNotification.message = notification.message;
          break;

        default:
          formattedNotification.title = 'Notification';
          formattedNotification.message = notification.message;
      }

        return formattedNotification;
      } catch (error) {
        logger.error('Notification formatting error:', error);
        // Return original notification if formatting fails
        return notification;
      }
    });

    return successResponse(res, 200, 'Notifications retrieved successfully', { notifications: formattedNotifications });
  } catch (error) {
    logger.error('Get notifications error:', error);
    return httpResponses.serverError(res, 'Failed to fetch notifications');
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findOne({
      _id: id,
      recipient: req.user._id
    });

    if (!notification) {
      return httpResponses.notFound(res, 'Notification not found');
    }

    notification.read = true;
    await notification.save();

    return successResponse(res, 200, 'Notification marked as read');
  } catch (error) {
    logger.error('Mark notification as read error:', error);
    return httpResponses.serverError(res, 'Failed to mark notification as read');
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { $set: { read: true } }
    );

    return successResponse(res, 200, 'All notifications marked as read');
  } catch (error) {
    logger.error('Mark all notifications as read error:', error);
    return httpResponses.serverError(res, 'Failed to mark notifications as read');
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findOne({
      _id: id,
      recipient: req.user._id
    });

    if (!notification) {
      return httpResponses.notFound(res, 'Notification not found');
    }

    await notification.remove();

    return successResponse(res, 200, 'Notification deleted successfully');
  } catch (error) {
    logger.error('Delete notification error:', error);
    return httpResponses.serverError(res, 'Failed to delete notification');
  }
};
