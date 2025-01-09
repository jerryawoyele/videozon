import { successResponse, httpResponses } from '../utils/apiResponse.js';
import Event from '../models/event.model.js';
import Gig from '../models/gig.model.js';
import Message from '../models/message.model.js';
import Notification from '../models/notification.model.js';
import logger from '../config/logger.js';

export const getDashboardData = async (req, res) => {
  try {
    const now = new Date();
    const userId = req.user._id;

    // Get counts
    const [
      totalEvents,
      activeEvents,
      upcomingEvents,
      unreadMessages,
      unreadNotifications,
      pendingRequests,
      currentGigs
    ] = await Promise.all([
      // Total events
      Event.countDocuments({ creator: userId }),
      
      // Active events
      Event.countDocuments({ 
        creator: userId, 
        status: 'active',
        date: { $gte: now }
      }),
      
      // Upcoming events in next 7 days
      Event.countDocuments({
        creator: userId,
        status: 'active',
        date: {
          $gte: now,
          $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        }
      }),
      
      // Unread messages
      Message.countDocuments({
        receiver: userId,
        isRead: false
      }),
      
      // Unread notifications
      Notification.countDocuments({
        recipient: userId,
        isRead: false
      }),
      
      // Pending requests
      Message.countDocuments({
        receiver: userId,
        type: 'service_request',
        status: 'pending'
      }),

      // Current gigs
      Gig.find({
        $or: [
          { professional: userId },
          { 'event.creator': userId }
        ],
        status: 'active'
      })
        .populate('event', 'title date')
        .populate('professional', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    // Recent events
    const recentEvents = await Event.find({ creator: userId })
      .sort({ date: -1 })
      .limit(5)
      .select('title date status');

    const stats = {
      totalEvents,
      activeEvents,
      upcomingEvents,
      unreadMessages,
      unreadNotifications,
      pendingRequests,
      currentGigs,
      recentEvents
    };

    return successResponse(res, 200, 'Dashboard data retrieved successfully', { stats });
  } catch (error) {
    logger.error('Get dashboard data error:', error);
    return httpResponses.serverError(res, 'Failed to fetch dashboard data');
  }
};
