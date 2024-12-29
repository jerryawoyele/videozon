import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { 
  Bell, Calendar, MessageSquare, 
  CheckCircle, Trash2, MailOpen,
  Filter, Clock, Mail, DollarSign,
  Star, Settings, Briefcase, User
} from 'lucide-react';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const NOTIFICATION_CATEGORIES = [
  { id: 'all', label: 'All', icon: Bell },
  { id: 'unread', label: 'Unread', icon: Mail },
  { id: 'events', label: 'Events', icon: Calendar, types: ['event_created', 'event_updated', 'event_cancelled', 'event_completed'] },
  { id: 'services', label: 'Services', icon: Briefcase, types: ['service_request', 'service_accepted', 'service_rejected'] },
  { id: 'professionals', label: 'Professionals', icon: User, types: ['professional_joined', 'professional_left', 'professional_reviewed'] },
  { id: 'messages', label: 'Messages', icon: MessageSquare, types: ['message_received', 'message_request'] },
  { id: 'payments', label: 'Payments', icon: DollarSign, types: ['payment_received', 'payment_sent', 'payment_failed'] },
  { id: 'reviews', label: 'Reviews', icon: Star, types: ['review_received'] },
  { id: 'system', label: 'System', icon: Settings, types: ['system_update', 'account_update'] }
];

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, [activeFilter]);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications', {
        params: { 
          type: activeFilter === 'all' ? undefined : activeFilter,
          unread: activeFilter === 'unread' ? true : undefined
        }
      });
      setNotifications(response.data.data.notifications);
    } catch (error) {
      toast.error('Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(notif => 
        notif._id === id ? { ...notif, read: true } : notif
      ));
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(notifications.filter(notif => notif._id !== id));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type) => {
    // Find the category that contains this notification type
    const category = NOTIFICATION_CATEGORIES.find(cat => 
      cat.types?.includes(type)
    );

    if (category) {
      const Icon = category.icon;
      const colors = {
        events: 'text-blue-500',
        services: 'text-purple-500',
        professionals: 'text-green-500',
        messages: 'text-yellow-500',
        payments: 'text-emerald-500',
        reviews: 'text-orange-500',
        system: 'text-gray-500'
      };
      return <Icon className={`h-5 w-5 ${colors[category.id] || 'text-gray-500'}`} />;
    }
    return <Bell className="h-5 w-5 text-gray-500" />;
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await handleMarkAsRead(notification._id);
    }

    // Navigate based on notification type and metadata
    const { type, metadata } = notification;

    // Event related navigation
    if (type.startsWith('event_') && metadata?.eventId?._id) {
      navigate(`/events/${metadata.eventId._id}`);
      return;
    }

    // Message related navigation
    if (type.startsWith('message_') && metadata?.messageId) {
      navigate(`/messages/${metadata.messageId}`);
      return;
    }

    // Professional related navigation
    if (type.startsWith('professional_') && metadata?.userId?._id) {
      navigate(`/professionals/${metadata.userId._id}`);
      return;
    }

    // Payment related navigation
    if (type.startsWith('payment_') && metadata?.paymentId) {
      navigate(`/payments/${metadata.paymentId}`);
      return;
    }

    // Review related navigation
    if (type.startsWith('review_') && metadata?.reviewId) {
      navigate(`/reviews/${metadata.reviewId}`);
      return;
    }

    // Service related navigation
    if (type.startsWith('service_') && metadata?.eventId?._id) {
      navigate(`/events/${metadata.eventId._id}`);
      return;
    }
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;

    // Apply category filter
    if (activeFilter !== 'all' && activeFilter !== 'unread') {
      const category = NOTIFICATION_CATEGORIES.find(cat => cat.id === activeFilter);
      if (category?.types) {
        filtered = filtered.filter(notification => 
          category.types.includes(notification.type)
        );
      }
    }

    // Apply unread filter
    if (activeFilter === 'unread') {
      filtered = filtered.filter(notification => !notification.read);
    }

    // Apply time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      const dayInMs = 24 * 60 * 60 * 1000;
      const weekInMs = 7 * dayInMs;
      const monthInMs = 30 * dayInMs;

      filtered = filtered.filter(notification => {
        const notifDate = new Date(notification.createdAt);
        const timeDiff = now - notifDate;

        switch (timeFilter) {
          case 'today':
            return timeDiff < dayInMs;
          case 'week':
            return timeDiff < weekInMs;
          case 'month':
            return timeDiff < monthInMs;
          default:
            return true;
        }
      });
    }

    return filtered;
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
              className="flex items-center px-4 py-2 text-sm bg-gray-700 text-white rounded-md hover:bg-gray-600"
            >
              <MailOpen className="h-4 w-4 mr-2" />
              Mark all as read
            </button>
          </div>

          {/* Filters */}
          <div className="bg-gray-800 p-4 rounded-lg mb-6">
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0">
              {/* Category Filters */}
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
                    {id !== 'all' && id !== 'unread' && (
                      <span className="ml-2 bg-gray-600 text-white px-2 py-0.5 rounded-full text-xs">
                        {notifications.filter(n => 
                          NOTIFICATION_CATEGORIES.find(cat => cat.id === id)?.types?.includes(n.type)
                        ).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Time Filter */}
              <div className="flex items-center md:ml-auto">
                <Clock className="h-5 w-5 text-gray-400 mr-2" />
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-md px-3 py-1 text-sm text-white"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
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
                      <p className="text-sm text-gray-400">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification._id);
                    }}
                    className="text-gray-400 hover:text-gray-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 text-gray-300">{notification.message}</p>
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
