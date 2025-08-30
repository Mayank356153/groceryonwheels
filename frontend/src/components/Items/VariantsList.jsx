import React, { useState, useEffect } from "react";
import { FaTachometerAlt, FaEdit, FaTrash } from "react-icons/fa";
import { BiChevronRight } from "react-icons/bi";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import axios from "axios";
import LoadingScreen from "../../Loading";
import { useNavigate } from "react-router-dom";

function VariantsList() {
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionMenu, setActionMenu] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
 useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[])
  // Fetch variants from API
  const fetchVariants = async () => {
    try {
      setLoading(true);
      const res = await axios.get("api/variants", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setVariants(res.data.data);
    } catch (error) {
      console.error("Error fetching variants:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariants();
  }, []);

  // Delete a variant
  const deleteVariant = async (id) => {
    if (!window.confirm("Do you want to delete this variant?")) return;
    try {
      await axios.delete(`api/variants/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      alert("Deleted Successfully");
      fetchVariants();
    } catch (error) {
      console.error("Error deleting variant:", error);
      alert("Error deleting variant");
    }
  };

  // Toggle status (active/inactive)
  const toggleStatus = async (id, currentStatus) => {
    const token = localStorage.getItem("token");
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      await axios.put(
        `api/variants/${id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchVariants();
    } catch (error) {
      console.error("Error toggling status:", error.message);
      alert("Error updating status");
    }
  };

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const totalPages = Math.ceil(variants.length / itemsPerPage);
  const currentVariants = variants.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      {/* Main layout: Sidebar & Content */}
      <div className="flex flex-grow bg-gray-200 md:flex-row">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <div className="flex-grow p-4 transition-all duration-300 bg-white">
          {/* Header */}
          <header className="flex flex-col items-center justify-between mb-6 md:flex-row">
            <h2 className="text-lg font-bold md:text-xl">Variants List</h2>
            <nav className="flex items-center text-sm text-gray-500">
              <a
                href="/dashboard"
                className="flex items-center text-gray-700 no-underline hover:text-cyan-600"
              >
                <FaTachometerAlt className="mr-2 text-gray-500" /> Home
              </a>
              <BiChevronRight className="mx-2 text-gray-400" />
              <a href="#" className="text-gray-700 no-underline hover:text-cyan-600">
                Variants List
              </a>
            </nav>
          </header>

          {/* Actions Toolbar */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Variants List</h2>
            <button
              className="px-4 py-2 font-bold text-white rounded bg-cyan-500 hover:bg-cyan-700 focus:outline-none focus:shadow-outline"
              onClick={() => navigate("/variant-add")}
            >
              + Create Variant
            </button>
          </div>

          {/* Variants Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-collapse border-gray-300 md:text-base">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-2 py-1 border">#</th>
                  <th className="px-2 py-1 border">Variant Name</th>
                  <th className="px-2 py-1 border">Description</th>
                  <th className="px-2 py-1 border">Status</th>
                  <th className="px-2 py-1 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentVariants.length <= 0 ? (
                  <tr className="text-lg">
                    <td className="p-1 text-center border" colSpan="5">
                      No data available
                    </td>
                  </tr>
                ) : (
                  currentVariants.map((variant, index) => (
                    <tr key={variant._id} className="text-sm">
                      <td className="px-2 py-1 border">
                        {indexOfFirstItem + index + 1}
                      </td>
                      <td className="px-2 py-1 border">{variant.variantName}</td>
                      <td className="px-2 py-1 border">
                        {variant.description || "NA"}
                      </td>
                      <td className="px-2 py-1 border">
                        <button
                          className={`px-2 py-1 rounded-lg ${
                            variant.status.toUpperCase() === ("ACTIVE" || "active")
                              ? "bg-green-500 text-white"
                              : "bg-red-500 text-white"
                          }`}
                          onClick={() =>
                            toggleStatus(variant._id, variant.status)
                          }
                        >
                          {variant.status.charAt(0).toUpperCase() +
                            variant.status.slice(1)}
                        </button>
                      </td>
                      <td className="relative p-2 border">
                        <button
                          className="px-2 py-1 text-white rounded bg-cyan-500"
                          onClick={() =>
                            setActionMenu(
                              actionMenu === variant._id ? null : variant._id
                            )
                          }
                        >
                          Action ▼
                        </button>
                        {actionMenu === variant._id && (
                          <div className="absolute left-0 z-40 mt-1 bg-white border shadow-lg top-full w-28">
                            <button
                              className="flex items-center w-full px-2 py-1 hover:bg-gray-100"
                              onClick={() =>
                                navigate(`/variant-add?variantId=${variant._id}`)
                              }
                            >
                              <FaEdit className="mr-2" /> Edit
                            </button>
                            <button
                              className="flex items-center w-full px-2 py-1 text-red-500 hover:bg-gray-100"
                              onClick={() => deleteVariant(variant._id)}
                            >
                              <FaTrash className="mr-2" /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col items-center justify-between mt-4 md:flex-row">
              {/* <p className="text-sm">Showing {(currentPage - 1) * entriesPerPage + 1} to {Math.min(currentPage * entriesPerPage, variants.length)} of {variants.length} entries</p> */}
              <div className="flex gap-1">
                <button
                  className={`px-2 py-1 rounded ${currentPage === 1 ? "bg-gray-300 cursor-not-allowed" : "bg-blue-500 text-white"}`}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </button>
                {/* <span className="px-3 py-1 text-white bg-blue-500 rounded">{currentPage}</span> */}
                <button
                  className={`px-2 py-1 rounded ${currentPage === totalPages ? "bg-gray-300 cursor-not-allowed" : "bg-blue-500 text-white"}`}
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </button>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default VariantsList;
