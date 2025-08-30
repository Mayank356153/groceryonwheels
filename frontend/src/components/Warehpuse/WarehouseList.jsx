import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { useGeolocated } from "react-geolocated";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import Loading from "../../Loading.jsx";

const WarehouseListPage = () => {
  const navigate = useNavigate();

  /* ── UI state ───────────────────────── */
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ── Data state ─────────────────────── */
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseInfo, setWarehouseInfo] = useState({}); // { warehouseId: { totalItems, totalQuantity, totalWorth } }

  /* ── Table helpers ──────────────────── */
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  /* ── Permissions ────────────────────── */
  const [localPermissions, setLocalPermissions] = useState([]);
  useEffect(() => {
    const stored = localStorage.getItem("permissions");
    if (stored) {
      try {
        setLocalPermissions(JSON.parse(stored));
      } catch {}
    }
  }, []);
  const hasPermissionFor = (module, action) => {
    const role = (localStorage.getItem("role") || "guest").toLowerCase();
    if (role === "admin") return true;
    return localPermissions.some(
      (p) =>
        p.module.toLowerCase() === module.toLowerCase() &&
        p.actions.map((a) => a.toLowerCase()).includes(action.toLowerCase())
    );
  };

  /* ── Responsive sidebar ─────────────── */
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  /* ── Geolocated hook ────────────────── */
  const { coords, isGeolocationAvailable, positionError } = useGeolocated({
    positionOptions: {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    },
    watchPosition: true,
    userDecisionTimeout: 5000
  });

  /* ── Reporting state ────────────────── */
  const [reportingId, setReportingId] = useState(null);
  const [reportInterval, setReportInterval] = useState(null);

  /* ── Fetching ───────────────────────── */
  const auth = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const role = (localStorage.getItem("role") || "").toLowerCase();
      const url = role === "admin" ? "api/warehouses" : "api/warehouses?scope=mine";
      const { data } = await axios.get(url, auth());
      setWarehouses(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouseStocks = async (warehouseId) => {
    try {
      const { data } = await axios.get("api/items", {
        ...auth(),
        params: { warehouse: warehouseId, page: 1, limit: 10000, inStock: "true" }
      });
      const items = data.data || [];
      let totalItems = 0;
      let totalQuantity = 0;
      let totalWorth = 0;
      items.forEach((item) => {
        if (item.currentStock > 0) {
          totalItems += 1;
          totalQuantity += item.currentStock;
          totalWorth += item.currentStock * (item.purchasePrice || 0);
        }
      });
      return { totalItems, totalQuantity, totalWorth };
    } catch (err) {
      console.error(`Error fetching stock for warehouse ${warehouseId}:`, err);
      return { totalItems: 0, totalQuantity: 0, totalWorth: 0 };
    }
  };

  const fetchAllStockSummaries = async () => {
    if (warehouses.length === 0) return;
    setLoading(true);
    try {
      const summaries = {};
      const requests = warehouses.map((warehouse) =>
        fetchWarehouseStocks(warehouse._id)
      );
      const results = await Promise.all(requests);
      warehouses.forEach((warehouse, index) => {
        summaries[warehouse._id] = results[index];
      });
      setWarehouseInfo(summaries);
    } catch (err) {
      setError("Failed to fetch stock summaries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (warehouses.length > 0) {
      fetchAllStockSummaries();
    }
  }, [warehouses]);

  useEffect(() => {
    if (coords) {
      console.log(
        "📍 My position:",
        coords.latitude,
        coords.longitude,
        "| accuracy (m):",
        coords.accuracy
      );
    }
  }, [coords]);

  /* ── Filter + Pagination ────────────── */
  const filtered = warehouses.filter(
    (w) =>
      (w.warehouseName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.mobile || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / entriesPerPage);
  const currentRows = filtered.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  /* ── Export Helpers ─────────────────── */
  const handleCopy = () => {
    const text = currentRows
      .map((w, idx) => {
        const info = warehouseInfo[w._id] || { totalItems: 0, totalQuantity: 0, totalWorth: 0 };
        return [
          idx + 1,
          w.warehouseName || "—",
          w.mobile || "—",
          w.email || "—",
          w.cashAccount?.accountNumber || "—",
          w.terminal?.tid || w.tid || "—",
          info.totalItems,
          info.totalQuantity,
          info.totalWorth.toFixed(2),
          w.status || "—"
        ].join("\t");
      })
      .join("\n");
    navigator.clipboard.writeText(text);
    alert("Table copied to clipboard!");
  };

  const handleExcelDownload = () => {
    const rows = currentRows.map((w, idx) => {
      const info = warehouseInfo[w._id] || { totalItems: 0, totalQuantity: 0, totalWorth: 0 };
      return {
        "#": idx + 1,
        "Warehouse": w.warehouseName || "—",
        "Mobile": w.mobile || "—",
        "Email": w.email || "—",
        "Cash A/c No.": w.cashAccount?.accountNumber || "—",
        "TID": w.terminal?.tid || w.tid || "—",
        "Total Items": info.totalItems,
        "Quantity": info.totalQuantity,
        "Worth (₹)": info.totalWorth.toFixed(2),
        "Status": w.status || "—"
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Warehouses");
    XLSX.writeFile(wb, "warehouses.xlsx");
  };

  const handlePdfDownload = () => {
    const doc = new jsPDF();
    doc.text("Warehouse List", 14, 10);
    autoTable(doc, {
      head: [["#", "Warehouse", "Mobile", "Email", "Cash A/c No.", "TID", "Total Items", "Quantity", "Worth (₹)", "Status"]],
      body: currentRows.map((w, idx) => {
        const info = warehouseInfo[w._id] || { totalItems: 0, totalQuantity: 0, totalWorth: 0 };
        return [
          idx + 1,
          w.warehouseName || "—",
          w.mobile || "—",
          w.email || "—",
          w.cashAccount?.accountNumber || "—",
          w.terminal?.tid || w.tid || "—",
          info.totalItems,
          info.totalQuantity,
          info.totalWorth.toFixed(2),
          w.status || "—"
        ];
      })
    });
    doc.save("warehouses.pdf");
  };

  const handleCsvDownload = () => {
    const rows = currentRows.map((w, idx) => {
      const info = warehouseInfo[w._id] || { totalItems: 0, totalQuantity: 0, totalWorth: 0 };
      return {
        "#": idx + 1,
        "Warehouse": w.warehouseName || "—",
        "Mobile": w.mobile || "—",
        "Email": w.email || "—",
        "Cash A/c No.": w.cashAccount?.accountNumber || "—",
        "TID": w.terminal?.tid || w.tid || "—",
        "Total Items": info.totalItems,
        "Quantity": info.totalQuantity,
        "Worth (₹)": info.totalWorth.toFixed(2),
        "Status": w.status || "—"
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const blob = new Blob([XLSX.utils.sheet_to_csv(ws)], { type: "text/csv;charset=utf-8;" });
    Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: "warehouses.csv"
    }).click();
  };

  const handlePrint = () => window.print();

  /* ── Delete & Status Toggle ─────────── */
  const [dropdownIndex, setDropdownIndex] = useState(null);
  const role = (localStorage.getItem("role") || "guest").toLowerCase();

  async function confirmAndDelete(id) {
    if (!window.confirm("Permanently delete this warehouse?")) return;
    setLoading(true);
    try {
      await axios.delete(`api/warehouses/${id}`, auth());
      fetchWarehouses();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteClick = (id) => {
    if (role === "admin") confirmAndDelete(id);
    else {
      const reason = window.prompt("Reason for deletion:");
      if (!reason) return;
      axios
        .post(
          "api/deletion-requests",
          { itemType: "Warehouse", itemId: id, reason },
          auth()
        )
        .then(() => alert("Request sent"))
        .catch((err) => alert(err.message));
    }
  };

  const handleStatus = async (id, current) => {
    setLoading(true);
    try {
      await axios.put(
        `/api/warehouses/${id}`,
        { status: current === "Active" ? "Inactive" : "Active" },
        auth()
      );
      fetchWarehouses();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Report Live Location ───────────── */
  const handleReportClick = (warehouseId) => {
    if (reportingId === warehouseId) {
      clearInterval(reportInterval);
      setReportingId(null);
      setReportInterval(null);
      return;
    }
    if (!coords) {
      alert("Waiting for geolocation…");
      return;
    }
    setReportingId(warehouseId);
    const doPost = () => {
      axios
        .post(
          `/api/warehouse-location`,
          { lat: coords.latitude, lng: coords.longitude, warehouseId },
          auth()
        )
        .catch(console.error);
    };
    doPost();
    const id = setInterval(doPost, 10000);
    setReportInterval(id);
  };

  /* ── Track on Map ───────────────────── */
  const handleTrackClick = (warehouseId) => {
    navigate(`/warehouse-tracker?id=${warehouseId}`);
  };

  /* ── Render ─────────────────────────── */
  if (loading) return <Loading />;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={sidebarOpen} />
        <main className="flex-grow p-2 overflow-x-auto">
          {/* header */}
          <header className="flex justify-between bg-white p-3 rounded shadow">
            <div>
              <h1 className="text-lg font-bold">Warehouse List</h1>
              <p className="text-xs text-gray-600">Manage Warehouses</p>
            </div>
            <nav className="flex items-center text-gray-500 text-sm">
              <a href="/dashboard" className="flex items-center">
                <FaTachometerAlt className="mr-1" /> Home
              </a>
              <BiChevronRight className="mx-2" />
              <span>Warehouse List</span>
            </nav>
          </header>

          {/* toolbar */}
          <div className="flex flex-col gap-2 my-4 lg:flex-row lg:items-center">
            <div className="flex-1">
              <label className="block mb-1 text-sm">Search</label>
              <input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by name, mobile, or email"
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Copy
              </button>
              <button
                onClick={handleCsvDownload}
                className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                CSV
              </button>
              <button
                onClick={handleExcelDownload}
                className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
              >
                XLSX
              </button>
              <button
                onClick={handlePdfDownload}
                className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
              >
                PDF
              </button>
              <button
                onClick={handlePrint}
                className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
              >
                Print
              </button>
              {hasPermissionFor("Warehouses", "Add") && (
                <Link to="/warehouse-form" className="ml-auto">
                  <button className="flex items-center gap-1 bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-2 rounded">
                    <FaPlus /> Add Warehouse
                  </button>
                </Link>
              )}
            </div>
          </div>

          {/* table */}
          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100 text-xs font-semibold">
                <tr>
                  <th className="px-3 py-2">Report</th>
                  <th className="px-3 py-2">Track</th>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Warehouse</th>
                  <th className="px-3 py-2">Mobile</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Cash A/c No.</th>
                  <th className="px-3 py-2">TID</th>
                  <th className="px-3 py-2">Details</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {currentRows.map((w, idx) => {
                  const isRestricted = w.isRestricted;
                  const info = warehouseInfo[w._id] || { totalItems: 0, totalQuantity: 0, totalWorth: 0 };
                  return (
                    <tr key={w._id}>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => handleReportClick(w._id)}
                          className={`px-2 py-1 rounded text-white ${
                            reportingId === w._id ? "bg-red-500" : "bg-green-500"
                          }`}
                        >
                          {reportingId === w._id ? "Stop" : "Report"}
                        </button>
                        {!isGeolocationAvailable && (
                          <div className="text-xs text-red-500">Geo unavailable</div>
                        )}
                        {positionError && (
                          <div className="text-xs text-red-500">{positionError.message}</div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => handleTrackClick(w._id)}
                          className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
                        >
                          Track
                        </button>
                      </td>
                      <td className="px-3 py-2">{(currentPage - 1) * entriesPerPage + idx + 1}</td>
                      <td className="px-3 py-2">{w.warehouseName || "—"}</td>
                      <td className="px-3 py-2">{w.mobile || "—"}</td>
                      <td className="px-3 py-2">{w.email || "—"}</td>
                      <td className="px-3 py-2">{w.cashAccount?.accountNumber || "—"}</td>
                      <td className="px-3 py-2">{w.terminal?.tid || w.tid || "—"}</td>
                      <td className="px-3 py-2">
                        <div>Total Items: {info.totalItems}</div>
                        <div>Quantity: {info.totalQuantity}</div>
                        <div>Worth ₹: {info.totalWorth.toFixed(2)}</div>
                      </td>
                      <td className="px-3 py-2">
                        {isRestricted ? (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                            Restricted
                          </span>
                        ) : (
                          <span
                            onClick={() => handleStatus(w._id, w.status)}
                            className={`cursor-pointer px-2 py-1 rounded-full text-xs font-semibold ${
                              w.status === "Active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {w.status || "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right relative">
                        <button
                          className="px-3 py-1 border rounded"
                          onClick={() => setDropdownIndex(dropdownIndex === w._id ? null : w._id)}
                        >
                          Action ▼
                        </button>
                        {dropdownIndex === w._id && (
                          <div className="absolute right-0 mt-1 bg-white border rounded shadow p-2 flex flex-col gap-1 z-10">
                            {!isRestricted && hasPermissionFor("Warehouses", "Edit") && (
                              <button
                                onClick={() => navigate(`/warehouse-form?id=${w._id}`)}
                                className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                              >
                                <FaEdit size={14} /> Edit
                              </button>
                            )}
                            {!isRestricted && hasPermissionFor("Warehouses", "Delete") && (
                              <button
                                onClick={() => handleDeleteClick(w._id)}
                                className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                              >
                                <FaTrash size={14} /> Delete
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {currentRows.length === 0 && (
                  <tr>
                    <td colSpan={12} className="p-4 text-center">No data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* pagination */}
          <div className="flex flex-col items-center justify-between gap-2 mt-4 md:flex-row">
            <span className="text-sm">
              Showing {(currentPage - 1) * entriesPerPage + 1}-{" "}
              {Math.min(entriesPerPage * currentPage, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default WarehouseListPage;