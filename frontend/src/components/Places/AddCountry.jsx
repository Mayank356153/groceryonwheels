// src/components/Countries/AddCountry.jsx
import React, { useState, useEffect } from "react";
import { Navigate, useNavigate, useParams, NavLink } from "react-router-dom";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";
import axios from "axios";
import LoadingScreen from "../../Loading";
import { BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt } from "react-icons/fa";

function AddCountry() {
  // Hooks
  const { countryId } = useParams();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    countryName: "",
    countryCode: "",
    status: "active",
  });

  // Sidebar collapse on small screens
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  // Fetch country if editing
  useEffect(() => {
    if (!countryId) return;
    const fetchCountry = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `api/countries/${countryId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = res.data.data;
        setFormData({
          countryName: data.countryName || "",
          countryCode: data.countryCode || "",
          status: data.status || "active",
        });
      } catch (error) {
        console.error("Error fetching country:", error);
        alert("Error fetching country data.");
      } finally {
        setLoading(false);
      }
    };
    fetchCountry();
  }, [countryId]);

  // Admin guard
  const role = localStorage.getItem("role");
  if (role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // Form handlers
  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      if (countryId) {
        await axios.put(
          `api/countries/${countryId}`,
          formData,
          { headers }
        );
        alert("Country updated successfully!");
      } else {
        await axios.post(
          `api/countries`,
          formData,
          { headers }
        );
        alert("Country created successfully!");
      }
      navigate("/country-list");
    } catch (error) {
      console.error("Error submitting country:", error);
      alert("Error submitting country.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => navigate("/country-list");

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <div className="flex-grow p-4 transition-all duration-300 w-full">
          <h1 className="mb-2 text-2xl font-bold">
            {countryId ? "Edit Country" : "Add Country"}
          </h1>
          <nav className="flex items-center text-xs text-gray-500 mb-4">
            <NavLink
              to="/dashboard"
              className="flex items-center no-underline hover:text-cyan-600"
            >
              <FaTachometerAlt className="mr-2" /> Home
            </NavLink>
            <NavLink
              to="/country-list"
              className="flex items-center no-underline hover:text-cyan-600 mx-2"
            >
              <BiChevronRight className="text-gray-400 mt-1.5" />
              Country List
            </NavLink>
            <BiChevronRight className="mx-2 text-gray-400 mt-1.5" />
            <span>{countryId ? "Edit Country" : "Add Country"}</span>
          </nav>
          <div className="p-6 bg-white rounded shadow-md">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block mb-1 font-semibold">
                  Country Name
                </label>
                <input
                  type="text"
                  name="countryName"
                  value={formData.countryName}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold">
                  Country Code
                </label>
                <input
                  type="text"
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-green-500 rounded hover:bg-green-600"
                >
                  {countryId ? "Update Country" : "Create Country"}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-white bg-orange-500 rounded hover:bg-orange-600"
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

export default AddCountry;
