import { CATEGORIES } from '../constants/eventConstants';

const EditEventModal = ({ event, isOpen, onClose, onUpdate }) => {
  // ... other code ...

  return (
    <div className={`modal ${isOpen ? 'show' : ''}`}>
      <div className="modal-content">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ... other form fields ... */}

          {/* Update the category input to a select dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category
            </label>
            <select
              name="category"
              value={editedEvent.category}
              onChange={handleChange}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a category</option>
              {CATEGORIES.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* ... rest of the form ... */}
        </form>
      </div>
    </div>
  );
}; 