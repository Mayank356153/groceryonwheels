// SubscriptionList.jsx
import React, { useState, useEffect } from "react";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";
import { FaTachometerAlt, FaEdit, FaTrash } from "react-icons/fa";
import { BiChevronRight } from "react-icons/bi";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import LoadingScreen from "../../Loading";

const SubscriptionList = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [entries, setEntries] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Use searchParams to extract the storeId from the URL if available.
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get("storeId");

  // Fetch subscriptions from the backend.
  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      // If storeId is provided, filter by it
      const url = storeId 
        ? `api/subscriptions?storeId=${storeId}` 
        : `api/subscriptions`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubscriptions(res.data.data || []);
    } catch (error) {
      console.error("Error fetching subscriptions:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [storeId]);

  // Filter subscriptions by packageName (case insensitive)
  const filteredSubscriptions = subscriptions.filter((sub) =>
    sub.packageName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const indexOfLastItem = currentPage * entries;
  const indexOfFirstItem = indexOfLastItem - entries;
  const currentItems = filteredSubscriptions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSubscriptions.length / entries);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Export functionalities
  const handleCopy = () => {
    const data = filteredSubscriptions
      .map(
        (sub) =>
          `${sub.packageName}, ${sub.category}, ${sub.productCount}, ${sub.total}, ${sub.status}`
      )
      .join("\n");
    navigator.clipboard.writeText(data);
    alert("Data copied to clipboard!");
  };

  const handleExcelDownload = () => {
    const ws = XLSX.utils.json_to_sheet(filteredSubscriptions);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Subscriptions");
    XLSX.writeFile(wb, "subscriptions.xlsx");
  };

  const handlePdfDownload = () => {
    const doc = new jsPDF();
    doc.text("Subscriptions List", 20, 20);
    const tableData = filteredSubscriptions.map((sub) => [
      sub.packageName,
      sub.category,
      sub.productCount,
      sub.total,
      sub.status,
    ]);
    autoTable(doc, {
      head: [["Package Name", "Category", "Product Count", "Total", "Status"]],
      body: tableData,
    });
    doc.save("subscriptions.pdf");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCsvDownload = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      filteredSubscriptions
        .map((sub) =>
          `${sub.packageName},${sub.category},${sub.productCount},${sub.total},${sub.status}`
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "subscriptions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Delete a subscription
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this subscription?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`api/subscriptions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Subscription deleted successfully!");
      fetchSubscriptions();
    } catch (error) {
      console.error("Error deleting subscription:", error.message);
      alert("Error deleting subscription");
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      {/* Main Layout */}
      <div className="flex flex-grow">
        <div className="w-auto">
          
        <Sidebar isSidebarOpen={isSidebarOpen} />
        </div>
        <div className={`overflow-x-auto  p-4 transition-all duration-300 w-full`}>
          <header className="flex flex-col items-center justify-between p-4 mb-4 bg-gray-100 rounded-md shadow sm:flex-row">
            <div className="flex flex-col items-center gap-1 sm:flex-row">
              <h1 className="text-lg font-semibold sm:text-xl">Subscriptions List</h1>
              <span className="text-xs text-gray-600 sm:text-sm">View/Search Subscriptions</span>
            </div>
            {/* Show the "Add Subscription" button only if storeId exists */}
            {storeId && (
              <div>
                <button
                  className="px-4 py-2 text-white rounded bg-cyan-500"
                  onClick={() => navigate(`/add-subscription?storeId=${storeId}`)}
                >
                  + New Subscription
                </button>
              </div>
            )}
          </header>

          {/* Table Controls */}
          <div className="flex flex-col justify-between w-full mt-4 mb-4 space-y-2 lg:flex-row lg:space-y-0 lg:items-center">
              <div className="flex items-center px-2 space-x-2">
                <span className="text-sm">Show</span>
                <select className="p-2 text-sm border border-gray-300 rounded-md" value={entries}   onChange={(e) => {
                    setEntries(Number(e.target.value));
                    setCurrentPage(1);
                  }}>
                  <option>10</option>
                  <option>20</option>
                  <option>50</option>
                </select>
                <span className="text-sm">Entries</span>
              </div>
              <div className="flex flex-col justify-around w-full gap-2 lg:flex-row">
                <div className='flex items-center justify-around flex-1 w-full gap-1 px-2'>
                <button onClick={handleCopy} className="w-full px-3 py-2 text-sm text-white bg-cyan-500">Copy</button>
                <button onClick={handleExcelDownload} className="w-full px-3 py-2 text-sm text-white bg-cyan-500">Excel</button>
                <button onClick={handlePdfDownload} className="w-full px-3 py-2 text-sm text-white bg-cyan-500">PDF</button>
                <button onClick={handlePrint} className="w-full px-3 py-2 text-sm text-white bg-cyan-500">Print</button>
                <button onClick={handleCsvDownload} className="w-full px-3 py-2 text-sm text-white bg-cyan-500">CSV</button>
                </div>
                <input type="text" placeholder="Search" className="w-full p-2 text-sm border border-gray-300 rounded-sm md:w-auto" onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>

          {/* Subscriptions Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-lg">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-4 py-2 border">Package Name</th>
                  <th className="px-4 py-2 border">Category</th>
                  <th className="px-4 py-2 border">Product Count</th>
                  <th className="px-4 py-2 border">Total (₹)</th>
                  <th className="px-4 py-2 border">Payment Type</th>
                  <th className="px-4 py-2 border">Status</th>
                  <th className="px-4 py-2 border">Start Date</th>
                  <th className="px-4 py-2 border">End Date</th>
                  <th className="px-4 py-2 text-center border">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-4 text-center text-gray-500">
                      No matching records found
                    </td>
                  </tr>
                ) : (
                  currentItems.map((sub) => (
                    <tr key={sub._id} className="border-b">
                      <td className="px-4 py-2 border">{sub.packageName}</td>
                      <td className="px-4 py-2 border">{sub.category}</td>
                      <td className="px-4 py-2 border">{sub.productCount}</td>
                      <td className="px-4 py-2 border">{sub.total}</td>
                      <td className="px-4 py-2 border">
                        {sub.paymentType?.paymentTypeName || "N/A"}
                      </td>
                      <td className="px-4 py-2 border">{sub.status}</td>
                      <td className="px-4 py-2 border">{new Date(sub.startDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2 border">
                        {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-4 py-2 text-center border">
                        <button
                          className="px-2 py-1 mr-2 text-white rounded bg-cyan-600 hover:bg-cyan-500"
                          onClick={() => navigate(`/edit-subscription/${sub._id}?storeId=${storeId}`)}
                        >
                          Edit
                        </button>
                        <button
                          className="px-2 py-1 text-white bg-red-600 rounded hover:bg-red-500"
                          onClick={() => handleDelete(sub._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between mt-4">
            <div>
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredSubscriptions.length)} of {filteredSubscriptions.length} entries
            </div>
            <div>
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-2 py-1 mr-2 text-gray-700 bg-gray-300 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={indexOfLastItem >= filteredSubscriptions.length}
                className="px-2 py-1 ml-2 text-gray-700 bg-gray-300 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionList;
