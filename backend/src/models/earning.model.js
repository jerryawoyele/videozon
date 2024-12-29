import mongoose from 'mongoose';

const earningSchema = new mongoose.Schema({
  professional: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  serviceFee: {
    type: Number,
    required: true
  },
  netAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'available', 'withdrawn'],
    default: 'pending'
  },
  availableDate: {
    type: Date,
    required: true
  },
  withdrawalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Withdrawal'
  }
}, {
  timestamps: true
});

// Add index for querying earnings by date range
earningSchema.index({ professional: 1, createdAt: 1 });

export default mongoose.model('Earning', earningSchema); 