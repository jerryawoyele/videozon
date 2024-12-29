import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Menu, X, Home, Briefcase, Calendar, MessageSquare, 
  Bell, LogOut, User, Users
} from 'lucide-react';
import api from '../utils/axios';
import Logo from './Logo';
import ConfirmationModal from './modals/ConfirmationModal';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { user, logout } = useAuth();
  const location = useLocation();
  const isProfessional = user?.role === 'professional';

  useEffect(() => {
    const checkUnreadNotifications = async () => {
      try {
        const response = await api.get('/notifications/unread-count');
        setUnreadNotifications(response.data.data.count);
      } catch (error) {
        console.error('Failed to fetch unread notifications:', error);
      }
    };

    // Check initially
    checkUnreadNotifications();

    // Check every 30 seconds
    const interval = setInterval(checkUnreadNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Professionals', href: '/professionals', icon: Users },
    ...(isProfessional ? [
      { name: 'My Gigs', href: '/professionals/gigs', icon: Briefcase }
    ] : []),
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Notifications', href: '/notifications', icon: Bell }
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Mobile header */}
      <div className="lg:hidden bg-gray-800 fixed top-0 left-0 right-0 z-50 border-b border-gray-700">
        <div className="flex items-center px-4 py-2">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-md text-gray-400 hover:bg-gray-700"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex-1 flex justify-start ml-4">
            <Logo className="h-8" />
          </div>
        </div>
      </div>

      {/* Sidebar - Fixed on large screens */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-gray-800 
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          {/* Logo - hidden on mobile */}
          <div className="hidden lg:flex items-center h-16 px-6 border-b border-gray-700">
            <Logo className="h-8" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto mt-16 lg:mt-0">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center px-4 py-3 text-sm font-semibold rounded-md
                    transition-colors duration-150 ease-in-out
                    ${isActive(item.href) ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                  `}
                >
                  <Icon className="mr-4 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto px-3 py-4">
            <Link
              to="/profile"
              className="flex items-center px-4 py-3 text-sm font-semibold text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors duration-150 ease-in-out"
            >
              <User className="mr-4 h-5 w-5" />
              Profile
            </Link>
            <button
              onClick={handleLogoutClick}
              className="w-full flex items-center px-4 py-3 text-sm font-semibold text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors duration-150 ease-in-out"
            >
              <LogOut className="mr-4 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>
      
      {/* Main content - Pushed to the right on large screens */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 pt-16 lg:pt-0">
          <div className="max-w-8xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out? You will need to log in again to access your account."
      />
    </div>
  );
};

export default Layout;
