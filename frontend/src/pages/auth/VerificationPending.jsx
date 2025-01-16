import React from 'react';
import { Link } from 'react-router-dom';

const VerificationPending = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-gray-800 rounded-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            Check Your Email
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            We've sent you a verification email. Please check your inbox and click the verification link to complete your registration.
          </p>
          <div className="mt-4">
            <Link
              to="/login"
              className="text-blue-500 hover:text-blue-400"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationPending; 