import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import toast from 'react-hot-toast';
import { X, Camera, Settings, User, Star, Plus, ArrowRight, CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import EditProfileModal from '../components/profiles/EditProfileModal';
import PortfolioModal from '../components/profiles/PortfolioModal';
import AvailabilityModal from '../components/profiles/AvailabilityModal';
import DefaultAvatar from '../components/DefaultAvatar';
import { PROFESSIONAL_SERVICES } from '../constants/services';
import OnboardingForm from '../components/profiles/OnboardingForm';

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

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateUser, isNewUser } = useAuth();
  const [userDetails, setUserDetails] = useState(null);
  const [userEvents, setUserEvents] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [portfolio, setPortfolio] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await axios.get(`/users/profile`);
        if (response.data.success) {
          const completeUserData = response.data.data.profile;
          setUserDetails(completeUserData);
          updateUser(completeUserData);
        }
      } catch (error) {
        console.error('Fetch user details error:', error);
        toast.error('Failed to fetch user details');
      }
    };

    if (user?._id) {
      fetchUserDetails();
    }
  }, [user?._id]);

  useEffect(() => {
    fetchUserEvents();
    if (userDetails?.role === 'professional') {
      fetchAvailability();
      fetchPortfolio();
    }
  }, [userDetails]);

  const fetchUserEvents = async () => {
    try {
      const response = await axios.get('/events', {
        params: {
          status: '',
          startDate: '',
          endDate: ''
        }
      });
      if (response.data.success) {
        setUserEvents(response.data.data.events);
      }
    } catch (error) {
      toast.error('Failed to fetch events');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailability = async () => {
    try {
      const response = await axios.get('/users/availability');
      if (response.data.success) {
        console.log('Fetched availability:', response.data.data); // Debug log
        setAvailability(response.data.data.availability || []);
      }
    } catch (error) {
      console.error('Fetch availability error:', error);
      toast.error('Failed to fetch availability');
    }
  };

  const fetchPortfolio = async () => {
    try {
      const response = await axios.get('/users/portfolio');
      if (response.data.success) {
        setPortfolio(response.data.data.portfolio);
      }
    } catch (error) {
      console.error('Fetch portfolio error:', error);
      toast.error('Failed to fetch portfolio items');
    }
  };

  const handleUpdateProfile = async (profileData) => {
    try {
      const formData = new FormData();
      if (profileData.avatar) {
        formData.append('avatar', profileData.avatar);
      }
      formData.append('name', profileData.name);
      formData.append('bio', profileData.bio);
      if (userDetails?.role === 'professional' && profileData.services) {
        formData.append('services', JSON.stringify(profileData.services));
      }

      const response = await axios.put('/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        const updatedProfile = response.data.data.profile;
        updateUser(updatedProfile);
        toast.success('Profile updated successfully');
        setShowEditModal(false);
      }
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleAddPortfolioItem = async (portfolioData) => {
    try {
      const formData = new FormData();
      formData.append('title', portfolioData.title);
      formData.append('description', portfolioData.description);
      formData.append('image', portfolioData.image);

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/users/portfolio`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        await fetchPortfolio(); // Refresh portfolio after adding new item
        toast.success('Portfolio item added successfully');
        setShowPortfolioModal(false);
      }
    } catch (error) {
      console.error('Add portfolio item error:', error);
      toast.error('Failed to add portfolio item');
      throw error;
    }
  };

  const handleUpdateAvailability = async (newAvailability) => {
    try {
      console.log('Updating availability with:', newAvailability); // Debug log
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/users/availability`, {
        availability: newAvailability
      });
      
      if (response.data.success) {
        await fetchAvailability(); // Refresh availability data
      toast.success('Availability updated successfully');
        setShowAvailabilityModal(false);
      }
    } catch (error) {
      console.error('Update availability error:', error);
      toast.error('Failed to update availability');
    }
  };

  const handleProfileUpdate = (updatedData) => {
    setProfileData(updatedData);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (isNewUser) {
    return <OnboardingForm />;
  }

  console.log("userDetails",userDetails);
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-start space-x-6">
            <Avatar user={userDetails} className="w-32 h-32" />
            <div className="flex-1">
              <div className="flex justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-2">{userDetails?.name}</h1>
                  {userDetails?.role === 'professional' && (
                    <div className="flex items-center space-x-4 text-gray-300">
                      <div className="flex items-center">
                        <Star className="h-5 w-5 text-yellow-500 mr-1" />
                        <span>{userDetails?.rating?.toFixed(1) || 'No rating'}</span>
                      </div>
                      <div>{userDetails?.completedEvents || 0} events completed</div>
                    </div>
                  )}
                  <p className="text-gray-400 mt-2">{userDetails?.bio || 'No bio available'}</p>
                  {userDetails?.role === 'professional' && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {userDetails.services?.map((serviceId) => {
                        const service = PROFESSIONAL_SERVICES.find(s => s.id === serviceId);
                        return service ? (
                          <span
                            key={serviceId}
                            className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300"
                          >
                            {service.label}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="h-10 max-lg:h-16 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={() => navigate('/settings')}
                    className="h-10 w-10 max-lg:w-16 bg-gray-700 text-white rounded-md hover:bg-gray-600 flex items-center justify-center"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Events Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">
              {userDetails?.role === 'professional' ? 'My Events' : 'Events I\'ve Created'}
            </h2>
          </div>
          {userEvents?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userEvents.map((event) => (
                <div key={event._id} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors">
                  <h3 className="text-lg font-medium text-white mb-2">{event.title}</h3>
                  <div className="text-gray-400 mb-2">
                    <CalendarIcon className="inline-block h-4 w-4 mr-1" />
                    {format(new Date(event.datetime), 'MMMM d, yyyy')}
                  </div>
                  <p className="text-gray-300 mb-4 line-clamp-2">{event.description}</p>
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-1 rounded text-sm ${
                      event.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      event.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    </span>
                    <button
                      onClick={() => navigate(`/events/${event._id}`)}
                      className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                    >
                      View Details
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">
                {userDetails?.role === 'professional' ? 'No events yet' : 'You haven\'t created any events yet'}
              </p>
            </div>
          )}
        </div>

        {userDetails?.role === 'professional' && (
          <>
            {/* Portfolio Section */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Portfolio</h2>
                <button
                  onClick={() => setShowPortfolioModal(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Item
                </button>
              </div>
              {portfolio?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {portfolio.map((item) => (
                    <div key={item._id} className="bg-gray-700 rounded-lg overflow-hidden">
                      <img
                        src={item.image.url}
                        alt={item.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="text-lg font-medium text-white mb-2">{item.title}</h3>
                        <p className="text-gray-400">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No portfolio items yet</p>
                </div>
              )}
            </div>

            {/* Availability Section */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">Availability</h3>
                <button
                  onClick={() => setShowAvailabilityModal(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Update Availability
                </button>
              </div>

              {availability?.length > 0 ? (
                <div className="grid gap-4">
                  {availability.map((slot, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-4">
                      <div className="text-white font-medium mb-2">
                        {format(new Date(slot.date), 'EEEE, MMMM d, yyyy')}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {slot.timeSlots.map((time, timeIndex) => (
                          <div
                            key={timeIndex}
                            className="bg-gray-600 px-3 py-2 rounded-md text-sm text-gray-300"
                          >
                            {time.start} - {time.end}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No availability set</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showEditModal && (
        <EditProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleUpdateProfile}
          user={userDetails}
        />
      )}

      {showPortfolioModal && (
        <PortfolioModal
          isOpen={showPortfolioModal}
          onClose={() => setShowPortfolioModal(false)}
          onSubmit={handleAddPortfolioItem}
        />
      )}

      {showAvailabilityModal && (
        <AvailabilityModal
          isOpen={showAvailabilityModal}
          onClose={() => setShowAvailabilityModal(false)}
          onSubmit={handleUpdateAvailability}
          availability={availability}
        />
      )}
    </Layout>
  );
};

export default ProfilePage;
