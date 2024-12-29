import Event from '../models/event.model.js';
import Message from '../models/message.model.js';
import Notification from '../models/notification.model.js';
import { successResponse, httpResponses } from '../utils/apiResponse.js';
import logger from '../config/logger.js';

export const getDashboardData = async (req, res) => {
  try {
    const now = new Date();
    const userId = req.user.id;

    // Common queries for both roles
    const [unreadMessages, unreadNotifications] = await Promise.all([
      Message.countDocuments({
        receiver: userId,
        status: 'unread',
        type: { $ne: 'service_request' } // Exclude service requests from unread count
      }),
      Notification.countDocuments({
        recipient: userId,
        read: false
      })
    ]);

    let stats;
    if (req.user.role === 'professional') {
      // Professional-specific stats
      const [
        activeGigs,
        totalEarningsResult,
        currentGigs,
        upcomingEvents,
        pendingRequests
      ] = await Promise.all([
        // Active gigs count
        Event.countDocuments({
          'professionals.professional': userId,
          'professionals.status': 'accepted',
          status: 'active',
          datetime: { $gte: now }
        }),

        // Total earnings
        Event.aggregate([
          {
            $match: {
              'professionals.professional': userId,
              'professionals.status': 'accepted',
              status: { $in: ['active', 'completed'] }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$budget' }
            }
          }
        ]),

        // Current gigs
        Event.find({
          'professionals.professional': userId,
          'professionals.status': 'accepted',
          status: 'active',
          datetime: { $gte: now }
        })
        .sort({ datetime: 1 })
        .limit(5)
        .populate('organizer', 'name email'),

        // Upcoming events
        Event.countDocuments({
          'professionals.professional': userId,
          'professionals.status': 'accepted',
          status: 'active',
          datetime: {
            $gte: now,
            $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          }
        }),

        // Pending requests
        Message.countDocuments({
          receiver: userId,
          type: 'service_request',
          status: 'unread'
        })
      ]);

      stats = {
        activeGigs,
        totalEarnings: totalEarningsResult[0]?.total || 0,
        currentGigs,
        upcomingEvents,
        unreadMessages,
        unreadNotifications,
        pendingRequests
      };
    } else {
      // Organizer-specific stats
      const [
        totalEvents,
        activeEvents,
        upcomingEvents,
        recentEvents,
        pendingRequests
      ] = await Promise.all([
        // Total events
        Event.countDocuments({ organizer: userId }),
        
        // Active events
        Event.countDocuments({ 
          organizer: userId, 
          status: 'active',
          datetime: { $gte: now }
        }),
        
        // Upcoming events in next 7 days
        Event.countDocuments({
          organizer: userId,
          status: 'active',
          datetime: {
            $gte: now,
            $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          }
        }),
        
        // Recent events (last 5)
        Event.find({ organizer: userId })
          .sort({ datetime: -1 })
          .limit(5)
          .populate('professionals.professional', 'name email'),
        
        // Pending service requests
        Message.countDocuments({
          receiver: userId,
          type: 'service_request',
          status: 'unread'
        })
      ]);

      stats = {
        totalEvents,
        activeEvents,
        upcomingEvents,
        recentEvents,
        unreadMessages,
        unreadNotifications,
        pendingRequests
      };
    }

    return successResponse(res, 200, 'Dashboard data retrieved successfully', { stats });
  } catch (error) {
    logger.error('Get dashboard data error:', error);
    return httpResponses.serverError(res, 'Failed to fetch dashboard data');
  }
};
