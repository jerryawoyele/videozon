import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import axios from '../../utils/axios';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { 
  User, MessageSquare, Trash2, 
  CheckCircle, XCircle, Clock,
  Check, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DefaultAvatar from '../../components/DefaultAvatar';

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('Request config:', {
      url: config.url,
      method: config.method,
      hasToken: !!token
    });
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    console.log('Response interceptor:', {
      url: response.config.url,
      status: response.status,
      hasData: !!response.data
    });
    return response;
  },
  (error) => {
    console.error('Response interceptor error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message
    });
    return Promise.reject(error);
  }
);

const Avatar = ({ user, className = "w-10 h-10" }) => {
  const [imgError, setImgError] = useState(false);

  if (!user) {
    return (
      <div className={`${className} rounded-full bg-gray-700 flex items-center justify-center`}>
        <User className="w-6 h-6 text-gray-400" />
      </div>
    );
  }

  if (imgError || !user.avatar) {
    return <DefaultAvatar name={user.name} className={className} />;
  }

  return (
    <img 
      src={user.avatar}
      alt={user.name}
      className={`${className} rounded-full object-cover`}
      onError={() => setImgError(true)}
    />
  );
};

const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return 'Offline';
  
  try {
    const lastSeenDate = new Date(lastSeen);
    if (isNaN(lastSeenDate.getTime())) {
      return 'Offline';
    }

    if (isToday(lastSeenDate)) {
      return `Last seen today at ${format(lastSeenDate, 'h:mm a')}`;
    } else if (isYesterday(lastSeenDate)) {
      return `Last seen yesterday at ${format(lastSeenDate, 'h:mm a')}`;
    } else {
      return `Last seen ${format(lastSeenDate, 'MMM d')} at ${format(lastSeenDate, 'h:mm a')}`;
    }
  } catch (error) {
    console.error('Error formatting last seen date:', error);
    return 'Offline';
  }
};

const ConversationCard = ({ conversation, isActive, onClick }) => {
  const { isUserOnline } = useAuth();
  const otherUser = conversation.participants.find(p => p._id !== user?._id);
  const lastMessage = conversation.lastMessage;

  return (
    <div 
      className={`flex items-start gap-3 p-4 cursor-pointer ${
        isActive ? 'bg-gray-100' : ''
      }`}
      onClick={onClick}
    >
      <div className="relative">
        <img 
          src={otherUser?.avatar?.url || '/default-avatar.png'} 
          alt={otherUser?.name} 
          className="w-12 h-12 rounded-full object-cover"
        />
        {isUserOnline(otherUser?._id) && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 truncate">{otherUser?.name}</h3>
            {isUserOnline(otherUser?._id) ? (
              <p className="text-xs text-green-500">Online</p>
            ) : otherUser?.lastSeen && (
              <p className="text-xs text-gray-500">
                {formatLastSeen(otherUser.lastSeen)}
              </p>
            )}
          </div>
          {lastMessage && (
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })}
            </span>
          )}
        </div>
        {lastMessage && (
          <p className="text-sm text-gray-600 truncate mt-1">
            {lastMessage.content}
          </p>
        )}
      </div>
    </div>
  );
};

const MessagesPage = () => {
  const { user, socket, isUserOnline } = useAuth();
  const [activeTab, setActiveTab] = useState('conversations');
  const [messages, setMessages] = useState({
    conversations: [],
    sentRequests: [],
    receivedRequests: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      console.log('No user found, redirecting to login');
      navigate('/login');
      return;
    }
    
    console.log('Current user:', {
      id: user._id,
      name: user.name,
      role: user.role
    });
    
    // Initial fetch only
    fetchMessages();
  }, [user, navigate]);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      
      console.log('Fetching messages with user:', {
        id: user._id,
        token: localStorage.getItem('token')?.substring(0, 20) + '...'
      });
      
      const response = await axios.get(`/messages`);
      
      console.log('Response structure:', {
        status: response.status,
        hasData: !!response.data,
        dataKeys: Object.keys(response.data),
        messageTypes: response.data.data ? {
          conversations: response.data.data.conversations?.length || 0,
          sentRequests: response.data.data.sentRequests?.length || 0,
          receivedRequests: response.data.data.receivedRequests?.length || 0
        } : null
      });

      if (!response.data?.data) {
        console.error('Invalid response structure:', response.data);
        toast.error('Invalid response from server');
        return;
      }

      const messageData = {
        conversations: Array.isArray(response.data.data.conversations) 
          ? response.data.data.conversations 
          : [],
        sentRequests: Array.isArray(response.data.data.sentRequests) 
          ? response.data.data.sentRequests 
          : [],
        receivedRequests: Array.isArray(response.data.data.receivedRequests) 
          ? response.data.data.receivedRequests 
          : []
      };

      console.log('Message counts:', {
        conversations: messageData.conversations.length,
        sentRequests: messageData.sentRequests.length,
        receivedRequests: messageData.receivedRequests.length
      });

      // Log a sample message from each category if available
      if (messageData.conversations[0]) {
        console.log('Sample conversation:', messageData.conversations[0]);
      }
      if (messageData.sentRequests[0]) {
        console.log('Sample sent request:', messageData.sentRequests[0]);
      }
      if (messageData.receivedRequests[0]) {
        console.log('Sample received request:', messageData.receivedRequests[0]);
      }

      setMessages(messageData);
    } catch (error) {
      console.error('Fetch messages error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      if (error.response?.status === 401) {
        toast.error('Please login again');
        navigate('/login');
      } else {
        toast.error('Failed to fetch messages');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentMessages = () => {
    const currentMessages = (() => {
      switch (activeTab) {
        case 'sent':
          return messages.sentRequests || [];
        case 'received':
          return messages.receivedRequests || [];
        default:
          return messages.conversations || [];
      }
    })();
    
    console.log(`Current messages for tab ${activeTab}:`, currentMessages);
    return currentMessages;
  };

  const handleAcceptRequest = async (messageId) => {
    console.log('Accepting request with messageId:', messageId);
    try {
      const response = await axios.put(`/messages/${messageId}/accept-service-request`, {});
      if (response.data.success) {
        toast.success('Request accepted successfully');
        fetchMessages(); // Refresh messages
      }
    } catch (error) {
      console.error('Accept request error:', error);
      toast.error(error.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (messageId) => {
    try {
      const response = await axios.put(`/messages/${messageId}/reject-service-request`, {});
      if (response.data.success) {
        toast.success('Request rejected successfully');
        fetchMessages(); // Refresh messages
      }
    } catch (error) {
      console.error('Reject request error:', error);
      toast.error(error.response?.data?.message || 'Failed to reject request');
    }
  };

  const handleDeleteRequest = async (messageId) => {
    try {
      const response = await axios.put(`/messages/${messageId}/delete`);
      if (response.data.success) {
        toast.success('Request deleted successfully');
        fetchMessages(); // Refresh messages
      }
    } catch (error) {
      console.error('Delete request error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete request');
    }
  };

  const getUnreadCount = (type) => {
    switch (type) {
      case 'conversations':
        // Count number of conversations that have any unread messages
        return messages.conversations.filter(conv => (conv.unreadCount || 0) > 0).length;
      case 'sent':
        return messages.sentRequests.filter(msg => msg.status === 'unread').length;
      case 'received':
        return messages.receivedRequests.filter(msg => msg.status === 'unread').length;
      default:
        return 0;
    }
  };

  const renderMessageContent = (message) => {
    if (!message) return null;

    if (message.isDeleted) {
      return (
        <div className="flex items-center text-gray-500 italic">
          <Trash2 className="h-4 w-4 mr-2" />
          <span>This message has been deleted</span>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2">
        <p className="text-gray-300">
          {message.content.length > 50 
            ? `${message.content.substring(0, 50)}...` 
            : message.content}
        </p>
        {message.edited && (
          <span className="text-gray-500 text-xs italic">(edited)</span>
        )}
      </div>
    );
  };

  const renderMessageCard = (message) => {
    const partner = message.sender._id === user._id ? message.receiver : message.sender;
    const isRequest = message.type === 'service_request';

    // Use renderRequestCard for requests
    if (isRequest) {
      return renderRequestCard(message, activeTab);
    }

    // Regular conversation message card
    return (
      <div
        key={message._id}
        onClick={() => navigate(`/messages/${partner._id}`)}
        className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors cursor-pointer"
      >
        <div className="flex items-start space-x-4">
          <div 
            className="relative flex-shrink-0 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/professionals/${partner._id}`);
            }}
          >
            <Avatar user={partner} />
            <div 
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-gray-800 rounded-full ${
                isUserOnline(partner?._id) ? 'bg-green-500' : 'bg-gray-500'
              }`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div>
                <h3 
                  className="text-white font-medium hover:text-blue-400 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/professionals/${partner._id}`);
                  }}
                >
                  {partner.name}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                {message.unreadCount > 0 && (
                  <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                    {message.unreadCount}
                  </span>
                )}
              </div>
            </div>
            <div className="mt- 0 flex items-center space-x-2">
              <p className="text-gray-300 truncate">{message.content}</p>
              <span className="text-gray-500">•</span>
              <p className="text-sm text-gray-400">
                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      unread: { color: 'bg-yellow-500/20 text-yellow-400', icon: Clock, text: 'Pending' },
      accepted: { color: 'bg-green-500/20 text-green-400', icon: CheckCircle, text: 'Accepted' },
      rejected: { color: 'bg-red-500/20 text-red-400', icon: XCircle, text: 'Rejected' }
    };

    const config = statusConfig[status] || statusConfig.unread;
    const Icon = config.icon;

    return (
      <div className={`flex items-center px-2 py-1 rounded ${config.color} text-sm`}>
        <Icon className="w-4 h-4 mr-1" />
        {config.text}
      </div>
    );
  };

  const renderRequestCard = (request, type) => {
    const otherUser = type === 'sent' ? request.receiver : request.sender;
    
    return (
      <div 
        key={request._id} 
        className={`bg-gray-800 rounded-lg p-4 space-y-4 ${
          type === 'received' && request.status === 'unread' ? 'bg-gray-700' : 'bg-gray-800'
        }`}
      >
        <div className="flex items-start space-x-4">
          <div 
            onClick={() => navigate(`/professionals/${otherUser._id}`)}
            className="cursor-pointer"
          >
            <Avatar user={otherUser} className="w-12 h-12" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 
                  onClick={() => navigate(`/professionals/${otherUser._id}`)}
                  className="text-white font-medium hover:text-blue-400 cursor-pointer"
                >
                  {otherUser.name}
                </h3>
                <p className="text-sm text-gray-400">
                  {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {type === 'received' ? (
                  request.status !== 'accepted' && request.status !== 'rejected' ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcceptRequest(request._id);
                        }}
                        className="p-1 rounded-full bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        title="Accept Request"
                      >
                        <Check className="w-6 h-6" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRejectRequest(request._id);
                        }}
                        className="p-1 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        title="Reject Request"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  ) : (
                    getStatusTag(request.status)
                  )
                ) : (
                  getStatusTag(request.status)
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRequest(request._id);
                  }}
                  className="p-1 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  title="Delete Request"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            <p className="mt-2 text-gray-300 whitespace-pre-line">{request.content}</p>
            {request.relatedEvent && (
              <div className="mt-2 px-3 py-2 bg-gray-700 rounded-md">
                <p className="text-sm text-gray-300">
                  Event: {request.relatedEvent.title}
                </p>
                {request.services?.length > 0 && (
                  <p className="text-sm text-gray-400">
                    Services: {request.services.join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="flex-1 min-h-screen bg-gray-900 m-6">
        <div className="max-w-7xl mx-auto">
          {/* Tabs */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setActiveTab('conversations')}
              className={`px-4 py-2 rounded-md relative ${
                activeTab === 'conversations'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Conversations
              {getUnreadCount('conversations') > 0 && (
                <span className="absolute -top-2 -right-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                  {getUnreadCount('conversations')}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`px-4 py-2 rounded-md ${
                activeTab === 'sent'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Sent Requests
            </button>
            <button
              onClick={() => setActiveTab('received')}
              className={`px-4 py-2 rounded-md relative ${
                activeTab === 'received'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Received Requests
              {getUnreadCount('received') > 0 && (
                <span className="absolute -top-2 -right-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                  {getUnreadCount('received')}
                </span>
              )}
            </button>
          </div>

          {/* Messages List */}
          <div className="space-y-4 min-h-[calc(100vh-160px)] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : getCurrentMessages().length > 0 ? (
              getCurrentMessages().map(message => renderMessageCard(message))
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No messages yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MessagesPage;
