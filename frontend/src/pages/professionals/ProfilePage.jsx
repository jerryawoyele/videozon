import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { 
  User, Star, MessageSquare, 
  Image as ImageIcon, Clock, Edit,
  Plus, X, Upload, Camera
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Calendar from '../../components/Calendar';
import { format } from 'date-fns';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);
  const [portfolioImage, setPortfolioImage] = useState(null);
  const [portfolioData, setPortfolioData] = useState({
    title: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    bio: '',
    services: [],
    avatar: null
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/profile`);
      setProfile(response.data.data.profile);
      setProfileData({
        name: response.data.data.profile.name,
        bio: response.data.data.profile.bio || '',
        services: response.data.data.profile.services || [],
        avatar: response.data.data.profile.avatar?.url || null
      });
    } catch (error) {
      toast.error('Failed to fetch profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProfile = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', profileData.name);
      formData.append('bio', profileData.bio);
      formData.append('services', JSON.stringify(profileData.services));
      if (profileData.avatar instanceof File) {
        formData.append('avatar', profileData.avatar);
      }

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/users/profile`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        toast.success('Profile updated successfully');
        setShowEditProfileModal(false);
        fetchProfile();
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... (keep the portfolio and availability handling functions from ProfessionalProfilePage)

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-start space-x-6">
            <div className="relative group">
              <div className="h-24 w-24 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                {profile?.avatar ? (
                  <img
                    src={profile.avatar.url}
                    alt={profile.name}
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-gray-400" />
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-2">{profile.name}</h1>
                  <div className="flex items-center space-x-4 text-gray-300">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-yellow-500 mr-1" />
                      <span>{profile.rating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center">
                      <MessageSquare className="h-5 w-5 mr-1" />
                      <span>{profile.reviews?.length || 0} reviews</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditProfileModal(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Edit className="h-5 w-5 mr-2" />
                  Edit Profile
                </button>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-white mb-2">Services</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.services.map((service) => (
                    <span
                      key={service}
                      className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
              {profile.bio && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-white mb-2">About</h3>
                  <p className="text-gray-300">{profile.bio}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Portfolio Section */}
        {/* ... (keep the portfolio section from ProfessionalProfilePage) */}

        {/* Availability Section */}
        {/* ... (keep the availability section from ProfessionalProfilePage) */}

        {/* Edit Profile Modal */}
        {showEditProfileModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg w-full max-w-md mx-4">
              <div className="p-4 border-b border-gray-700">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">Edit Profile</h2>
                  <button
                    onClick={() => setShowEditProfileModal(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleEditProfile} className="p-4 space-y-4">
                {/* ... Add form fields for editing profile ... */}
              </form>
            </div>
          </div>
        )}

        {/* Portfolio Modal */}
        {/* ... (keep the portfolio modal from ProfessionalProfilePage) */}

        {/* Availability Modal */}
        {/* ... (keep the availability modal from ProfessionalProfilePage) */}
      </div>
    </Layout>
  );
};

export default ProfilePage; 