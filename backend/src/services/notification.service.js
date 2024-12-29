import Notification from '../models/notification.model.js';
import logger from '../config/logger.js';

class NotificationService {
  static async createNotification(recipientId, type, title, message, metadata = {}) {
    try {
      const notification = new Notification({
        recipient: recipientId,
        type,
        title,
        message,
        metadata
      });

      await notification.save();
      return notification;
    } catch (error) {
      logger.error('Create notification error:', error);
      throw error;
    }
  }

  // Event notifications
  static async notifyEventCreated(event) {
    const message = `New event "${event.title}" has been created`;
    return this.createNotification(
      event.organizer._id || event.organizer,
      'event_created',
      'New Event Created',
      message,
      { eventId: event._id }
    );
  }

  static async notifyEventUpdated(event) {
    // Notify all professionals involved
    const notifications = event.professionals.map(prof => 
      this.createNotification(
        prof.professional._id || prof.professional,
        'event_updated',
        'Event Updated',
        `Event "${event.title}" has been updated`,
        { eventId: event._id }
      )
    );
    
    // Also notify the organizer
    notifications.push(
      this.createNotification(
        event.organizer._id || event.organizer,
        'event_updated',
        'Event Updated',
        `Your event "${event.title}" has been updated`,
        { eventId: event._id }
      )
    );
    
    return Promise.all(notifications);
  }

  // Service notifications
  static async notifyServiceRequested(request) {
    return this.createNotification(
      request.professional._id || request.professional,
      'service_request',
      'New Service Request',
      `You have a new service request for event "${request.event.title}"`,
      { 
        eventId: request.event._id,
        userId: request.organizer._id || request.organizer
      }
    );
  }

  static async notifyServiceAccepted(request) {
    return this.createNotification(
      request.organizer._id || request.organizer,
      'service_accepted',
      'Service Request Accepted',
      `Your service request for event "${request.event.title}" has been accepted`,
      { 
        eventId: request.event._id,
        userId: request.professional._id || request.professional
      }
    );
  }

  static async notifyServiceRejected(request) {
    return this.createNotification(
      request.organizer._id || request.organizer,
      'service_rejected',
      'Service Request Rejected',
      `Your service request for event "${request.event.title}" has been declined`,
      { 
        eventId: request.event._id,
        userId: request.professional._id || request.professional
      }
    );
  }

  // Professional notifications
  static async notifyProfessionalJoined(event, professional) {
    return this.createNotification(
      event.organizer._id || event.organizer,
      'professional_joined',
      'Professional Joined',
      `${professional.name} has joined your event "${event.title}"`,
      { 
        eventId: event._id,
        userId: professional._id
      }
    );
  }

  static async notifyProfessionalLeft(event, professional) {
    return this.createNotification(
      event.organizer._id || event.organizer,
      'professional_left',
      'Professional Left',
      `${professional.name} has left your event "${event.title}"`,
      { 
        eventId: event._id,
        userId: professional._id
      }
    );
  }

  // Message notifications
  static async notifyNewMessage(message) {
    return this.createNotification(
      message.receiver._id || message.receiver,
      'message_received',
      'New Message',
      `You have a new message from ${message.sender.name}`,
      { 
        messageId: message._id,
        userId: message.sender._id || message.sender
      }
    );
  }

  static async notifyPaymentReceived(payment) {
    return this.createNotification(
      payment.recipient._id || payment.recipient,
      'payment_received',
      'Payment Received',
      `You received a payment of $${payment.amount} for event "${payment.event.title}"`,
      { 
        paymentId: payment._id,
        eventId: payment.event._id,
        amount: payment.amount
      }
    );
  }

  static async notifyPaymentSent(payment) {
    return this.createNotification(
      payment.sender._id || payment.sender,
      'payment_sent',
      'Payment Sent',
      `Your payment of $${payment.amount} for event "${payment.event.title}" was sent`,
      { 
        paymentId: payment._id,
        eventId: payment.event._id,
        amount: payment.amount
      }
    );
  }

  static async notifyReviewReceived(review) {
    return this.createNotification(
      review.recipient._id || review.recipient,
      'review_received',
      'New Review',
      `You received a ${review.rating}-star review from ${review.author.name}`,
      { 
        reviewId: review._id,
        userId: review.author._id || review.author,
        rating: review.rating
      }
    );
  }
}

export default NotificationService;
