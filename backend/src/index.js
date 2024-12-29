import { Server } from 'socket.io';
import { setupSocketIO } from './config/socket.js';

// After creating your HTTP server
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
});

setupSocketIO(io); 