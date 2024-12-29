import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Layout from "../../components/Layout";
import {
  Send,
  ArrowLeft,
  User,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronDown,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { useAuth } from "../../context/AuthContext";

const formatLastSeen = (lastSeen) => {
  const date = new Date(lastSeen);
  if (isToday(date)) {
    return `Today at ${format(date, "h:mm a")}`;
  } else if (isYesterday(date)) {
    return `Yesterday at ${format(date, "h:mm a")}`;
  }
  return format(date, "MMM d, yyyy h:mm a");
};

const MessageDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, socket, isUserOnline } = useAuth();
  const [messages, setMessages] = useState([]);
  const [partner, setPartner] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editMessage, setEditMessage] = useState("");
  const [openMessageMenu, setOpenMessageMenu] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [initialScroll, setInitialScroll] = useState(true);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    // Set up polling for new messages
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (socket) {
      // Listen for status updates
      socket.on("userStatus", ({ userId, isOnline, lastSeen }) => {
        if (partner && userId === partner._id) {
          setPartner((prev) => ({
            ...prev,
            isOnline,
            lastSeen,
          }));
        }
      });

      return () => {
        socket.off("userStatus");
      };
    }
  }, [socket, partner]);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/messages/conversation/${id}`);
      setMessages(response.data.data.messages);
      setPartner(response.data.data.partner);
    } catch (error) {
      console.error('Fetch messages error:', error);
      toast.error('Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/messages/${id}/reply`,
        { content: newMessage }
      );

      if (response.data.success) {
        setMessages(prevMessages => [...prevMessages, response.data.data.message]);
        setNewMessage('');
        scrollToBottom();
      }
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
    }
  };

  const getMessageDate = (date) => {
    if (isToday(new Date(date))) {
      return "Today";
    } else if (isYesterday(new Date(date))) {
      return "Yesterday";
    }
    return format(new Date(date), "MMMM d, yyyy");
  };

  // Group messages by date
  const groupMessagesByDate = (messages) => {
    const groups = [];
    let currentDate = null;

    messages?.forEach((msg) => {
      const messageDate = new Date(msg.createdAt);
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
    });

    return groups;
  };

  const handleEditMessage = async (messageId, newContent) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/messages/messages/${messageId}`,
        {
          content: newContent,
        }
      );

      setEditingMessageId(null);
      setEditMessage("");
      fetchMessages();
      toast.success("Message updated successfully");
    } catch (error) {
      console.error("Edit message error:", error);
      toast.error("Failed to update message");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/messages/messages/${messageId}`
      );
      fetchMessages();
      toast.success("Message deleted successfully");
    } catch (error) {
      console.error("Delete message error:", error);
      toast.error("Failed to delete message");
    }
  };

  const renderMessage = (item) => {
    const isOwnMessage = item.message.sender._id === user._id;
    const isEditing = editingMessageId === item.message._id;

    return (
      <div
        key={`msg-${item.message._id}`}
        className={`flex ${
          isOwnMessage ? "justify-end" : "justify-start"
        } group items-center gap-2`}
      >
        {/* Message Options Button - Only show for own messages */}
        {isOwnMessage && (
          <div className="relative">
            <button
              onClick={() =>
                setOpenMessageMenu(
                  openMessageMenu === item.message._id ? null : item.message._id
                )
              }
              className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-gray-700 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4 text-gray-400" />
            </button>

            {/* Message Options Menu */}
            {openMessageMenu === item.message._id && (
              <div className="absolute left-0 top-8 bg-gray-800 rounded-lg shadow-lg py-1 z-10 min-w-[120px] w-max">
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
            isOwnMessage
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-300"
          }`}
        >
          {/* Message Content */}
          {isEditing ? (
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
              <p>{item.message.content}</p>
              <div className="flex items-center justify-between mt-1 text-xs opacity-70">
                <span>
                  {format(new Date(item.message.createdAt), "h:mm a")}
                </span>
                {item.message.edited && <span className="ml-2">(edited)</span>}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Keep only these scroll-related effects:
  useEffect(() => {
    if (initialScroll && !isLoading && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView();
      setInitialScroll(false);
    }
  }, [messages, isLoading, initialScroll]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Layout>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="bg-gray-800 p-4 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            {/* Back button */}
            <button
              onClick={() => navigate('/messages')}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>

            {/* Partner info */}
            <div className="flex items-center space-x-3">
              {partner?.avatar ? (
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
                <h2 className="text-white font-medium">{partner?.name}</h2>
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${
                    partner?.isOnline ? 'bg-green-500' : 'bg-gray-500'
                  }`} />
                  <span className="text-sm text-gray-400">
                    {partner?.isOnline ? 'Online' : partner?.lastSeen ? 
                      `Last seen ${format(new Date(partner.lastSeen), 'MMM d, h:mm a')}` : 
                      'Offline'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 relative"
        >
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            groupMessagesByDate(messages).map((item, index) =>
              item.type === "date" ? (
                // Date Separator
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
                // Message
                renderMessage(item)
              )
            )
          )}
          <div ref={messagesEndRef} />

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

        {/* Fixed Input Box */}
        <div className="bg-gray-800 border-t border-gray-700 p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
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
    </Layout>
  );
};

export default MessageDetailPage;
