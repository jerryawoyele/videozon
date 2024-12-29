import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['wedding', 'corporate', 'birthday', 'other']
  },
  datetime: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attendees: {
    type: Number,
    required: true,
    min: 1
  },
  budget: {
    type: Number,
    required: true,
    min: 0
  },
  requirements: String,
  services: [{
    type: String,
    enum: [
      'photographer',
      'videographer',
      'caterer',
      'musician',
      'decorator',
      'planner',
      'security',
      'mc'
    ]
  }],
  professionals: [{
    professional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    service: String,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    }
  }],
  images: [{
    url: String,
    publicId: String
  }],
  status: {
    type: String,
    enum: ['active', 'cancelled', 'completed'],
    default: 'active'
  }
}, {
  timestamps: true
});

export default mongoose.model('Event', eventSchema); 