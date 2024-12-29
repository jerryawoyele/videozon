import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const VerificationPending = () => {
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedEmail = localStorage.getItem('pendingVerificationEmail');
    if (!storedEmail) {
      navigate('/signup');
    }
    setEmail(storedEmail);
  }, [navigate]);

  const handleResendVerification = async () => {
    if (isResending) return;
    
    setIsResending(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/resend-verification`,
        { email }
      );

      if (response.data.success) {
        toast.success('Verification email resent successfully');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      const errorMessage = 
        error.response?.data?.message || 
        'Failed to resend verification email';
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="bg-gray-800 rounded-lg p-8 shadow-lg">
          <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="h-8 w-8 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Check your email
          </h2>
          <p className="text-gray-300 mb-6">
            We've sent a verification link to <span className="font-medium">{email}</span>
          </p>
          <button
            onClick={handleResendVerification}
            disabled={isResending}
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isResending ? 'animate-spin' : ''}`} />
            {isResending ? 'Resending...' : 'Resend verification email'}
          </button>
          <Link
            to="/login"
            className="mt-4 flex items-center justify-center text-sm text-gray-400 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerificationPending; 