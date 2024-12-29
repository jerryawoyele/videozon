# Frontend Documentation

## Overview

The frontend is built with React.js and Vite, using Tailwind CSS for styling. The application follows a component-based architecture with proper separation of concerns.

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── context/        # React context providers
│   ├── pages/          # Page components
│   ├── utils/          # Utility functions
│   └── routes/         # Route definitions
```

## Key Components

### Layout Components

#### Layout.jsx
The main layout wrapper that includes:
- Header with navigation
- Sidebar for authenticated users
- Main content area
- Responsive design support

#### Header.jsx
Contains:
- Logo
- Navigation links
- Authentication status
- Notification bell
- User menu

#### Sidebar.jsx
Provides:
- Dashboard navigation
- Quick access to messages
- Event management links
- Profile settings

### Page Components

#### DashboardPage.jsx
- Displays overview of user activity
- Shows upcoming events
- Recent messages
- Notifications
- Analytics for professionals

#### EventsPage.jsx
- Lists all events
- Filtering and search capabilities
- Event cards with key information
- Pagination

#### ProfessionalProfilePage.jsx
- Professional's public profile
- Services offered
- Reviews and ratings
- Availability calendar
- Contact button

#### MessagesPage.jsx
- Conversation list
- Real-time message updates
- Message composition
- File attachment support

## State Management

### AuthContext
Manages authentication state:
```jsx
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Authentication methods
  const login = async (credentials) => {
    // Implementation
  };

  const logout = () => {
    // Implementation
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

## Routing

Routes are defined in `src/routes/index.jsx`:

```jsx
<Routes>
  {/* Public Routes */}
  <Route path="/" element={<HomePage />} />
  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<SignUp />} />
  
  {/* Protected Routes */}
  <Route element={<PrivateRoute />}>
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/events" element={<EventsPage />} />
    <Route path="/messages" element={<MessagesPage />} />
    <Route path="/notifications" element={<NotificationsPage />} />
  </Route>
</Routes>
```

## API Integration

API calls are handled using axios with a custom configuration:

```javascript
// src/utils/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## Real-time Features

Socket.IO is used for real-time features:
- Message notifications
- Event updates
- Status changes

```javascript
// Socket connection setup
const socket = io(SOCKET_URL, {
  auth: {
    token: localStorage.getItem('token'),
  },
});

// Event listeners
socket.on('new_message', handleNewMessage);
socket.on('notification', handleNotification);
```

## Styling

Tailwind CSS is used for styling with custom configuration:

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#007bff',
        secondary: '#6c757d',
      },
      // Custom spacing, breakpoints, etc.
    },
  },
  plugins: [],
};
```

## Form Handling

Forms are handled using controlled components with proper validation:

```jsx
const [formData, setFormData] = useState({
  title: '',
  description: '',
  date: '',
  // ...other fields
});

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    // Form validation
    // API call
    // Success handling
  } catch (error) {
    // Error handling
  }
};
```

## Error Handling

Global error handling is implemented using:
- API error interceptors
- Error boundaries for React components
- Toast notifications for user feedback

## Performance Optimization

- React.memo() for expensive components
- useMemo() and useCallback() for optimization
- Lazy loading for routes
- Image optimization with Cloudinary
- Code splitting

## Testing

Components can be tested using Jest and React Testing Library:

```javascript
import { render, screen, fireEvent } from '@testing-library/react';

test('login form submission', async () => {
  render(<Login />);
  
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'test@example.com' },
  });
  
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: 'password123' },
  });
  
  fireEvent.click(screen.getByRole('button', { name: /login/i }));
  
  // Assert expected behavior
});
