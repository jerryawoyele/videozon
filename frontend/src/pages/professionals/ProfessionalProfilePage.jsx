import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { ArrowLeft } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { ProfessionalProfile } from '../../components/profiles/ProfessionalProfile';

const ProfessionalProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [professional, setProfessional] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userEvents, setUserEvents] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [professionalEvents, setProfessionalEvents] = useState([]);

  useEffect(() => {
    fetchProfessionalProfile();
    fetchAvailability();
    fetchProfessionalEvents();
    if (user) {
      fetchUserEvents();
    }
  }, [id]);

  const fetchProfessionalProfile = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/professionals/${id}`);
      setProfessional(response.data.data.professional);
    } catch (error) {
      toast.error('Failed to fetch professional profile');
      navigate('/professionals');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailability = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/availability`);
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

  const fetchUserEvents = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/events`);
      if (response.data.success) {
        const activeEvents = response.data.data.events.filter(event => 
          event.status !== 'concluded' && 
          event.organizer._id === user._id
        );
        setUserEvents(activeEvents);
      }
    } catch (error) {
      console.error('Fetch user events error:', error);
      toast.error('Failed to fetch events');
    }
  };

  const fetchProfessionalEvents = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/events/my-events?userId=${id}`);
      if (response.data.success) {
        setProfessionalEvents(response.data.data.events);
      }
    } catch (error) {
      console.error('Fetch professional events error:', error);
      toast.error('Failed to fetch professional events');
    }
  };

  const handleUpdateProfile = async (profileData) => {
    try {
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/users/profile`, profileData);
      if (response.data.success) {
        setProfessional(response.data.data.user);
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleAddPortfolioItem = async (portfolioData) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/users/portfolio`, portfolioData);
      if (response.data.success) {
        await fetchProfessionalProfile();
        toast.success('Portfolio item added successfully');
      }
    } catch (error) {
      throw error;
    }
  };

  const handleUpdateAvailability = async (availabilityData) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/users/availability`, {
        availability: availabilityData
      });
      await fetchAvailability();
      toast.success('Availability updated successfully');
    } catch (error) {
      throw error;
    }
  };

  const handleAddReview = async ({ rating, review }) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/users/${id}/reviews`, {
        rating,
        review
      });
      await fetchProfessionalProfile();
      toast.success('Review submitted successfully');
    } catch (error) {
      throw error;
    }
  };

  const handleBack = () => {
    const previousMessagePage = sessionStorage.getItem('previousMessagePage');
    if (previousMessagePage) {
      navigate(previousMessagePage);
      sessionStorage.removeItem('previousMessagePage');
    } else {
      navigate(-1);
    }
  };

  if (isLoading || !professional) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>

          <ProfessionalProfile
            professional={professional}
            events={professionalEvents}
            availability={availability}
            isOwnProfile={user?._id === professional?._id}
            onUpdateProfile={handleUpdateProfile}
            onUpdateAvailability={handleUpdateAvailability}
            onAddPortfolioItem={handleAddPortfolioItem}
            onAddReview={handleAddReview}
            user={user}
            userEvents={userEvents}
          />
        </div>
      </div>
    </Layout>
  );
};

export default ProfessionalProfilePage;
