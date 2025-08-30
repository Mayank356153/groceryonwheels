import React, { useEffect, useState, useRef } from 'react';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { BiChevronRight } from 'react-icons/bi';
import { FaTachometerAlt } from 'react-icons/fa';
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import { Link, useNavigate, NavLink } from 'react-router-dom';
import axios from 'axios';
import LoadingScreen from '../../Loading.jsx';

const RoleList = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [status, setStatus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showActions, setShowActions] = useState(null);
  const dropdownRef = useRef(null);
  const buttonRef = useRef({});

  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    if (showActions && dropdownRef.current && buttonRef.current[showActions]) {
      const dropdown = dropdownRef.current;
      const button = buttonRef.current[showActions];
      const buttonRect = button.getBoundingClientRect();
      const dropdownRect = dropdown.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;

      // Position dropdown fixed, to the right and slightly below
      const offsetBelow = 5; // Slight downward offset
      const offsetRight = 5; // Space from button
      let topPosition = buttonRect.bottom + window.scrollY + offsetBelow;
      let leftPosition = buttonRect.right + window.scrollX + offsetRight;

      // Prevent dropdown from overflowing bottom
      if (topPosition + dropdownRect.height > window.scrollY + windowHeight) {
        topPosition = buttonRect.top + window.scrollY - dropdownRect.height - 5;
      }
      // Prevent dropdown from overflowing top
      if (topPosition < window.scrollY) {
        topPosition = buttonRect.bottom + window.scrollY + offsetBelow;
      }
      // Prevent dropdown from overflowing right
      if (leftPosition + dropdownRect.width > windowWidth + window.scrollX) {
        leftPosition = buttonRect.left + window.scrollX - dropdownRect.width - 5;
      }

      dropdown.style.position = 'fixed';
      dropdown.style.top = `${topPosition}px`;
      dropdown.style.left = `${leftPosition}px`;
      dropdown.style.right = 'auto';
      dropdown.style.bottom = 'auto';
    }
  }, [showActions]);

  const fetchRoles = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found. Redirecting to login...");
      navigate("/");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(
        "/admincreatingrole/api/roles",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("API Response:", response.data);
      setExpenses(response.data.roles);
    } catch (error) {
      console.error("Error fetching roles:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const filteredData = expenses.filter(item => {
    const searchTermLower = searchTerm.toLowerCase().trim();
    const userNameMatch = item.roleName?.toLowerCase().includes(searchTermLower) ?? false;
    return searchTermLower === "" || userNameMatch;
  });

  const totalPages = Math.ceil(filteredData.length / entries);

  const handleCopy = () => {
    const data = filteredData.map(exp => `${exp.roleName}, ${exp.description}, ${status.find((item) => item === exp._id) ? 'Active' : 'InActive'}`).join('\n');
    navigator.clipboard.writeText(data);
    alert("Data copied to clipboard!");
  };

  const handleExcelDownload = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "roles");
    XLSX.writeFile(wb, "roleslist.xlsx");
  };

  const handlePdfDownload = () => {
    const doc = new jsPDF();
    doc.text("Roles List", 20, 20);
    const tableData = filteredData.map(exp => [exp.roleName, exp.description, status.find((item) => item === exp._id) ? 'InActive' : 'Active']);
    autoTable(doc, {
      head: [['Role Name', 'Description', 'Status']],
      body: tableData,
    });
    doc.save('roles.pdf');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCsvDownload = () => {
    const csvContent = "data:text/csv;charset=utf-8," + filteredData.map(exp => Object.values(exp).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "roleList.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteClick = async (id) => {
    const conf = window.confirm("Do you want to delete?");
    if (!conf) {
      return;
    }
    setLoading(true);
    try {
      const response = await axios.delete(`/admincreatingrole/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      alert("Deleted Successfully");
      fetchRoles();
    } catch (error) {
      console.error(error.message);
      alert("Unable to delete");
    } finally {
      setLoading(false);
    }
  };

  const toggleShowActions = (id) => {
    setShowActions(showActions === id ? null : id);
  };

  if (loading) return (<LoadingScreen />);

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <main className={`flex-grow flex flex-col p-2 md:p-2 min-h-screen overflow-x-hidden`}>
          <header className="flex items-center justify-between p-4 mb-2 bg-gray-100 rounded-md shadow sm:flex-row">
            <div className="flex flex-col items-center gap-1 text-center sm:flex-row sm:text-left">
              <h1 className="text-lg font-semibold truncate sm:text-xl">Roles List</h1>
              <span className="text-xs text-gray-600 sm:text-sm">View/Search Items Category</span>
            </div>
            <nav className="flex items-center justify-start text-xs text-gray-500 sm:text-sm">
              <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                <FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600" /> Home
              </NavLink>
              <BiChevronRight className="inline mx-1 sm:mx-2" />
              <a href="#" className="text-gray-700 no-underline hover:text-cyan-600">Roles List</a>
            </nav>
          </header>
          <section className="p-1 bg-white border-t-4 rounded-lg shadow-md border-cyan-500">
            <header className="flex items-center justify-between mb-4">
              <div></div>
              <Link to='/admin/create/list'>
                <button className="px-4 py-2 mt-2 text-white rounded bg-cyan-500">+ Create Role</button>
              </Link>
            </header>
            <div className="flex flex-col justify-between mb-2 space-y-1 md:flex-row md:space-y-0 md:items-center">
              <div className="flex items-center space-x-2">
                <span className="text-sm">Show</span>
                <select className="p-2 text-sm border border-gray-300" value={entries} onChange={(e) => setEntries(Number(e.target.value))}>
                  <option>10</option>
                  <option>20</option>
                  <option>50</option>
                </select>
                <span className="text-sm">Entries</span>
              </div>
              <div className="flex justify-end flex-1 gap-1 mt-2 mb-2">
                <button onClick={handleCopy} className="w-full px-3 py-2 text-sm text-white bg-cyan-500 lg:w-auto">Copy</button>
                <button onClick={handleExcelDownload} className="w-full px-3 py-2 text-sm text-white bg-cyan-500 lg:w-auto">Excel</button>
                <button onClick={handlePdfDownload} className="w-full px-3 py-2 text-sm text-white bg-cyan-500 lg:w-auto">PDF</button>
                <button onClick={handlePrint} className="w-full px-3 py-2 text-sm text-white bg-cyan-500 lg:w-auto">Print</button>
                <button onClick={handleCsvDownload} className="w-full px-3 py-2 text-sm text-white bg-cyan-500 lg:w-auto">CSV</button>
                <input type="text" placeholder="Search" className="w-full p-2 text-sm border border-gray-300" onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-sm text-center border">#</th>
                    <th className="px-3 py-2 text-sm text-center border">Role Name</th>
                    <th className="px-3 py-2 text-sm text-center border">Description</th>
                    <th className="px-3 py-2 text-sm text-center border">Status</th>
                    <th className="py-2 text-sm text-center border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-4 text-center">No data available in table</td>
                    </tr>
                  ) : (
                    filteredData.slice((currentPage - 1) * entries, currentPage * entries).map((expense, index) => (
                      <tr key={expense._id} className="hover:bg-gray-100">
                        <td className="text-sm text-center border">{index + 1}</td>
                        <td className="text-sm text-center border">{expense.roleName}</td>
                        <td className="text-sm text-center border">{expense.description}</td>
                        <td
                          className="text-center border cursor-pointer sm:px-4 sm:py-2"
                          onClick={() =>
                            setStatus((prev) =>
                              prev.includes(expense._id)
                                ? prev.filter((id) => id !== expense._id)
                                : [...prev, expense._id]
                            )
                          }
                        >
                          {status.includes(expense._id) ? (
                            <span className="p-1 text-white bg-red-700 rounded-md">Inactive</span>
                          ) : (
                            <span className="p-1 text-white bg-green-400 rounded-md">Active</span>
                          )}
                        </td>
                        <td className="relative flex items-center justify-center py-2 text-sm text-center border">
                          <button
                            ref={(el) => (buttonRef.current[expense._id] = el)}
                            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white transition-all duration-200 ease-in-out rounded-full shadow bg-cyan-600 hover:bg-cyan-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                            onClick={() => toggleShowActions(expense._id)}
                          >
                            Actions
                            <svg
                              className={`w-4 h-4 transition-transform duration-200 ${
                                showActions === expense._id ? "rotate-180" : ""
                              }`}
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {showActions === expense._id && (
                            <div
                              ref={dropdownRef}
                              className="z-50 w-32 bg-white border border-gray-200 rounded-md shadow-md animate-dropdown-open"
                              style={{ minWidth: '120px', maxHeight: '200px', overflowY: 'auto' }}
                            >
                              <Link
                                to={`/admin/create/list?id=${expense._id}`}
                                className="block px-4 py-2 text-sm text-left text-gray-700 no-underline transition-colors hover:bg-gray-100 flex items-center gap-2"
                              >
                                ✏️ Edit
                              </Link>
                              <button
                                onClick={() => handleDeleteClick(expense._id)}
                                className="w-full px-4 py-2 text-sm text-left text-red-600 transition-colors hover:bg-gray-100 flex items-center gap-2"
                              >
                                🗑️ Delete
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
            <div className="flex flex-col items-center justify-between mt-4 md:flex-row">
              <span>Showing {entries * (currentPage - 1) + 1} to {Math.min(entries * currentPage, filteredData.length)} of {filteredData.length} entries</span>
              <div>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-4 py-2 mr-2 text-gray-600 bg-gray-300 disabled:opacity-50"
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-4 py-2 text-gray-600 bg-gray-300 disabled:opacity-50"
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>

      <style jsx>{`
        @keyframes dropdown-open {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-dropdown-open {
          animation: dropdown-open 0.2s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
};

export default RoleList;