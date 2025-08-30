import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";
import axios from "axios";

function AddUnit() {
  const navigate = useNavigate();
  const { unitId } = useParams(); // If present, we are editing

  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    unitName: "",
    description: "",
    status: "active",
  });
 useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[])
  // If editing, fetch the unit details
  useEffect(() => {
    if (unitId) {
      fetchUnit(unitId);
    }
  }, [unitId]);

  const fetchUnit = async (id) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`api/units/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data.data;
      setFormData({
        unitName: data.unitName || "",
        description: data.description || "",
        status: data.status || "active",
      });
    } catch (error) {
      console.error("Error fetching unit:", error.message);
      alert("Error fetching unit data.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      if (unitId) {
        // Update existing unit
        await axios.put(
          `api/units/${unitId}`,
          formData,
          { headers }
        );
        alert("Unit updated successfully!");
      } else {
        // Create new unit
        await axios.post("api/units", formData, {
          headers,
        });
        alert("Unit created successfully!");
      }
      navigate("/units-list"); // or wherever your units list is
    } catch (error) {
      console.error("Error submitting unit:", error.message);
      alert("Error submitting unit.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate("/units-list"); // or your desired route
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Navbar */}
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      {/* Main layout: Sidebar & Content */}
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <div
          className={`flex-grow p-4 w-full transition-all duration-300 `}
        >
          
          <h1 className="mb-4 text-2xl font-bold">
            {unitId ? "Edit Unit" : "Add Unit"}
          </h1>
          <div className="p-6 bg-white rounded shadow-md ">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block mb-1 font-semibold">Unit Name</label>
                <input
                  type="text"
                  name="unitName"
                  value={formData.unitName}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  rows="3"
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
                  disabled={loading}
                >
                  {unitId ? "Update" : "Save"}
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

export default AddUnit;
