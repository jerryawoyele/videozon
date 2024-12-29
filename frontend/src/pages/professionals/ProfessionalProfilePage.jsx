import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { 
  User, Star, MessageSquare, 
  Image as ImageIcon, Clock, ArrowLeft,
  Plus, X, Upload, Calendar as CalendarIcon
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Calendar from '../../components/Calendar';
import ReviewModal from '../../components/ReviewModal';
import { uploadImage } from '../../utils/imageUpload';
import { format } from 'date-fns';

const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

const ProfessionalProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [professional, setProfessional] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);
  const [portfolioItem, setPortfolioItem] = useState({
    title: '',
    description: '',
    image: null
  });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [availability, setAvailability] = useState([]);
  // const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [portfolioImage, setPortfolioImage] = useState(null);
  const [portfolioData, setPortfolioData] = useState({
    title: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [userEvents, setUserEvents] = useState([]);
  const [requestData, setRequestData] = useState({
    eventId: '',
    service: '',
    message: ''
  });

  useEffect(() => {
    fetchProfessionalProfile();
    fetchAvailability();
  }, [id]);

  const fetchProfessionalProfile = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/professionals/${id}`);
      setProfessional(response.data.data.professional);
    } catch (error) {
      toast.error('Failed to fetch professional profile');
      navigate('/professionals');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailability = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/availability`);
      if (response.data.success) {
        const availabilityData = response.data.data.availability;
        setAvailability(availabilityData.map(slot => ({
          ...slot,
          date: new Date(slot.date)
        })));
      }
    } catch (error) {
      console.error('Fetch availability error:', error);
      toast.error('Failed to fetch availability');
    }
  };

  const handlePortfolioSubmit = async (e) => {
    e.preventDefault();
    
    if (!portfolioImage || !portfolioData.title) {
      toast.error('Please provide both an image and title');
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert image file to base64
      const base64Image = await convertFileToBase64(portfolioImage);

      // Prepare the data
      const portfolioPayload = {
        title: portfolioData.title,
        description: portfolioData.description,
        image: base64Image
      };

      // Log for debugging
      console.log('Sending portfolio data:', {
        title: portfolioPayload.title,
        description: portfolioPayload.description,
        imageSize: portfolioPayload.image.length
      });

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/users/portfolio`,
        portfolioPayload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        toast.success('Portfolio item added successfully');
        setShowPortfolioModal(false);
        
        // Reset form
        setPortfolioImage(null);
        setPortfolioData({ title: '', description: '' });
        
        // Refresh profile data
        fetchProfessionalProfile();
      }
    } catch (error) {
      console.error('Add portfolio error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add portfolio item';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvailabilitySubmit = async () => {
    try {
      const formattedDates = selectedDates.map(({ date, timeSlots }) => ({
        date: date.toISOString(),
        timeSlots: timeSlots.filter(slot => slot.isSelected)
      }));

      await axios.post(`${import.meta.env.VITE_API_URL}/users/availability`, {
        availability: formattedDates
      });

      toast.success('Availability updated successfully');
      setShowAvailabilityModal(false);
      fetchAvailability();
    } catch (error) {
      console.error('Update availability error:', error);
      toast.error('Failed to update availability');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleReviewSubmit = async ({ rating, review }) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/users/${id}/reviews`, {
        rating,
        review
      });
      toast.success('Review submitted successfully');
      setShowReviewModal(false);
      fetchProfessionalProfile();
    } catch (error) {
      toast.error('Failed to submit review');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const imageUrl = await uploadImage(file);
        setPortfolioItem(prev => ({
          ...prev,
          image: { url: imageUrl }
        }));
      } catch (error) {
        toast.error('Failed to upload image');
      }
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPortfolioImage(file);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setPortfolioImage(file);
    }
  };

  const renderAvailabilitySection = () => {
    return (
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">Availability</h3>
          {user._id === id && (
            <button
              onClick={() => setShowAvailabilityModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Clock className="h-4 w-4 mr-2" />
              Update Availability
            </button>
          )}
        </div>

        {availability.length > 0 ? (
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
    );
  };

  const fetchUserEvents = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/events/my-events`);
      setUserEvents(response.data.data.events);
    } catch (error) {
      toast.error('Failed to fetch events');
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/messages/service-request`, {
        receiverId: id,
        eventId: requestData.eventId,
        service: requestData.service,
        message: requestData.message || `Request for ${requestData.service} service`
      });
      toast.success('Request sent successfully');
      setShowRequestModal(false);
      setRequestData({ eventId: '', service: '', message: '' });
      navigate('/messages'); // Redirect to messages page to see the sent request
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    }
  };

  useEffect(() => {
    if (showRequestModal) {
      fetchUserEvents();
    }
  }, [showRequestModal]);

  const handleBack = () => {
    // Check if we came from a message page
    const previousMessagePage = sessionStorage.getItem('previousMessagePage');
    if (previousMessagePage) {
      navigate(previousMessagePage);
      sessionStorage.removeItem('previousMessagePage'); // Clean up
    } else {
      navigate(-1); // Default back behavior
    }
  };

  const handleRequestService = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/events/request`, {
        professionalId: professional._id,
        eventId: selectedEventId // Assuming you have the selected event ID
      });

      toast.success(response.data.message);
      // Optionally, you can navigate to the messages page or refresh the current page
    } catch (error) {
      toast.error('Failed to send service request');
    }
  };

  if (isLoading || !professional) {
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
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>

          {/* Profile Header */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-start space-x-6">
              <div className="h-24 w-24 rounded-full bg-gray-700 flex items-center justify-center">
                {professional?.avatar ? (
                  <img
                    src={professional?.avatarUrl}
                    alt={professional.name}
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white mb-2">{professional.name}</h1>
                <div className="flex items-center space-x-4 text-gray-300 mb-4">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-500 mr-1" />
                    <span>{professional.rating?.toFixed(1) || 'No rating'}</span>
                  </div>
                  <div>
                    {professional.completedEvents || 0} events completed
                  </div>
                </div>
                <p className="text-gray-400 mb-4">{professional.bio || 'No bio available'}</p>
                <div className="flex flex-wrap gap-2">
                  {professional.services?.map((service) => (
                    <span
                      key={service}
                      className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300"
                    >
                      {service.charAt(0).toUpperCase() + service.slice(1)}
                    </span>
                  ))}
                </div>
              </div>
              {user.role === 'organizer' && (
                <button
                  onClick={() => navigate(`/messages/new?recipient=${professional._id}`)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Contact
                </button>
              )}
              <div className="flex items-center space-x-4">
                {user._id !== id && (
                  <button
                    onClick={() => setShowRequestModal(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    Request Service
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Portfolio Section */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Portfolio</h2>
              {user._id === id && (
                <button
                  onClick={() => setShowPortfolioModal(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Item
                </button>
              )}
            </div>
            {professional.portfolio?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {professional.portfolio.map((item) => (
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

          {/* Availability Calendar with mb-6 for spacing */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-white">Availability</h3>
              {user._id === id && (
                <button
                  onClick={() => setShowAvailabilityModal(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Update Availability
                </button>
              )}
            </div>

            {availability.length > 0 ? (
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

          {/* Reviews Section */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Reviews</h2>
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="text-white font-medium">{professional.rating.toFixed(1)}</span>
                <span className="text-gray-400">({professional.reviews.length} reviews)</span>
              </div>
            </div>
            
            {professional.reviews && professional.reviews.length > 0 ? (
              <div className="space-y-4">
                {professional.reviews.map((review, index) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center">
                          {review.organizer.avatar ? (
                            <img
                            src={review.organizer.avatarUrl}
                            alt={review.organizer.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{review.organizer.name}</p>
                          <p className="text-sm text-gray-400">{formatDate(review.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Star className="h-5 w-5 text-yellow-500 mr-1" />
                        <span className="text-white">{review.rating}</span>
                      </div>
                    </div>
                    <p className="text-gray-300">{review.review}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">No reviews yet</p>
              </div>
            )}
          </div>

          {/* Portfolio Modal */}
          {showPortfolioModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg w-full max-w-md mx-4">
                <div className="p-4 border-b border-gray-700">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Add Portfolio Item</h2>
                    <button
                      onClick={() => {
                        setShowPortfolioModal(false);
                        setPortfolioImage(null);
                        setPortfolioData({ title: '', description: '' });
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handlePortfolioSubmit} className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Image
                    </label>
                    <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-700 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-400">
                          <label className="relative cursor-pointer rounded-md font-medium text-blue-500 hover:text-blue-400">
                            <span>Upload a file</span>
                            <input
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleFileChange}
                            />
                          </label>
                        </div>
                        {portfolioImage && (
                          <p className="text-sm text-gray-400">
                            Selected: {portfolioImage.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={portfolioData.title}
                      onChange={(e) => setPortfolioData(prev => ({
                        ...prev,
                        title: e.target.value
                      }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={portfolioData.description}
                      onChange={(e) => setPortfolioData(prev => ({
                        ...prev,
                        description: e.target.value
                      }))}
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPortfolioModal(false);
                        setPortfolioImage(null);
                        setPortfolioData({ title: '', description: '' });
                      }}
                      className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !portfolioImage || !portfolioData.title}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Adding...' : 'Add Item'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Availability Modal */}
          {user._id === id && showAvailabilityModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg w-full max-w-md mx-4">
                {/* Fixed Header */}
                <div className="p-4 border-b border-gray-700">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Update Availability</h2>
                    <button
                      onClick={() => setShowAvailabilityModal(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                  <div className="space-y-4">
                    <Calendar
                      selectedDates={selectedDates}
                      onChange={setSelectedDates}
                    />
                    {selectedDates.length === 0 && (
                      <p className="text-sm text-yellow-400">
                        Warning: Updating with no dates selected will clear your availability.
                      </p>
                    )}
                  </div>
                </div>

                {/* Fixed Footer */}
                <div className="p-4 border-t border-gray-700">
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowAvailabilityModal(false)}
                      className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAvailabilitySubmit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      {selectedDates.length === 0 ? 'Clear Availability' : 'Update Availability'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Review Modal */}
          <ReviewModal
            isOpen={showReviewModal}
            onClose={() => setShowReviewModal(false)}
            onSubmit={handleReviewSubmit}
          />

          {/* Request Modal */}
          {showRequestModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg w-full max-w-md mx-4">
                <div className="p-4 border-b border-gray-700">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Request Service</h2>
                    <button
                      onClick={() => setShowRequestModal(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleRequestSubmit} className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Select Event
                    </label>
                    <select
                      value={requestData.eventId}
                      onChange={(e) => setRequestData(prev => ({ ...prev, eventId: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select an event</option>
                      {userEvents.map((event) => (
                        <option key={event._id} value={event._id}>
                          {event.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Service Required
                    </label>
                    <select
                      value={requestData.service}
                      onChange={(e) => setRequestData(prev => ({ ...prev, service: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select a service</option>
                      {professional?.services.map((service) => (
                        <option key={service} value={service}>
                          {service.charAt(0).toUpperCase() + service.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Message (Optional)
                    </label>
                    <textarea
                      value={requestData.message}
                      onChange={(e) => setRequestData(prev => ({ ...prev, message: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add any specific requirements or notes..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowRequestModal(false)}
                      className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Send Request
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProfessionalProfilePage;
