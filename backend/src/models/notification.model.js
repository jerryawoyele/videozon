import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      // Event related
      'event_created',
      'event_updated',
      'event_cancelled',
      'event_completed',
      // Service related
      'service_request',
      'service_accepted',
      'service_rejected',
      // Hire related
      'hire_request',
      'hire_accepted',
      'hire_rejected',
      // Professional related
      'professional_joined',
      'professional_left',
      'professional_reviewed',
      // Message related
      'message_received',
      'message_request',
      // Payment related
      'payment_received',
      'payment_sent',
      'payment_failed',
      // Review related
      'review_received',
      // System related
      'system_update',
      'account_update'
    ],
    required: true
  },
  title: {
    type: String,
    default: 'Notification'
  },
  message: {
    type: String,
    default: ''
  },
  link: String,
  read: {
    type: Boolean,
    default: false
  },
  viewed: {
    type: Boolean,
    default: false
  },
  metadata: {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    },
    reviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review'
    },
    amount: Number,
    status: String,
    rating: Number,
    comment: String
  }
}, {
  timestamps: true
});

export default mongoose.model('Notification', notificationSchema);
