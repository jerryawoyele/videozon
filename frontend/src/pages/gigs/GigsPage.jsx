import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { 
  Calendar, MapPin, Clock, DollarSign, 
  Mail, CheckCircle, AlertCircle, 
  Eye, Filter, ArrowUpDown
} from 'lucide-react';
import api from '../../utils/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const GigsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isProfessional = user?.role === 'professional';
  const [gigs, setGigs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(isProfessional ? 'my-gigs' : 'assigned-gigs');
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
  }, [filters, sortBy, activeTab]);

  const fetchGigs = async () => {
    try {
      setIsLoading(true);
      const endpoint = activeTab === 'my-gigs' 
        ? '/gigs/professional'
        : '/gigs/client';
      const response = await api.get(endpoint);
      
      if (response.data.success) {
        const fetchedGigs = response.data.data.gigs || [];
        setGigs(fetchedGigs);

        // Calculate stats
        const activeGigs = fetchedGigs.filter(gig => gig.status === 'active').length;
        const completedGigs = fetchedGigs.filter(gig => gig.status === 'completed').length;
        const pendingPayments = fetchedGigs
          .filter(gig => gig.status === 'completed' && gig.paymentStatus !== 'paid')
          .reduce((total, gig) => total + (gig.price || 0), 0);

        setStats({
          totalActive: activeGigs,
          completed: completedGigs,
          pendingPayments
        });
      }
    } catch (error) {
      console.error('Fetch gigs error:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        toast.error('Failed to fetch gigs');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsCompleted = async (gigId) => {
    try {
      const response = await api.put(`/professionals/gigs/${gigId}`, {
        status: 'completed'
      });

      if (response.data.success) {
        toast.success('Gig marked as completed');
        fetchGigs();
      }
    } catch (error) {
      console.error('Update gig error:', error);
      toast.error('Failed to update gig status');
    }
  };

  const handleContactOrganizer = (organizerId) => {
    navigate(`/messages/${organizerId}`);
  };

  const handleContactProfessional = (professionalId) => {
    navigate(`/messages/${professionalId}`);
  };

  const handleMakePayment = (gigId) => {
    if (!gigId) {
      toast.error('Invalid gig ID');
      return;
    }
    navigate(`/payments/${gigId}`);
  };

  const getFilteredGigs = () => {
    let filtered = [...gigs];

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(gig => gig.status === filters.status);
    }

    // Apply date range filter
    if (filters.dateRange) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      filtered = filtered.filter(gig => {
        const gigDate = new Date(gig.datetime);
        switch (filters.dateRange) {
          case 'upcoming':
            return gigDate >= today;
          case 'past':
            return gigDate < today;
          case 'this_month':
            return gigDate >= monthStart && gigDate <= monthEnd;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.datetime) - new Date(a.datetime);
        case 'recent':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'payment':
          return (b.payment?.amount || 0) - (a.payment?.amount || 0);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredGigs = getFilteredGigs();
  console.log("filteredGigs", filteredGigs);

  const isMyGigs = activeTab === 'my-gigs';

  const renderGigCard = (gig) => {
    const contactPerson = isMyGigs ? gig.event?.organizer : gig.professional;
    const contactPersonName = contactPerson?.name || 'Unknown';

    return (
      <div key={gig._id} className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold text-white">{gig.title}</h3>
              {/* <p className="text-gray-400">{gig.service}</p> */}
              <p className="text-gray-300 mt-1">
                {isMyGigs ? (
                  <>Event Organizer: {contactPersonName}</>
                ) : (
                  <>Professional: {contactPersonName}</>
                )}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm ${
              gig.status === 'active' ? 'bg-blue-500/20 text-blue-500' :
              gig.status === 'completed' ? 'bg-green-500/20 text-green-500' :
              'bg-red-500/20 text-red-500'
            }`}>
              {gig.status.replace('_', ' ').charAt(0).toUpperCase() + gig.status.slice(1)}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center text-gray-300">
              <Calendar className="h-5 w-5 mr-2 text-gray-400" />
              {new Date(gig.startDate).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              }).replace(/(\d+)/, (match) => {
                const day = parseInt(match);
                const suffix = ['th', 'st', 'nd', 'rd'][(day % 10 > 3 || day > 20) ? 0 : day % 10];
                return `${day}${suffix}`;
              })}
            </div>
            <div className="flex items-center text-gray-300">
              <Clock className="h-5 w-5 mr-2 text-gray-400" />
              {new Date(gig.startDate).toLocaleTimeString()}
            </div>
            <div className="flex items-center text-gray-300">
              <MapPin className="h-5 w-5 mr-2 text-gray-400" />
              {gig.event.location}
            </div>
            <div className="flex items-center text-gray-300">
              <DollarSign className="h-5 w-5 mr-2 text-gray-400" />
              ₦{gig.price?.toLocaleString()} ({gig.paymentStatus === 'paid' ? 'Paid' : 'Pending'})
            </div>
          </div>

          <div className="flex flex-col space-y-3">
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => navigate(`/gigs/${gig._id}/preview`)}
                className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
              >
                <Eye className="h-5 w-5 mr-2" />
                View Details
              </button>
              {gig.status === 'active' && (
                <button
                  onClick={() => handleMarkAsCompleted(gig._id)}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Mark Completed
                </button>
              )}
              {activeTab === 'assigned-gigs' && gig.paymentStatus !== 'paid' && (
                <button
                  onClick={() => gig._id ? navigate(`/payments/${gig._id}`) : toast.error('Invalid gig ID')}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <DollarSign className="h-5 w-5 mr-2" />
                  Make Payment
                </button>
              )}
            </div>
            <div className="flex justify-end">
              {activeTab === 'my-gigs' ? (
                <button
                  onClick={() => handleContactOrganizer(gig.event?.organizer?._id)}
                  className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                  disabled={!gig.event?.organizer?._id}
                >
                  <Mail className="h-5 w-5 mr-2" />
                  Contact Event Organizer
                </button>
              ) : (
                <button
                  onClick={() => handleContactProfessional(gig.professional?._id)}
                  className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                  disabled={!gig.professional?._id}
                >
                  <Mail className="h-5 w-5 mr-2" />
                  Contact Professional
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-800 rounded-lg"></div>
              ))}
            </div>
            <div className="h-16 bg-gray-800 rounded-lg"></div>
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-800 rounded-lg"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">
              {isProfessional ? 'My Active Gigs' : 'Assigned Active Gigs'}
            </h3>
            <p className="text-3xl font-bold text-blue-500">{stats.totalActive}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">
              {isProfessional ? 'My Completed Gigs' : 'Assigned Completed Gigs'}
            </h3>
            <p className="text-3xl font-bold text-green-500">{stats.completed}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">
              {isProfessional ? 'My Pending Payments' : 'Assigned Pending Payments'}
            </h3>
            <p className="text-3xl font-bold text-yellow-500">₦{stats.pendingPayments.toLocaleString()}</p>
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
              <option value="active">Active</option>
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
              <option value="payment">Payment Amount</option>
            </select>
          </div>
        </div>

        {/* Tabs Navigation */}
        {isProfessional && (
          <div className="flex justify-center space-x-1 bg-gray-800 p-1 rounded-lg mb-6 max-w-fit mx-auto">
            <button
              onClick={() => setActiveTab('my-gigs')}
              className={`py-2.5 px-6 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'my-gigs'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              My Gigs
            </button>
            <button
              onClick={() => setActiveTab('assigned-gigs')}
              className={`py-2.5 px-6 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'assigned-gigs'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Assigned Gigs
            </button>
          </div>
        )}

        {/* Gigs List */}
        <div className="space-y-6">
          {filteredGigs.map((gig) => (
            <div key={gig._id} className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{gig.title}</h3>
                    <p className="text-gray-300 mt-1">
                      {isMyGigs ? (
                        <>Event Organizer: {gig.event?.organizer?.name || 'Unknown'}</>
                      ) : (
                        <>Professional: {gig.professional?.name || 'Unknown'}</>
                      )}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    gig.status === 'active' ? 'bg-blue-500/20 text-blue-500' :
                    gig.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {gig.status.replace('_', ' ').charAt(0).toUpperCase() + gig.status.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center text-gray-300">
                    <Calendar className="h-5 w-5 mr-2 text-gray-400" />
                    {new Date(gig.startDate).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }).replace(/(\d+)/, (match) => {
                      const day = parseInt(match);
                      const suffix = ['th', 'st', 'nd', 'rd'][(day % 10 > 3 || day > 20) ? 0 : day % 10];
                      return `${day}${suffix}`;
                    })}
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Clock className="h-5 w-5 mr-2 text-gray-400" />
                    {new Date(gig.startDate).toLocaleTimeString()}
                  </div>
                  <div className="flex items-center text-gray-300">
                    <MapPin className="h-5 w-5 mr-2 text-gray-400" />
                    {gig.event.location}
                  </div>
                  <div className="flex items-center text-gray-300">
                    <DollarSign className="h-5 w-5 mr-2 text-gray-400" />
                    ₦{gig.price?.toLocaleString()} ({gig.paymentStatus === 'paid' ? 'Paid' : 'Pending'})
                  </div>
                </div>

                <div className="flex flex-col space-y-3">
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => navigate(`/gigs/${gig._id}/preview`)}
                      className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                    >
                      <Eye className="h-5 w-5 mr-2" />
                      View Details
                    </button>
                    {gig.status === 'active' && (
                      <button
                        onClick={() => handleMarkAsCompleted(gig._id)}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Mark Completed
                      </button>
                    )}
                    {activeTab === 'assigned-gigs' && gig.paymentStatus !== 'paid' && (
                      <button
                        onClick={() => gig._id ? navigate(`/payments/${gig._id}`) : toast.error('Invalid gig ID')}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        <DollarSign className="h-5 w-5 mr-2" />
                        Make Payment
                      </button>
                    )}
                  </div>
                  <div className="flex justify-end">
                    {activeTab === 'my-gigs' ? (
                      <button
                        onClick={() => handleContactOrganizer(gig.event?.organizer?._id)}
                        className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                        disabled={!gig.event?.organizer?._id}
                      >
                        <Mail className="h-5 w-5 mr-2" />
                        Contact Event Organizer
                      </button>
                    ) : (
                      <button
                        onClick={() => handleContactProfessional(gig.professional?._id)}
                        className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                        disabled={!gig.professional?._id}
                      >
                        <Mail className="h-5 w-5 mr-2" />
                        Contact Professional
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {!isLoading && filteredGigs.length === 0 && (
            <div className="text-center py-12 bg-gray-800 rounded-lg">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Gigs Found</h3>
              <p className="text-gray-400 mb-4">
                {gigs.length === 0 ? (
                  isProfessional ? (
                    "You haven't secured any gigs yet. Check the Events Page to find opportunities!"
                  ) : (
                    "You haven't assigned any gigs yet. Hire professionals for your events to see them here!"
                  )
                ) : (
                  "No gigs match your current filters. Try adjusting them to see more results."
                )}
              </p>
              {gigs.length === 0 && (
                <button
                  onClick={() => navigate(isProfessional ? '/events' : '/professionals')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {isProfessional ? 'Browse Events' : 'Browse Professionals'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default GigsPage; 