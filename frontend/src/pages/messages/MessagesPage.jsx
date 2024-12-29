import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { User, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const MessagesPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('conversations');
  const [messages, setMessages] = useState({
    conversations: [],
    sentRequests: [],
    receivedRequests: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/messages`);
      console.log('Messages response:', response.data);
      setMessages(response.data.data);
    } catch (error) {
      console.error('Fetch messages error:', error);
      toast.error('Failed to fetch messages');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentMessages = () => {
    switch (activeTab) {
      case 'sent':
        return messages.sentRequests || [];
      case 'received':
        return messages.receivedRequests || [];
      default:
        return messages.conversations || [];
    }
  };

  const handleAcceptRequest = async (messageId) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/messages/${messageId}/accept`);
      toast.success('Service request accepted');
      fetchMessages();
    } catch (error) {
      console.error('Accept request error:', error);
      toast.error('Failed to accept request');
    }
  };

  const handleRejectRequest = async (messageId) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/messages/${messageId}/reject`);
      toast.success('Service request rejected');
      fetchMessages();
    } catch (error) {
      console.error('Reject request error:', error);
      toast.error('Failed to reject request');
    }
  };

  const getUnreadCount = (type) => {
    switch (type) {
      case 'conversations':
        return messages.conversations.filter(msg => 
          msg.status === 'unread' && 
          msg.receiver._id === user._id
        ).length;
      case 'sent':
        return messages.sentRequests.filter(msg => msg.status === 'unread').length;
      case 'received':
        return messages.receivedRequests.filter(msg => msg.status === 'unread').length;
      default:
        return 0;
    }
  };

  const renderMessages = () => {
    const currentMessages = getCurrentMessages();
    
    if (currentMessages.length === 0) {
      return (
        <div className="text-center py-8 text-gray-400">
          No messages to display
        </div>
      );
    }

    if (activeTab === 'conversations') {
      // Group messages by conversation partner
      const conversationGroups = currentMessages.reduce((groups, message) => {
        if (!message.sender || !message.receiver) return groups;

        const partnerId = message.sender._id === user?._id ? message.receiver._id : message.sender._id;
        const partner = message.sender._id === user?._id ? message.receiver : message.sender;
        
        if (!groups[partnerId]) {
          groups[partnerId] = {
            partner,
            messages: []
          };
        }
        groups[partnerId].messages.push(message);
        return groups;
      }, {});

      // Get last message from each conversation
      return Object.values(conversationGroups).map(({ partner, messages }) => {
        const lastMessage = messages[0]; // Messages are already sorted by date
        const unreadCount = messages.filter(msg => 
          msg.status === 'unread' && 
          msg.receiver._id === user._id
        ).length;

        return (
          <div 
            key={partner._id}
            onClick={() => navigate(`/messages/${partner._id}`)}
            className={`bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors cursor-pointer ${
              unreadCount > 0 ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {partner.avatar ? (
                  <img 
                    src={partner.avatar}
                    alt={partner.name} 
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-white font-medium">{partner.name}</h3>
                    <span className={`w-2 h-2 rounded-full ${partner.isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
                    {unreadCount > 0 && (
                      <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">
                    {lastMessage.content.length > 50 
                      ? `${lastMessage.content.substring(0, 50)}...` 
                      : lastMessage.content}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-400">
                  {format(new Date(lastMessage.createdAt), 'MMM d, h:mm a')}
                </p>
                {!partner.isOnline && partner.lastSeen && (
                  <p className="text-xs text-gray-500">
                    Last seen {format(new Date(partner.lastSeen), 'MMM d, h:mm a')}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      });
    }

    return currentMessages.map((message) => (
      <div 
        key={message._id} 
        className={`bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors ${
          activeTab === 'conversations' ? 'cursor-pointer' : ''
        } ${activeTab === 'received' && message.status === 'unread' ? 'ring-2 ring-yellow-500' : ''}`}
        onClick={() => {
          if (activeTab === 'conversations') {
            navigate(`/messages/${message._id}`);
          }
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {(activeTab === 'sent' ? message.receiver?.avatar : message.sender?.avatar) ? (
              <img 
                src={activeTab === 'sent' ? message.receiver.avatar : message.sender.avatar}
                alt="Profile" 
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                <User className="w-6 h-6 text-gray-400" />
              </div>
            )}
            
            <div>
              <h3 className="text-white font-medium">
                {activeTab === 'sent' ? message.receiver?.name : message.sender?.name}
              </h3>
              <p className="text-sm text-gray-400">
                {format(new Date(message.createdAt), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          </div>

          {activeTab !== 'conversations' && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              message.status === 'unread' ? 'bg-yellow-500/20 text-yellow-500' :
              message.status === 'accepted' ? 'bg-green-500/20 text-green-500' :
              message.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
              'bg-blue-500/20 text-blue-500'
            }`}>
              {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
            </span>
          )}
        </div>

        <p className="mt-2 text-gray-300">{message.content}</p>

        {message.relatedEvent && (
          <p className="mt-1 text-sm text-gray-400">
            Event: {message.relatedEvent.title}
          </p>
        )}
        {message.service && (
          <p className="mt-1 text-sm text-gray-400">
            Service: {message.service}
          </p>
        )}

        {activeTab === 'received' && message.status === 'unread' && (
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRejectRequest(message._id);
              }}
              className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Decline
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAcceptRequest(message._id);
              }}
              className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Accept
            </button>
          </div>
        )}

        {activeTab !== 'conversations' && message.status === 'accepted' && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const partnerId = message.sender._id === user._id ? message.receiver._id : message.sender._id;
                navigate(`/messages/${partnerId}`);
              }}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              View Conversation
            </button>
          </div>
        )}
      </div>
    ));
  };

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Messages</h1>
        
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
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {getUnreadCount('conversations')}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-4 py-2 rounded-md relative ${
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
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {getUnreadCount('received')}
              </span>
            )}
          </button>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : renderMessages()}
        </div>
      </div>
    </Layout>
  );
};

export default MessagesPage;
