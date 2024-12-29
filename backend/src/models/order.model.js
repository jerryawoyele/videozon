import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  professional: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  service: {
    title: String,
    description: String,
    requirements: String,
    attachments: [{
      url: String,
      publicId: String,
      name: String
    }]
  },
  deliverables: [{
    title: String,
    description: String,
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  }],
  delivery: {
    files: [{
      url: String,
      publicId: String,
      name: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    note: String,
    deliveredAt: Date
  },
  payment: {
    amount: {
      type: Number,
      required: true
    },
    paid: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid'],
      default: 'pending'
    },
    history: [{
      amount: Number,
      date: {
        type: Date,
        default: Date.now
      },
      method: String
    }]
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'delivered', 'completed', 'cancelled'],
    default: 'pending'
  },
  timeline: [{
    status: String,
    date: {
      type: Date,
      default: Date.now
    },
    note: String
  }],
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    attachments: [{
      url: String,
      publicId: String,
      name: String
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Generate unique order ID
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderId = `ORD${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Update timeline on status change
orderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.timeline.push({
      status: this.status,
      date: new Date(),
      note: `Order marked as ${this.status}`
    });
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

export default Order; 