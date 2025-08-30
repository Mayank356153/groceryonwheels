import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";
import LoadingScreen from "../../Loading";
import axios from "axios";
import { BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt } from "react-icons/fa";

const TerminalList = () => {
  const navigate = useNavigate();
  const [terminals, setTerminals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionMenu, setActionMenu] = useState(null);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  // fetch terminal list
  const fetchTerminals = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("api/terminals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTerminals(res.data.data || []);
    } catch (err) {
      console.error("Error fetching terminals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerminals();
  }, []);

  // delete
  const deleteTerminal = async (id) => {
    if (!window.confirm("Delete this terminal?")) return;
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`api/terminals/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTerminals();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  // filter by tid or warehouse name
  const filtered = terminals.filter((t) =>
    t.tid.toLowerCase().includes(searchTerm.toLowerCase())
    || (t.warehouseName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <main className="flex-grow p-4 overflow-auto bg-gray-100">
          {/* Header */}
          <header className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold">Terminal List</h1>
              <p className="text-gray-600 text-sm">View/Edit terminals</p>
            </div>
            <nav className="flex items-center text-gray-500 text-sm">
              <Link to="/dashboard" className="flex items-center">
                <FaTachometerAlt className="mr-1" /> Home
              </Link>
              <BiChevronRight className="mx-2" />
              <span>Terminals</span>
            </nav>
          </header>

          {/* Top Bar */}
          <div className="flex justify-between mb-4">
            <button
              onClick={() => navigate("/create-terminal")}
              className="px-4 py-2 bg-cyan-500 text-white rounded"
            >
              + New Terminal
            </button>
            <input
              type="text"
              placeholder="Search by TID or warehouse…"
              className="w-1/3 p-2 border rounded"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto bg-white border rounded">
            <table className="w-full border-collapse">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2 border">#</th>
                  <th className="p-2 border">TID</th>
                  <th className="p-2 border">Warehouse</th>
                  <th className="p-2 border">QR Code</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-4 text-center">
                      No terminals found
                    </td>
                  </tr>
                ) : (
                  filtered.map((t, i) => (
                    <tr key={t._id} className="hover:bg-gray-50">
                      <td className="p-2 border">{i + 1}</td>
                      <td className="p-2 border">{t.tid}</td>
                      <td className="p-2 border">
                        {t.warehouse ? t.warehouseName : "—unassigned—"}
                      </td>
                      <td className="p-2 border">
                        {t.qrCodePath ? (
                          <img
                            src={t.qrCodePath}
                            alt="QR"
                            className="h-8 w-8 object-contain"
                          />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-2 border relative">
                        <button
                          className="px-2 py-1 text-white bg-cyan-600 rounded"
                          onClick={() =>
                            setActionMenu((prev) =>
                              prev === t._id ? null : t._id
                            )
                          }
                        >
                          Action
                        </button>
                        {actionMenu === t._id && (
                          <div className="absolute right-0 mt-1 w-32 bg-white border rounded shadow z-10">
                            <button
                              className="block w-full p-2 text-left hover:bg-gray-100"
                              onClick={() =>
                                navigate(
                                  `/create-terminal?id=${t._id}`
                                )
                              }
                            >
                              ✏️ Edit
                            </button>
                            <button
                              className="block w-full p-2 text-left text-red-600 hover:bg-gray-100"
                              onClick={() => deleteTerminal(t._id)}
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
        </main>
      </div>
    </div>
  );
};

export default TerminalList;
