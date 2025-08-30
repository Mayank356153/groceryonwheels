import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from '../Navbar';
import Sidebar from '../Sidebar';

const MybookingForm = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    bookNumber: '',
    bookingDate: '',
    customerId: '',
    contactNumber: '',
    location: '',
    remark: ''
  });

  // 1️⃣ On mount: generate booking number + fetch items & customers
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      bookNumber: generateBookingNumber()
    }));
    fetchItems();
    fetchCustomers();
  }, []);

  const generateBookingNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `BN${timestamp}${random}`;
  };

  // Fetch all items for a potential dropdown
  const fetchItems = async () => {
    try {
      const res = await axios.get(
        'api/items'
      );
      setItems(res.data);
    } catch (err) {
      console.error('Error fetching items:', err);
    }
  };

  // Fetch all customers for selection
  const fetchCustomers = async () => {
    try {
      const res = await axios.get(
        'api/customer-data/all'
      );
      setCustomers(res.data);
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  // Handle form field changes
  const handleChange = e => {
    const { name, value } = e.target;

    // When selecting a customer, auto-fill contactNumber
    if (name === 'customerId') {
      const cust = customers.find(c => c._id === value);
      setFormData(prev => ({
        ...prev,
        customerId: value,
        contactNumber: cust?.contactNumber || ''
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Submit booking
  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const payload = {
        bookNumber: formData.bookNumber,
        bookingDate: formData.bookingDate,
        customerId: formData.customerId,
        contactNumber: formData.contactNumber,
        location: formData.location,
        remark: formData.remark
      };
      const res = await axios.post(
        'api/booking-orders',
        payload
      );
      toast.success(
        `Booking ${res.data.bookNumber} submitted successfully!`,
        { autoClose: 3000 }
      );

      // Reset form and regenerate number
      const newBN = generateBookingNumber();
      setFormData({
        bookNumber: newBN,
        bookingDate: '',
        customerId: '',
        contactNumber: '',
        location: '',
        remark: ''
      });
    } catch (error) {
      console.error('Error submitting booking:', error);
      toast.error('Something went wrong. Please try again.', {
        autoClose: 3000
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <div className="flex flex-1 pt-16">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <div
          className={`flex-1 p-4 sm:p-6 bg-gray-100 transition-all duration-300 ${
            isSidebarOpen ? 'ml-64' : 'ml-0'
          }`}
        >
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
          />
          <form
            onSubmit={handleSubmit}
            className="bg-gray-900 text-white shadow-lg rounded p-6 mb-6 max-w-4xl mx-auto"
          >
            <h2 className="text-xl font-bold mb-4 text-orange-400">
              New Booking
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Booking Number */}
              <input
                type="text"
                name="bookNumber"
                placeholder="Booking Number"
                value={formData.bookNumber}
                readOnly
                required
                className="p-2 bg-gray-800 text-white border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-orange-400 opacity-75 cursor-not-allowed"
              />

              {/* Booking Date */}
              <input
                type="date"
                name="bookingDate"
                value={formData.bookingDate}
                onChange={handleChange}
                required
                className="p-2 bg-gray-800 text-white border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
              />

              {/* Customer Selection */}
              <select
                name="customerId"
                value={formData.customerId}
                onChange={handleChange}
                required
                className="p-2 bg-gray-800 text-white border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="">Select Customer</option>
                {customers.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Auto-filled Contact Number */}
              <input
                type="text"
                name="contactNumber"
                placeholder="Contact Number"
                value={formData.contactNumber}
                readOnly
                className="p-2 bg-gray-800 text-white border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-orange-400 opacity-75 cursor-not-allowed"
              />

              {/* Location */}
              <input
                type="text"
                name="location"
                placeholder="Location"
                value={formData.location}
                onChange={handleChange}
                required
                className="p-2 bg-gray-800 text-white border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
              />

              {/* Remark */}
              <input
                type="text"
                name="remark"
                placeholder="Remark"
                value={formData.remark}
                onChange={handleChange}
                required
                className="p-2 bg-gray-800 text-white border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <button
              type="submit"
              className="mt-6 bg-orange-500 hover:bg-orange-600 text-white py-2 px-6 rounded font-semibold transition-colors duration-200 justify-center flex items-center w-full sm:w-auto mx-auto"
            >
              Submit Booking
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MybookingForm;
