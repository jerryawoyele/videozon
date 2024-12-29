import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Bell, Lock, Shield, ArrowLeft } from 'lucide-react';
import axios from '../utils/axios';  // Import configured axios instance with auth headers
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [settingsData, setSettingsData] = useState({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    twoFactorAuth: false,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/users/settings');
      if (response.data.success) {
        setSettingsData(prev => ({
          ...prev,
          ...response.data.data.settings,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }
    } catch (error) {
      toast.error('Failed to fetch settings');
    } finally {
      setIsFetching(false);
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Only send password fields if they're filled
      const dataToSend = {
        emailNotifications: settingsData.emailNotifications,
        pushNotifications: settingsData.pushNotifications,
        marketingEmails: settingsData.marketingEmails,
        twoFactorAuth: settingsData.twoFactorAuth
      };

      if (settingsData.currentPassword && settingsData.newPassword) {
        if (settingsData.newPassword !== settingsData.confirmPassword) {
          toast.error('New passwords do not match');
          return;
        }
        dataToSend.currentPassword = settingsData.currentPassword;
        dataToSend.newPassword = settingsData.newPassword;
      }

      const response = await axios.patch('/users/settings', dataToSend);

      if (response.data.success) {
        toast.success('Settings updated successfully');
        // Clear password fields after successful update
        setSettingsData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update settings';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Profile
          </button>

          <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

          {isFetching ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <form onSubmit={handleSettingsSubmit} className="space-y-6">
              {/* Notifications */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-4">
                  <Bell className="inline-block mr-2 h-5 w-5" />
                  Notifications
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-gray-300">Email Notifications</label>
                    <input
                      type="checkbox"
                      checked={settingsData.emailNotifications}
                      onChange={(e) => setSettingsData(prev => ({
                        ...prev,
                        emailNotifications: e.target.checked
                      }))}
                      className="toggle"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-gray-300">Push Notifications</label>
                    <input
                      type="checkbox"
                      checked={settingsData.pushNotifications}
                      onChange={(e) => setSettingsData(prev => ({
                        ...prev,
                        pushNotifications: e.target.checked
                      }))}
                      className="toggle"
                    />
                  </div>
                </div>
              </div>

              {/* Security */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-4">
                  <Shield className="inline-block mr-2 h-5 w-5" />
                  Security
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-gray-300">Two-Factor Authentication</label>
                    <input
                      type="checkbox"
                      checked={settingsData.twoFactorAuth}
                      onChange={(e) => setSettingsData(prev => ({
                        ...prev,
                        twoFactorAuth: e.target.checked
                      }))}
                      className="toggle"
                    />
                  </div>
                </div>
              </div>

              {/* Password Change */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-4">
                  <Lock className="inline-block mr-2 h-5 w-5" />
                  Change Password
                </h3>
                <div className="space-y-4">
                  <input
                    type="password"
                    placeholder="Current Password"
                    value={settingsData.currentPassword}
                    onChange={(e) => setSettingsData(prev => ({
                      ...prev,
                      currentPassword: e.target.value
                    }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white"
                  />
                  <input
                    type="password"
                    placeholder="New Password"
                    value={settingsData.newPassword}
                    onChange={(e) => setSettingsData(prev => ({
                      ...prev,
                      newPassword: e.target.value
                    }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white"
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={settingsData.confirmPassword}
                    onChange={(e) => setSettingsData(prev => ({
                      ...prev,
                      confirmPassword: e.target.value
                    }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
