import React from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { X } from 'lucide-react'; // Import X icon for clear button

const DEFAULT_TIME_SLOTS = [
  { start: "09:00", end: "12:00" },
  { start: "13:00", end: "17:00" },
  { start: "18:00", end: "22:00" }
];

const Calendar = ({ selectedDates, onChange }) => {
  const handleDateChange = (date) => {
    if (!date) return;

    const isSelected = selectedDates.some(
      selectedDate => selectedDate.date.toDateString() === date.toDateString()
    );
    
    if (isSelected) {
      // Remove the date if it's already selected
      onChange(selectedDates.filter(
        d => d.date.toDateString() !== date.toDateString()
      ));
    } else {
      // Add new date with default time slots
      onChange([...selectedDates, {
        date: date,
        timeSlots: DEFAULT_TIME_SLOTS.map(slot => ({
          ...slot,
          isSelected: true
        }))
      }]);
    }
  };

  const handleTimeSlotToggle = (dateIndex, slotIndex) => {
    const newSelectedDates = [...selectedDates];
    const currentSlot = newSelectedDates[dateIndex].timeSlots[slotIndex];
    currentSlot.isSelected = !currentSlot.isSelected;

    // If no time slots are selected, remove the entire date
    const hasSelectedSlots = newSelectedDates[dateIndex].timeSlots.some(slot => slot.isSelected);
    if (!hasSelectedSlots) {
      newSelectedDates.splice(dateIndex, 1);
    }

    onChange(newSelectedDates);
  };

  const handleClearAll = () => {
    onChange([]); // Clear all selected dates
  };

  return (
    <div className="space-y-4">
      <div className="dark-calendar">
        <DatePicker
          inline
          minDate={new Date()}
          selected={null}
          onChange={handleDateChange}
          highlightDates={selectedDates.map(d => d.date)}
          monthsShown={1}
          calendarClassName="bg-gray-800 border-gray-700"
          dayClassName={date => {
            const isSelected = selectedDates.some(
              d => d.date.toDateString() === date.toDateString()
            );
            return isSelected 
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "text-gray-300 hover:bg-gray-700";
          }}
        />
      </div>

      {/* Selected Dates Header with Clear All button */}
      {selectedDates.length > 0 && (
        <div className="bg-gray-700 rounded-lg p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-white font-medium">Selected Dates & Times</h3>
            <button
              onClick={handleClearAll}
              className="text-gray-400 hover:text-white flex items-center gap-1 text-sm"
            >
              <X size={16} />
              Clear All
            </button>
          </div>
          <div className="space-y-4">
            {selectedDates.map((selectedDate, dateIndex) => (
              <div key={selectedDate.date.toISOString()} className="bg-gray-800 rounded-lg p-3">
                <div className="text-white mb-2">
                  {selectedDate.date.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {selectedDate.timeSlots.map((slot, slotIndex) => (
                    <button
                      key={`${slot.start}-${slot.end}`}
                      onClick={() => handleTimeSlotToggle(dateIndex, slotIndex)}
                      className={`
                        px-3 py-2 rounded-md text-sm font-medium
                        ${slot.isSelected 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }
                      `}
                    >
                      {slot.start} - {slot.end}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar; 