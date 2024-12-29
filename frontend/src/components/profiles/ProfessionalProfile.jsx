import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Plus, Clock, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import PortfolioModal from './PortfolioModal';
import AvailabilityModal from './AvailabilityModal';

const ProfessionalProfile = ({ 
  user, 
  availability, 
  onUpdateAvailability,
  onAddPortfolioItem 
}) => {
  const navigate = useNavigate();
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);

  return (
    <>
      {/* Events Section */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">My Events</h2>
        </div>
        {user?.events?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {user.events.map((event) => (
              <div key={event._id} className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-medium text-white mb-2">{event.title}</h3>
                <div className="text-gray-400 mb-2">
                  <CalendarIcon className="inline-block h-4 w-4 mr-1" />
                  {format(new Date(event.date), 'MMMM d, yyyy')}
                </div>
                <p className="text-gray-300 mb-4">{event.description}</p>
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
                    className="text-blue-400 hover:text-blue-300"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">No events yet</p>
          </div>
        )}
      </div>

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

        {user?.portfolio?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {user.portfolio.map((item) => (
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
          <button
            onClick={() => setShowAvailabilityModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Clock className="h-4 w-4 mr-2" />
            Update Availability
          </button>
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

      {/* Modals */}
      {showPortfolioModal && (
        <PortfolioModal
          onClose={() => setShowPortfolioModal(false)}
          onSubmit={onAddPortfolioItem}
        />
      )}

      {showAvailabilityModal && (
        <AvailabilityModal
          onClose={() => setShowAvailabilityModal(false)}
          onSubmit={onUpdateAvailability}
        />
      )}
    </>
  );
};

export default ProfessionalProfile;
