import React from 'react';
import { Link } from 'react-router-dom';
import { Video } from 'lucide-react';

const Logo = ({ className = "" }) => {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <Video className="w-8 h-8 text-blue-500" />
      <span className="text-2xl font-bold text-blue-500">Videozon</span>
    </Link>
  );
};

export default Logo; 