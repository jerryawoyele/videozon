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
    enum: ['active', 'ongoing', 'concluded', 'cancelled'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add virtual field for days to event
eventSchema.virtual('daysToEvent').get(function() {
  if (!this.datetime) return null;
  const now = new Date();
  const eventDate = new Date(this.datetime);
  const diffTime = eventDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Add pre-save middleware to update status based on event date
eventSchema.pre('save', function(next) {
  if (this.isModified('datetime') || this.isModified('status')) {
    const now = new Date();
    const eventDate = new Date(this.datetime);
    const eventEndDate = new Date(eventDate.getTime() + (24 * 60 * 60 * 1000)); // Event end date (24 hours after start)

    if (this.status !== 'cancelled') {
      if (now >= eventDate && now < eventEndDate) {
        this.status = 'ongoing';
      } else if (now >= eventEndDate) {
        this.status = 'concluded';
      } else {
        this.status = 'active';
      }
    }
  }
  next();
});

export default mongoose.model('Event', eventSchema); 