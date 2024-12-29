import React from 'react';
import { X } from 'lucide-react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-800 rounded-lg w-full max-w-md p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="mt-3 text-center sm:mt-0 sm:text-left">
          <h3 className="text-lg font-medium leading-6 text-white">
            {title}
          </h3>
          <div className="mt-2">
            <p className="text-sm text-gray-300">
              {message}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
          >
            Logout
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-500 px-4 py-2 bg-gray-700 text-base font-medium text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal; 