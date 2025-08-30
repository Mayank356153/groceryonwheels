import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import LoadingScreen from "../../Loading";
import { BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt } from "react-icons/fa";

function AddExpenseCategory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id"); // if present, we're editing

  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  // Form data for Expense Category
  const [formData, setFormData] = useState({
    categoryName: "",
    description: "",
    status: "Active",
  });
 useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[])
  // If editing, fetch the expense category details
  useEffect(() => {
    if (id) {
      const fetchExpenseCategory = async () => {
        setLoading(true);
        try {
          const res = await axios.get(
            `api/expense-categories/${id}`,
            {
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            }
          );
          const data = res.data.data;
          setFormData({
            categoryName: data.categoryName || "",
            description: data.description || "",
            status: data.status || "Active",
          });
        } catch (error) {
          console.error("Error fetching expense category:", error.message);
        } finally {
          setLoading(false);
        }
      };
      fetchExpenseCategory();
    }
  }, [id]);

  // Handle form field changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit the form to create or update an expense category
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (id) {
        // Update mode
        await axios.put(
          `api/expense-categories/${id}`,
          formData,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        );
        alert("Expense Category updated successfully!");
      } else {
        // Create mode
        await axios.post(
          "api/expense-categories",
          formData,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        );
        alert("Expense Category created successfully!");
      }
    } catch (error) {
      console.error("Error submitting expense category:", error.message);
      alert("Error submitting expense category");
    } finally {
      setLoading(false);
    }
  };

  // Close the form without saving
  const handleClose = () => {
    navigate("/expense-category-list");
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Navbar */}
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Layout: Sidebar & Content */}
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <div className={`flex-grow p-4  transition-all duration-300 `}>
          {/* Header with Breadcrumbs */}
          <header className="flex flex-col items-center justify-between p-4 mb-4 bg-white rounded-md shadow sm:flex-row">
            <div className="flex items-baseline gap-2 sm:flex-row">
              <h1 className="text-sm font-semibold text-gray-800">
                {id ? "Edit Expense Category" : "Add Expense Category"}
              </h1>
              <span className="text-sm text-gray-600">
                {id ? "Edit Expense Category" : "Create Expense Category"}
              </span>
            </div>
            <nav className="flex items-center text-sm text-gray-500">
              <a href="/dashboard" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                <FaTachometerAlt className="mr-2" /> Home
              </a>
              <BiChevronRight className="mx-2 " />
              <a href="/expense-category-list" className="text-gray-700 no-underline hover:text-cyan-600">
                Expense Category List
              </a>
            </nav>
          </header>

          {/* Form Container */}
          <div className="p-4 bg-white border-t-4 rounded-md shadow-md border-cyan-500">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Category Name */}
                <div>
                  <label className="block mb-1 font-semibold">Category Name</label>
                  <input
                    type="text"
                    name="categoryName"
                    value={formData.categoryName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                {/* Status */}
                <div>
                  <label className="block mb-1 font-semibold">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block mb-1 font-semibold">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  ></textarea>
                </div>
              </div>
              {/* Form Buttons */}
              <div className="flex justify-end mt-4 space-x-2">
                <button
                  type="submit"
                  className="px-6 py-2 font-semibold text-white bg-green-500 rounded-md shadow hover:bg-green-600"
                >
                  {id ? "Update Category" : "Create Category"}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2 font-semibold text-white bg-orange-500 rounded-md shadow hover:bg-orange-600"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddExpenseCategory;
