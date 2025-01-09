import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from '../../utils/axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import Layout from '../../components/Layout';
import Avatar from '../../components/Avatar';
import {
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  User,
  Star,
  ArrowLeft,
} from 'lucide-react';

const PROFESSIONAL_SERVICES = [
  { value: 'photographer', label: 'Photographer' },
  { value: 'videographer', label: 'Videographer' },
  { value: 'caterer', label: 'Caterer' },
  { value: 'musician', label: 'Musician' },
  { value: 'decorator', label: 'Decorator' },
  { value: 'planner', label: 'Planner' },
  { value: 'security', label: 'Security' },
  { value: 'mc', label: 'MC' }
];

const HireProfessionalPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [professional, setProfessional] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userEvents, setUserEvents] = useState([]);
  const [formData, setFormData] = useState({
    eventId: '',
    gigTitle: '',
    description: '',
    selectedServices: [],
    eventDate: '',
    eventTime: '',
    location: '',
    specialRequirements: '',
    price: '',
    paymentMethod: '',
    agreeToTerms: false,
    agreeToEscrow: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profResponse, eventsResponse] = await Promise.all([
          axios.get(`/users/professionals/${id}`),
          axios.get('/events')
        ]);

        if (profResponse.data.success) {
          const prof = profResponse.data.data.professional;
          setProfessional(prof);
        }

        if (eventsResponse.data.success) {
          setUserEvents(eventsResponse.data.data.events);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load required data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleEventChange = async (e) => {
    const selectedEventId = e.target.value;
    const selectedEvent = userEvents.find(event => event._id === selectedEventId);
    
    if (selectedEvent) {
      // Check if there's already a hire request for this event
      try {
        const response = await axios.get(`/messages/check-request/${id}/${selectedEventId}`);
        if (response.data.success && response.data.data.hasRequest) {
          toast.error('You already have a hire request for this event');
          e.target.value = formData.eventId; // Reset to previous value
          return;
        }
      } catch (error) {
        console.error('Error checking existing request:', error);
      }

      const eventDate = new Date(selectedEvent.datetime);
      setFormData(prev => ({
        ...prev,
        eventId: selectedEventId,
        eventDate: format(eventDate, 'yyyy-MM-dd'),
        eventTime: format(eventDate, 'HH:mm'),
        location: selectedEvent.location || '',
        specialRequirements: selectedEvent.specialRequirements || '',
        price: selectedEvent.budget || '',
        gigTitle: `${professional.services[0].charAt(0).toUpperCase() + professional.services[0].slice(1)} Service for ${selectedEvent.title}`,
        description: `Hire request: Professional ${professional.services[0].charAt(0).toUpperCase() + professional.services[0].slice(1)} service for ${selectedEvent.title}`
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.agreeToTerms || !formData.agreeToEscrow) {
      toast.error('Please agree to the terms and escrow conditions');
      return;
    }

    if (formData.selectedServices.length === 0) {
      toast.error('Please select at least one service');
      return;
    }

    try {
      // Create a hire request message
      const response = await axios.post('/messages', {
        receiverId: id,
        content: formData.description,
        type: 'hire_request',
        services: formData.selectedServices, // Send as services array
        eventId: formData.eventId,
        status: 'unread',  
        gigTitle: formData.gigTitle,
        paymentMethod: formData.paymentMethod,
        price: formData.price
      });

      if (response.data.success) {
        toast.success('Hire request sent successfully');
        navigate(`/messages/${id}`);
      }
    } catch (error) {
      console.error('Error submitting hire request:', error);
      toast.error(error.response?.data?.message || 'Failed to submit hire request');
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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>

        <h1 className="text-2xl font-bold text-white mb-8">Hire Professional</h1>

        {/* Professional Information Card */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Professional's Information</h2>
          <div className="flex items-start gap-4">
            <Avatar user={professional} className="w-20 h-20" />
            <div>
              <h3 className="text-lg font-medium text-white">{professional?.name}</h3>
              <div className="flex items-center gap-1 text-yellow-400 mt-1">
                <Star className="w-4 h-4 fill-current" />
                <span>{professional?.rating || '0'}</span>
              </div>
              <p className="text-gray-400 mt-2">{professional?.bio}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {professional?.services?.map((service, index) => {
                  const serviceInfo = PROFESSIONAL_SERVICES.find(s => s.value === service);
                  return (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-700 text-sm text-gray-300 rounded"
                  >
                      {serviceInfo?.label || service}
                  </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Event Selection Card */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Event Selection</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Select Event
                </label>
                <select
                  name="eventId"
                  value={formData.eventId}
                  onChange={handleEventChange}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select an event</option>
                  {userEvents.map(event => (
                    <option key={event._id} value={event._id}>
                      {event.title} ({format(new Date(event.datetime), 'MMM dd, yyyy')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    name="eventDate"
                    value={formData.eventDate}
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-not-allowed opacity-75"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Event Time
                  </label>
                  <input
                    type="time"
                    name="eventTime"
                    value={formData.eventTime}
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-not-allowed opacity-75"
                    disabled
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-not-allowed opacity-75"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Special Requirements/Notes
                </label>
                <textarea
                  name="specialRequirements"
                  value={formData.specialRequirements}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-not-allowed opacity-75"
                  rows={3}
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Gig Information Card */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Gig Information <i>(editable)</i> </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Gig Title
                </label>
                <input
                  type="text"
                  name="gigTitle"
                  value={formData.gigTitle}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Services Required
                </label>
                <div className="space-y-2">
                  {professional?.services?.map((service, index) => {
                    const serviceInfo = PROFESSIONAL_SERVICES.find(s => s.value === service);
                    return (
                      <div key={index} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                          id={`service-${service}`}
                          name="selectedServices"
                          value={service}
                          checked={formData.selectedServices.includes(service)}
                          onChange={(e) => {
                            const { checked, value } = e.target;
                            setFormData(prev => ({
                              ...prev,
                              selectedServices: checked
                                ? [...prev.selectedServices, value]
                                : prev.selectedServices.filter(s => s !== value)
                            }));
                          }}
                      className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                        <label htmlFor={`service-${service}`} className="text-gray-300">
                          {serviceInfo?.label || service}
                  </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information Card */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Payment Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Gig Price (₦)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-not-allowed opacity-75"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Payment Method
                </label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select payment method</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="mobile">Mobile Money</option>
                </select>
              </div>

              <div className="flex items-start gap-2 mt-4">
                <input
                  type="checkbox"
                  name="agreeToEscrow"
                  checked={formData.agreeToEscrow}
                  onChange={handleInputChange}
                  className="mt-1 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                  required
                  id="agreeToEscrow"
                />
                <label for="agreeToEscrow" className="text-sm text-gray-300">
                  I understand that my payment will be held in escrow and released to the professional
                  once the event is completed and confirmed.
                </label>
              </div>
            </div>
          </div>

          {/* Terms & Conditions Card */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Terms & Conditions</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  className="mt-1 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                  required
                  id="agreeToTerms"
                />
                <label for="agreeToTerms" className="text-sm text-gray-300">
                  I agree to the Terms and Conditions for this hire, including the escrow service
                  and payment conditions. View full terms{' '}
                  <a href="/terms" className="text-blue-400 hover:underline" target="_blank">
                    here
                  </a>
                  .
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Submit Hire Request
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default HireProfessionalPage; 