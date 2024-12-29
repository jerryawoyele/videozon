import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, MessageCircle } from 'lucide-react';

const Header = () => {
  const { user } = useAuth();

  return (
    <header className="bg-gray-800 shadow-md p-4 flex justify-between items-center">
      <div className="text-2xl font-bold text-white">Videozon</div>
      <nav className="flex items-center space-x-4">
        <Link to="/notifications" className="text-white hover:text-gray-300">
          <Bell size={20} />
        </Link>
        <Link to="/messages" className="text-white hover:text-gray-300">
          <MessageCircle size={20} />
        </Link>
        {user ? (
          <Link to="/profile" className="text-white hover:text-gray-300">
            {user.fullName}
          </Link>
        ) : (
          <Link to="/login" className="text-white hover:text-gray-300">
            Login
          </Link>
        )}
      </nav>
    </header>
  );
};

export default Header;

