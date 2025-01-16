import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError('Verification token is missing');
        setIsVerifying(false);
        return;
      }

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/auth/verify-email/${token}`
        );

        if (response.data.success) {
          // Log the user in automatically
          await login(response.data.data.user);
          
          // Store the token
          localStorage.setItem('token', response.data.data.token);
          
          // Set default authorization header for future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.data.token}`;
          
          toast.success('Email verified successfully!');
          
          // Redirect based on whether it's a new user
          if (response.data.data.user.isNewUser) {
            navigate('/profile');
          } else {
            navigate('/dashboard');
          }
        }
      } catch (error) {
        console.error('Verification error:', error);
        setError(error.response?.data?.message || 'Verification failed');
        toast.error(error.response?.data?.message || 'Verification failed');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [token, login, navigate]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg text-white">Verifying your email...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Verification Failed</div>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return null;
};

export default VerifyEmail; 