import React, { useState } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const ServiceOfferModal = ({ isOpen, onClose, event, availableServices }) => {
  const [selectedServices, setSelectedServices] = useState([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleServiceChange = (service) => {
    setSelectedServices(prev => {
      if (prev.includes(service)) {
        return prev.filter(s => s !== service);
      } else {
        return [...prev, service];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedServices.length === 0) {
      toast.error('Please select at least one service');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/messages/service-offer`, {
        receiverId: event.organizer._id,
        eventId: event._id,
        services: selectedServices,
        content: message || `I would like to offer my services for your event: ${event.title}`,
        type: 'service_offer'
      });
      
      toast.success('Service offer sent successfully');
      onClose();
      setSelectedServices([]);
      setMessage('');
    } catch (error) {
      console.error('Service offer error:', error);
      toast.error(error.response?.data?.message || 'Failed to send service offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-md mx-4">
        <div className="p-4 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Offer Services</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Event Info */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Event
            </label>
            <div className="bg-gray-700 p-3 rounded-md">
              <p className="text-white">{event.title}</p>
              <p className="text-sm text-gray-400 mt-1">Organized by {event.organizer.name}</p>
            </div>
          </div>

          {/* Services Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Services to Offer
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableServices.map((service) => (
                <label key={service} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(service)}
                    onChange={() => handleServiceChange(service)}
                    className="form-checkbox h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                  />
                  <span className="text-gray-300 capitalize">{service}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message to your service offer..."
              rows={4}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit Button */}
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
              disabled={isSubmitting || selectedServices.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : 'Send Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceOfferModal; 