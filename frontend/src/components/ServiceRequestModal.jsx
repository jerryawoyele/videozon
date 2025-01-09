import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { X } from 'lucide-react';
import { isValid } from 'date-fns';

const ServiceRequestModal = ({ isOpen, onClose, professional, userEvents, onRequestSent }) => {
  const [requestData, setRequestData] = useState({
    eventId: '',
    services: [],
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRequests, setExistingRequests] = useState([]);
  const [availableEvents, setAvailableEvents] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setRequestData({
        eventId: '',
        services: [],
        message: ''
      });
      fetchExistingRequests();
    }
  }, [isOpen]);

  useEffect(() => {
    // Filter out events that already have requests
    const filteredEvents = userEvents?.filter(event => 
      !existingRequests.some(request => 
        request.relatedEvent?._id === event._id
      )
    ) || [];
    setAvailableEvents(filteredEvents);
  }, [userEvents, existingRequests]);

  const fetchExistingRequests = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/messages/service-requests/${professional._id}`);
      if (response.data.success) {
        setExistingRequests(response.data.data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching existing requests:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!requestData.eventId || !requestData.services?.length) return;

    setIsSubmitting(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/messages/service-request`, {
        receiverId: professional._id,
        eventId: requestData.eventId,
        services: requestData.services,
        message: requestData.message
      });

      if (response.data.success) {
        toast.success('Service request sent successfully');
        onRequestSent?.();
        onClose();
      }
    } catch (error) {
      console.error('Service request error:', error);
      toast.error(error.response?.data?.message || 'Failed to send service request');
    } finally {
      setIsSubmitting(false);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Request Service</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
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
              {availableEvents.map((event) => (
                <option key={event._id} value={event._id}>
                  {event.title} - {formatEventDate(event.datetime)}
                </option>
              ))}
              {userEvents?.filter(event => 
                existingRequests.some(request => request.relatedEvent?._id === event._id)
              ).map((event) => (
                <option key={event._id} value={event._id} disabled className="text-gray-500">
                  {event.title} - {formatEventDate(event.datetime)} (Request Sent)
                </option>
              ))}
            </select>
            {userEvents?.length === 0 && (
              <p className="text-yellow-400 text-sm mt-1">
                You don't have any active events. Please create an event first.
              </p>
            )}
            {userEvents?.length > 0 && availableEvents.length === 0 && (
              <p className="text-yellow-400 text-sm mt-1">
                You have already sent service requests for all your events.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Services Required
            </label>
            <div className="space-y-2">
              {professional?.services?.map((service) => (
                <label key={service} className="flex items-center space-x-3 p-2 bg-gray-700 rounded-md hover:bg-gray-600">
                  <input
                    type="checkbox"
                    checked={requestData.services?.includes(service)}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setRequestData(prev => ({
                        ...prev,
                        services: isChecked
                          ? [...(prev.services || []), service]
                          : (prev.services || []).filter(s => s !== service)
                      }));
                    }}
                    className="h-4 w-4 text-blue-600 rounded border-gray-500 bg-gray-700 focus:ring-blue-500 focus:ring-offset-gray-800"
                  />
                  <span className="text-white">
                    {service.charAt(0).toUpperCase() + service.slice(1)}
                  </span>
                </label>
              ))}
            </div>
            {requestData.services?.length === 0 && (
              <p className="text-red-400 text-sm mt-1">Please select at least one service</p>
            )}
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
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!requestData.eventId || !requestData.services?.length || isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceRequestModal; 