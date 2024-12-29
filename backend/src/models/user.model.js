import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const timeSlotSchema = new mongoose.Schema({
  start: {
    type: String,
    required: true
  },
  end: {
    type: String,
    required: true
  }
}, { _id: false });

const availabilitySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  timeSlots: [timeSlotSchema]
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  role: {
    type: String,
    enum: ['client', 'professional'],
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
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
  bio: {
    type: String,
    maxLength: 500
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  completedEvents: {
    type: Number,
    default: 0
  },
  availability: [availabilitySchema],
  portfolio: [{
    title: String,
    description: String,
    image: {
      url: String,
      publicId: String
    }
  }],
  avatar: {
    url: String,
    publicId: String
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  settings: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    marketingEmails: {
      type: Boolean,
      default: false
    },
    twoFactorAuth: {
      type: Boolean,
      default: false
    }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for default avatar
userSchema.virtual('defaultAvatar').get(function() {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=random`;
});

// Modify the avatar getter to return defaultAvatar if no custom avatar is set
userSchema.virtual('avatarUrl').get(function() {
  return this.avatar?.url || this.defaultAvatar;
});


userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    if (!this.password) {
      const user = await this.constructor.findById(this._id).select('+password');
      return await bcrypt.compare(candidatePassword, user.password);
    }
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Password comparison error:', error);
    throw error;
  }
};

export default mongoose.model('User', userSchema);
