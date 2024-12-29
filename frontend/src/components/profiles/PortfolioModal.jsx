import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const PortfolioModal = ({ onClose, onSubmit }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [portfolioImage, setPortfolioImage] = useState(null);
  const [portfolioData, setPortfolioData] = useState({
    title: '',
    description: ''
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setPortfolioImage(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!portfolioImage || !portfolioData.title) {
      toast.error('Please provide both an image and title');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        image: portfolioImage,
        ...portfolioData
      });
      onClose();
    } catch (error) {
      toast.error('Failed to add portfolio item');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-md mx-4">
        <div className="p-4 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Add Portfolio Item</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Image
            </label>
            <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-700 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-400">
                  <label className="relative cursor-pointer rounded-md font-medium text-blue-500 hover:text-blue-400">
                    <span>Upload a file</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                {portfolioImage && (
                  <p className="text-sm text-gray-400">
                    Selected: {portfolioImage.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={portfolioData.title}
              onChange={(e) => setPortfolioData(prev => ({
                ...prev,
                title: e.target.value
              }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={portfolioData.description}
              onChange={(e) => setPortfolioData(prev => ({
                ...prev,
                description: e.target.value
              }))}
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !portfolioImage || !portfolioData.title}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PortfolioModal;
