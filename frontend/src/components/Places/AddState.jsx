// src/components/States/AddState.jsx
import React, { useState, useEffect } from "react";
import { Navigate, useNavigate, useParams, NavLink } from "react-router-dom";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";
import axios from "axios";
import LoadingScreen from "../../Loading";
import { BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt } from "react-icons/fa";

export default function AddState() {
  // Hooks
  const { stateId } = useParams();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    stateName: "",
    country: "",
    status: "active",
  });
  const [countries, setCountries] = useState([]);

  // Collapse sidebar on small screens
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  // Fetch countries & existing state
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "api/countries",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCountries(res.data.data || []);
      } catch (err) {
        console.error("Error fetching countries:", err);
      }
    };

    fetchCountries();

    if (stateId) {
      const fetchState = async (id) => {
        setLoading(true);
        try {
          const token = localStorage.getItem("token");
          const res = await axios.get(
            `api/states/${id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const data = res.data.data;
          setFormData({
            stateName: data.stateName || "",
            country: data.country || "",
            status: data.status || "active",
          });
        } catch (err) {
          console.error("Error fetching state:", err);
          alert("Error fetching state data.");
        } finally {
          setLoading(false);
        }
      };
      fetchState(stateId);
    }
  }, [stateId]);

  // Admin-only guard
  const role = localStorage.getItem("role");
  if (role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      if (stateId) {
        await axios.put(
          `api/states/${stateId}`,
          formData,
          { headers }
        );
        alert("State updated successfully!");
      } else {
        await axios.post(
          "api/states",
          formData,
          { headers }
        );
        alert("State created successfully!");
      }
      navigate("/state-list");
    } catch (err) {
      console.error("Error submitting state:", err);
      alert("Error submitting state.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => navigate("/state-list");

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <div className="flex-grow p-4 transition-all duration-300 w-full">
          <h1 className="mb-4 text-2xl font-bold">
            {stateId ? "Edit State" : "Add State"}
          </h1>
          <nav className="flex items-center text-xs text-gray-500 mb-4">
            <NavLink to="/dashboard" className="flex items-center hover:text-cyan-600">
              <FaTachometerAlt className="mr-2" /> Home
            </NavLink>
            <NavLink to="/state-list" className="flex items-center mx-2 hover:text-cyan-600">
              <BiChevronRight className="text-gray-400 mt-1.5" /> State List
            </NavLink>
            <BiChevronRight className="mx-2 text-gray-400 mt-1.5" />
            <span>{stateId ? "Edit State" : "Add State"}</span>
          </nav>

          <div className="p-6 bg-white rounded shadow-md">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block mb-1 font-semibold">State Name</label>
                <input
                  type="text"
                  name="stateName"
                  value={formData.stateName}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold">Country</label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                >
                  <option value="">Select Country</option>
                  {countries.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.countryName}
                    </option>
                  ))}
                </select>
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
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  {stateId ? "Update State" : "Create State"}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
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
