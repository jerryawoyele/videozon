import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const OnboardingForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    // Add other fields as needed
  });
  const { user, updateProfile } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      // Redirect to dashboard or reload profile
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Welcome! Let's set up your profile</h2>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block mb-1">First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          {/* Add other form fields */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Complete Profile
          </button>
        </div>
      </form>
    </div>
  );
};

export default OnboardingForm; 