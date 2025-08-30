import React, { useState, useEffect, useRef } from "react";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import { useNavigate } from "react-router-dom";

const StoreView = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [stores, setStores] = useState([]);
  const [actionMenu, setActionMenu] = useState(null);
  const [error, setError] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const navigate = useNavigate();
  const menuRef = useRef(null); // Ref for outside click detection
  const buttonRefs = useRef({}); // Store refs for each action button
  const menuRefs = useRef({});

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActionMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch store list from the API
  useEffect(() => {
    const fetchStores = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please log in.");
        return;
      }
      try {
        const response = await fetch("/admin/store/add/store", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch stores: ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Fetched stores data:", data);
        const storeList = Array.isArray(data) ? data : data.result || data.stores || [];
        if (!storeList.length) {
          console.warn("No stores found in response");
        }
        setStores(storeList);
        setError(null);
      } catch (error) {
        console.error("Error fetching stores:", error);
        setError("Failed to load stores. Please try again.");
      }
    };
    fetchStores();
  }, []);

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStores = stores.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(stores.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) setCurrentPage(pageNumber);
  };

  // Toggle the action dropdown and calculate position
  const toggleActionMenu = (storeId, event) => {
    if (actionMenu === storeId) {
      setActionMenu(null);
      return;
    }
    setActionMenu(storeId);

    // Calculate popup position
    const button = buttonRefs.current[storeId];
    if (button) {
      const rect = button.getBoundingClientRect();
      const popupWidth = 192; // w-48 in Tailwind (48 * 4px)
      const popupHeight = 160; // Approximate height (4 items * ~40px)
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = rect.bottom + 8; // 8px below button
      let left = rect.right - popupWidth; // Align right edge with button's right

      // Adjust if popup would go off-screen
      if (left < 8) left = 8; // Keep 8px from left edge
      if (top + popupHeight > viewportHeight - 8) {
        top = rect.top - popupHeight - 8; // Move above button
      }
      if (top < 8) top = 8; // Keep 8px from top edge

      setPopupPosition({ top, left });
    }
  };

  // Handle delete store
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this store?")) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/admin/store/store/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete store");
      }
      alert("Store deleted successfully!");
      const res = await fetch("/admin/store/add/store", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch stores after deletion");
      }
      const data = await res.json();
      const storeList = Array.isArray(data) ? data : data.result || data.stores || [];
      setStores(storeList);
      setError(null);
    } catch (error) {
      console.error("Error deleting store:", error.message);
      alert(`Error: ${error.message}`);
      setError("Failed to delete store. Please try again.");
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow bg-gray-200">
        {/* Sidebar */}
        <div className="w-auto">
          <Sidebar isSidebarOpen={isSidebarOpen} />
        </div>
        {/* Main Content */}
        <div className="w-full p-8 mx-auto bg-white">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">
              Store List
              <span className="text-black text-[16px]">View/Search Items Store</span>
            </h1>
            <button
              className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors duration-200"
              onClick={() => navigate("/store/add")}
            >
              + Create Store
            </button>
          </div>
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
          {/* Items per page dropdown */}
          <div className="flex justify-start mb-4">
            <label className="mr-2 font-semibold text-gray-700">Items per page:</label>
            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="75">75</option>
              <option value="100">100</option>
            </select>
          </div>
          <div className="relative">
            {/* Store table */}
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-4 py-2 text-left">#</th>
                  <th className="px-4 py-2 text-left">Store Code</th>
                  <th className="px-4 py-2 text-left">Store Name</th>
                  <th className="px-4 py-2 text-left">Mobile</th>
                  <th className="px-4 py-2 text-left">Address</th>
                  <th className="px-4 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {stores.length === 0 && !error ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-2 text-center">
                      No stores found.
                    </td>
                  </tr>
                ) : (
                  currentStores.map((store, index) => (
                    <tr key={store._id || index} className="relative border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{indexOfFirstItem + index + 1}</td>
                      <td className="px-4 py-2">{store.StoreCode || "N/A"}</td>
                      <td className="px-4 py-2">{store.StoreName || "N/A"}</td>
                      <td className="px-4 py-2">{store.Mobile || "N/A"}</td>
                      <td className="px-4 py-2">{store.Address || "N/A"}</td>
                      <td className="px-4 py-2">
  <div>
    <button
      ref={(el) => (buttonRefs.current[store._id] = el)}
      className="px-3 py-1.5 font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      onClick={(e) => toggleActionMenu(store._id, e)}
    >
      Action
    </button>
    {actionMenu === store._id && (
      <div
        ref={(el) => (menuRefs.current[store._id] = el)} // Unique ref for each dropdown
        className="fixed bg-white border border-gray-200 rounded-lg shadow-xl z-[100] w-48 animate-slide-in"
        style={{
          top: `${popupPosition.top}px`,
          left: `${popupPosition.left}px`,
          animation: "slideIn 0.15s ease-in-out forwards",
        }}
      >
        <button
          className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150"
          onClick={(e) => {
            e.stopPropagation(); // Prevent event bubbling
            setActionMenu(null); // Close dropdown
            navigate(`/admin/store/edit?id=${store._id}`);
          }}
        >
          Edit
        </button>
        <button
          className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-150"
          onClick={(e) => {
            e.stopPropagation(); // Prevent event bubbling
            setActionMenu(null); // Close dropdown
            handleDelete(store._id);
          }}
        >
          Delete
        </button>
        <button
          className="w-full px-4 py-2 text-left text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
          onClick={(e) => {
            e.stopPropagation(); // Prevent event bubbling
            setActionMenu(null); // Close dropdown
            navigate(`/subscription-list?storeId=${store._id}`);
          }}
        >
          View Subscriptions
        </button>
        <button
          className="w-full px-4 py-2 text-left text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
          onClick={(e) => {
            e.stopPropagation(); // Prevent event bubbling
            setActionMenu(null); // Close dropdown
            navigate(`/add-subscription?storeId=${store._id}`);
          }}
        >
          Add Subscription
        </button>
      </div>
    )}
  </div>
</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination controls */}
          {stores.length > 0 && (
            <div className="flex justify-center mt-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  className={`mx-1 px-4 py-2 rounded-lg transition-colors duration-200 ${
                    currentPage === pageNumber
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  onClick={() => handlePageChange(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreView;