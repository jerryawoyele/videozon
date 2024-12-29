# Videozon Platform

A professional event management and booking platform that connects event organizers with service providers.

## Features

- 👥 User Authentication & Authorization
- 📅 Event Management
- 💼 Professional Profiles
- 💬 Real-time Messaging
- 🔔 Notifications System
- 💰 Payment Processing
- 📊 Analytics Dashboard
- ⭐ Reviews & Ratings
- 🎯 Service Offerings/Gigs

## Tech Stack

- **Frontend**: React.js with Vite
- **Backend**: Node.js & Express
- **Database**: MongoDB
- **Real-time**: Socket.IO
- **File Storage**: Cloudinary
- **Styling**: Tailwind CSS
- **Email**: Mailtrap

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Getting Started

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/videozon.git
cd videozon
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Create environment files:

Backend (.env):
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
MAILTRAP_USER=your_mailtrap_user
MAILTRAP_PASS=your_mailtrap_password
```

Frontend (.env):
```env
VITE_API_URL=http://localhost:5000/api
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Project Structure

### Backend

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

### Frontend

```
frontend/
├── src/
│   ├── components/     # Reusable components
│   ├── context/        # React context
│   ├── pages/          # Page components
│   ├── utils/          # Utility functions
│   └── routes/         # Route definitions
```

## API Documentation

Detailed API documentation can be found in [docs/api.md](docs/api.md)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
