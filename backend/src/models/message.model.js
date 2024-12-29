import mongoose from 'mongoose';

const messageVersionSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  editedAt: {
    type: Date,
    default: Date.now
  },
  editedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { _id: false });

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['message', 'service_request', 'service_offer'],
    default: 'message'
  },
  content: {
    type: String,
    required: true
  },
  relatedEvent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  service: {
    type: String,
    enum: ['photographer', 'videographer', 'caterer', 'musician', 'decorator', 'planner', 'security', 'mc']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'read', 'unread'],
    default: 'unread'
  },
  parentMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  versions: [messageVersionSchema],
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

export default mongoose.model('Message', messageSchema);
