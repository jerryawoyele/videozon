import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';

class NotificationService {
  static async create(data) {
    try {
      // Ensure all required fields are present
      if (!data.recipient || !data.type || !data.title || !data.message) {
        throw new Error('Missing required notification fields');
      }

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
  }

  static async createServiceRequestNotification(data) {
    const { professional, organizer, event, services } = data;
    
    if (!event || !event.title) {
      throw new Error('Event data is required for service request notification');
    }

    return this.create({
      recipient: professional,
      sender: organizer,
      type: 'service_request',
      title: 'New Service Request',
      message: `You have a new service request for event: ${event.title}`,
      eventId: event._id,
      metadata: {
        services,
        eventTitle: event.title,
        eventDate: event.datetime,
        location: event.location
      }
    });
  }

  static async notifyEventUpdated(event) {
    try {
      // Notify all professionals involved in the event
      const professionals = event.professionals.map(p => p.professional);
      
      for (const professionalId of professionals) {
        await Notification.create({
          recipient: professionalId,
          sender: event.organizer,
          type: 'event_update',
          title: 'Event Updated',
          message: `Event "${event.title}" has been updated`,
          relatedEvent: event._id,
          read: false
        });

        // Emit socket notification if available
        if (global.io) {
          global.io.to(`user_${professionalId}`).emit('notification', {
            type: 'event_update',
            title: 'Event Updated',
            message: `Event "${event.title}" has been updated`,
            eventId: event._id
          });
        }
      }
    } catch (error) {
      console.error('Notify event updated error:', error);
      throw error;
    }
  }

  static async notifyServiceRequested(data) {
    try {
      // Extract the event ID if an object is passed
      const eventId = typeof data.event === 'object' ? data.event.event : data.event;
      
      // Create notification for the professional
      const notification = new Notification({
        recipient: data.professional,  // The professional receiving the notification
        sender: data.organizer,       // The organizer sending the request
        type: 'service_request',
        title: 'New Service Request',
        message: 'You have received a new service request',
        relatedEvent: eventId,        // Just the event ID
        read: false
      });

      await notification.save();

      // Safely check for socket.io and emit notification
      try {
        if (global.io) {
          const recipientSocket = global.io.sockets.adapter.rooms.get(data.professional);
          if (recipientSocket) {
            global.io.to(data.professional).emit('notification:new', {
              type: 'service_request',
              title: notification.title,
              message: notification.message,
              eventId: eventId,
              senderId: data.organizer
            });
          }
        }
      } catch (socketError) {
        console.log('Socket notification failed:', socketError);
        // Continue execution even if socket notification fails
      }

      return notification;
    } catch (error) {
      console.error('Notify service requested error:', error);
      throw error;
    }
  }

  static async notifyServiceOffered(eventId, senderId, receiverId, message) {
    try {
      // Create notification for the event organizer
      const notification = new Notification({
        recipient: receiverId,
        sender: senderId,
        type: 'service_offer',
        title: 'New Service Offer',
        message: message || 'You have received a new service offer',
        relatedEvent: eventId,
        read: false
      });

      await notification.save();

      // Safely check for socket.io and emit notification
      try {
        if (global.io) {
          const recipientSocket = global.io.sockets.adapter.rooms.get(receiverId);
          if (recipientSocket) {
            global.io.to(receiverId).emit('notification:new', {
              type: 'service_offer',
              title: notification.title,
              message: notification.message,
              eventId: eventId,
              senderId: senderId
            });
          }
        }
      } catch (socketError) {
        console.log('Socket notification failed:', socketError);
        // Continue execution even if socket notification fails
      }

      return notification;
    } catch (error) {
      console.error('Notify service offered error:', error);
      throw error;
    }
  }

  static async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { read: true },
        { new: true }
      );
      return notification;
    } catch (error) {
      console.error('Mark notification as read error:', error);
      throw error;
    }
  }

  static async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({
        recipient: userId,
        read: false
      });
      return count;
    } catch (error) {
      console.error('Get unread notifications count error:', error);
      throw error;
    }
  }

  static async notifyServiceOfferAccepted(data) {
    try {
      const notification = new Notification({
        recipient: data.professional,
        sender: data.organizer,
        type: 'service_offer_accepted',
        title: 'Service Offer Accepted',
        message: `Your service offer for ${data.event.title} has been accepted`,
        relatedEvent: data.event._id,
        read: false
      });

      await notification.save();

      // Safely check for socket.io and emit notification
      try {
        if (global.io) {
          const recipientSocket = global.io.sockets.adapter.rooms.get(data.professional);
          if (recipientSocket) {
            global.io.to(data.professional).emit('notification:new', {
              type: 'service_offer_accepted',
              title: notification.title,
              message: notification.message,
              eventId: data.event._id,
              senderId: data.organizer
            });
          }
        }
      } catch (socketError) {
        console.log('Socket notification failed:', socketError);
      }

      return notification;
    } catch (error) {
      console.error('Notify service offer accepted error:', error);
      throw error;
    }
  }

  static async notifyServiceOfferRejected(data) {
    try {
      const notification = new Notification({
        recipient: data.professional,
        sender: data.organizer,
        type: 'service_offer_rejected',
        title: 'Service Offer Rejected',
        message: `Your service offer for ${data.event.title} has been declined`,
        relatedEvent: data.event._id,
        read: false
      });

      await notification.save();

      // Safely check for socket.io and emit notification
      try {
        if (global.io) {
          const recipientSocket = global.io.sockets.adapter.rooms.get(data.professional);
          if (recipientSocket) {
            global.io.to(data.professional).emit('notification:new', {
              type: 'service_offer_rejected',
              title: notification.title,
              message: notification.message,
              eventId: data.event._id,
              senderId: data.organizer
            });
          }
        }
      } catch (socketError) {
        console.log('Socket notification failed:', socketError);
      }

      return notification;
    } catch (error) {
      console.error('Notify service offer rejected error:', error);
      throw error;
    }
  }

  static async notifyServiceAccepted(data) {
    try {
      const notification = new Notification({
        recipient: data.organizer,
        sender: data.professional,
        type: 'service_accepted',
        title: 'Service Request Accepted',
        message: `Your service request for ${data.event.title} has been accepted`,
        relatedEvent: data.event._id,
        read: false
      });

      await notification.save();

      // Safely check for socket.io and emit notification
      try {
        if (global.io) {
          const recipientSocket = global.io.sockets.adapter.rooms.get(data.organizer);
          if (recipientSocket) {
            global.io.to(data.organizer).emit('notification:new', {
              type: 'service_accepted',
              title: notification.title,
              message: notification.message,
              eventId: data.event._id,
              senderId: data.professional
            });
          }
        }
      } catch (socketError) {
        console.log('Socket notification failed:', socketError);
      }

      return notification;
    } catch (error) {
      console.error('Notify service accepted error:', error);
      throw error;
    }
  }

  static async notifyServiceRejected(data) {
    try {
      const notification = new Notification({
        recipient: data.organizer,
        sender: data.professional,
        type: 'service_rejected',
        title: 'Service Request Rejected',
        message: `Your service request for ${data.event.title} has been declined`,
        relatedEvent: data.event._id,
        read: false
      });

      await notification.save();

      // Safely check for socket.io and emit notification
      try {
        if (global.io) {
          const recipientSocket = global.io.sockets.adapter.rooms.get(data.organizer);
          if (recipientSocket) {
            global.io.to(data.organizer).emit('notification:new', {
              type: 'service_rejected',
              title: notification.title,
              message: notification.message,
              eventId: data.event._id,
              senderId: data.professional
            });
          }
        }
      } catch (socketError) {
        console.log('Socket notification failed:', socketError);
      }

      return notification;
    } catch (error) {
      console.error('Notify service rejected error:', error);
      throw error;
    }
  }

  static async notifyHireRequested(data) {
    try {
      const notification = await Notification.create({
        type: 'HIRE_REQUESTED',
        sender: data.organizer,
        recipient: data.professional,
        relatedEvent: data.event,
        read: false,
        title: 'New Hire Request',
        message: 'You have received a new hire request'
      });

      // If you're using socket.io, you can emit the notification here
      if (global.io) {
        global.io.to(`user_${data.professional}`).emit('notification', {
          type: 'HIRE_REQUESTED',
          notification
        });
      }

      return notification;
    } catch (error) {
      console.error('Error creating hire request notification:', error);
      throw error;
    }
  }

  static async notifyHireAccepted(data) {
    try {
      const notification = await Notification.create({
        type: 'HIRE_ACCEPTED',
        sender: data.professional,
        recipient: data.organizer,
        relatedEvent: data.event,
        read: false,
        title: 'Hire Request Accepted',
        message: `Your hire request has been accepted${data.event?.title ? ` for ${data.event.title}` : ''}`
      });

      // If you're using socket.io, emit the notification
      if (global.io) {
        global.io.to(`user_${data.organizer}`).emit('notification', {
          type: 'HIRE_ACCEPTED',
          notification
        });
      }

      return notification;
    } catch (error) {
      console.error('Error creating hire accepted notification:', error);
      throw error;
    }
  }

  static async notifyNewMessage(message) {
    try {
      const notification = await Notification.create({
        type: 'MESSAGE',
        sender: message.sender,
        recipient: message.receiver,
        relatedMessage: message._id,
        read: false,
        title: 'New Message',
        message: message.content.substring(0, 100) // First 100 characters of message
      });

      // If you're using socket.io, emit the notification
      if (global.io) {
        global.io.to(`user_${message.receiver}`).emit('notification', {
          type: 'MESSAGE',
          notification,
          message: {
            id: message._id,
            content: message.content,
            sender: message.sender,
            createdAt: message.createdAt
          }
        });
      }

      return notification;
    } catch (error) {
      console.error('Error creating new message notification:', error);
      throw error;
    }
  }

  // Add other notification creation methods as needed
}

export default NotificationService;
