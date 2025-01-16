import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import toast from 'react-hot-toast';
import { CloudCog } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Initialize user from localStorage if available
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return JSON.parse(storedUser);
    }
    return null;
  });
  const [socket, setSocket] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const navigate = useNavigate();

  // Add this useEffect to handle initial loading state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (storedUser && token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const updateUser = (userData) => {
    const updatedUser = {
      ...user, // Keep existing user data
      ...userData, // Merge new data
      bio: userData.bio || user?.bio || '',
      services: userData.services || user?.services || [],
      avatarUrl: userData.avatarUrl || userData.avatar?.url || user?.avatarUrl
    };

    // Update state
    setUser(updatedUser);
    
    // Update localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };
  

  const login = useCallback(async (userData) => {
    setLoading(true);
    try {
      setUser(userData);
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(userData));
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      // Clean up socket connection
      if (socket) {
        socket.disconnect();
      }
      // Clear stored data
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      // Clear authorization header
      delete axios.defaults.headers.common['Authorization'];
      // Reset states
      setUser(null);
      setSocket(null);
      setUnreadNotifications(0);
      setOnlineUsers(new Set());
    } finally {
      setLoading(false);
    }
  }, [socket]);

  // Initialize socket connection
  useEffect(() => {
    if (user && !socket) {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        // Remove /api from the URL for socket connection
        const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '');
        console.log('Connecting to socket at:', baseUrl);

        const newSocket = io(baseUrl, {
          auth: { token },
          transports: ['websocket', 'polling'],
          upgrade: true,
          rememberUpgrade: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
          autoConnect: true,
          withCredentials: true,
          path: '/socket.io'
        });

        // Handle connection events
        newSocket.on('connect', () => {
          console.log('Socket connected successfully');
          // Join user's room for private notifications
          newSocket.emit('join', user._id);
        });

        newSocket.on('connect_error', (error) => {
          console.error('Socket connection error:', error.message);
          if (error.message === 'Authentication error') {
            logout();
          }
        });

        newSocket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          if (reason === 'io server disconnect') {
            // Reconnect if server disconnected
            newSocket.connect();
          }
        });

        newSocket.on('notification:new', (notification) => {
          console.log('New notification received:', notification);
          setUnreadNotifications(prev => prev + 1);
          // Show toast notification
          toast.success(notification.message, {
            duration: 5000,
            position: 'top-right',
          });
        });

        newSocket.on('users:online', (users) => {
          setOnlineUsers(new Set(users));
        });

        newSocket.on('user:online', (userId) => {
          setOnlineUsers(prev => new Set([...prev, userId]));
        });

        newSocket.on('user:offline', (userId) => {
          setOnlineUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
        });

        // Connect the socket
        newSocket.connect();
        setSocket(newSocket);

        // Cleanup on unmount
        return () => {
          if (newSocket) {
            newSocket.emit('leave', user._id);
            newSocket.disconnect();
          }
        };
      } catch (error) {
        console.error('Socket initialization error:', error);
      }
    }
  }, [user, logout]);

  // Fetch initial unread notifications count
  useEffect(() => {
    if (user) {
      fetchUnreadNotificationsCount();
    }
  }, [user]);

  const fetchUnreadNotificationsCount = async () => {
    try {
      const response = await axios.get('/notifications/unread-count');
      if (response.data.success) {
        setUnreadNotifications(response.data.data.count);
      }
    } catch (error) {
      console.error('Failed to fetch unread notifications count:', error);
      if (error.response?.status === 401) {
        logout();
      }
    }
  };

  const isUserOnline = useCallback((userId) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  useEffect(() => {
    if (user && socket) {
      // Update online status when user connects
      const updateOnlineStatus = async (isOnline) => {
        try {
          await axios.post(`${import.meta.env.VITE_API_URL}/users/status`, {
            isOnline,
            lastSeen: isOnline ? null : new Date().toISOString()
          });
        } catch (error) {
          console.error('Error updating online status:', error);
        }
      };

      // Set user as online when connecting
      updateOnlineStatus(true);

      // Handle page visibility change
      const handleVisibilityChange = () => {
        updateOnlineStatus(!document.hidden);
      };

      // Handle beforeunload event
      const handleBeforeUnload = () => {
        updateOnlineStatus(false);
      };

      // Add event listeners
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('beforeunload', handleBeforeUnload);

      // Socket connection for real-time status updates
      socket.on('connect', () => {
        updateOnlineStatus(true);
      });

      socket.on('disconnect', () => {
        updateOnlineStatus(false);
      });

      // Listen for user status updates
      socket.on('user:status', ({ userId, isOnline, lastSeen }) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          if (isOnline) {
            newSet.add(userId);
          } else {
            newSet.delete(userId);
          }
          return newSet;
        });
      });

      // Cleanup
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        updateOnlineStatus(false);
        socket.off('user:status');
      };
    }
  }, [user, socket]);

  const handleAuthResponse = (data) => {
    setToken(data.token);
    setUser(data.user);
    setIsNewUser(data.user.isNewUser);
    localStorage.setItem('token', data.token);
  };

  const verifyEmail = async (token) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/verify-email`, { token });
      handleAuthResponse(response.data);
      
      // If it's a new user, redirect to profile
      if (response.data.user.isNewUser) {
        navigate('/profile');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      // ... error handling ...
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      socket,
      login,
      logout, 
      isUserOnline,
      unreadNotifications,
      setUnreadNotifications,
      loading,
      updateUser,
      isNewUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

