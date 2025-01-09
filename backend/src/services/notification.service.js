import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';
import { getIO } from '../config/socket.js';

class NotificationService {
  static async notifyNewMessage(message) {
    try {
      // Only create notification for the receiver
      const notification = await Notification.create({
        recipient: message.receiver,
        type: 'message_received',
        title: 'New Message',
        message: `${message.sender.name} sent you a message`,
        metadata: {
          messageId: message._id,
          userId: message.sender
        }
      });

      await notification.populate('metadata.userId', 'name');

      // Emit socket event to recipient's room
      getIO().to(message.receiver.toString()).emit('notification:new', {
        ...notification.toObject(),
        type: 'message_received'
      });

      return notification;
    } catch (error) {
      console.error('Error creating message notification:', error);
    }
  }

  static async notifyMessageRequest(request) {
    try {
      const notification = await Notification.create({
        recipient: request.receiver,
        type: 'message_request',
        title: 'New Service Request',
        message: `${request.sender.name} sent you a service request`,
        metadata: {
          messageId: request._id,
          userId: request.sender
        }
      });

      await notification.populate('metadata.userId', 'name');

      // Emit socket event to recipient's room
      getIO().to(request.receiver.toString()).emit('notification:new', {
        ...notification.toObject(),
        type: 'message_request'
      });

      return notification;
    } catch (error) {
      console.error('Error creating request notification:', error);
    }
  }

  static async notifyNewEvent(event, creator) {
    try {
      // Get all users who have chatted with the event creator
      const chatPartners = await User.distinct('_id', {
        $or: [
          { 'messages.sender': creator._id },
          { 'messages.receiver': creator._id }
        ]
      });

      // Create notifications for each chat partner
      const notifications = await Promise.all(
        chatPartners.map(async (partnerId) => {
          const notification = await Notification.create({
            recipient: partnerId,
            type: 'event_created',
            title: 'New Event Posted',
            message: `${creator.name} posted a new event: ${event.title}`,
            metadata: {
              eventId: event._id,
              userId: creator._id
            }
          });

          await notification.populate('metadata.userId', 'name');
          await notification.populate('metadata.eventId', 'title');

          // Emit socket event to each recipient's room
          getIO().to(partnerId.toString()).emit('notification:new', {
            ...notification.toObject(),
            type: 'event_created'
          });

          return notification;
        })
      );

      return notifications;
    } catch (error) {
      console.error('Error creating event notification:', error);
    }
  }

  static async notifyServiceRequested({ professional, organizer, event }) {
    try {
      const notification = await Notification.create({
        recipient: professional,
        type: 'service_request',
        title: 'New Service Request',
        message: `You have a new service request for event: ${event.title}`,
        metadata: {
          eventId: event._id,
          userId: organizer
        }
      });

      await notification.populate('metadata.userId', 'name');
      await notification.populate('metadata.eventId', 'title');

      // Emit socket event to recipient's room
      getIO().to(professional.toString()).emit('notification:new', {
        ...notification.toObject(),
        type: 'service_request'
      });

      return notification;
    } catch (error) {
      console.error('Error creating service request notification:', error);
    }
  }

  static async notifyServiceAccepted({ organizer, professional, event }) {
    try {
      const notification = await Notification.create({
        recipient: organizer,
        type: 'service_accepted',
        title: 'Service Request Accepted',
        message: `Your service request for event "${event.title}" has been accepted`,
        metadata: {
          eventId: event._id,
          userId: professional
        }
      });

      await notification.populate('metadata.userId', 'name');
      await notification.populate('metadata.eventId', 'title');

      // Emit socket event to recipient's room
      getIO().to(organizer.toString()).emit('notification:new', {
        ...notification.toObject(),
        type: 'service_accepted'
      });

      return notification;
    } catch (error) {
      console.error('Error creating service accepted notification:', error);
    }
  }

  static async notifyServiceRejected({ organizer, professional, event }) {
    try {
      const notification = await Notification.create({
        recipient: organizer,
        type: 'service_rejected',
        title: 'Service Request Rejected',
        message: `Your service request for event "${event.title}" has been rejected`,
        metadata: {
          eventId: event._id,
          userId: professional
        }
      });

      await notification.populate('metadata.userId', 'name');
      await notification.populate('metadata.eventId', 'title');

      // Emit socket event to recipient's room
      getIO().to(organizer.toString()).emit('notification:new', {
        ...notification.toObject(),
        type: 'service_rejected'
      });

      return notification;
    } catch (error) {
      console.error('Error creating service rejected notification:', error);
    }
  }

  static async notifyEventUpdated(event) {
    try {
      // Get all professionals involved in the event
      const recipients = event.professionals.map(prof => prof.professional);

      // Create notifications for each professional
      const notifications = await Promise.all(
        recipients.map(async (professionalId) => {
          const notification = await Notification.create({
            recipient: professionalId,
            type: 'event_updated',
            title: 'Event Updated',
            message: `Event "${event.title}" has been updated`,
            metadata: {
              eventId: event._id,
              userId: event.organizer
            }
          });

          await notification.populate('metadata.userId', 'name');
          await notification.populate('metadata.eventId', 'title');

          // Emit socket event to each recipient's room
          getIO().to(professionalId.toString()).emit('notification:new', {
            ...notification.toObject(),
            type: 'event_updated'
          });

          return notification;
        })
      );

      return notifications;
    } catch (error) {
      console.error('Error creating event update notification:', error);
    }
  }

  static async notifyHireRequested({ professional, organizer, event }) {
    try {
      const notification = await Notification.create({
        recipient: professional,
        type: 'hire_request',
        title: 'New Hire Request',
        message: `You have received a hire request for event: ${event.title}`,
        metadata: {
          eventId: event._id,
          userId: organizer
        }
      });

      await notification.populate('metadata.userId', 'name');
      await notification.populate('metadata.eventId', 'title');

      // Emit socket event to recipient's room
      getIO().to(professional.toString()).emit('notification:new', {
        ...notification.toObject(),
        type: 'hire_request'
      });

      return notification;
    } catch (error) {
      console.error('Error creating hire request notification:', error);
    }
  }

  static async notifyHireAccepted({ organizer, professional, event }) {
    try {
      const notification = await Notification.create({
        recipient: organizer,
        type: 'hire_accepted',
        title: 'Hire Request Accepted',
        message: `Your hire request for event "${event.title}" has been accepted`,
        metadata: {
          eventId: event._id,
          userId: professional
        }
      });

      await notification.populate('metadata.userId', 'name');
      await notification.populate('metadata.eventId', 'title');

      // Emit socket event to recipient's room
      getIO().to(organizer.toString()).emit('notification:new', {
        ...notification.toObject(),
        type: 'hire_accepted'
      });

      return notification;
    } catch (error) {
      console.error('Error creating hire accepted notification:', error);
    }
  }

  static async notifyHireRejected({ organizer, professional, event }) {
    try {
      const notification = await Notification.create({
        recipient: organizer,
        type: 'hire_rejected',
        title: 'Hire Request Rejected',
        message: `Your hire request for event "${event.title}" has been rejected`,
        metadata: {
          eventId: event._id,
          userId: professional
        }
      });

      await notification.populate('metadata.userId', 'name');
      await notification.populate('metadata.eventId', 'title');

      // Emit socket event to recipient's room
      getIO().to(organizer.toString()).emit('notification:new', {
        ...notification.toObject(),
        type: 'hire_rejected'
      });

      return notification;
    } catch (error) {
      console.error('Error creating hire rejected notification:', error);
    }
  }
}

export default NotificationService;
