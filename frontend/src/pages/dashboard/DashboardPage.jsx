import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { 
  Calendar, MessageSquare, Bell, 
  Clock, Archive, AlertCircle,
  Eye, CheckCircle, Briefcase,
  DollarSign
} from 'lucide-react';
import axios from '../../utils/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    upcomingEvents: 0,
    unreadMessages: 0,
    unreadNotifications: 0,
    pendingRequests: 0,
    recentEvents: [],
    totalEarnings: 0,
    activeGigs: 0,
    currentGigs: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/dashboard/stats');
      if (response.data.success) {
        setStats(response.data.data.stats);
      }
    } catch (error) {
      console.error('Dashboard error:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {user.role === 'professional' ? (
              <>
                <div className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Active Gigs</h3>
                    <Briefcase className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.activeGigs || 0}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Total Earnings</h3>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="text-3xl font-bold text-white">₦{stats.totalEarnings?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Upcoming Events</h3>
                    <Clock className="h-8 w-8 text-yellow-500" />
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.upcomingEvents || 0}</p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Active Events</h3>
                    <Calendar className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.activeEvents || 0}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Total Events</h3>
                    <Archive className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.totalEvents || 0}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Upcoming Events</h3>
                    <Clock className="h-8 w-8 text-yellow-500" />
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.upcomingEvents || 0}</p>
                </div>
              </>
            )}
          </div>

          {/* Activity Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {user.role === 'professional' ? (
              <>
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h2 className="text-lg font-semibold text-white mb-4">Current Gigs</h2>
                  <div className="space-y-4">
                    {stats.currentGigs?.map((gig) => (
                      <div
                        key={gig._id}
                        className="flex items-center justify-between p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600"
                        onClick={() => navigate(`/gigs`)}
                      >
                        <div>
                          <h3 className="text-white font-medium">{gig.event.title}</h3>
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm text-gray-400">
                              {formatDate(gig.event.datetime)}
                            </p>
                            <p className="text-sm text-gray-400">
                              Service: {gig.service}
                            </p>
                            <p className="text-sm text-gray-400">
                              Organizer: {gig.event.organizer?.name}
                            </p>
                            <p className="text-sm text-gray-400">
                              Location: {gig.event.location}
                            </p>
                          </div>
                        </div>
                        <Eye className="h-5 w-5 text-gray-400" />
                      </div>
                    ))}
                    {!stats.currentGigs?.length && (
                      <div className="text-center py-4 text-gray-400">
                        No active gigs found
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-gray-800 p-6 rounded-lg">
                <h2 className="text-lg font-semibold text-white mb-4">Recent Events</h2>
                <div className="space-y-4">
                  {stats.recentEvents?.map((event) => (
                    <div
                      key={event._id}
                      className="flex items-center justify-between p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600"
                      onClick={() => navigate(`/events/${event._id}`)}
                    >
                      <div>
                        <h3 className="text-white font-medium">{event.title}</h3>
                        <p className="text-sm text-gray-400">{formatDate(event.datetime)}</p>
                      </div>
                      <Eye className="h-5 w-5 text-gray-400" />
                    </div>
                  ))}
                  {!stats.recentEvents?.length && (
                    <div className="text-center py-4 text-gray-400">
                      No events found
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-white mb-4">Notifications</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <Bell className="h-5 w-5 text-blue-500 mr-3" />
                    <div>
                      <p className="text-white">Unread Notifications</p>
                      <p className="text-sm text-gray-400">{stats.unreadNotifications || 0} new notifications</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/notifications')}
                    className="text-blue-500 hover:text-blue-400"
                  >
                    View
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <MessageSquare className="h-5 w-5 text-blue-500 mr-3" />
                    <div>
                      <p className="text-white">Unread Messages</p>
                      <p className="text-sm text-gray-400">{stats.unreadMessages || 0} new messages</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/messages')}
                    className="text-blue-500 hover:text-blue-400"
                  >
                    View
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                    <div>
                      <p className="text-white">Pending Requests</p>
                      <p className="text-sm text-gray-400">{stats.pendingRequests || 0} requests</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/messages?tab=received')}
                    className="text-blue-500 hover:text-blue-400"
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;