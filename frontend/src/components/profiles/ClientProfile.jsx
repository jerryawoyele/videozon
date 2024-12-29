import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Plus, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

const ClientProfile = ({ user }) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Client Events Section */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">My Events</h2>
          <button
            onClick={() => navigate('/events/create')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Event
          </button>
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
            <p className="text-gray-400">No events created yet</p>
          </div>
        )}
      </div>

      {/* Reviews Given Section */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Reviews Given</h2>
        {user?.reviewsGiven?.length > 0 ? (
          <div className="space-y-4">
            {user.reviewsGiven.map((review) => (
              <div key={review._id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <img
                      src={review.professional.avatarUrl}
                      alt={review.professional.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-white font-medium">{review.professional.name}</p>
                      <p className="text-sm text-gray-400">
                        {format(new Date(review.createdAt), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-500 mr-1" />
                    <span className="text-white">{review.rating}</span>
                  </div>
                </div>
                <p className="text-gray-300">{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">No reviews given yet</p>
          </div>
        )}
      </div>

      {/* Favorite Professionals */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Favorite Professionals</h2>
        {user?.favorites?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {user.favorites.map((professional) => (
              <div key={professional._id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <img
                    src={professional.avatarUrl}
                    alt={professional.name}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-lg font-medium text-white">{professional.name}</h3>
                    <div className="flex items-center text-gray-400">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <span>{professional.rating?.toFixed(1) || 'No rating'}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => navigate(`/professionals/${professional._id}`)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    View Profile →
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">No favorite professionals yet</p>
          </div>
        )}
      </div>
    </>
  );
};

export default ClientProfile;
