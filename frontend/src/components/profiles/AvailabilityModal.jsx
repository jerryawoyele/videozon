import React, { useState } from 'react';
import { X } from 'lucide-react';
import Calendar from '../Calendar';

const AvailabilityModal = ({ onClose, onSubmit }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const formattedDates = selectedDates.map(({ date, timeSlots }) => ({
        date: date.toISOString(),
        timeSlots: timeSlots.filter(slot => slot.isSelected)
      }));

      await onSubmit(formattedDates);
      onClose();
    } catch (error) {
      console.error('Failed to update availability:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-md mx-4">
        <div className="p-4 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Update Availability</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          <Calendar
            selectedDates={selectedDates}
            onChange={setSelectedDates}
          />
        </div>

        <div className="p-4 border-t border-gray-700">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Updating...' : 'Update Availability'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityModal;
