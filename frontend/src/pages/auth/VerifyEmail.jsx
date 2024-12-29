import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle } from 'lucide-react';
import Logo from '../../components/Logo';

const VerifyEmail = () => {
  const [verificationStatus, setVerificationStatus] = useState('verifying');
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        console.log('Attempting to verify email with token:', token);
        
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/auth/verify-email/${token}`
        );

        console.log('Verification response:', response.data);

        if (response.data.success) {
          setVerificationStatus('success');
          toast.success('Email verified successfully!');
          
          // Clear any pending verification email from localStorage
          localStorage.removeItem('pendingVerificationEmail');
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          setVerificationStatus('error');
          toast.error(response.data.message || 'Verification failed');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setVerificationStatus('error');
        
        // Handle different types of errors
        if (error.response?.data?.message) {
          toast.error(error.response.data.message);
        } else if (error.message) {
          toast.error(error.message);
        } else {
          toast.error('Verification failed');
        }
      }
    };

    if (token) {
      verifyEmail();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        
        <div className="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {verificationStatus === 'verifying' && (
              <div className="text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                <p className="mt-4 text-lg">Verifying your email...</p>
              </div>
            )}
            
            {verificationStatus === 'error' && (
              <div className="text-green-400">
                <CheckCircle className="h-12 w-12 mx-auto animate-bounce" />
                <h2 className="mt-4 text-xl font-bold text-white">
                  Email Verified Successfully!
                </h2>
                <p className="mt-2 text-gray-300">
                  Your email has been verified. You will be redirected to the login page shortly.
                </p>
              </div>
            )}
            
            {verificationStatus === 'success' && (
              <div className="text-red-400">
                <XCircle className="h-12 w-12 mx-auto" />
                <h2 className="mt-4 text-xl font-bold text-white">
                  Verification Failed
                </h2>
                <p className="mt-2 text-gray-300">
                  We couldn't verify your email. Please try again or contact support.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail; 