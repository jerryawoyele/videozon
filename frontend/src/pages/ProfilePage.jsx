import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import toast from 'react-hot-toast';
import ProfileHeader from '../components/profiles/ProfileHeader';
import ProfessionalProfile from '../components/profiles/ProfessionalProfile';
import ClientProfile from '../components/profiles/ClientProfile';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availability, setAvailability] = useState([]);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    bio: user?.bio || '',
    avatar: null,
    services: user?.services || []
  });

  useEffect(() => {
    if (user?.role === 'professional') {
      fetchAvailability();
      fetchUserEvents();
    }
  }, [user]);

  const fetchUserEvents = async () => {
    try {
      const response = await axios.get('/events/my-events');
      if (response.data.success) {
        updateUser({ ...user, events: response.data.data.events });
      }
    } catch (error) {
      console.error('Fetch events error:', error);
      toast.error('Failed to fetch events');
    }
  };

  const fetchAvailability = async () => {
    try {
      const response = await axios.get('/users/availability');
      if (response.data.success) {
        const availabilityData = response.data.data.availability;
        setAvailability(availabilityData.map(slot => ({
          ...slot,
          date: new Date(slot.date)
        })));
      }
    } catch (error) {
      console.error('Fetch availability error:', error);
      toast.error('Failed to fetch availability');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'avatar' && formData[key]) {
          formDataToSend.append('avatar', formData[key]);
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await axios.patch('/users/profile', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      updateUser(response.data.data.user);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPortfolioItem = async (portfolioData) => {
    try {
      const base64Image = await convertFileToBase64(portfolioData.image);
      const response = await axios.post('/users/portfolio', {
        title: portfolioData.title,
        description: portfolioData.description,
        image: base64Image
      });

      if (response.data.success) {
        toast.success('Portfolio item added successfully');
        updateUser(response.data.data.user);
      }
    } catch (error) {
      toast.error('Failed to add portfolio item');
      throw error;
    }
  };

  const handleUpdateAvailability = async (availabilityData) => {
    try {
      await axios.post('/users/availability', {
        availability: availabilityData
      });
      toast.success('Availability updated successfully');
      fetchAvailability();
    } catch (error) {
      toast.error('Failed to update availability');
      throw error;
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <ProfileHeader
            user={user}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />

          {user?.role === 'professional' ? (
            <ProfessionalProfile
              user={user}
              availability={availability}
              onUpdateAvailability={handleUpdateAvailability}
              onAddPortfolioItem={handleAddPortfolioItem}
            />
          ) : (
            <ClientProfile user={user} />
          )}
        </div>
      </div>
    </Layout>
  );
};

// Helper function to convert file to base64
const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

export default ProfilePage;
