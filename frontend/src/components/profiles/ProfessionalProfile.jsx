import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Star, Plus, Clock, CalendarIcon, 
  User, X, Upload, MessageSquare, ArrowRight, CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import Calendar from '../Calendar';
import ReviewModal from '../ReviewModal';
import { uploadImage } from '../../utils/imageUpload';
import axios from 'axios';
import toast from 'react-hot-toast';
import DefaultAvatar from '../DefaultAvatar';
import ServiceRequestModal from '../ServiceRequestModal';

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
const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

export const ProfessionalProfile = ({ 
  user, 
  professional,
  events,
  availability, 
  isOwnProfile,
  onUpdateProfile,
  onUpdateAvailability,
  onAddPortfolioItem,
  onAddReview,
  userEvents
}) => {
  const navigate = useNavigate();
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);
  const [portfolioImage, setPortfolioImage] = useState(null);
  const [portfolioData, setPortfolioData] = useState({
    title: '',
    description: ''
  });
  const [requestData, setRequestData] = useState({
    eventId: '',
    services: [],
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRequestedService, setHasRequestedService] = useState(false);

  useEffect(() => {
    if (professional?._id) {
      checkExistingRequest();
    }
  }, [professional?._id]);

  const checkExistingRequest = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/messages/check-request/${professional._id}`
      );
      setHasRequestedService(response.data.data.hasRequest);
    } catch (error) {
      console.error('Error checking existing requests:', error);
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
      const base64Image = await convertFileToBase64(portfolioImage);
      const portfolioPayload = {
        title: portfolioData.title,
        description: portfolioData.description,
        image: base64Image
      };

      await onAddPortfolioItem(portfolioPayload);
      setShowPortfolioModal(false);
      setPortfolioImage(null);
      setPortfolioData({ title: '', description: '' });
    } catch (error) {
      console.error('Add portfolio error:', error);
      toast.error('Failed to add portfolio item');
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

      await onUpdateAvailability(formattedDates);
      setShowAvailabilityModal(false);
      setSelectedDates([]);
    } catch (error) {
      console.error('Update availability error:', error);
      toast.error('Failed to update availability');
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/messages/service-request`, {
        receiverId: professional._id,
        eventId: requestData.eventId,
        services: requestData.services,
        message: requestData.message || `Request for ${requestData.services.join(', ')} services`
      });
      toast.success('Request sent successfully');
      setShowRequestModal(false);
      setRequestData({ eventId: '', services: [], message: '' });
      await checkExistingRequest();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
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

  const displayedUser = professional || user;

  return (
    <>
      {/* Profile Header */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex items-start space-x-6">
          <Avatar user={displayedUser} className="w-32 h-32 md:w-32 md:h-32" />
          <div className="flex-1">
            <div className="flex justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">{displayedUser.name}</h1>
                <div className="flex items-center space-x-4 text-gray-300 mb-4">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-500 mr-1" />
                    <span>{displayedUser?.rating?.toFixed(1) || 'No rating'}</span>
                  </div>
                  <div>
                    {displayedUser?.completedEvents || 0} events completed
                  </div>
                </div>
                <p className="text-gray-400 mb-4">{displayedUser.bio || 'No bio available'}</p>
                <div className="flex flex-wrap gap-2">
                  {displayedUser.services?.map((service) => (
                    <span
                      key={service}
                      className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300"
                    >
                      {service.charAt(0).toUpperCase() + service.slice(1)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex space-x-3">
                {isOwnProfile ? (
                  <button
                    onClick={() => navigate('/settings')}
                    className="h-10 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 flex items-center"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </button>
                ) : (
                  <>
                    {user?.role === 'organizer' && (
                      <button
                        onClick={() => navigate(`/messages/new?recipient=${professional._id}`)}
                        className="h-10 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Contact
                      </button>
                    )}
                    {hasRequestedService ? (
                      <button
                        disabled
                        className="h-10 max-md:h-16 px-4 py-2 bg-gray-600 text-white rounded-md flex items-center cursor-not-allowed"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Service Requested
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowRequestModal(true)}
                        className="h-10 max-md:h-16 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                      >
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Request Service
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Events Section - Moved to top */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">
            {isOwnProfile ? 'My Events' : `${displayedUser.name}'s Events`}
          </h2>
          {isOwnProfile && (
            <button
              onClick={() => navigate('/events/new')}
              className="h-10 max-md:h-16 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </button>
          )}
        </div>
        {events?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((event) => (
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
              {isOwnProfile ? 'You haven\'t created any events yet' : 'No events created yet'}
            </p>
          </div>
        )}
      </div>

      {/* Portfolio Section */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Portfolio</h2>
          {isOwnProfile && (
          <button
            onClick={() => setShowPortfolioModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Item
          </button>
          )}
        </div>
        {displayedUser?.portfolio?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayedUser.portfolio.map((item) => (
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
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">Availability</h3>
          {isOwnProfile && (
          <button
            onClick={() => setShowAvailabilityModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Clock className="h-4 w-4 mr-2" />
            Update Availability
          </button>
          )}
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

      {/* Reviews Section */}
      {!isOwnProfile && (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Reviews</h2>
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="text-white font-medium">{professional?.rating?.toFixed(1)}</span>
              <span className="text-gray-400">({professional?.reviews?.length || 0} reviews)</span>
            </div>
          </div>
          
          {professional?.reviews?.length > 0 ? (
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
                        <p className="text-sm text-gray-400">
                          {format(new Date(review.date), 'MMMM d, yyyy')}
                        </p>
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
      )}

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
      {showAvailabilityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg w-full max-w-md mx-4">
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

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={onAddReview}
      />

      {/* Request Modal */}
      {showRequestModal && (
        <ServiceRequestModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          professional={professional}
          userEvents={userEvents}
          onRequestSent={checkExistingRequest}
        />
      )}
    </>
  );
};
