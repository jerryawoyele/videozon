import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
    required: true
  },
  budget: {
    type: Number,
    required: true
  },
  eventDate: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  requirements: String,
  status: {
    type: String,
    enum: ['open', 'in_progress', 'completed', 'cancelled'],
    default: 'open'
  },
  proposals: [{
    professional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    price: Number,
    deliveryTime: Number,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

export default mongoose.model('Request', requestSchema); 