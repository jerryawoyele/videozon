import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { User, Star, Search } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import DefaultAvatar from '../../components/DefaultAvatar';

const Avatar = ({ user, className = "w-10 h-10" }) => {
  const [imgError, setImgError] = useState(false);

  if (!user) {
    return (
      <div className={`${className} rounded-full bg-gray-700 flex items-center justify-center`}>
        <User className="w-6 h-6 text-gray-400" />
      </div>
    );
  }

  if (imgError || !user.avatar) {
    return <DefaultAvatar name={user.name} className={className} />;
  }

  return (
    <img 
      src={user.avatar}
      alt={user.name}
      className={`${className} rounded-full object-cover`}
      onError={() => setImgError(true)}
    />
  );
};

const ProfessionalsPage = () => {
  const [professionals, setProfessionals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const { user } = useAuth(); // Get current user

  const services = [
    'photographer',
    'videographer',
    'caterer',
    'musician',
    'decorator',
    'planner',
    'security',
    'mc'
  ];

  useEffect(() => {
    fetchProfessionals();
  }, [searchTerm, selectedService]);
  
  useEffect(() => {
    console.log(professionals);
  }, []);
  
  const fetchProfessionals = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedService) params.append('service', selectedService);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/users/professionals?${params.toString()}`
      );

      // Filter out the current user from the professionals list
      const filteredProfessionals = response.data.data.professionals.filter(
        prof => prof._id !== user._id
      );

      setProfessionals(filteredProfessionals);
    } catch (error) {
      toast.error('Failed to fetch professionals');
    } finally {
      setIsLoading(false);
    }
  };

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
        {/* Search and Filter Section */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search professionals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="w-full md:w-64">
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Services</option>
                {services.map((service) => (
                  <option key={service} value={service}>
                    {service.charAt(0).toUpperCase() + service.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Professionals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {professionals.map((professional) => (
            <div
              key={professional._id}
              className="bg-gray-800 rounded-lg overflow-hidden shadow-lg relative flex flex-col"
            >
              <div className="flex-1">
                <div className="p-6 pb-3">
                  <div className="flex items-center space-x-4">
                    <Avatar user={professional} className="w-16 h-16 md:w-20 md:h-20" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {professional.name}
                      </h3>
                      <div className="flex items-center space-x-3 mt-1">
                        <div className="flex items-center bg-gray-700 px-2 py-1 rounded-full">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="text-gray-300 font-medium">
                            {professional.rating.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-gray-400 text-sm">
                          {professional.reviews?.length || 0} reviews
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 pb-3">
                  <div className="flex flex-wrap gap-2">
                    {professional.services.map((service) => (
                      <span
                        key={service}
                        className="px-3 py-1 bg-gray-700/50 text-gray-300 rounded-full text-xs font-medium"
                      >
                        {service.charAt(0).toUpperCase() + service.slice(1)}
                      </span>
                    ))}
                  </div>
                </div>

                {professional.bio && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-400 text-sm line-clamp-2">
                      {professional.bio}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-gradient-to-t from-gray-800 via-gray-800/95 to-transparent mt-auto">
                <Link
                  to={`/professionals/${professional._id}`}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 font-medium"
                >
                  View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>

        {professionals.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400">No professionals found</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProfessionalsPage; 