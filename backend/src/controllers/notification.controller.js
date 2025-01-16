import Notification from '../models/notification.model.js';
import { successResponse, httpResponses } from '../utils/apiResponse.js';
import mongoose from 'mongoose';

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching notifications for user:', userId);

    console.log('Query filter:', {
      recipient: new mongoose.Types.ObjectId(userId)
    });

    const notifications = await Notification.find({
      recipient: new mongoose.Types.ObjectId(userId)
    })
      .populate('sender', 'name avatar')
      .populate('relatedEvent', 'title datetime')
      .sort({ createdAt: -1 });

    notifications.forEach((notif, index) => {
      console.log(`Notification ${index}:`, {
        id: notif._id,
        recipient: notif.recipient.toString(),
        type: notif.type,
        title: notif.title
      });
    });

    const filteredNotifications = notifications.filter(notif => {
      const isMatch = notif.recipient.toString() === userId;
      if (!isMatch) {
        console.log('Found mismatched notification:', {
          notifRecipient: notif.recipient.toString(),
          userId: userId,
          title: notif.title
        });
      }
      return isMatch;
    });

    console.log(`Found ${notifications.length} total notifications, ${filteredNotifications.length} after filtering`);

    return successResponse(res, 200, 'Notifications retrieved successfully', {
      notifications: filteredNotifications
    });
  } catch (error) {
    console.error('Get notifications error:', error, {
      userId: req.user.id,
      userObject: req.user
    });
    return httpResponses.serverError(res, 'Failed to fetch notifications');
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return httpResponses.notFound(res, 'Notification not found');
    }

    return successResponse(res, 200, 'Notification marked as read');
  } catch (error) {
    console.error('Mark as read error:', error);
    return httpResponses.serverError(res, 'Failed to mark notification as read');
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true }
    );

    return successResponse(res, 200, 'All notifications marked as read');
  } catch (error) {
    console.error('Mark all as read error:', error);
    return httpResponses.serverError(res, 'Failed to mark all notifications as read');
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: userId
    });

    if (!notification) {
      return httpResponses.notFound(res, 'Notification not found');
    }

    return successResponse(res, 200, 'Notification deleted successfully');
  } catch (error) {
    console.error('Delete notification error:', error);
    return httpResponses.serverError(res, 'Failed to delete notification');
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const count = await Notification.countDocuments({
      recipient: new mongoose.Types.ObjectId(userId),
      read: false
    });

    return successResponse(res, 200, 'Unread count retrieved successfully', {
      count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    return httpResponses.serverError(res, 'Failed to get unread count');
  }
};

export const createNotification = async (data) => {
  try {
    const notification = new Notification({
      recipient: data.recipient,
      sender: data.sender,
      type: data.type,
      title: data.title,
      message: data.message,
      relatedEvent: data.eventId,
      relatedMessage: data.messageId,
      metadata: data.metadata || {}
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};
