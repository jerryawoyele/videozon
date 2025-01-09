import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import Avatar from '../../components/Avatar';
import { 
  Calendar, MapPin, Clock, Users, 
  DollarSign, MessageSquare, User,
  CheckCircle, ArrowLeft, Plus, Edit, X
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import ServiceOfferModal from '../../components/ServiceOfferModal';
import { CATEGORIES } from '../../constants/eventConstants';
import { isValid } from 'date-fns';

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requestSent, setRequestSent] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const isOrganizer = event?.organizer._id === user._id;
  const [selectedServices, setSelectedServices] = useState([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    category: '',
    datetime: '',
    location: '',
    attendees: '',
    budget: '',
    requirements: '',
    services: []
  });
  const [hasOffered, setHasOffered] = useState(false);
  const [hasContactedOrganizer, setHasContactedOrganizer] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  useEffect(() => {
    if (event) {
      setEditFormData({
        title: event.title,
        description: event.description,
        category: event.category,
        datetime: new Date(event.datetime).toISOString().slice(0, 16), // Format for datetime-local input
        location: event.location,
        attendees: event.attendees,
        budget: event.budget,
        requirements: event.requirements || '',
        services: event.services
      });
    }
  }, [event]);

  useEffect(() => {
    if (user?.role === 'professional' && event) {
      checkExistingOffer();
    }
  }, [user, event]);

  useEffect(() => {
    if (event?.organizer?._id && user?._id) {
      checkOrganizerContact();
    }
  }, [event, user]);

  const fetchEventDetails = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/events/${id}`);
      setEvent(response.data.data.event);
      
      // Check if user has already offered services
      if (user.role === 'professional') {
        const hasExistingOffer = response.data.data.event.professionals.some(
          prof => prof.professional._id === user._id
        );
        setHasOffered(hasExistingOffer);
      }
    } catch (error) {
      toast.error('Failed to fetch event details');
      navigate('/events');
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceRequest = () => {
    setIsServiceModalOpen(true);
  };

  const handleServiceChange = (service) => {
    setSelectedServices(prev => {
      if (prev.includes(service)) {
        return prev.filter(s => s !== service);
      } else {
        return [...prev, service];
      }
    });
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    if (selectedServices.length === 0) return;

    setIsSubmitting(true);
    try {
      // Send service offer through the messaging system
      await axios.post(`${import.meta.env.VITE_API_URL}/messages/service-offer`, {
        receiverId: event.organizer._id,
        eventId: event._id,
        services: selectedServices,
        content: message || `I would like to offer my services for your event: ${event.title}`,
        type: 'service_offer'
      });
      
      toast.success('Service offer sent successfully');
      setShowOfferModal(false);
      setSelectedServices([]);
      setMessage('');
      setHasOffered(true);
      fetchEventDetails(); // Refresh event details
    } catch (error) {
      console.error('Offer services error:', error);
      toast.error(error.response?.data?.message || 'Failed to send service offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditEvent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/events/${id}`,
        editFormData
      );

      if (response.data.success) {
        toast.success('Event updated successfully');
        setShowEditModal(false);
        fetchEventDetails(); // Refresh event details
      }
    } catch (error) {
      console.error('Edit event error:', error);
      toast.error(error.response?.data?.message || 'Failed to update event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleServiceOffer = () => {
    setIsServiceModalOpen(true);
  };

  const checkExistingOffer = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/messages/sent-requests`);
      const hasExistingOffer = response.data.data.requests.some(
        request => request.relatedEvent?._id === event._id
      );
      setHasOffered(hasExistingOffer);
    } catch (error) {
      console.error('Error checking existing offers:', error);
    }
  };

  const checkOrganizerContact = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/messages/sent-requests`);
      const sentRequests = response.data.data.requests || [];
      
      // Check if there's a request for this specific event
      const hasContacted = sentRequests.some(request => 
        request.relatedEvent?._id === event._id
      );
      
      setHasContactedOrganizer(hasContacted);
      setRequestSent(hasContacted);
    } catch (error) {
      console.error('Error checking organizer contact:', error);
    }
  };

  const handleContactOrganizer = async () => {
    if (hasContactedOrganizer || requestSent) {
      toast.error('You have already contacted this organizer for this event');
      return;
    }

    try {
      // Double check before sending
      const checkResponse = await axios.get(`${import.meta.env.VITE_API_URL}/messages/sent-requests`);
      const existingRequests = checkResponse.data.data.requests || [];
      
      const alreadyContacted = existingRequests.some(request => 
        request.relatedEvent?._id === event._id
      );

      if (alreadyContacted) {
        setHasContactedOrganizer(true);
        setRequestSent(true);
        toast.error('You have already contacted this organizer for this event');
        return;
      }

      // If no existing request, proceed with sending
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/messages/service-request`, {
        receiverId: event.organizer._id,
        eventId: event._id,
        content: `I would like to discuss about your event: ${event.title}`,
        type: 'service_request'
      });

      if (response.data.success) {
        setHasContactedOrganizer(true);
        setRequestSent(true);
        toast.success('Contact request sent to organizer');
        
        // Refresh the contact status
        await checkOrganizerContact();
      }
    } catch (error) {
      console.error('Contact request error:', error);
      toast.error(error.response?.data?.message || 'Failed to send contact request');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'concluded':
        return 'bg-green-500/20 text-green-500';
      case 'ongoing':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'cancelled':
        return 'bg-red-500/20 text-red-500';
      default:
        return 'bg-blue-500/20 text-blue-500';
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

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (!event) return null;

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>

          {/* Event Images */}
          {event.images && event.images.length > 0 && (
            <div className="mb-6 rounded-lg overflow-hidden">
              <img
                src={event.images[0].url}
                alt={event.title}
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          {/* Event Header */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">{event.title}</h1>
                <p className="text-gray-400 capitalize">{event.category}</p>
                <p className="text-gray-400 mt-2">{getDaysToEvent(event.datetime)}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(event.status)}`}>
                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Event Details</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-300">
                    {formatEventDate(event.datetime)}
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-300">
                    {new Date(event.datetime).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-300">{event.location}</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-300">{event.attendees} attendees</span>
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-300">Budget: ₦{event.budget?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Organizer</h2>
              <div className="flex flex-col p-4 sm:p-6 bg-gray-700/50 rounded-lg space-y-4">
                {/* Organizer Info */}
                <div className="flex items-center space-x-4">
                  <Avatar 
                    user={event.organizer} 
                    className="w-12 h-12"
                  />
                  <div className="ml-4">
                    <h3 className="text-white font-medium text-lg">{event.organizer.name}</h3>
                    <p className="text-gray-400 text-sm mt-1">{event.organizer.email}</p>
                  </div>
                </div>
                
                {/* Contact Button */}
                {user._id !== event.organizer._id && (
                  <div className="w-full">
                    {hasContactedOrganizer || event.status === 'concluded' ? (
                      <div className="flex items-center justify-center text-gray-400 bg-gray-600/50 px-4 sm:px-6 py-3 rounded-lg w-full sm:w-auto">
                        <CheckCircle className="h-5 w-5 mr-3" />
                        <span className="text-gray-300">
                          {event.status === 'concluded' ? 'Event Concluded' : 'Already Contacted'}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={handleContactOrganizer}
                        disabled={hasContactedOrganizer || requestSent || event.status === 'concluded'}
                        className={`flex items-center justify-center px-4 sm:px-6 py-3 w-full sm:w-auto ${
                          hasContactedOrganizer || requestSent || event.status === 'concluded'
                            ? 'bg-gray-600 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700'
                        } text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl`}
                      >
                        <MessageSquare className="h-5 w-5 mr-3" />
                        Contact Organizer
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description and Requirements */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Description</h2>
            <p className="text-gray-300 whitespace-pre-line mb-6">{event.description}</p>
            
            {event.requirements && (
              <>
                <h2 className="text-lg font-semibold text-white mb-4">Requirements</h2>
                <p className="text-gray-300 whitespace-pre-line">{event.requirements}</p>
              </>
            )}
          </div>

          {/* Services Needed */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Services Needed</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {event.services.map((service) => (
                <div
                  key={service}
                  className="bg-gray-700 rounded-lg p-3 text-center"
                >
                  <span className="text-gray-300">
                    {service.charAt(0).toUpperCase() + service.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mb-6">
            {!isOrganizer && user.role === 'professional' && (
              <>
                {hasOffered || event.status === 'concluded' ? (
                  <button
                    disabled
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md cursor-not-allowed"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    {event.status === 'concluded' ? 'Event Concluded' : 'Service Offered'}
                  </button>
                ) : (
                  <button
                    onClick={handleServiceOffer}
                    disabled={event.status === 'concluded'}
                    className={`flex items-center px-4 py-2 ${
                      event.status === 'concluded' 
                        ? 'bg-gray-600 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white rounded-md`}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Offer Services
                  </button>
                )}
              </>
            )}
            {isOrganizer && (
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <Edit className="h-5 w-5 mr-2" />
                Edit Event
              </button>
            )}
          </div>

          {/* Service Offer Modal */}
          {event && (
            <ServiceOfferModal
              isOpen={isServiceModalOpen}
              onClose={() => setIsServiceModalOpen(false)}
              event={event}
              availableServices={event.services}
            />
          )}

          {/* Edit Event Modal */}
          {showEditModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-4 border-b border-gray-700">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Edit Event</h2>
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleEditEvent} className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editFormData.title}
                        onChange={(e) => setEditFormData(prev => ({
                          ...prev,
                          title: e.target.value
                        }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Category
                      </label>
                      <select
                        value={editFormData.category}
                        onChange={(e) => setEditFormData(prev => ({
                          ...prev,
                          category: e.target.value
                        }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select a category</option>
                        {CATEGORIES.map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Date and Time
                      </label>
                      <input
                        type="datetime-local"
                        value={editFormData.datetime}
                        onChange={(e) => setEditFormData(prev => ({
                          ...prev,
                          datetime: e.target.value
                        }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={editFormData.location}
                        onChange={(e) => setEditFormData(prev => ({
                          ...prev,
                          location: e.target.value
                        }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Number of Attendees
                      </label>
                      <input
                        type="number"
                        value={editFormData.attendees}
                        onChange={(e) => setEditFormData(prev => ({
                          ...prev,
                          attendees: e.target.value
                        }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Budget
                      </label>
                      <input
                        type="number"
                        value={editFormData.budget}
                        onChange={(e) => setEditFormData(prev => ({
                          ...prev,
                          budget: e.target.value
                        }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={editFormData.description}
                      onChange={(e) => setEditFormData(prev => ({
                        ...prev,
                        description: e.target.value
                      }))}
                      rows={4}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Requirements
                    </label>
                    <textarea
                      value={editFormData.requirements}
                      onChange={(e) => setEditFormData(prev => ({
                        ...prev,
                        requirements: e.target.value
                      }))}
                      rows={4}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Services Needed
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {['photographer', 'videographer', 'caterer', 'musician', 'decorator', 'planner', 'security', 'mc'].map((service) => (
                        <label key={service} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={editFormData.services.includes(service)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditFormData(prev => ({
                                  ...prev,
                                  services: [...prev.services, service]
                                }));
                              } else {
                                setEditFormData(prev => ({
                                  ...prev,
                                  services: prev.services.filter(s => s !== service)
                                }));
                              }
                            }}
                            className="form-checkbox h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                          />
                          <span className="text-gray-300 capitalize">{service}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Updating...' : 'Update Event'}
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

export default EventDetailsPage;
