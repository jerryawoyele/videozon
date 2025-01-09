import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Star, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import Avatar from '../../components/Avatar';

const ProfileHeader = ({ 
  user, 
  isEditing, 
  setIsEditing, 
  formData, 
  setFormData,
  onSubmit,
  isLoading 
}) => {
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      setFormData(prev => ({ ...prev, avatar: file }));
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <div className="flex items-start space-x-6">
        <div className="relative">
          {isEditing && formData.avatar ? (
            <img
              src={URL.createObjectURL(formData.avatar)}
              alt={user?.name}
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <Avatar user={user} className="w-24 h-24" />
          )}
          {isEditing && (
            <label className="absolute bottom-0 right-0 p-2 bg-gray-700 rounded-full cursor-pointer hover:bg-gray-600">
              <Camera className="h-4 w-4 text-gray-400" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        <div className="flex-1">
          <div className="flex justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{user?.name}</h1>
              {user?.role === 'professional' && (
                <div className="flex items-center space-x-4 text-gray-300">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-500 mr-1" />
                    <span>{user?.rating?.toFixed(1) || 'No rating'}</span>
                  </div>
                  <div>{user?.completedEvents || 0} events completed</div>
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={() => navigate('/settings')}
                    className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 flex items-center"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={onSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {user?.role === 'professional' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Professional Skills
                    </label>
                    <select
                      multiple
                      value={formData.services}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        setFormData(prev => ({ ...prev, services: selected }));
                      }}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="photographer">Photographer</option>
                      <option value="videographer">Videographer</option>
                      <option value="caterer">Caterer</option>
                      <option value="musician">Musician</option>
                      <option value="decorator">Decorator</option>
                      <option value="planner">Planner</option>
                      <option value="security">Security</option>
                      <option value="mc">MC</option>
                    </select>
                    <p className="text-sm text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple skills</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <>
              <p className="text-gray-400 mt-4">{user?.bio || 'No bio available'}</p>
              {user?.role === 'professional' && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {user?.services?.map((service) => (
                    <span
                      key={service}
                      className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300"
                    >
                      {service.charAt(0).toUpperCase() + service.slice(1)}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
