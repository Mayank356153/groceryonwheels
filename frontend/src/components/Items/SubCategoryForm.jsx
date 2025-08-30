import React, { useEffect, useState } from 'react';
import Sidebar from '../Sidebar';
import Navbar from '../Navbar';
import { BiChevronRight } from 'react-icons/bi';
import { FaTachometerAlt } from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import LoadingScreen from '../../Loading';
import { NavLink } from 'react-router-dom';

const SubCategoryForm = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('categoryId'); // parent category
  const id = searchParams.get('id'); // subcategory ID (for editing)
  const navigate = useNavigate();

  // Subcategory form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: categoryId || '', // link to parent category
    status: 'Active',
  });
 useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[])
  // If editing, fetch existing subcategory details
  const fetchSubcategory = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // e.g. GET /api/subcategories/:id
      const response = await axios.get(
        `api/subcategories/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      // Suppose the data is in response.data.data
      const subcat = response.data.data;
      setFormData({
        name: subcat.name,
        description: subcat.description,
        category: subcat.category, // the parent category ID
        status: subcat.status,
      });
    } catch (error) {
      console.error(error.message);
      alert('Error fetching subcategory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchSubcategory();
    }
  }, [id]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Create or update
  const createSubcategory = async () => {
    setLoading(true);
    try {
      // POST /api/categories/sub
      const response = await axios.post(
        'api/categories/sub',
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      alert('Subcategory created successfully!');
      navigate(-1); // go back or navigate to subcategory list
    } catch (error) {
      console.error(error.response?.data || error.message);
      alert('Error creating subcategory');
    } finally {
      setLoading(false);
    }
  };

  const updateSubcategory = async () => {
    setLoading(true);
    try {
      // e.g. PUT /api/subcategories/:id
      const response = await axios.put(
        `api/subcategories/${id}`,
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      alert('Subcategory updated successfully!');
      navigate(-1);
    } catch (error) {
      console.error(error.response?.data || error.message);
      alert('Error updating subcategory');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (id) {
      updateSubcategory();
    } else {
      createSubcategory();
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <div
          className={`flex-grow  flex flex-col p-4 md:p-6 bg-gray-100 transition-all duration-300 `}
        >
          <header className="flex flex-col items-center justify-between p-4 mb-2 bg-gray-100 rounded-md shadow md:flex-row">
            <div className="flex items-baseline gap-1 text-center sm:flex-row sm:text-left">
              <h1 className="text-lg font-semibold truncate sm:text-xl">
                {id ? 'Edit Subcategory' : 'Create Subcategory'}
              </h1>
              <span className="text-xs text-gray-600 sm:text-sm">
                {id
                  ? 'Update an existing subcategory'
                  : 'Add a new subcategory'}
              </span>
            </div>
            <nav className="flex flex-wrap items-center justify-center mt-2 text-xs text-gray-500 sm:justify-start sm:text-sm sm:mt-0">
            <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline"><FaTachometerAlt /> Home </NavLink>
              <BiChevronRight className="mx-1  sm:mx-2" />
              <span className="text-gray-700 no-underline">
                {id ? 'Edit Subcategory' : 'Create Subcategory'}
              </span>
            </nav>
          </header>

          <form
            onSubmit={handleSubmit}
            className="p-4 bg-white border-t-4 rounded shadow-md border-cyan-500"
          >
            <h2 className="mb-3 text-lg font-medium text-gray-700">
              {id ? 'Update Subcategory' : 'Please Enter Valid Data'}
            </h2>

            <div className="mb-4">
              <label className="block font-semibold text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                className="w-full p-2 mt-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 focus:outline-none"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block font-semibold text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                className="w-full p-2 mt-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 focus:outline-none"
                value={formData.description}
                onChange={handleChange}
              ></textarea>
            </div>

            <div className="mb-4">
              <label className="block font-semibold text-gray-700">
                Status
              </label>
              <select
                name="status"
                className="w-full p-2 mt-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 focus:outline-none"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* categoryId is read-only or hidden if you want */}
            <input type="hidden" name="category" value={formData.category} />

            <div className="flex justify-center gap-4 mt-6">
              <button
                type="submit"
                className="px-6 py-2 text-white bg-green-500 rounded hover:bg-green-600"
              >
                {id ? 'Update' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2 text-white bg-orange-500 rounded hover:bg-orange-600"
              >
                Close
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SubCategoryForm;
