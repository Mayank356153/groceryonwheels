import React, { useState, useEffect } from "react";
import { FaTachometerAlt } from "react-icons/fa";
import { BiChevronRight } from "react-icons/bi";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";

function PaymentTypesList() {
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
 useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[])
  // Data from backend
  const [paymentTypes, setPaymentTypes] = useState([]);
  // Searching
  const [searchTerm, setSearchTerm] = useState("");
  // Pagination
  const [entries, setEntries] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // 1) Fetch payment types from /api/payment-types
  const fetchPaymentTypes = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("api/payment-types", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // data should be in res.data.data
      setPaymentTypes(res.data.data || []);
    } catch (error) {
      console.error("Error fetching payment types:", error.message);
    }
  };

  useEffect(() => {
    fetchPaymentTypes();
  }, []);

  // 2) Client-side search filter
  const filteredTypes = paymentTypes.filter((pt) =>
    pt.paymentTypeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 3) Pagination
  const indexOfLastItem = currentPage * entries;
  const indexOfFirstItem = indexOfLastItem - entries;
  const currentItems = filteredTypes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTypes.length / entries);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // 4) Export functionalities
  const handleCopy = () => {
    const data = filteredTypes
      .map((pt) => `${pt.paymentTypeName}, ${pt.status}`)
      .join("\n");
    navigator.clipboard.writeText(data);
    alert("Data copied to clipboard!");
  };

  const handleExcelDownload = () => {
    const ws = XLSX.utils.json_to_sheet(filteredTypes);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PaymentTypes");
    XLSX.writeFile(wb, "payment_types.xlsx");
  };

  const handlePdfDownload = () => {
    const doc = new jsPDF();
    doc.text("Payment Types List", 20, 20);
    const tableData = filteredTypes.map((pt) => [
      pt.paymentTypeName,
      pt.status,
    ]);
    autoTable(doc, {
      head: [["Payment Type Name", "Status"]],
      body: tableData,
    });
    doc.save("payment_types.pdf");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCsvDownload = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      filteredTypes
        .map((pt) => `${pt.paymentTypeName},${pt.status}`)
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "payment_types.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 5) Toggle status (active <-> inactive)
  const handleToggleStatus = async (paymentType) => {
    try {
      const newStatus =
        paymentType.status === "active" ? "inactive" : "active";
      const token = localStorage.getItem("token");
      await axios.put(
        `api/payment-types/${paymentType._id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchPaymentTypes(); // Refresh list
    } catch (error) {
      console.error("Error toggling status:", error.message);
    }
  };

  // 6) Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this payment type?"))
      return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `api/payment-types/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Payment Type deleted successfully!");
      fetchPaymentTypes();
    } catch (error) {
      console.error("Error deleting payment type:", error.message);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        {/* Sidebar */}
        <Sidebar isSidebarOpen={isSidebarOpen} />

        {/* Content */}
        <div
          className={`flex-grow flex flex-col p-2 md:p-2 min-h-screen w-full`}
        >
          {/* Header */}
          <header className="flex flex-col items-center justify-between p-4 mb-2 bg-gray-100 rounded-md shadow sm:flex-row">
            <div className="flex items-baseline gap-1 text-center sm:flex-row sm:text-left">
              <h1 className="text-lg font-semibold truncate sm:text-xl">
                Payment Types
              </h1>
              <span className="text-xs text-gray-600 sm:text-sm">
                View/Search Records
              </span>
            </div>
            <nav className="flex flex-wrap items-center justify-center mt-2 text-xs text-gray-500 sm:justify-start sm:text-sm sm:mt-0">
              <a
                href="#"
                className="flex items-center text-gray-700 no-underline hover:text-cyan-600"
              >
                <FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600" />{" "}
                Home
              </a>
              <BiChevronRight className="mx-1 sm:mx-2" />
              <a
                href="#"
                className="text-gray-700 no-underline hover:text-cyan-600"
              >
                Payment Types List
              </a>
            </nav>
          </header>

          {/* Main Card */}
          <div className="p-4 bg-white border-t-4 rounded-lg shadow-md border-cyan-500">
            <header className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Payment Types</h2>
              <button
                className="px-4 py-2 text-white rounded bg-cyan-500"
                onClick={() => navigate("/add-payment-type")}
              >
                + Create New
              </button>
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

            {/* Table */}
            <table className="min-w-full bg-white border-collapse rounded-lg shadow-lg">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-4 py-2 border">Payment Type Name</th>
                  <th className="px-4 py-2 border">Status</th>
                  <th className="px-4 py-2 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan="3"
                      className="p-4 text-center text-gray-500 border"
                    >
                      No matching records found
                    </td>
                  </tr>
                ) : (
                  currentItems.map((pt) => (
                    <tr key={pt._id} className="border-b">
                      <td className="px-4 py-2 border">{pt.paymentTypeName}</td>
                      <td className="px-4 py-2 border">
                        <button
                          className={`px-2 py-1 rounded-lg ${
                            pt.status === "active"
                              ? "bg-green-500 text-white"
                              : "bg-red-500 text-white"
                          }`}
                          onClick={() => handleToggleStatus(pt)}
                        >
                          {pt.status}
                        </button>
                      </td>
                      <td className="px-4 py-2 text-center border">
                        <button
                          className="px-2 py-1 mr-2 text-white rounded bg-cyan-600 hover:bg-cyan-500 focus:outline-none"
                          onClick={() =>
                            navigate(`/edit-payment-type/${pt._id}`)
                          }
                        >
                          Edit
                        </button>
                        <button
                          className="px-2 py-1 text-white bg-red-600 rounded hover:bg-red-500 focus:outline-none"
                          onClick={() => handleDelete(pt._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex justify-between mt-4">
              <div>
                Showing {indexOfFirstItem + 1} to{" "}
                {Math.min(indexOfLastItem, filteredTypes.length)} of{" "}
                {filteredTypes.length} entries
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
                  disabled={indexOfLastItem >= filteredTypes.length}
                  className="px-2 py-1 ml-2 text-gray-700 bg-gray-300 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentTypesList;
