import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { 
  Calendar, MapPin, Clock, DollarSign, 
  MessageSquare, CheckCircle, AlertCircle, 
  Eye, Filter, ArrowUpDown
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const MyGigsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [gigs, setGigs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalActive: 0,
    completed: 0,
    pendingPayments: 0
  });

  // Filtering and Sorting
  const [filters, setFilters] = useState({
    status: '',
    dateRange: ''
  });
  const [sortBy, setSortBy] = useState('date');

  useEffect(() => {
    fetchGigs();
  }, [filters, sortBy]);

  const fetchGigs = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/gigs/my-secured-gigs`, {
        params: {
          ...filters,
          sortBy
        }
      });
      
      setGigs(response.data.data.gigs);
      setStats(response.data.data.stats);
    } catch (error) {
      toast.error('Failed to fetch gigs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsCompleted = async (gigId) => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/gigs/${gigId}/complete`);
      toast.success('Gig marked as completed');
      fetchGigs();
    } catch (error) {
      toast.error('Failed to update gig status');
    }
  };

  const handleContactOrganizer = (eventId) => {
    navigate(`/messages/${eventId}`);
  };

  return (
    <Layout>
      <div className="p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Active Gigs</h3>
            <p className="text-3xl font-bold text-blue-500">{stats.totalActive}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Completed Gigs</h3>
            <p className="text-3xl font-bold text-green-500">{stats.completed}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Pending Payments</h3>
            <p className="text-3xl font-bold text-yellow-500">${stats.pendingPayments}</p>
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white"
            >
              <option value="">All Statuses</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              className="bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white"
            >
              <option value="">All Dates</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
              <option value="this_month">This Month</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white"
            >
              <option value="date">Event Date</option>
              <option value="recent">Most Recent</option>
              <option value="payment">Payment Status</option>
            </select>
          </div>
        </div>

        {/* Gigs List */}
        <div className="space-y-6">
          {gigs.map((gig) => (
            <div key={gig._id} className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{gig.event.title}</h3>
                    <p className="text-gray-400">{gig.title}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    gig.status === 'in_progress' ? 'bg-blue-500/20 text-blue-500' :
                    gig.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {gig.status.replace('_', ' ').charAt(0).toUpperCase() + gig.status.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center text-gray-300">
                    <Calendar className="h-5 w-5 mr-2 text-gray-400" />
                    {new Date(gig.event.datetime).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Clock className="h-5 w-5 mr-2 text-gray-400" />
                    {new Date(gig.event.datetime).toLocaleTimeString()}
                  </div>
                  <div className="flex items-center text-gray-300">
                    <MapPin className="h-5 w-5 mr-2 text-gray-400" />
                    {gig.event.location}
                  </div>
                  <div className="flex items-center text-gray-300">
                    <DollarSign className="h-5 w-5 mr-2 text-gray-400" />
                    ${gig.payment.amount} ({gig.payment.status})
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => navigate(`/gigs/${gig._id}`)}
                    className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    View Details
                  </button>
                  {gig.status === 'in_progress' && (
                    <button
                      onClick={() => handleMarkAsCompleted(gig._id)}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Mark Completed
                    </button>
                  )}
                  <button
                    onClick={() => handleContactOrganizer(gig.event._id)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Contact Organizer
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {!isLoading && gigs.length === 0 && (
            <div className="text-center py-12 bg-gray-800 rounded-lg">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Gigs Yet</h3>
              <p className="text-gray-400 mb-4">You haven't secured any gigs yet. Check the Events Page to find opportunities!</p>
              <button
                onClick={() => navigate('/events')}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Browse Events
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MyGigsPage; 