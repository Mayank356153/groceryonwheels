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
import TaxGroups from "../Settings/TaxGroups.jsx";

const TaxList = () => {
  const navigate = useNavigate();

  /* ─────────────────── UI state ─────────────────── */
  const [isSidebarOpen, setSidebarOpen]   = useState(true);
  const [entries,       setEntries]       = useState(10);
  const [currentPage,   setCurrentPage]   = useState(1);
  const [taxes,         setTaxes]         = useState([]);
  const [searchTerm,    setSearchTerm]    = useState("");

  /* ─────────────────── permissions ──────────────── */
  const [localPerms, setLocalPerms] = useState([]);
  const userRole = (localStorage.getItem("role") || "guest").toLowerCase();
  const isAdmin  = userRole === "admin";

  const hasPermissionFor = (module, action) =>
    isAdmin ||
    localPerms.some(
      p =>
        p.module.toLowerCase() === module.toLowerCase() &&
        p.actions.map(a => a.toLowerCase()).includes(action.toLowerCase())
    );

  /* grab stored perms once */
  useEffect(() => {
    try {
      setLocalPerms(JSON.parse(localStorage.getItem("permissions") || "[]"));
    } catch {
      setLocalPerms([]);
    }
  }, []);

  /* collapse sidebar on small screens */
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  /* ─────────────────── fetch taxes ───────────────── */
  const fetchTaxes = async () => {
    try {
      const token = localStorage.getItem("token");
      const res   = await axios.get(
        "api/taxes",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTaxes(res.data.data || []);
    } catch (err) {
      console.error("Fetch taxes:", err.message);
    }
  };

  useEffect(() => {               // wrap to avoid returning a Promise
    fetchTaxes();
  }, []);

  /* ─────────────────── filtering & paging ───────── */
  const filtered = taxes.filter(t =>
    t.taxName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const indexLast  = currentPage * entries;
  const indexFirst = indexLast - entries;
  const pageItems  = filtered.slice(indexFirst, indexLast);
  const totalPages = Math.ceil(filtered.length / entries);

  const paginate = n => {
    if (n >= 1 && n <= totalPages) setCurrentPage(n);
  };

  /* ─────────────────── exports (unchanged) ──────── */
  const handleCopy = () => {
    navigator.clipboard.writeText(
      filtered.map(t => `${t.taxName}, ${t.taxPercentage}, ${t.status}`).join("\n")
    );
    alert("Data copied to clipboard!");
  };
  const handleExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Taxes");
    XLSX.writeFile(wb, "taxes.xlsx");
  };
  const handlePdf = () => {
    const doc = new jsPDF();
    doc.text("Tax List", 20, 20);
    autoTable(doc, {
      head: [["Tax Name", "Tax Rate", "Status"]],
      body: filtered.map(t => [t.taxName, t.taxPercentage, t.status]),
    });
    doc.save("taxes.pdf");
  };
  const handleCsv = () => {
    const csv =
      "data:text/csv;charset=utf-8," +
      filtered.map(t => `${t.taxName},${t.taxPercentage},${t.status}`).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = "taxes.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handlePrint = () => window.print();

  /* ─────────────────── CRUD actions ─────────────── */
  const handleDelete = async id => {
    if (!window.confirm("Delete this tax?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `api/taxes/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTaxes();
    } catch (err) {
      console.error("Delete tax:", err.message);
    }
  };

  const toggleStatus = async (id, status) => {
    if (!hasPermissionFor("Taxes", "Edit")) return;
    const newStatus = status === "active" ? "inactive" : "active";
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `api/taxes/${id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTaxes();
    } catch (err) {
      console.error("Toggle status:", err.message);
    }
  };

  /* ─────────────────── render ───────────────────── */
  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />

        <div className="flex-grow flex flex-col p-2 md:p-2">
          {/* page header */}
          <header className="flex flex-col sm:flex-row items-center justify-between p-4 mb-2 bg-gray-100 rounded-md shadow">
            <div className="flex items-baseline gap-1">
              <h1 className="text-lg sm:text-xl font-semibold">Tax List</h1>
              <span className="text-xs sm:text-sm text-gray-600">View / Search</span>
            </div>
            <nav className="flex items-center text-xs sm:text-sm text-gray-500">
              <a href="/dashboard" className="flex items-center hover:text-cyan-600">
                <FaTachometerAlt className="mr-2" /> Home
              </a>
              <BiChevronRight className="mx-1 sm:mx-2" />
              <span>Tax List</span>
            </nav>
          </header>

          {/* card */}
          <div className="p-4 bg-white border-t-4 border-cyan-500 rounded-lg shadow-md">
            <header className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Tax List</h2>

              {hasPermissionFor("Taxes", "Add") && (
                <button
                  className="px-4 py-2 rounded text-white bg-cyan-500"
                  onClick={() => navigate("/add-tax")}
                >
                  + New Tax
                </button>
              )}
            </header>

            {/* controls */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-2 mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm">Show</span>
                <select
                  value={entries}
                  onChange={e => { setEntries(Number(e.target.value)); setCurrentPage(1); }}
                  className="p-2 text-sm border rounded-md"
                >
                  <option>10</option><option>20</option><option>50</option>
                </select>
                <span className="text-sm">Entries</span>
              </div>

              <div className="flex flex-1 gap-1">
                <button onClick={handleCopy}  className="flex-1 px-3 py-2 text-sm text-white bg-cyan-500">Copy</button>
                <button onClick={handleExcel} className="flex-1 px-3 py-2 text-sm text-white bg-cyan-500">Excel</button>
                <button onClick={handlePdf}   className="flex-1 px-3 py-2 text-sm text-white bg-cyan-500">PDF</button>
                <button onClick={handlePrint} className="flex-1 px-3 py-2 text-sm text-white bg-cyan-500">Print</button>
                <button onClick={handleCsv}   className="flex-1 px-3 py-2 text-sm text-white bg-cyan-500">CSV</button>
              </div>

              <input
                type="text"
                placeholder="Search"
                className="p-2 text-sm border rounded-md lg:w-60"
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* table */}
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse rounded-lg shadow">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="w-10 px-4 py-2 border"></th>
                    <th className="px-4 py-2 border">Tax Name</th>
                    <th className="px-4 py-2 border">Tax (%)</th>
                    <th className="px-4 py-2 border">Status</th>
                    <th className="px-4 py-2 border">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-4 text-center text-gray-500">
                        No matching records found
                      </td>
                    </tr>
                  ) : (
                    pageItems.map(tax => (
                      <tr key={tax._id} className="border-b">
                        <td className="px-4 py-2 text-center border">
                          <input type="checkbox" />
                        </td>
                        <td className="px-4 py-2 border">{tax.taxName}</td>
                        <td className="px-4 py-2 border">{tax.taxPercentage}</td>
                        <td className="px-4 py-2 border">
                          <span
                            onClick={() => toggleStatus(tax._id, tax.status)}
                            className={`px-2 py-1 rounded-lg cursor-pointer ${
                              tax.status === "active"
                                ? "bg-green-500 text-white"
                                : "bg-red-500 text-white"
                            } ${hasPermissionFor("Taxes","Edit") ? "" : "cursor-not-allowed opacity-60"}`}
                          >
                            {tax.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center border">
                          {hasPermissionFor("Taxes", "Edit") && (
                            <button
                              className="px-2 py-1 mr-2 text-white rounded bg-cyan-600 hover:bg-cyan-500"
                              onClick={() => navigate(`/edit-tax/${tax._id}`)}
                            >
                              Edit
                            </button>
                          )}
                          {hasPermissionFor("Taxes", "Delete") && (
                            <button
                              className="px-2 py-1 text-white bg-red-600 rounded hover:bg-red-500"
                              onClick={() => handleDelete(tax._id)}
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* pagination */}
            <div className="flex justify-between mt-4 text-sm">
              <div>
                Showing {indexFirst + 1} to {Math.min(indexLast, filtered.length)} of {filtered.length} entries
              </div>
              <div>
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 mr-2 bg-gray-300 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={indexLast >= filtered.length}
                  className="px-2 py-1 bg-gray-300 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* optional extra component */}
          {hasPermissionFor("TaxGroups", "View") && <TaxGroups />}
        </div>
      </div>
    </div>
  );
};

export default TaxList;
