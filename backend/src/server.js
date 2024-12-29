import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleMulterError } from './config/multer.js';
import fs from 'fs';
import apiRouter from './routes/api.js';
import jwt from 'jsonwebtoken';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Configure CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5174',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

// Configure Content Security Policy
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self' http://localhost:5000 ws://localhost:5000",
      "img-src 'self' http://localhost:5000 https://ui-avatars.com https://res.cloudinary.com data:",
      "style-src 'self' 'unsafe-inline'",
      "connect-src 'self' http://localhost:5000 ws://localhost:5000"
    ].join('; ')
  );
  next();
});

// Configure Socket.IO
const io = new Server(httpServer, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }
  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Store user's socket id and update online status
  socket.join(socket.userId);
  updateUserStatus(socket.userId, true);

  // Broadcast to others that user is online
  socket.broadcast.emit('userStatus', {
    userId: socket.userId,
    isOnline: true,
    lastSeen: new Date()
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    const lastSeen = new Date();
    await updateUserStatus(socket.userId, false, lastSeen);
    
    // Broadcast to others that user is offline
    socket.broadcast.emit('userStatus', {
      userId: socket.userId,
      isOnline: false,
      lastSeen
    });
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  // Handle going offline
  socket.on('goingOffline', async () => {
    console.log('User going offline:', socket.userId);
    const lastSeen = new Date();
    await updateUserStatus(socket.userId, false, lastSeen);
    
    socket.broadcast.emit('userStatus', {
      userId: socket.userId,
      isOnline: false,
      lastSeen
    });
  });
});

// Add this function to update user status in the database
async function updateUserStatus(userId, isOnline, lastSeen = new Date()) {
  try {
    await mongoose.model('User').findByIdAndUpdate(userId, {
      isOnline,
      lastSeen
    });
  } catch (error) {
    console.error('Error updating user status:', error);
  }
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(path.dirname(__dirname), 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// Add multer error handling middleware
app.use(handleMulterError);

// Routes
app.use('/api', apiRouter);

// Connect to MongoDB with more detailed error logging
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Videozon API' });
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, io };
