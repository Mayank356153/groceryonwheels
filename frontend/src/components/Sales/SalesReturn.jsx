import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import LoadingScreen from "../../Loading";

const SalesReturn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const saleId = queryParams.get('saleId');

  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
    // Fetch sale details for return if needed
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Implement sales return logic here
    navigate('/sales-list');
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="box-border flex min-h-screen">
        <div className="w-auto">
          <Sidebar isSidebarOpen={isSidebarOpen} />
        </div>
        <div className="flex flex-col p-2 md:p-2 w-full mx-auto overflow-x-auto">
          <header className="flex flex-col items-center justify-between px-2 py-2 mb-2 bg-gray-100 rounded-md shadow md:flex-row">
            <div className="flex items-baseline gap-1 text-center sm:flex-row sm:text-left">
              <h1 className="text-lg font-semibold truncate sm:text-xl">
                Sales Return
              </h1>
              <span className="text-xs text-gray-600 sm:text-sm">
                Return for Sale {saleId}
              </span>
            </div>
          </header>
          <div className="p-4 bg-white shadow-md rounded-md mt-3 border-t-4 border-cyan-500">
            <form onSubmit={handleSubmit}>
              <p>Form to process sales return for sale {saleId} will be implemented here.</p>
              <div className="mt-4">
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-cyan-500 rounded-md hover:bg-cyan-600"
                >
                  Submit Return
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesReturn;