import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { Server } from 'socket.io';

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
      allowedHeaders: ['Authorization', 'Content-Type']
    },
    allowEIO3: true,
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    maxHttpBufferSize: 1e8
  });
  setupSocketIO(io);
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

export const setupSocketIO = (socketIO) => {
  const activeUsers = new Map();

  socketIO.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token missing'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded || !decoded.userId) {
          return next(new Error('Invalid token'));
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = decoded.userId;
        socket.user = user;
        next();
      } catch (error) {
        console.error('Token verification error:', error);
        return next(new Error('Authentication error'));
      }
    } catch (err) {
      console.error('Socket middleware error:', err);
      return next(new Error('Authentication error'));
    }
  });

  socketIO.on('connection', async (socket) => {
    try {
      console.log(`Socket connected: ${socket.userId}`);
      
      if (socket.userId) {
        // Update user's online status
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: true,
          lastSeen: new Date()
        });

        // Add to active users and join personal room
        activeUsers.set(socket.userId, socket.id);
        socket.join(socket.userId);

        // Broadcast user's online status
        socketIO.emit('userStatus', {
          userId: socket.userId,
          isOnline: true,
          lastSeen: new Date()
        });

        // Send current online users to the connected client
        socket.emit('users:online', Array.from(activeUsers.keys()));
      }

      // Handle joining rooms
      socket.on('join', (room) => {
        if (room === socket.userId) {
          socket.join(room);
          console.log(`User ${socket.userId} joined room: ${room}`);
        }
      });

      // Handle leaving rooms
      socket.on('leave', (room) => {
        socket.leave(room);
        console.log(`User ${socket.userId} left room: ${room}`);
      });

      // Handle user disconnection
      socket.on('disconnect', async () => {
        try {
          if (socket.user) {
            // Update user status to offline and set last seen
            await User.findByIdAndUpdate(socket.user.id, {
              isOnline: false,
              lastSeen: new Date()
            });

            // Emit status update to all clients
            io.emit('user:status', {
              userId: socket.user.id,
              isOnline: false,
              lastSeen: new Date()
            });

            // Remove from online users
            onlineUsers.delete(socket.user.id);
            io.emit('users:online', Array.from(onlineUsers));
          }
        } catch (error) {
          console.error('Socket disconnect error:', error);
        }
      });

      socket.on('goingOffline', async () => {
        try {
          console.log(`User going offline: ${socket.userId}`);
          if (socket.userId) {
            activeUsers.delete(socket.userId);
            await User.findByIdAndUpdate(socket.userId, {
              isOnline: false,
              lastSeen: new Date()
            });

            socketIO.emit('userStatus', {
              userId: socket.userId,
              isOnline: false,
              lastSeen: new Date()
            });
          }
        } catch (error) {
          console.error('Going offline handler error:', error);
        }
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    } catch (error) {
      console.error('Connection handler error:', error);
    }
  });
}; 