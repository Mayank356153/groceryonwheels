import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import LoadingScreen from "../../Loading";
import { FaTachometerAlt } from "react-icons/fa";

const AddTax = () => {
  const { taxId } = useParams(); // if present, we're in edit mode
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [taxData, setTaxData] = useState({
    taxName: "",
    taxPercentage: 0,
    status: "active",
  });
 useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[])
  // Fetch tax details if editing
  useEffect(() => {
    if (taxId) {
      const fetchTax = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem("token");
          const res = await axios.get(`api/taxes/${taxId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setTaxData({
            taxName: res.data.data.taxName || "",
            taxPercentage: res.data.data.taxPercentage || 0,
            status: res.data.data.status || "active",
          });
        } catch (error) {
          console.error("Error fetching tax:", error.message);
        } finally {
          setLoading(false);
        }
      };
      fetchTax();
    }
  }, [taxId]);

  const handleChange = (e) => {
    setTaxData({ ...taxData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (taxId) {
        // Update tax
        await axios.put(`api/taxes/${taxId}`, taxData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Tax updated successfully!");
      } else {
        // Create new tax
        await axios.post("api/taxes", taxData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Tax created successfully!");
      }
      navigate("/tax-list"); // Navigate back to the tax list
    } catch (error) {
      console.error("Error submitting tax:", error.message);
      alert("Error submitting tax");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Navbar */}
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      {/* Main Layout: Sidebar & Content */}
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <div className={`flex-grow  flex flex-col p-4 md:p-6 `}>
          {/* Header */}
          <header className="flex flex-col items-center justify-between p-4 mb-2 bg-white rounded-md shadow sm:flex-row">
            <div className="flex items-baseline gap-2 sm:flex-row">
              <h1 className="text-xl font-semibold">{taxId ? "Edit Tax" : "Add Tax"}</h1>
              <span className="text-sm text-gray-600">
                {taxId ? "Update Tax" : "Create Tax"}
              </span>
            </div>
            <nav className="flex items-center text-sm text-gray-500">
              <a href="/dashboard" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                <FaTachometerAlt className="mr-2" /> Home
              </a>
              <span className="mx-2">/</span>
              <a href="/tax-list" className="text-gray-700 no-underline hover:text-cyan-600">
                Tax List
              </a>
            </nav>
          </header>

          {/* Form */}
          <div className="p-6 bg-white rounded shadow-md">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Tax Name</label>
                <input
                  type="text"
                  name="taxName"
                  value={taxData.taxName}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Tax Percentage (%)</label>
                <input
                  type="number"
                  name="taxPercentage"
                  value={taxData.taxPercentage}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Status</label>
                <select
                  name="status"
                  value={taxData.status}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button type="submit" className="px-4 py-2 font-semibold text-white bg-green-500 rounded hover:bg-green-600">
                  {taxId ? "Update Tax" : "Save Tax"}
                </button>
                <button type="button" onClick={() => navigate("/tax-list")} className="px-4 py-2 font-semibold text-white bg-orange-500 rounded hover:bg-orange-600">
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTax;
