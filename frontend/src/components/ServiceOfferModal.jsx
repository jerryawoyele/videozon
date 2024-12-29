import React, { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const ServiceOfferModal = ({ isOpen, onClose, event, availableServices }) => {
  const [selectedServices, setSelectedServices] = useState([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedServices.length === 0) {
      toast.error('Please select at least one service');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/messages/service-request`, {
        receiverId: event.organizer._id,
        eventId: event._id,
        service: selectedServices[0],
        message: message
      });

      toast.success('Service offer sent successfully');
      window.location.reload();
      onClose();
    } catch (error) {
      console.error('Service offer error:', error);
      toast.error('Failed to send service offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Offer Services</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Available Services
            </label>
            <div className="space-y-2">
              {availableServices.map((service) => (
                <label
                  key={service}
                  className={`
                    flex items-center p-3 rounded-md border-2 transition-colors cursor-pointer
                    ${selectedServices.includes(service)
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-600 hover:border-gray-500 bg-gray-700'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    value={service}
                    checked={selectedServices.includes(service)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedServices([...selectedServices, service]);
                      } else {
                        setSelectedServices(selectedServices.filter(s => s !== service));
                      }
                    }}
                    className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700 mr-3"
                  />
                  <span className="text-gray-300 capitalize">{service.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Message to Organizer
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your experience and why you'd be a great fit for this event..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
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