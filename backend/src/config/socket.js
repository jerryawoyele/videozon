import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const setupSocketIO = (io) => {
  const activeUsers = new Map();

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        throw new Error('Authentication token missing');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded || !decoded.userId) {
        throw new Error('Invalid token');
      }

      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      socket.userId = decoded.userId;
      
      // Update user's online status
      await User.findByIdAndUpdate(decoded.userId, {
        isOnline: true,
        lastSeen: new Date()
      });

      // Broadcast user's online status
      io.emit('userStatus', {
        userId: decoded.userId,
        isOnline: true,
        lastSeen: new Date()
      });

      console.log(`User ${decoded.userId} connected`);
      next();
    } catch (err) {
      console.error('Socket authentication error:', err.message);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.userId}`);
    
    if (socket.userId) {
      activeUsers.set(socket.userId, socket.id);
    }

    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.userId}`);
      if (socket.userId) {
        activeUsers.delete(socket.userId);
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastSeen: new Date()
        });

        io.emit('userStatus', {
          userId: socket.userId,
          isOnline: false,
          lastSeen: new Date()
        });
      }
    });

    socket.on('goingOffline', async () => {
      console.log(`User going offline: ${socket.userId}`);
      if (socket.userId) {
        activeUsers.delete(socket.userId);
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastSeen: new Date()
        });

        io.emit('userStatus', {
          userId: socket.userId,
          isOnline: false,
          lastSeen: new Date()
        });
      }
    });
  });
}; 