import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Send,
  ArrowLeft,
  User,
  MoreHorizontal,
  MoreVertical,
  Pencil,
  Trash2,
  ChevronDown,
  Loader2,
  MessageSquare,
  Home,
  Calendar,
  Users,
  Mail,
  Bell,
  LogOut,
  Menu,
  X,
  Briefcase,
} from "lucide-react";
import axios from '../../utils/axios';
import toast from "react-hot-toast";
import { format, isToday, isYesterday, isSameDay, formatDistanceToNow } from "date-fns";
import { useAuth } from "../../context/AuthContext";
import DefaultAvatar from '../../components/DefaultAvatar';
import Logo from '../../components/Logo';

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
  const date = new Date(lastSeen);
  if (isToday(date)) {
    return `Today at ${format(date, "h:mm a")}`;
  } else if (isYesterday(date)) {
    return `Yesterday at ${format(date, "h:mm a")}`;
  }
  return format(date, "MMM d, yyyy h:mm a");
};

const ProfileHeader = ({ otherUser }) => {
  const { isUserOnline } = useAuth();
  const isOnline = isUserOnline(otherUser?._id);

  return (
    <div className="flex items-center gap-3 p-4 border-b">
      <div className="relative">
        <img
          src={otherUser?.avatar?.url || '/default-avatar.png'}
          alt={otherUser?.name}
          className="w-12 h-12 rounded-full object-cover"
        />
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
        )}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">{otherUser?.name}</h3>
        {isOnline ? (
          <p className="text-sm text-green-500">Online</p>
        ) : otherUser?.lastSeen && (
          <p className="text-sm text-gray-500">
            Last seen {formatDistanceToNow(new Date(otherUser.lastSeen), { addSuffix: true })}
          </p>
        )}
      </div>
    </div>
  );
};

const MessageDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isUserOnline, logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [partner, setPartner] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editMessage, setEditMessage] = useState("");
  const [openMessageMenu, setOpenMessageMenu] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Initialize conversation without polling
  useEffect(() => {
    if (id && user) {
      const initializeConversation = async () => {
        try {
          setIsLoading(true);
          await fetchMessages();
          // Mark messages as read when entering chat
          await markMessagesAsRead();

          // Always scroll to bottom first
          setTimeout(() => {
            const container = messagesContainerRef.current;
            if (container) {
              container.scrollTop = container.scrollHeight;
            }

            // Then check for unread messages and scroll if needed
            setTimeout(() => {
              scrollToUnreadIfExists();
            });

            inputRef.current?.focus();
          });
        } catch (error) {
          console.error('Error initializing conversation:', error);
        } finally {
          setIsLoading(false);
        }
      };

      initializeConversation();
    }
  }, [id, user]);

  const markMessagesAsRead = async () => {
    try {
      if (!id) {
        console.error('No partner ID available');
        return;
      }
      await axios.put(`/messages/conversation/${id}/read`);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Add scroll detection
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 300;
    setShowScrollButton(!isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
    }, []);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching messages for conversation:', id);
      const response = await axios.get(`/messages/conversation/${id}`);

      if (response.data && response.data.success) {
        const { partner: conversationPartner, messages: conversationMessages } = response.data.data;

        setPartner(conversationPartner);
        setMessages(conversationMessages || []);
      } else {
        console.log('Response indicated failure:', response.data);
        toast.error('Failed to load messages');
      }
    } catch (error) {
      console.error('Fetch messages error:', error);
      toast.error('Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only scroll to bottom on initial load or when sending a new message
    const shouldAutoScroll = messages.length > 0 && 
      (!messagesContainerRef.current || 
       messagesContainerRef.current.scrollHeight === messagesContainerRef.current.clientHeight ||
       messages[messages.length - 1]?.sender?._id === user?._id);

    if (shouldAutoScroll) {
      setTimeout(() => {
        const container = messagesContainerRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    }
  }, [messages, user?._id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await axios.post(`/messages/${id}/reply`, { content: newMessage });
      if (response.data.success) {
        setNewMessage('');
        await fetchMessages(); // Fetch fresh messages after sending
        // Scroll to bottom after sending a new message
        setTimeout(() => {
          const container = messagesContainerRef.current;
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        });
      }
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
    }
  };

  const getMessageDate = (date) => {
    try {
      const messageDate = new Date(date);
      if (isNaN(messageDate.getTime())) {
        console.error('Invalid date:', date);
        return 'Invalid date';
      }

      if (isToday(messageDate)) {
        return "Today";
      } else if (isYesterday(messageDate)) {
        return "Yesterday";
      }
      return format(messageDate, "MMMM d, yyyy");
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Group messages by date
  const groupMessagesByDate = (messages) => {
    if (!Array.isArray(messages)) {
      console.log('Messages is not an array:', messages);
      return [];
    }

    const groups = [];
    let currentDate = null;

    messages.forEach((msg) => {
      if (!msg || !msg.createdAt) {
        console.log('Invalid message or missing createdAt:', msg);
        return;
      }

      try {
        const messageDate = new Date(msg.createdAt);
        if (isNaN(messageDate.getTime())) {
          console.error('Invalid date in message:', msg);
          return;
        }

        if (!currentDate || !isSameDay(currentDate, messageDate)) {
          currentDate = messageDate;
          groups.push({
            type: "date",
            date: messageDate,
          });
        }
        groups.push({
          type: "message",
          message: msg,
        });
      } catch (error) {
        console.error('Error processing message date:', error);
      }
    });

    return groups;
  };

  const handleEditMessage = async (messageId, newContent) => {
    try {
      const response = await axios.put(`/messages/${messageId}`, {
        content: newContent,
        isEdited: true
      });
      if (response.data.success) {
        setEditingMessageId(null);
        setEditMessage("");
        await fetchMessages(); // Fetch fresh messages after editing
        // Restore scroll position after messages update
        setTimeout(() => {
          const container = messagesContainerRef.current;
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        }, 50);
        toast.success("Message updated successfully");
      }
    } catch (error) {
      console.error("Edit message error:", error);
      toast.error("Failed to update message");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      // Use the dedicated delete endpoint
      const response = await axios.put(`/messages/${messageId}/delete`);

      if (response.data.success) {
        await fetchMessages();
        setTimeout(() => {
          const container = messagesContainerRef.current;
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        }, 50);
        toast.success("Message deleted successfully");
      }
    } catch (error) {
      console.error("Delete message error:", error);
      toast.error("Failed to delete message");
    }
  };

  const scrollToUnreadIfExists = () => {
    if (!messages.length) return;

    // Find the first unread message
    const firstUnreadIndex = messages.findIndex(msg =>
      msg.receiver?._id === user?._id && msg.status === 'unread'
    );

    // If there are unread messages, scroll to the first unread one
    if (firstUnreadIndex !== -1) {
      const messageElements = document.querySelectorAll('[data-message-id]');
      const targetElement = messageElements[firstUnreadIndex];

      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'auto', block: 'start' });
        // Add some padding to the top for better visibility
        const container = messagesContainerRef.current;
        if (container) {
          container.scrollTop -= 100; // Scroll up by 100px for context
        }
      }
    }
  };

  const linkRegex = /(https?:\/\/[^\s]+)/g;

  const renderMessageContent = (content) => {
    if (!content) return null;
    
    const parts = content.split(linkRegex);
    
    return parts.map((part, index) => {
      if (part.match(linkRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-300 hover:text-blue-200 underline"
            onClick={(e) => e.stopPropagation()}
            style={{ color: 'white' , fontWeight: 'bold'}}
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const renderMessage = (item) => {
    if (!item || !item.message || !item.message.sender) {
      return null;
    }

    const isOwnMessage = item.message.sender._id === user._id;
    const isEditing = editingMessageId === item.message._id;
    const isHireRequest = item.message.type === 'hire_request';
    const isServiceOffer = item.message.type === 'service_offer';
    const isLastMessage = messages[messages.length - 1]._id === item.message._id;

    return (
      <div
        data-message-id={item.message._id}
        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} group items-center gap-2`}
      >
        {/* Message Options Button - Only show for own messages that are not deleted, not hire requests, and not service offers */}
        {isOwnMessage && !item.message.isDeleted && !isHireRequest && !isServiceOffer && (
          <div className="relative">
            <button
              onClick={() => {
                const isOpeningMenu = openMessageMenu !== item.message._id;
                setOpenMessageMenu(openMessageMenu === item.message._id ? null : item.message._id);
                if (isLastMessage && isOpeningMenu) {
                  setTimeout(() => {
                    scrollToBottom(false);
                  }, 150);
                }
              }}
              className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-gray-700 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4 text-gray-400" />
            </button>

            {/* Regular Message Options Menu */}
            {openMessageMenu === item.message._id && (
              <div className={`absolute ${isLastMessage ? 'bottom-8' : 'top-8'} right-0 bg-gray-800 rounded-lg shadow-lg py-1 z-10 min-w-[120px] w-max`}>
                <div
                  className="fixed inset-0 z-0"
                  onClick={() => setOpenMessageMenu(null)}
                />
                <div className="relative z-10">
                  <button
                    onClick={() => {
                      setEditingMessageId(item.message._id);
                      setEditMessage(item.message.content);
                      setOpenMessageMenu(null);
                    }}
                    className="flex items-center px-4 py-2 hover:bg-gray-700 w-full text-left text-gray-300"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteMessage(item.message._id);
                      setOpenMessageMenu(null);
                    }}
                    className="flex items-center px-4 py-2 hover:bg-gray-700 w-full text-left text-red-400"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div
          className={`max-w-[70%] p-3 rounded-lg ${
            isHireRequest 
              ? "bg-purple-800 text-white"
              : isServiceOffer
                ? "bg-indigo-700 text-white"
              : isOwnMessage 
                ? "bg-blue-600 text-white" 
                : "bg-gray-700 text-gray-300"
          }`}
        >
          {/* Message Content */}
          {isEditing && !isHireRequest && !isServiceOffer ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editMessage.trim()) {
                  handleEditMessage(item.message._id, editMessage);
                }
              }}
              className="flex flex-col gap-2"
            >
              <input
                type="text"
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                className="bg-gray-700 text-white px-2 py-1 rounded"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingMessageId(null);
                    setEditMessage("");
                  }}
                  className="text-sm px-2 py-1 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editMessage.trim()}
                  className="text-sm px-2 py-1 rounded bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </form>
          ) : (
            <>
              {item.message.isDeleted ? (
                <>
                  <div className="flex items-center text-gray-400 space-x-2">
                    <Trash2 className="h-4 w-4" />
                    <span className="text-sm italic">deleted message</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs opacity-70">
                    <div className="flex items-center gap-2">
                      <span>
                        {item.message.deletedAt && !isNaN(new Date(item.message.deletedAt).getTime())
                          ? format(new Date(item.message.deletedAt), "h:mm a")
                          : format(new Date(item.message.createdAt), "h:mm a")}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>{renderMessageContent(item.message.content)}</div>
                  {/* Show hire request, service offer, or service request details */}
                  {(isHireRequest || isServiceOffer || item.message.service || item.message.relatedEvent) && item.message.services.length > 0 && (
                    <div className="mt-2 text-sm">
                      <div className="flex flex-col gap-2">
                        <div>
                          <span className={`${isHireRequest || isServiceOffer ? 'text-gray-300' : 'text-gray-400'}`}>Services: </span>
                          <span className="font-medium">
                            {Array.isArray(item.message.services) 
                              ? item.message.services
                                  .map(service => service.charAt(0).toUpperCase() + service.slice(1))
                                  .join(', ')
                              : item.message.service
                                  ? Array.isArray(item.message.service)
                                    ? item.message.service
                                        .map(service => service.charAt(0).toUpperCase() + service.slice(1))
                                        .join(', ')
                                    : item.message.service.charAt(0).toUpperCase() + item.message.service.slice(1)
                                  : 'No services specified'}
                          </span>
                        </div>
                        {item.message.relatedEvent && (
                          <div>
                            <span className={`${isHireRequest || isServiceOffer ? 'text-gray-300' : 'text-gray-400'}`}>Event: </span>
                            <span className="font-medium">{item.message.relatedEvent.title}</span>
                          </div>
                        )}
                      </div>
                      {/* Accept/Decline buttons for professional */}
                      {!isOwnMessage && (item.message.status !== 'accepted' && item.message.status !== 'rejected') && (isHireRequest || isServiceOffer) && (
                    <div className="flex gap-2 mt-3">
                      <button
                            onClick={() => handleAcceptServiceMessage(item.message._id)}
                        className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm"
                      >
                        Accept
                      </button>
                      <button
                            onClick={() => handleRejectServiceMessage(item.message._id)}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                      {/* Show status if request has been handled */}
                      {(isHireRequest || isServiceOffer) && (
                        <div className="mt-2">
                          <span className={`text-sm ${
                            item.message.status === 'accepted' 
                              ? 'text-green-400' 
                              : item.message.status === 'rejected'
                                ? 'text-red-400'
                                : item.message.status === 'unread'
                                  ? 'text-yellow-400'
                                  : 'text-gray-400'
                          }`}>
                            {item.message.status === 'accepted' 
                              ? 'Accepted' 
                              : item.message.status === 'rejected'
                                ? 'Declined'
                                : item.message.status === 'unread'
                                  ? 'Pending'
                                  : 'Read'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-1 text-xs opacity-70">
                    <div className="flex items-center gap-2">
                      <span>
                        {item.message.createdAt && !isNaN(new Date(item.message.createdAt).getTime())
                          ? format(new Date(item.message.createdAt), "h:mm a")
                          : "Invalid time"}
                      </span>
                      {item.message.isEdited && !isHireRequest && !isServiceOffer && (
                        <span className="italic">(edited)</span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Calendar, label: 'Events', path: '/events' },
    { icon: Users, label: 'Professionals', path: '/professionals' },
    { icon: Mail, label: 'Messages', path: '/messages', active: true },
    { icon: Briefcase, label: user?.role === 'professional' ? 'My Gigs' : 'Assigned Gigs', path: '/gigs' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
  ];

  const handleAcceptServiceMessage = async (messageId) => {
    try {
      const response = await axios.put(`/messages/${messageId}/accept-${isServiceOffer ? 'service-offer' : 'hire-request'}`);
      if (response.data.success) {
        toast.success(`${isServiceOffer ? 'Service offer' : 'Hire request'} accepted`);
        // Navigate to the specific gig if ID is provided, otherwise to the professional's gigs page
        if (response.data.data?.mainGigId) {
          navigate(`/gigs/${response.data.data.mainGigId}/preview`);
        } else {
          // If user is a professional, go to "My Gigs", otherwise "Assigned Gigs"
          navigate('/gigs');
        }
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error(error.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleRejectServiceMessage = async (messageId) => {
    try {
      const response = await axios.put(`/messages/${messageId}/reject-${isServiceOffer ? 'service-offer' : 'hire-request'}`);
      if (response.data.success) {
        toast.success(`${isServiceOffer ? 'Service offer' : 'Hire request'} declined`);
        await fetchMessages();
        // Scroll to bottom
        setTimeout(() => {
          const container = messagesContainerRef.current;
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
          inputRef.current?.focus();
        });
      }
    } catch (error) {
      console.error('Error declining request:', error);
      toast.error(error.response?.data?.message || 'Failed to decline request');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">

      {/* Sidebar - Fixed on large screens */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-gray-800 
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          {/* Logo - hidden on mobile */}
          <div className="hidden lg:flex items-center h-16 px-6 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="flex-1 flex justify-start ml-4">
                <Logo className="h-8" />
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto mt-16 lg:mt-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`
                    flex items-center px-4 py-3 text-sm font-semibold rounded-md
                    transition-colors duration-150 ease-in-out
                    ${item.active ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                  `}
                >
                  <Icon className="mr-4 h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Profile Section */}
          <div className="mt-auto px-3 py-4">
            <Link
              to="/profile"
              className="flex items-center px-4 py-3 text-sm font-semibold rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-150 ease-in-out mb-2"
            >
              <User className="mr-4 h-5 w-5" />
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-sm font-semibold text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors duration-150 ease-in-out"
            >
              <LogOut className="mr-4 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content - Pushed to the right on large screens */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 lg:pt-0">
          <div className="max-w-8xl mx-auto">
            {/* Fixed Header */}
            <div className="w-full bg-gray-800 border-b border-gray-700 z-50">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center p-4 space-x-4">
                  {/* Back button */}
                  <button
                    onClick={() => navigate(-1)}
                    className="text-gray-400 hover:text-white"
                  >
                    <ArrowLeft className="h-6 w-6" />
                  </button>

                  {/* Partner info */}
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div
                      className="relative flex-shrink-0 cursor-pointer"
                      onClick={() => navigate(`/professionals/${partner?._id}`)}
                    >
                      <Avatar user={partner} />
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-gray-800 rounded-full ${isUserOnline(partner?._id) ? 'bg-green-500' : 'bg-gray-500'
                          }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex h-auto items-center pt-2 justify-between">
                        <h2
                          className="text-white font-medium truncate cursor-pointer hover:text-blue-400"
                          onClick={() => navigate(`/professionals/${partner?._id}`)}
                        >
                          {partner?.name}
                        </h2>
                        <div className="flex items-center gap-4">
                          {/* Hire Request Status Card */}
                          {messages.some(msg => 
                            msg.service && msg.relatedEvent
                          ) && (
                            <div className="relative">
                              {/* Get the most recent hire request */}
                              {(() => {
                                const hireRequests = messages.filter(msg => 
                                  msg.service && msg.relatedEvent
                                ).sort((a, b) => 
                                  new Date(b.createdAt) - new Date(a.createdAt)
                                );
                                const latestRequest = hireRequests[0];

                                if (latestRequest?.status === 'read') {
                                  return (
                                    <div className="bg-gray-700 rounded-lg px-4 py-2 text-sm">
                                      {user._id === partner?._id ? (
                                        // Professional's view
                                        <div className="flex flex-col gap-2">
                                          <span className="text-yellow-400">Pending Hire Request</span>
                                          <div className="flex gap-2">
                                            <button
                                              onClick={() => handleAcceptServiceMessage(latestRequest._id)}
                                              className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm"
                                            >
                                              Accept
                                            </button>
                                            <button
                                              onClick={() => handleRejectServiceMessage(latestRequest._id)}
                                              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                                            >
                                              Decline
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        // Event owner's view
                                        <span className="text-yellow-400">Hire Request Pending</span>
                                      )}
                                    </div>
                                  );
                                }

                                if (latestRequest?.status === 'accepted') {
                                  return (
                                    <div className="bg-gray-700 rounded-lg px-4 py-2 text-sm">
                                      <span className="text-green-400">Hire Request Accepted</span>
                                    </div>
                                  );
                                }

                                if (latestRequest?.status === 'rejected') {
                                  return (
                                    <div className="bg-gray-700 rounded-lg px-4 py-2 text-sm">
                                      <span className="text-red-400">Hire Request Declined</span>
                                    </div>
                                  );
                                }

                                if (latestRequest?.status === 'unread') {
                                  return (
                                    <div className="bg-gray-700 rounded-lg px-4 py-2 text-sm">
                                      {user._id === partner?._id ? (
                                        // Professional's view
                                        <div className="flex flex-col gap-2">
                                          <span className="text-yellow-400">Pending Hire Request</span>
                                          <div className="flex gap-2">
                                            <button
                                              onClick={() => handleAcceptServiceMessage(latestRequest._id)}
                                              className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm"
                                            >
                                              Accept
                                            </button>
                                            <button
                                              onClick={() => handleRejectServiceMessage(latestRequest._id)}
                                              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                                            >
                                              Decline
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        // Event owner's view
                                        <span className="text-yellow-400">Hire Request Pending</span>
                                      )}
                                    </div>
                                  );
                                }

                                return (
                                  <div className="bg-gray-700 rounded-lg px-4 py-2 text-sm">
                                    <span className="text-yellow-400">Hire Request Pending</span>
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          {/* Options Menu Button */}
                          <div className="relative">
                            <button
                              onClick={() => setOpenMessageMenu(openMessageMenu ? null : 'header-options')}
                              className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700"
                            >
                              <MoreVertical className="h-5 w-5" />
                            </button>

                            {/* Options Menu */}
                            {openMessageMenu === 'header-options' && (
                              <div className="absolute right-0 bg-gray-600 mt-2 w-48 rounded-lg shadow-lg py-1 z-10">
                                <div
                                  className="fixed inset-0 z-0"
                                  onClick={() => setOpenMessageMenu(null)}
                                />
                                <div className="relative z-10">
                                  {partner?.role === 'professional' && (
                                    <button
                                      onClick={() => {
                                        navigate(`/hire/${partner?._id}`);
                                        setOpenMessageMenu(null);
                                      }}
                                      className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                                    >
                                      <Briefcase className="h-4 w-4 mr-2" />
                                      Hire Professional
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400 truncate">
                          {isUserOnline(partner?._id) ? 'Online' : partner?.lastSeen ?
                            `Last seen ${formatDistanceToNow(new Date(partner.lastSeen), { addSuffix: true })}` :
                            'Offline'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Container */}
            <div className="max-w-7xl mx-auto">
              <div
                ref={messagesContainerRef}
                className="h-[calc(100vh-144px)] overflow-y-auto p-4 space-y-4"
              >
                {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <MessageSquare className="h-12 w-12 mb-2" />
                    <p>No messages yet</p>
                    <p className="text-sm">Start the conversation!</p>
                  </div>
                ) : (
                  <>
                    {groupMessagesByDate(messages).map((item, index) =>
                      item.type === "date" ? (
                        <div
                          key={`date-${index}`}
                          className="flex items-center justify-center my-6"
                        >
                          <div className="bg-gray-700 px-3 py-1 rounded-full">
                            <span className="text-sm text-gray-300">
                              {getMessageDate(item.date)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <React.Fragment key={`msg-${item.message._id}`}>
                          {renderMessage(item)}
                        </React.Fragment>
                      )
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}

                {/* Scroll to bottom button */}
                {showScrollButton && (
                  <button
                    onClick={scrollToBottom}
                    className="fixed bottom-24 right-8 bg-gray-800 hover:bg-gray-700 p-2 rounded-full shadow-lg transition-all duration-200"
                    title="Scroll to bottom"
                  >
                    <ChevronDown className="h-5 w-5 text-gray-300" />
                  </button>
                )}
              </div>
            </div>

            {/* Fixed Input Box */}
            <div className="fixed max-lg:left-0 bottom-0 right-0 left-64 bg-gray-800 border-t border-gray-700 p-4 z-50">
              <div className="max-w-7xl mx-auto">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-grow bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type your message..."
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isLoading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default MessageDetailPage;
