import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Plus, CalendarIcon, Search, Filter, User } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import axios from '../../utils/axios';
import toast from 'react-hot-toast';
import DefaultAvatar from '../../components/DefaultAvatar';

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

const EventsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [activeTab, searchTerm, filters]);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const endpoint = activeTab === 'all' ? '/events/all' : '/events';
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await axios.get(`${endpoint}?${params.toString()}`);
      if (response.data.success) {
        const now = new Date();
        const filteredEvents = response.data.data.events
          .map(event => {
            const eventDate = new Date(event.datetime);
            if (eventDate < now && event.status === 'active') {
              event.status = 'concluded';
            }
            return event;
          })
          .filter(event => event.status !== 'concluded');
          
        setEvents(filteredEvents);
      }
    } catch (error) {
      toast.error('Failed to fetch events');
    } finally {
      setIsLoading(false);
    }
  };

  const formatEventDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (!isValid(date)) {
        return 'Date not set';
      }
      
      const day = date.getDate();
      const suffix = getDaySuffix(day);
      const month = date.toLocaleString('default', { month: 'long' });
      const year = date.getFullYear();
      const time = date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit'
      });
      
      return `${day}${suffix} ${month}, ${year} ${time}`;
    } catch (error) {
      return 'Date not set';
    }
  };

  const getDaySuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'concluded':
        return 'bg-green-500/20 text-green-400';
      case 'ongoing':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-blue-500/20 text-blue-400';
    }
  };

  const getDaysToEvent = (datetime) => {
    const now = new Date();
    const eventDate = new Date(datetime);
    const diffTime = eventDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays < 0) {
      return `${Math.abs(diffDays)} days ago`;
    } else {
      return `${diffDays} days to go`;
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-md ${
                  activeTab === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                All Events
              </button>
              <button
                onClick={() => setActiveTab('my')}
                className={`px-4 py-2 rounded-md ${
                  activeTab === 'my'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                My Events
              </button>
            </div>
            <button
              onClick={() => navigate('/events/create')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Event
            </button>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
              >
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-800 rounded-md">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white"
                  >
                    <option value="">All</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((event) => (
                <div key={event._id} className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">{event.title}</h3>
                  <div className="flex items-center justify-between text-gray-400 mb-4">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {formatEventDate(event.datetime)}
                    </div>
                    <div className="text-sm font-medium">
                      {getDaysToEvent(event.datetime)}
                    </div>
                  </div>
                  {event.organizer && (
                    <div className="flex items-center mb-4 space-x-4">
                      <Avatar 
                        user={event.organizer} 
                        className="w-12 h-12 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <p className="text-white font-medium text-base">{event.organizer.name}</p>
                        <p className="text-sm text-gray-400 mt-0.5">Organizer</p>
                      </div>
                    </div>
                  )}
                  <p className="text-gray-300 mb-4">{event.description}</p>
                  <div className="flex justify-between items-center">
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(event.status)}`}>
                      {event.status?.charAt(0).toUpperCase() + event.status?.slice(1) || 'Unknown'}
                    </span>
                    <button
                      onClick={() => navigate(`/events/${event._id}`)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">
                {activeTab === 'all' ? 'No events available' : 'You have no events yet'}
              </p>
              {activeTab === 'my' && (
                <button
                  onClick={() => navigate('/events/create')}
                  className="mt-4 text-blue-400 hover:text-blue-300"
                >
                  Create your first event
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default EventsPage;
