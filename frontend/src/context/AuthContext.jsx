import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const socketRef = useRef(null);

  const connectSocket = () => {
    if (!socketRef.current) {
      const token = localStorage.getItem('token');
      if (!token) return null;

      socketRef.current = io('http://localhost:5000', {
        auth: { token },
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000
      });

      socketRef.current.on('connect', () => {
        console.log('Socket connected:', socketRef.current.id);
        setUser(prev => prev ? { ...prev, isOnline: true } : prev);
      });

      socketRef.current.on('userStatus', ({ userId, isOnline, lastSeen }) => {
        if (isOnline) {
          setOnlineUsers(prev => new Set([...prev, userId]));
        } else {
          setOnlineUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
        }
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setUser(prev => prev ? { ...prev, isOnline: false } : prev);
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setUser(prev => prev ? { ...prev, isOnline: false } : prev);
      });
    }
    return socketRef.current;
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const socket = connectSocket();
      if (socket) {
        socket.connect();
      }
    }
    
    setLoading(false);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const login = async (userData) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      connectSocket();
    }
  };

  const logout = () => {
    if (socketRef.current) {
      socketRef.current.emit('goingOffline');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading,
      socket: socketRef.current,
      isUserOnline: (userId) => onlineUsers.has(userId)
    }}>
      {!loading && children}
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

