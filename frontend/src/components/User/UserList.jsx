import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, NavLink } from "react-router-dom";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";
import { BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt } from "react-icons/fa";
import LoadingScreen from "../../Loading";
import axios from "axios";

const UserList = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [actionMenu, setActionMenu] = useState(null); // Track open popup
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 }); // Popup position
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const menuRef = useRef(null); // Ref for outside click detection
  const buttonRefs = useRef({}); // Refs for action buttons
  const menuRefs = useRef({});

  // Close popup when clicking outside
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

  // Initial setup and fetch users
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    try {
      const res = await axios.get("/admiaddinguser/userlist", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const token = localStorage.getItem("token");
    try {
      await axios.patch(
        `/admiaddinguser/${id}/status`,
        { status: currentStatus === "active" ? "inactive" : "active" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (err) {
      console.error("Status update error:", err);
      alert("Failed to update status");
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    setLoading(true);
    try {
      await axios.delete(`/admiaddinguser/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      fetchUsers();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  // Toggle action menu and calculate position
  const toggleActionMenu = (userId, event) => {
    if (actionMenu === userId) {
      setActionMenu(null);
      return;
    }
    setActionMenu(userId);

    // Calculate popup position
    const button = buttonRefs.current[userId];
    if (button) {
      const rect = button.getBoundingClientRect();
      const popupWidth = 192; // w-48 in Tailwind (48 * 4px)
      const popupHeight = 80; // Approximate height (2 items * ~40px)
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

  // Filter + paginate
  const filtered = users.filter((u) => {
    const t = searchTerm.toLowerCase().trim();
    return (
      !t ||
      u.userName?.toLowerCase().includes(t) ||
      u.Email?.toLowerCase().includes(t) ||
      `${u.FirstName} ${u.LastName}`.toLowerCase().includes(t)
    );
  });
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const current = filtered.slice(start, start + itemsPerPage);

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />

        <div className="flex flex-col flex-1 p-4">
          {/* Title + Breadcrumb */}
          <header className="flex justify-between items-center mb-4 px-2 py-2 bg-gray-100 rounded shadow">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">User List</h1>
              <span className="text-xs text-gray-600">View/Search Users</span>
            </div>
            <nav className="flex items-center text-xs text-gray-500 gap-1">
              <NavLink to="/dashboard" className="flex items-center hover:text-cyan-600">
                <FaTachometerAlt /> Home
              </NavLink>
              <BiChevronRight />
              <NavLink to="/admin/user/list" className="hover:text-cyan-600">
                User List
              </NavLink>
            </nav>
          </header>

          {/* Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-0 gap-2">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select
                className="p-1 border rounded"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(+e.target.value);
                  setCurrentPage(1);
                }}
              >
                {[10, 20, 50].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
              <span>Entries</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                className="p-1 border rounded"
                placeholder="Search"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Link to="/create-user">
                <button className="px-4 py-2 text-white bg-cyan-500 rounded">
                  + New User
                </button>
              </Link>
            </div>
          </div>

          {/* Table */}
          <div className="relative">
            <table className="w-full border-collapse border">
              <thead className="bg-gray-200">
                <tr>
                  {[
                    "#",
                    "Store Name",
                    "User Name",
                    "Name",
                    "Mobile",
                    "Email",
                    "Role",
                    "Created On",
                    "Status",
                    "Action",
                  ].map((h) => (
                    <th key={h} className="p-2 border text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {current.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="p-4 text-center">
                      No data Available
                    </td>
                  </tr>
                ) : (
                  current.map((u, i) => (
                    <tr key={u._id} className="text-sm">
                      <td className="p-2 border">{start + i + 1}</td>
                      <td className="p-2 border">
                        {Array.isArray(u.Store)
                          ? u.Store.map((s) => s.StoreName).join(", ")
                          : u.Store?.StoreName || "N/A"}
                      </td>
                      <td className="p-2 border">{u.userName}</td>
                      <td className="p-2 border">
                        {u.FirstName} {u.LastName}
                      </td>
                      <td className="p-2 border">{u.Mobile}</td>
                      <td className="p-2 border">{u.Email}</td>
                      <td className="p-2 border">{u.Role}</td>
                      <td className="p-2 border">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td
                        className="p-2 border text-center cursor-pointer"
                        onClick={() => toggleStatus(u._id, u.status)}
                      >
                        {u.status === "active" ? (
                          <span className="px-2 py-1 bg-green-500 text-white rounded-full">Active</span>
                        ) : (
                          <span className="px-2 py-1 bg-red-600 text-white rounded-full">Inactive</span>
                        )}
                      </td>
                      <td className="p-2 border">
  <div>
    <button
      ref={(el) => (buttonRefs.current[u._id] = el)}
      className="px-3 py-1.5 font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      onClick={(e) => toggleActionMenu(u._id, e)}
      aria-expanded={actionMenu === u._id}
      aria-controls={`action-menu-${u._id}`}
    >
      Action
    </button>
    {actionMenu === u._id && (
      <div
        id={`action-menu-${u._id}`}
        ref={(el) => (menuRefs.current[u._id] = el)} // Unique ref for each dropdown
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
            e.stopPropagation();
            setActionMenu(null);
            navigate(`/create-user?id=${u._id}`);
          }}
        >
          Edit
        </button>
        <button
          className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-150"
          onClick={(e) => {
            e.stopPropagation();
            setActionMenu(null);
            deleteUser(u._id);
          }}
        >
          Delete
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

          {/* Pagination */}
          <div className="flex flex-col md:flex-row justify-between items-center mt-4">
            <span className="text-sm">
              Showing {start + 1} to {Math.min(start + itemsPerPage, filtered.length)} of {filtered.length} entries
            </span>
            <div className="flex gap-2 mt-2 md:mt-0">
              <button
                className={`px-3 py-1 rounded ${currentPage === 1 ? "bg-gray-300" : "bg-blue-500 text-white"}`}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Previous
              </button>
              <button
                className={`px-3 py-1 rounded ${currentPage === totalPages ? "bg-gray-300" : "bg-blue-500 text-white"}`}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
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

export default UserList;