import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Update user's online status and last seen
    await User.findByIdAndUpdate(user._id, {
      isOnline: true,
      lastSeen: new Date()
    });

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    next();
  };
};

// Add this function to handle user going offline
export const handleUserOffline = async (userId) => {
  try {
    await User.findByIdAndUpdate(userId, {
      isOnline: false,
      lastSeen: new Date()
    });
  } catch (error) {
    console.error('Error updating user offline status:', error);
  }
}; 