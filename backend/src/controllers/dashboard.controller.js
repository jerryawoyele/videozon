import Event from '../models/event.model.js';
import User from '../models/user.model.js';
import Message from '../models/message.model.js';
import Notification from '../models/notification.model.js';
import { successResponse, httpResponses } from '../utils/apiResponse.js';
import mongoose from 'mongoose';

export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const isProfessional = req.user.role === 'professional';

    // Get current date for comparisons
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Common stats for both roles
    const [unreadNotifications, unreadMessages] = await Promise.all([
      Notification.countDocuments({ recipient: userId, read: false }),
      Message.countDocuments({ receiver: userId, status: 'unread' })
    ]);

    let stats = {
      unreadNotifications,
      unreadMessages
    };

    if (isProfessional) {
      // Professional dashboard stats
      const [
        activeGigs,
        upcomingEvents,
        totalEarnings,
        pendingRequests,
        currentGigs
      ] = await Promise.all([
        // Active gigs count
        Event.countDocuments({
          'professionals.professional': new mongoose.Types.ObjectId(userId),
          'professionals.status': 'accepted',
          status: { $in: ['active', 'ongoing'] }
        }),
        // Upcoming events count
        Event.countDocuments({
          'professionals.professional': userId,
          datetime: { $gt: now },
          status: 'active'
        }),
        // Calculate total earnings
        Event.aggregate([
          {
            $match: {
              'professionals.professional': new mongoose.Types.ObjectId(userId),
              status: 'concluded'
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$budget' }
            }
          }
        ]).then(result => (result[0]?.total || 0)),
        // Pending requests count
        Message.countDocuments({
          receiver: userId,
          type: 'service_request',
          status: 'unread'
        }),
        // Current gigs (active events)
        Event.find({
          'professionals.professional': new mongoose.Types.ObjectId(userId),
          'professionals.status': 'accepted',
          status: { $in: ['active', 'ongoing'] }
        })
        .sort({ datetime: 1 })
        .limit(5)
        .populate('organizer', 'name')
        .lean()
        .then(gigs => gigs.map(gig => ({
          _id: gig._id,
          event: {
            _id: gig._id,
            title: gig.title,
            datetime: gig.datetime,
            location: gig.location,
            organizer: gig.organizer
          },
          service: gig.professionals.find(p => 
            p.professional.toString() === userId && 
            p.status === 'accepted'
          )?.service
        })))
      ]);

      stats = {
        ...stats,
        activeGigs,
        upcomingEvents,
        totalEarnings,
        pendingRequests,
        currentGigs
      };
    } else {
      // Event organizer dashboard stats
      const [
        totalEvents,
        activeEvents,
        upcomingEvents,
        pendingRequests,
        recentEvents
      ] = await Promise.all([
        // Total events count
        Event.countDocuments({ organizer: userId }),
        // Active events count
        Event.countDocuments({
          organizer: userId,
          status: 'active'
        }),
        // Upcoming events count
        Event.countDocuments({
          organizer: userId,
          datetime: { $gt: now },
          status: 'active'
        }),
        // Pending requests count
        Message.countDocuments({
          sender: userId,
          type: 'service_request',
          status: 'pending'
        }),
        // Recent events
        Event.find({ organizer: userId })
        .sort({ datetime: -1 })
        .limit(5)
        .select('title datetime location status')
      ]);

      stats = {
        ...stats,
        totalEvents,
        activeEvents,
        upcomingEvents,
        pendingRequests,
        recentEvents
      };
    }

    return successResponse(res, 200, 'Dashboard stats retrieved successfully', { stats });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return httpResponses.serverError(res, 'Failed to fetch dashboard stats');
  }
};
