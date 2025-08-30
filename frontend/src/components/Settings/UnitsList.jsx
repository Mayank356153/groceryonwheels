import React, { useState, useEffect } from "react";
import { FaTachometerAlt } from "react-icons/fa";
import { BiChevronRight } from "react-icons/bi";
import Navbar  from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import axios   from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";

const UnitsList = () => {
  const navigate = useNavigate();

  /* ─────────────── UI state ─────────────── */
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [units,  setUnits]  = useState([]);
  const [search, setSearch] = useState("");
  const [entries, setEntries]     = useState(10);
  const [page,    setPage]        = useState(1);

  /* ─────────────── permissions ───────────── */
  const [localPerms, setLocalPerms] = useState([]);
  const isAdmin =
    (localStorage.getItem("role") || "guest").toLowerCase() === "admin";

  const hasPermissionFor = (module, action) =>
    isAdmin ||
    localPerms.some(
      p =>
        p.module.toLowerCase() === module.toLowerCase() &&
        p.actions.map(a => a.toLowerCase()).includes(action.toLowerCase())
    );

  /* grab permissions once */
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

  /* ─────────────── data fetch ────────────── */
  const fetchUnits = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        "api/units",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUnits(data.data || []);
    } catch (err) {
      console.error("Fetch units:", err.message);
    }
  };
  useEffect(() => { fetchUnits(); }, []);

  /* ─────────────── search & paging ───────── */
  const filtered = units.filter(u =>
    u.unitName.toLowerCase().includes(search.toLowerCase())
  );
  const idxLast  = page * entries;
  const idxFirst = idxLast - entries;
  const rows     = filtered.slice(idxFirst, idxLast);
  const pages    = Math.ceil(filtered.length / entries);

  /* ─────────────── exports (copy / xls / …) ─ */
  const copyToClipboard = () => {
    navigator.clipboard.writeText(
      filtered.map(u => `${u.unitName}, ${u.description}, ${u.status}`).join("\n")
    );
    alert("Data copied to clipboard!");
  };
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Units");
    XLSX.writeFile(wb, "units.xlsx");
  };
  const exportPdf = () => {
    const doc = new jsPDF();
    doc.text("Units List", 20, 20);
    autoTable(doc, {
      head: [["Unit Name", "Description", "Status"]],
      body: filtered.map(u => [u.unitName, u.description, u.status]),
    });
    doc.save("units.pdf");
  };
  const exportCsv = () => {
    const csv =
      "data:text/csv;charset=utf-8," +
      filtered.map(u => [u.unitName, u.description, u.status].join(",")).join("\n");
    const link = Object.assign(document.createElement("a"), {
      href: encodeURI(csv),
      download: "units.csv",
    });
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  /* ─────────────── CRUD helpers ──────────── */
  const toggleStatus = async unit => {
    if (!hasPermissionFor("Units", "Edit")) return;

    const newStatus = unit.status === "active" ? "inactive" : "active";
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `api/units/${unit._id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUnits();
    } catch (err) {
      console.error("Toggle status:", err.message);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm("Delete this unit?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `api/units/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUnits();
    } catch (err) {
      console.error("Delete unit:", err.message);
    }
  };

  /* ─────────────── render ────────────────── */
  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />

        <div className="flex-grow flex flex-col p-2 md:p-2">
          {/* page header */}
          <header className="flex flex-col sm:flex-row items-center justify-between p-4 mb-2 bg-gray-100 rounded-md shadow">
            <div className="flex items-baseline gap-1">
              <h1 className="text-lg sm:text-xl font-semibold">Units List</h1>
              <span className="text-xs sm:text-sm text-gray-600">View / Search</span>
            </div>
            <nav className="flex items-center text-xs sm:text-sm text-gray-500">
              <a href="/dashboard" className="flex items-center hover:text-cyan-600">
                <FaTachometerAlt className="mr-2" /> Home
              </a>
              <BiChevronRight className="mx-1 sm:mx-2" />
              <span>Units List</span>
            </nav>
          </header>

          {/* card */}
          <div className="p-4 bg-white border-t-4 border-cyan-500 rounded-lg shadow-md">
            <header className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Units List</h2>

              {hasPermissionFor("Units", "Add") && (
                <button
                  className="px-4 py-2 rounded text-white bg-cyan-500"
                  onClick={() => navigate("/add-unit")}
                >
                  + New Unit
                </button>
              )}
            </header>

            {/* controls */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-2 mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm">Show</span>
                <select
                  value={entries}
                  onChange={e => { setEntries(+e.target.value); setPage(1); }}
                  className="p-2 text-sm border rounded-md"
                >
                  <option>10</option><option>20</option><option>50</option>
                </select>
                <span className="text-sm">Entries</span>
              </div>

              <div className="flex flex-1 gap-1">
                <button onClick={copyToClipboard} className="flex-1 px-3 py-2 text-sm text-white bg-cyan-500">Copy</button>
                <button onClick={exportExcel}     className="flex-1 px-3 py-2 text-sm text-white bg-cyan-500">Excel</button>
                <button onClick={exportPdf}       className="flex-1 px-3 py-2 text-sm text-white bg-cyan-500">PDF</button>
                <button onClick={() => window.print()} className="flex-1 px-3 py-2 text-sm text-white bg-cyan-500">Print</button>
                <button onClick={exportCsv}       className="flex-1 px-3 py-2 text-sm text-white bg-cyan-500">CSV</button>
              </div>

              <input
                type="text"
                placeholder="Search"
                className="p-2 text-sm border rounded-md lg:w-60"
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* table */}
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse rounded-lg shadow">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-4 py-2 border">Unit Name</th>
                    <th className="px-4 py-2 border">Description</th>
                    <th className="px-4 py-2 border">Status</th>
                    <th className="px-4 py-2 border text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-4 text-center text-gray-500">
                        No matching records found
                      </td>
                    </tr>
                  ) : (
                    rows.map(unit => (
                      <tr key={unit._id} className="border-b">
                        <td className="px-4 py-2 border">{unit.unitName}</td>
                        <td className="px-4 py-2 border">{unit.description}</td>
                        <td className="px-4 py-2 border">
                          <span
                            onClick={() => toggleStatus(unit)}
                            className={`px-2 py-1 rounded-lg cursor-pointer ${
                              unit.status === "active"
                                ? "bg-green-500 text-white"
                                : "bg-red-500 text-white"
                            } ${hasPermissionFor("Units","Edit") ? "" : "cursor-not-allowed opacity-60"}`}
                          >
                            {unit.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 border text-center">
                          {hasPermissionFor("Units", "Edit") && (
                            <button
                              className="px-2 py-1 mr-2 text-white rounded bg-cyan-600 hover:bg-cyan-500"
                              onClick={() => navigate(`/edit-unit/${unit._id}`)}
                            >
                              Edit
                            </button>
                          )}
                          {hasPermissionFor("Units", "Delete") && (
                            <button
                              className="px-2 py-1 text-white bg-red-600 rounded hover:bg-red-500"
                              onClick={() => handleDelete(unit._id)}
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
                Showing {idxFirst + 1} to {Math.min(idxLast, filtered.length)} of {filtered.length} entries
              </div>
              <div>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2 py-1 mr-2 bg-gray-300 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => (idxLast >= filtered.length ? p : p + 1))}
                  disabled={idxLast >= filtered.length}
                  className="px-2 py-1 bg-gray-300 rounded disabled:opacity-50"
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
};

export default UnitsList;
