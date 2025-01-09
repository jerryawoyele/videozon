import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { 
  Bell, Calendar, MessageSquare, 
  CheckCircle, Trash2, MailOpen,
  Filter, Clock, Mail, DollarSign,
  Star, Settings, Briefcase, User
} from 'lucide-react';
import api from '../../utils/axios';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const NOTIFICATION_CATEGORIES = [
  { id: 'all', label: 'All', icon: Bell },
  { id: 'unread', label: 'Unread', icon: Mail },
  { id: 'events', label: 'Events', icon: Calendar, types: ['event_created', 'event_updated', 'event_cancelled', 'event_completed'] },
  { id: 'messages', label: 'Messages', icon: MessageSquare, types: ['message_received', 'message_request'] },
  { id: 'services', label: 'Services', icon: Briefcase, types: ['service_request', 'service_accepted', 'service_rejected'] }
];

const getNotificationIcon = (type) => {
  if (type.startsWith('event_')) {
    return <Calendar className="h-5 w-5 text-blue-500" />;
  } else if (type.startsWith('message_')) {
    return <MessageSquare className="h-5 w-5 text-green-500" />;
  } else if (type.startsWith('service_')) {
    return <Briefcase className="h-5 w-5 text-yellow-500" />;
  } else {
    return <Bell className="h-5 w-5 text-gray-500" />;
  }
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { user, socket, unreadNotifications, setUnreadNotifications } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const params = {};
      
      if (activeFilter !== 'all') {
        const category = NOTIFICATION_CATEGORIES.find(cat => cat.id === activeFilter);
        if (category?.types) {
          params.type = category.types;
        } else if (activeFilter === 'unread') {
          params.unread = true;
        }
      }

      const response = await api.get('/notifications', { params });
      
      if (response.data.success) {
        const { notifications: fetchedNotifications } = response.data.data;
        setNotifications(fetchedNotifications || []);
        // Update unread count in context
        const unreadCount = (fetchedNotifications || []).filter(n => !n.read).length;
        setUnreadNotifications(unreadCount);
      } else {
        toast.error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Fetch notifications error:', error);
      if (error.response?.status === 401) {
        // Handle unauthorized access
        navigate('/login');
      } else {
        toast.error(error.response?.data?.message || 'Failed to fetch notifications');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [activeFilter]);

  useEffect(() => {
    if (socket) {
      socket.on('notification:new', (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadNotifications(prev => prev + 1);
        toast.success('New notification received');
      });

      return () => {
        socket.off('notification:new');
      };
    }
  }, [socket, setUnreadNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      const response = await api.patch(`/notifications/${id}/read`);
      if (response.data.success) {
        setNotifications(notifications.map(notif => 
          notif._id === id ? { ...notif, read: true } : notif
        ));
        setUnreadNotifications(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Mark as read error:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await api.patch('/notifications/mark-all-read');
      if (response.data.success) {
        setNotifications(notifications.map(notif => ({ ...notif, read: true })));
        setUnreadNotifications(0);
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Mark all as read error:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await api.delete(`/notifications/${id}`);
      if (response.data.success) {
        const deletedNotification = notifications.find(n => n._id === id);
        setNotifications(notifications.filter(notif => notif._id !== id));
        if (deletedNotification && !deletedNotification.read) {
          setUnreadNotifications(prev => Math.max(0, prev - 1));
        }
        toast.success('Notification deleted');
      }
    } catch (error) {
      console.error('Delete notification error:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await handleMarkAsRead(notification._id);
    }

    const { type, metadata } = notification;

    if (type.startsWith('event_') && metadata?.eventId?._id) {
      navigate(`/events/${metadata.eventId._id}`);
    } else if (type.startsWith('message_') && metadata?.messageId) {
      navigate(`/messages/${metadata.messageId}`);
    } else if (type.startsWith('service_') && metadata?.eventId?._id) {
      navigate(`/events/${metadata.eventId._id}`);
    }
  };

  const getFilteredNotifications = () => {
    if (activeFilter === 'all') {
      return notifications;
    }

    if (activeFilter === 'unread') {
      return notifications.filter(notification => !notification.read);
    }

    const category = NOTIFICATION_CATEGORIES.find(cat => cat.id === activeFilter);
    if (category?.types) {
      return notifications.filter(notification => 
        category.types.includes(notification.type)
      );
    }

    return notifications;
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Notifications</h1>
              <p className="text-sm text-gray-400 mt-1">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className="flex items-center px-4 py-2 text-sm bg-gray-700 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MailOpen className="h-4 w-4 mr-2" />
              Mark all as read
            </button>
          </div>

          {/* Filters */}
          <div className="bg-gray-800 p-4 rounded-lg mb-6">
            <div className="flex items-center space-x-2 flex-wrap">
              <Filter className="h-5 w-5 text-gray-400" />
              {NOTIFICATION_CATEGORIES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveFilter(id)}
                  className={`
                    flex items-center px-3 py-1 rounded-md text-sm font-medium
                    ${activeFilter === id 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-700'
                    }
                  `}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                  {id === 'unread' && unreadCount > 0 && (
                    <span className="ml-2 bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs">
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                className={`
                  bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors
                  ${!notification.read ? 'border-l-4 border-blue-500' : ''}
                `}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    {getNotificationIcon(notification.type)}
                    <div>
                      <h3 className="text-white font-medium">{notification.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification._id);
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Loading and Empty States */}
            {isLoading && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}

            {!isLoading && filteredNotifications.length === 0 && (
              <div className="text-center py-12 bg-gray-800 rounded-lg">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No notifications</h3>
                <p className="text-gray-400">
                  {activeFilter === 'all' 
                    ? "You're all caught up!"
                    : `No ${activeFilter.replace('_', ' ')} notifications`
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotificationsPage; 