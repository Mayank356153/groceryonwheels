// src/components/States/StateList.jsx
import React, { useState, useEffect } from "react";
import { Navigate, useNavigate, NavLink } from "react-router-dom";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";
import axios from "axios";
import { BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt } from "react-icons/fa";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function StateList() {
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [states, setStates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [entries, setEntries] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // collapse sidebar on small
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  // fetch states
  const fetchStates = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "api/states",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStates(res.data.data || []);
    } catch (err) {
      console.error("Error fetching states:", err);
    }
  };

  useEffect(() => {
    fetchStates();
  }, []);

  // admin guard
  const role = localStorage.getItem("role");
  if (role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }
  // 1️⃣ Add this function alongside your other handlers:
const toggleStatus = async (id, currentStatus) => {
  const newStatus = currentStatus === "active" ? "inactive" : "active";
  try {
    const token = localStorage.getItem("token");
    // use PUT to hit your existing update route
    await axios.put(
      `api/states/${id}`,
      { status: newStatus },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // optimistically update UI
    setStates((prev) =>
      prev.map((st) =>
        st._id === id ? { ...st, status: newStatus } : st
      )
    );
  } catch (err) {
    console.error("Error toggling status:", err.response || err);
    alert("Could not change status");
  }
};


  // filter and paginate
  const filtered = states.filter((st) =>
    st.stateName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const last = currentPage * entries;
  const first = last - entries;
  const currentItems = filtered.slice(first, last);
  const totalPages = Math.ceil(filtered.length / entries);
  const paginate = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // export handlers
  const handleCopy = () => {
    const text = filtered
      .map((st) => `${st.stateName},${st.country.countryName},${st.status}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard");
  };
  const handleExcelDownload = () => {
    const ws = XLSX.utils.json_to_sheet(filtered.map(st => ({
      "State Name": st.stateName,
      "Country": st.country.countryName,
      "Status": st.status
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "States");
    XLSX.writeFile(wb, "states.xlsx");
  };
  const handlePdfDownload = () => {
    const doc = new jsPDF();
    doc.text("States List", 20, 20);
    autoTable(doc, {
      head: [["State Name", "Country", "Status"]],
      body: filtered.map((st) => [st.stateName, st.country.countryName, st.status]),
    });
    doc.save("states.pdf");
  };
  const handlePrint = () => window.print();
  const handleCsvDownload = () => {
    const csv = "data:text/csv;charset=utf-8," +
      filtered.map(st => `${st.stateName},${st.country.countryName},${st.status}`).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = "states.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this state?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `api/states/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("State deleted");
      fetchStates();
    } catch (err) {
      console.error("Error deleting state:", err);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <div className="overflow-x-auto p-4 w-full transition-all duration-300">
          {/* header & breadcrumbs */}
          <header className="flex justify-between p-4 mb-2 bg-gray-100 rounded shadow">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">State List</h1>
            </div>
            <nav className="flex items-center text-xs text-gray-500">
              <NavLink to="/dashboard" className="flex items-center hover:text-cyan-600">
                <FaTachometerAlt className="mr-1" /> Home
              </NavLink>
              <BiChevronRight className="mx-1" />
              <span>State List</span>
            </nav>
          </header>

          <div className="p-4 bg-white border-t-4 border-cyan-500 rounded shadow">
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold">States</h2>
              <button
                onClick={() => navigate("/add-state")}
                className="px-4 py-2 bg-cyan-500 text-white rounded"
              >
                + New State
              </button>
            </div>

            {/* controls */}
            <div className="flex flex-wrap justify-between mb-4 gap-2">
              <div className="flex items-center gap-1">
                <span>Show</span>
                <select
                  className="p-1 border rounded"
                  value={entries}
                  onChange={(e) => { setEntries(+e.target.value); setCurrentPage(1); }}
                >
                  {[10,20,50].map(n => <option key={n}>{n}</option>)}
                </select>
                <span>entries</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={handleCopy} className="px-2 py-1 bg-cyan-500 text-white rounded">Copy</button>
                <button onClick={handleExcelDownload} className="px-2 py-1 bg-cyan-500 text-white rounded">Excel</button>
                <button onClick={handlePdfDownload} className="px-2 py-1 bg-cyan-500 text-white rounded">PDF</button>
                <button onClick={handlePrint} className="px-2 py-1 bg-cyan-500 text-white rounded">Print</button>
                <button onClick={handleCsvDownload} className="px-2 py-1 bg-cyan-500 text-white rounded">CSV</button>
                <input
                  type="text"
                  placeholder="Search"
                  className="p-1 border rounded"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* table */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border-collapse rounded shadow">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-4 py-2 border">State Name</th>
                    <th className="px-4 py-2 border">Country</th>
                    <th className="px-4 py-2 border">Status</th>
                    <th className="px-4 py-2 border">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-4 text-center text-gray-500">No records found</td>
                    </tr>
                  ) : (
                    currentItems.map((state) => (
                      <tr key={state._id} className="border-b">
                        <td className="px-4 py-2">{state.stateName}</td>
                        <td className="px-4 py-2">
                          {state.country.countryName}
                        </td>
                        {/* ← 2. replace span with button */}
                        <td className="px-4 py-2">
                          <button
                            onClick={() =>
                              toggleStatus(state._id, state.status)
                            }
                            className={`px-2 py-1 rounded ${
                              state.status === "active"
                                ? "bg-green-500 text-white"
                                : "bg-red-500 text-white"
                            }`}
                          >
                            {state.status}
                          </button>
                        </td>
                        <td className="px-4 py-2 border">
                          <button
                            onClick={() => navigate(`/edit-state/${state._id}`)}
                            className="px-2 py-1 mr-2 bg-cyan-600 text-white rounded"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(state._id)}
                            className="px-2 py-1 bg-red-600 text-white rounded"
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

            {/* pagination */}
            <div className="flex justify-between items-center mt-4">
              <span>
                Showing {first + 1} to {Math.min(last, filtered.length)} of {filtered.length} entries
              </span>
              <div className="space-x-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 bg-gray-300 rounded disabled:opacity-50"
                >Previous</button>
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={last >= filtered.length}
                  className="px-2 py-1 bg-gray-300 rounded disabled:opacity-50"
                >Next</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
