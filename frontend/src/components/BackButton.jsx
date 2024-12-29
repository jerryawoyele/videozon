import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BackButton = ({ className = '' }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className={`flex items-center text-gray-400 hover:text-white transition-colors ${className}`}
      aria-label="Go back"
    >
      <ArrowLeft className="h-5 w-5 mr-2" />
      <span>Back</span>
    </button>
  );
};

export default BackButton; 