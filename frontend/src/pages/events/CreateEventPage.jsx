import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { 
  Calendar, MapPin, Clock, Users, 
  Image as ImageIcon, X, Upload,
  ArrowLeft
} from 'lucide-react';
import axios from '../../utils/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIES } from '../../constants/eventConstants';

const PROFESSIONAL_SERVICES = [
  { id: 'photographer', label: 'Photographer' },
  { id: 'videographer', label: 'Videographer' },
  { id: 'caterer', label: 'Caterer' },
  { id: 'musician', label: 'Musician/Band' },
  { id: 'decorator', label: 'Decorator' },
  { id: 'planner', label: 'Event Planner' },
  { id: 'security', label: 'Security' },
  { id: 'mc', label: 'Master of Ceremonies' }
];

const CreateEventPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [formData, setFormData] = useState({
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

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImageFiles = [...imageFiles];
    const newSelectedImages = [...selectedImages];

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        newImageFiles.push(file);
        newSelectedImages.push(URL.createObjectURL(file));
      }
    });

    setImageFiles(newImageFiles);
    setSelectedImages(newSelectedImages);
  };

  const removeImage = (index) => {
    const newSelectedImages = selectedImages.filter((_, i) => i !== index);
    const newImageFiles = imageFiles.filter((_, i) => i !== index);
    setSelectedImages(newSelectedImages);
    setImageFiles(newImageFiles);
  };

  const handleServiceToggle = (serviceId) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create event data
      const eventData = {
        ...formData,
        organizer: user.id,
        attendees: parseInt(formData.attendees),
        budget: parseFloat(formData.budget),
        services: selectedServices,
        datetime: new Date(formData.datetime).toISOString()
      };

      // Create form data
      const eventFormData = new FormData();
      eventFormData.append('eventData', JSON.stringify(eventData));
      
      // Append images if any
      imageFiles.forEach(file => {
        eventFormData.append('images', file);
      });

      const response = await axios.post(`/events`, eventFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Event created successfully');
      navigate(`/events/${response.data.data.event._id}`);
    } catch (error) {
      console.error('Create event error:', error);
      toast.error(error.response?.data?.message || 'Failed to create event');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Events
          </button>

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">Create Event</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Event Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter event title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe your event"
                  />
                </div>
              </div>
            </div>

            {/* Event Details */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Event Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date and Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.datetime}
                    onChange={(e) => setFormData({ ...formData, datetime: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Event location"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Expected Attendees
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.attendees}
                    onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Number of attendees"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Budget
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Event budget"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Requirements
                  </label>
                  <textarea
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    rows={4}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Specific requirements for service providers"
                  />
                </div>
              </div>
            </div>

            {/* Professional Services Section */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Required Professional Services</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {PROFESSIONAL_SERVICES.map((service) => (
                  <div
                    key={service.id}
                    className={`
                      relative flex items-center p-4 rounded-lg cursor-pointer
                      border-2 transition-colors duration-200
                      ${selectedServices.includes(service.id)
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-600 hover:border-gray-500 bg-gray-700'
                      }
                    `}
                    onClick={() => handleServiceToggle(service.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(service.id)}
                      onChange={() => {}}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="ml-3 block text-sm font-medium text-gray-300">
                      {service.label}
                    </label>
                  </div>
                ))}
              </div>
              {selectedServices.length === 0 && (
                <p className="mt-2 text-sm text-gray-400">
                  Please select at least one professional service required for your event.
                </p>
              )}
            </div>

            {/* Image Upload */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Event Images</h2>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  {selectedImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Preview ${index + 1}`}
                        className="h-24 w-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center w-full">
                  <label className="w-full flex flex-col items-center px-4 py-6 bg-gray-700 text-gray-300 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                    <Upload className="h-8 w-8 mb-2" />
                    <span className="text-sm">Click to upload images</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/events')}
                className="px-6 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default CreateEventPage;
