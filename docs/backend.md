# Backend Documentation

## Overview

The backend is built with Node.js and Express, using MongoDB as the database. It follows a modular architecture with clear separation of concerns between routes, controllers, services, and models.

## Architecture

```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Custom middleware
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   └── validations/    # Request validation schemas
```

## Database Models

### User Model
```javascript
const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'professional'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
```

### Event Model
```javascript
const eventSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  category: { type: String, required: true },
  budget: { type: Number, required: true },
  organizer: { type: Schema.Types.ObjectId, ref: 'User' },
  professionals: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['pending', 'active', 'completed'], default: 'pending' }
});
```

### Message Model
```javascript
const messageSchema = new Schema({
  conversation: { type: Schema.Types.ObjectId, ref: 'Conversation' },
  sender: { type: Schema.Types.ObjectId, ref: 'User' },
  content: { type: String, required: true },
  readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});
```

## Middleware

### Authentication Middleware
```javascript
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new Error('No token provided');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }
    });
  }
};
```

### Error Handling Middleware
```javascript
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message,
        details: Object.values(err.errors).map(e => e.message)
      }
    });
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  });
};
```

## Services

### Notification Service
```javascript
class NotificationService {
  static async create(userId, type, data) {
    const notification = await Notification.create({
      user: userId,
      type,
      data,
      createdAt: new Date()
    });

    // Emit socket event
    io.to(userId.toString()).emit('notification', notification);
    
    return notification;
  }

  static async markAsRead(notificationId, userId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { $set: { read: true } },
      { new: true }
    );
  }
}
```

### Email Service
```javascript
class EmailService {
  static async sendVerificationEmail(user, token) {
    const template = await fs.readFile(
      path.join(__dirname, '../templates/emails/verification.hbs'),
      'utf-8'
    );
    const html = Handlebars.compile(template)({
      name: user.name,
      verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${token}`
    });

    return mailer.sendMail({
      to: user.email,
      subject: 'Verify Your Email',
      html
    });
  }
}
```

## Socket.IO Integration

```javascript
const socketAuth = (socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
};

io.use(socketAuth);

io.on('connection', (socket) => {
  // Join user's room for private notifications
  socket.join(socket.user.id);

  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation:${conversationId}`);
  });

  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
  });

  socket.on('send_message', async (data) => {
    const message = await MessageService.create(data);
    io.to(`conversation:${data.conversationId}`).emit('new_message', message);
  });
});
```

## File Upload

Using Multer and Cloudinary for file uploads:

```javascript
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

const uploadToCloudinary = async (file) => {
  const b64 = Buffer.from(file.buffer).toString('base64');
  const dataURI = `data:${file.mimetype};base64,${b64}`;
  
  const result = await cloudinary.uploader.upload(dataURI, {
    resource_type: 'auto',
    folder: 'videozon'
  });
  
  return result.secure_url;
};
```

## Environment Variables

Required environment variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/videozon
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
MAILTRAP_USER=your_mailtrap_user
MAILTRAP_PASS=your_mailtrap_pass
FRONTEND_URL=http://localhost:5173
```

## Error Handling

The application uses a centralized error handling approach:

```javascript
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Usage in controllers
const createEvent = async (req, res, next) => {
  try {
    // Implementation
  } catch (error) {
    next(new AppError('Failed to create event', 400));
  }
};
```

## Testing

Using Jest for unit and integration testing:

```javascript
describe('AuthController', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('register', () => {
    it('should create a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.email).toBe('test@example.com');
    });
  });
});
