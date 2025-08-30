import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import axios from 'axios';
import LoadingScreen from '../../Loading';

export default function Pop({ add, setAdd, category, options, setOptions, fetchTax, fetchUnits, fetchBrands, fetchVariants }) {
  const [newOption, setNewOption] = useState({
    name: '',
    description: '',
    taxPercentage: '',
    status: 'active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewOption((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      let response;
      if (category === 'Category') {
        response = await axios.post(
          'api/categories',
          {
            name: newOption.name,
            description: newOption.description,
            status: newOption.status
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          }
        );
        setOptions((prev) => ({
          ...prev,
          category: [
            ...prev.category,
            {
              label: response.data.data.name,
              value: response.data.data._id
            }
          ]
        }));
      } else if (category === 'Tax') {
        response = await axios.post(
          'api/taxes',
          {
            taxName: newOption.name,
            taxPercentage: Number(newOption.taxPercentage),
            status: newOption.status
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          }
        );
        await fetchTax();
      } else if (category === 'Unit') {
        response = await axios.post(
          'api/units',
          {
            unitName: newOption.name,
            description: newOption.description,
            status: newOption.status
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          }
        );
        await fetchUnits();
      } else if (category === 'Brand') {
        response = await axios.post(
          'api/brands',
          {
            brandName: newOption.name,
            description: newOption.description,
            status: newOption.status
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          }
        );
        await fetchBrands();
      } else if (category === 'Variant') {
        response = await axios.post(
          'api/variants',
          {
            variantName: newOption.name,
            description: newOption.description,
            status: newOption.status
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          }
        );
        await fetchVariants();
      } else {
        throw new Error(`Unsupported category: ${category}`);
      }

      alert(`${category} added successfully`);
      setAdd(false);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      console.error(`Error adding ${category}:`, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-[1px] z-50">
        <div className="bg-white rounded-lg shadow-lg w-96 p-6">
          <div className="text-red-500 mb-4">Error: {error}</div>
          <button
            className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
            onClick={() => setError(null)}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-[1px] z-50">
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow-lg w-96">
          <div className="flex items-center justify-between p-4 text-lg font-semibold text-white rounded-t-lg bg-gradient-to-r from-teal-400 to-blue-500">
            <span>Add {category}</span>
            <button type="button" className="text-white cursor-pointer" onClick={() => setAdd(false)}>
              <FaTimes />
            </button>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <label htmlFor="name" className="block mb-2 font-medium text-gray-700">
                {category === 'Variant' ? 'Variant Name' : `${category} Name`}*
              </label>
              <input
                type="text"
                name="name"
                value={newOption.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            {category === 'Tax' && (
              <div className="mb-4">
                <label htmlFor="taxPercentage" className="block mb-2 font-medium text-gray-700">
                  Tax Percentage*
                </label>
                <input
                  type="number"
                  name="taxPercentage"
                  value={newOption.taxPercentage}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            )}
            <div className="mb-4">
              <label htmlFor="description" className="block mb-2 font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                value={newOption.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
            <div className="mb-4">
              <label htmlFor="status" className="block mb-2 font-medium text-gray-700">
                Status
              </label>
              <select
                name="status"
                value={newOption.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                className="px-4 py-2 text-white bg-orange-500 rounded hover:bg-orange-600"
                onClick={() => setAdd(false)}
              >
                Close
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
                disabled={loading}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}