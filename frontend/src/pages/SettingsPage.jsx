import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
  Bell, Lock, Shield, ArrowLeft, DollarSign, 
  ChevronDown, ChevronUp, Smartphone, CreditCard
} from 'lucide-react';
import axios from '../utils/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const SettingSection = ({ title, icon: Icon, isOpen, onToggle, children }) => {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center">
          <Icon className="h-5 w-5 mr-2" />
          <h3 className="text-lg font-medium text-white">{title}</h3>
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>
      {isOpen && <div className="p-6 border-t border-gray-700">{children}</div>}
    </div>
  );
};

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  
  // State for section visibility
  const [openSections, setOpenSections] = useState({
    notifications: false,
    security: false,
    bankTransfer: false,
    mobileMoney: false,
    password: false
  });

  // State for displaying current settings
  const [currentSettings, setCurrentSettings] = useState({
    notifications: {
      emailNotifications: false,
      pushNotifications: false,
    marketingEmails: false,
      twoFactorAuth: false
    },
    payment: {
      preferredMethod: '', // 'card', 'transfer', or 'mobile'
      card: {
        number: '',
        expiryDate: '',
        cvv: '',
        name: ''
      },
      transfer: {
        accountNumber: '',
        bankCode: '',
        bankName: '',
        accountName: '',
        businessName: ''
      },
      mobile: {
        phoneNumber: '',
        provider: null
      }
    },
    password: {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
    }
  });

  // Separate state for form changes
  const [formChanges, setFormChanges] = useState(null);

  // Toggle section visibility only
  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
    
    // Initialize form changes when first opening any section
    if (!formChanges) {
      setFormChanges({...currentSettings});
    }
  };

  // Fetch settings from backend
  useEffect(() => {
  const fetchSettings = async () => {
    try {
      const response = await axios.get('/users/settings');
      if (response.data.success) {
          const { settings, paymentInfo } = response.data.data;
          
          const newSettings = {
            notifications: {
              ...settings
            },
            payment: {
              preferredMethod: '',
              card: {
                number: '',
                expiryDate: '',
                cvv: '',
                name: ''
              },
              transfer: {
                accountNumber: '',
                bankCode: '',
                bankName: '',
                accountName: '',
                businessName: ''
              },
              mobile: {
                phoneNumber: '',
                provider: null
              }
            },
            password: {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
            }
          };

          setCurrentSettings(newSettings);
      }
    } catch (error) {
      toast.error('Failed to fetch settings');
    } finally {
      setIsFetching(false);
    }
  };

    fetchSettings();
  }, [user]);

  // Handle form input changes
  const handleChange = (section, field, value) => {
    if (!formChanges) {
      // Initialize formChanges with current settings if not already initialized
      setFormChanges({...currentSettings});
    }
    setFormChanges(prev => ({
      ...prev,
      [section]: {
        ...(prev?.[section] || {}),
        [field]: value
      }
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formChanges) {
      navigate('/profile');
      return;
    }
    
    setIsLoading(true);

    try {
      // Only include fields that have actually changed
      const dataToSend = {};

      // Add notifications if they've changed
      if (formChanges.notifications) {
        dataToSend.notifications = {
          emailNotifications: formChanges.notifications.emailNotifications ?? currentSettings.notifications.emailNotifications,
          pushNotifications: formChanges.notifications.pushNotifications ?? currentSettings.notifications.pushNotifications,
          twoFactorAuth: formChanges.notifications.twoFactorAuth ?? currentSettings.notifications.twoFactorAuth
        };
      }

      // Add password changes if they exist
      if (formChanges.password?.currentPassword && formChanges.password?.newPassword) {
        if (formChanges.password.newPassword !== formChanges.password.confirmPassword) {
          toast.error('New passwords do not match');
          return;
        }
        dataToSend.currentPassword = formChanges.password.currentPassword;
        dataToSend.newPassword = formChanges.password.newPassword;
      }

      // Only include payment info if it's been changed
      if (formChanges.payment) {
        dataToSend.payment = formChanges.payment;
      }

      console.log('Sending data:', dataToSend);

      const response = await axios.patch('/users/settings', dataToSend);
      console.log('Response:', response);

      if (response.data.success) {
        toast.success('Settings updated successfully');
        navigate('/profile');
      } else {
        toast.error(response.data.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Settings update error:', error);
      console.error('Error response:', error.response);
      toast.error(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    // Simply navigate back to profile without saving
    navigate('/profile');
  };

  // Also add state for banks
  const [banks, setBanks] = useState([]);

  // Add useEffect to fetch banks
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const response = await axios.get('/banks');
        if (response.data.success) {
          setBanks(response.data.data.banks);
        }
      } catch (error) {
        console.error('Fetch banks error:', error);
      }
    };

    fetchBanks();
  }, []);

  const handlePaymentMethodSelect = (method) => {
    // Paystack URLs for different payment methods
    const paystackUrls = {
      'bank-account': 'https://dashboard.paystack.com/#/payment-pages/bank-transfer',
      'mobile-money': 'https://dashboard.paystack.com/#/payment-pages/mobile-money',
      'business': 'https://dashboard.paystack.com/#/payment-pages/business'
    };

    // Redirect to the corresponding Paystack URL
    window.location.href = paystackUrls[method];
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
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
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              {/* Notifications Section */}
              <SettingSection
                title="Notifications"
                icon={Bell}
                isOpen={openSections.notifications}
                onToggle={() => toggleSection('notifications')}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-gray-300">Email Notifications</label>
                    <input
                      type="checkbox"
                      checked={(formChanges?.notifications?.emailNotifications ?? currentSettings.notifications.emailNotifications)}
                      onChange={(e) => handleChange('notifications', 'emailNotifications', e.target.checked)}
                      className="toggle"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-gray-300">Push Notifications</label>
                    <input
                      type="checkbox"
                      checked={(formChanges?.notifications?.pushNotifications ?? currentSettings.notifications.pushNotifications)}
                      onChange={(e) => handleChange('notifications', 'pushNotifications', e.target.checked)}
                      className="toggle"
                    />
                  </div>
                </div>
              </SettingSection>

              {/* Security Section */}
              <SettingSection
                title="Security"
                icon={Shield}
                isOpen={openSections.security}
                onToggle={() => toggleSection('security')}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-gray-300">Two-Factor Authentication</label>
                    <input
                      type="checkbox"
                      checked={(formChanges?.notifications?.twoFactorAuth ?? currentSettings.notifications.twoFactorAuth)}
                      onChange={(e) => handleChange('notifications', 'twoFactorAuth', e.target.checked)}
                      className="toggle"
                    />
                  </div>
                </div>
              </SettingSection>

              {/* Payment Information Section */}
              <SettingSection
                title="Payment Information"
                icon={DollarSign}
                isOpen={openSections.payment}
                onToggle={() => toggleSection('payment')}
              >
                <div className="space-y-4">
                  {/* Bank Transfer Option */}
                  <div 
                    onClick={() => handlePaymentMethodSelect('bank-account')}
                    className="bg-gray-700 hover:bg-gray-600 rounded-lg p-4 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-white">Bank Account</h3>
                        <p className="text-gray-400 text-sm mt-1">Link your bank account for direct deposits</p>
                      </div>
                      <CreditCard className="h-6 w-6 text-gray-400" />
                    </div>
                  </div>

                  {/* Mobile Money Option */}
                  <div 
                    onClick={() => handlePaymentMethodSelect('mobile-money')}
                    className="bg-gray-700 hover:bg-gray-600 rounded-lg p-4 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-white">Mobile Money</h3>
                        <p className="text-gray-400 text-sm mt-1">Use your mobile money account</p>
                      </div>
                      <Smartphone className="h-6 w-6 text-gray-400" />
                    </div>
                  </div>

                  {/* Business Account Option */}
                  <div 
                    onClick={() => handlePaymentMethodSelect('business')}
                    className="bg-gray-700 hover:bg-gray-600 rounded-lg p-4 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-white">Business Account</h3>
                        <p className="text-gray-400 text-sm mt-1">Set up a business account for payments</p>
                      </div>
                      <DollarSign className="h-6 w-6 text-gray-400" />
                    </div>
                  </div>
                </div>
              </SettingSection>

              {/* Password Section */}
              <SettingSection
                title="Change Password"
                icon={Lock}
                isOpen={openSections.password}
                onToggle={() => toggleSection('password')}
              >
                <div className="space-y-4">
                  <input
                    type="password"
                    placeholder="Current Password"
                    value={(formChanges?.password?.currentPassword ?? currentSettings.password.currentPassword)}
                    onChange={(e) => handleChange('password', 'currentPassword', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white"
                  />
                  <input
                    type="password"
                    placeholder="New Password"
                    value={(formChanges?.password?.newPassword ?? currentSettings.password.newPassword)}
                    onChange={(e) => handleChange('password', 'newPassword', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white"
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={(formChanges?.password?.confirmPassword ?? currentSettings.password.confirmPassword)}
                    onChange={(e) => handleChange('password', 'confirmPassword', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white"
                  />
                </div>
              </SettingSection>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
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
