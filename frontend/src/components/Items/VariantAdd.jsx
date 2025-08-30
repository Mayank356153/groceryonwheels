import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";
import LoadingScreen from "../../Loading";
import { BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt } from "react-icons/fa";

function VariantAdd() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const variantId = searchParams.get("variantId"); // If exists, we are in edit mode
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    variantName: "",
    description: "",
    status: "Active",
  });
 useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[])
  // If editing, fetch the variant details from the backend
  useEffect(() => {
    if (variantId) {
      const fetchVariant = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem("token");
          const res = await axios.get(
            `api/variants/${variantId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const data = res.data.data;
          setFormData({
            variantName: data.variantName || "",
            description: data.description || "",
            status: data.status || "Active",
          });
        } catch (error) {
          console.error("Error fetching variant:", error.message);
          alert("Error fetching variant");
        } finally {
          setLoading(false);
        }
      };
      fetchVariant();
    }
  }, [variantId]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      if (variantId) {
        // Update variant
        await axios.put(
          `api/variants/${variantId}`,
          formData,
          { headers }
        );
        alert("Variant updated successfully!");
      } else {
        // Create new variant
        await axios.post(
          "api/variants",
          formData,
          { headers }
        );
        alert("Variant created successfully!");
      }
      // Navigate back to the variants list page
      navigate("/variants-list");
    } catch (error) {
      console.error("Error submitting variant:", error.message);
      alert("Error submitting variant");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate("/variants-list");
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <div
          className={`flex-grow p-6  transition-all duration-300 `}
        >
          {/* Header with Breadcrumbs */}
          <header className="flex flex-col items-center justify-between mb-6 md:flex-row">
            <h2 className="text-lg font-bold md:text-xl">
              {variantId ? "Edit Variant" : "Add Variant"}
            </h2>
            <nav className="flex items-center text-sm text-gray-500">
              <a
                href="/dashboard"
                className="flex items-center text-gray-700 no-underline hover:text-cyan-600"
              >
                <FaTachometerAlt className="mr-2 text-gray-500" /> Home
              </a>
              <BiChevronRight className="mx-2 text-gray-400 mt-1.5" />
              <a
                href="/variants-list"
                className="text-gray-700 no-underline hover:text-cyan-600"
              >
                Variants List
              </a>
            </nav>
          </header>
          <div className="p-6 bg-white rounded shadow-md ">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Variant Name</label>
                <input
                  type="text"
                  name="variantName"
                  value={formData.variantName}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring focus:border-cyan-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring focus:border-cyan-500"
                  rows="4"
                ></textarea>
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring focus:border-cyan-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="submit"
                  className="px-4 py-2 text-white transition-colors rounded bg-cyan-500 hover:bg-cyan-600"
                  disabled={loading}
                >
                  {variantId ? "Update Variant" : "Create Variant"}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-white transition-colors bg-orange-500 rounded hover:bg-orange-600"
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

export default VariantAdd;
