import mongoose from 'mongoose';

const gigSchema = new mongoose.Schema({
  professional: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  services: {
    type: [String],
    required: true,
    enum: ['photographer', 'videographer', 'caterer', 'musician', 'decorator', 'planner', 'security', 'mc']
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5
  },
  review: {
    type: String
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add indexes for common queries
gigSchema.index({ professional: 1, status: 1 });
gigSchema.index({ event: 1 });
gigSchema.index({ status: 1, startDate: 1 });

const Gig = mongoose.model('Gig', gigSchema);

export default Gig; 