import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom"; // Changed from useSearchParams to useParams
import axios from "axios";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";

function AddTaxGroup() {
  const { taxGroupId } = useParams(); // Get taxGroupId from URL
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  // Form data for the tax group
  const [formData, setFormData] = useState({
    groupName: "",
    taxes: [], // Array of selected tax IDs
    status: "active"
  });
 useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[])
  // All available taxes to select from
  const [allTaxes, setAllTaxes] = useState([]);

  // Fetch all taxes and, if editing, load the existing tax group
  useEffect(() => {
    fetchAllTaxes();
    if (taxGroupId) {
      fetchTaxGroup(taxGroupId);
    }
  }, [taxGroupId]);

  const fetchAllTaxes = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("api/taxes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllTaxes(res.data.data || []);
    } catch (error) {
      console.error("Error fetching all taxes:", error.message);
    }
  };

  const fetchTaxGroup = async (id) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`api/tax-groups/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data.data;
      setFormData({
        groupName: data.groupName || "",
        taxes: data.taxes ? data.taxes.map((t) => t._id) : [],
        status: data.status || "active"
      });
    } catch (error) {
      console.error("Error fetching tax group:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleTaxSelect = (e) => {
    const value = e.target.value;
    if (formData.taxes.includes(value)) {
      // Remove if already selected
      setFormData((prev) => ({
        ...prev,
        taxes: prev.taxes.filter((t) => t !== value)
      }));
    } else {
      // Add if not selected
      setFormData((prev) => ({
        ...prev,
        taxes: [...prev.taxes, value]
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      if (taxGroupId) {
        // Update existing tax group
        await axios.put(
          `api/tax-groups/${taxGroupId}`,
          formData,
          { headers }
        );
        alert("Tax Group updated successfully!");
      } else {
        // Create new tax group
        await axios.post(
          "api/tax-groups",
          formData,
          { headers }
        );
        alert("Tax Group created successfully!");
      }
      navigate("/tax-list"); // Navigate back to the tax list
    } catch (error) {
      console.error("Error submitting tax group:", error.message);
      alert("Error submitting tax group.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate("/tax-list"); // Navigate to the tax list page
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Navbar */}
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Layout: Sidebar & Content */}
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <div className={`flex-grow w-full p-4 transition-all duration-300 `}>
          <h1 className="mb-4 text-xl font-bold">{taxGroupId ? "Edit Tax Group" : "Add Tax Group"}</h1>
          <div className="p-4 bg-white rounded-md shadow-md ">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block mb-1 font-semibold">Group Name</label>
                <input
                  type="text"
                  name="groupName"
                  value={formData.groupName}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              {/* Sub Taxes selection */}
              <div className="mb-4">
                <label className="block mb-1 font-semibold">Sub Taxes</label>
                <div className="flex flex-wrap gap-2">
                  {allTaxes.map((tax) => (
                    <label key={tax._id} className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        value={tax._id}
                        checked={formData.taxes.includes(tax._id)}
                        onChange={handleTaxSelect}
                      />
                      <span>
                        {tax.taxName} ({tax.taxPercentage}%)
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              {/* Status selection */}
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
                  disabled={loading}
                  className="px-4 py-2 text-white bg-green-500 rounded hover:bg-green-600"
                >
                  {taxGroupId ? "Update Tax Group" : "Save"}
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

export default AddTaxGroup;
