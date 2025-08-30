import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";
import LoadingScreen from "../../Loading";
import { FaTachometerAlt } from "react-icons/fa";
import { BiChevronRight } from "react-icons/bi";

const CreateTerminal = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");              // for edit mode
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [formData, setFormData] = useState({ tid: "", warehouse: "" });
  const [qrFile, setQrFile] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  // load warehouses for the dropdown
  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get("api/warehouses", {   // adjust to your actual warehouses endpoint
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setWarehouses(res.data.data || []))
      .catch(console.error);
  }, []);

  // if editing, fetch the existing terminal
  useEffect(() => {
    if (!editId) return;
    setLoading(true);
    const token = localStorage.getItem("token");
    axios
      .get("api/terminals", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const term = res.data.data.find((t) => t._id === editId);
        if (term) {
          setFormData({
            tid: term.tid,
            warehouse: term.warehouse || "",
          });
          // we don’t prefill qrFile input
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [editId]);

  const handleChange = (e) =>
    setFormData((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleFileChange = (e) => {
    setQrFile(e.target.files[0] || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("token");

    // use FormData for file upload
    const payload = new FormData();
    payload.append("tid", formData.tid);
    if (formData.warehouse) payload.append("warehouse", formData.warehouse);
    if (qrFile) payload.append("qrCode", qrFile);

    try {
      if (editId) {
        await axios.put(`api/terminals/${editId}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        alert("Terminal updated successfully");
      } else {
        await axios.post(`api/terminals`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        alert("Terminal created successfully");
      }
      navigate("/terminal-list");
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <form
          onSubmit={handleSubmit}
          className="flex-grow p-6 overflow-auto bg-gray-100"
        >
          {/* Header / Breadcrumb */}
          <header className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">
                {editId ? "Edit Terminal" : "Create Terminal"}
              </h1>
              <p className="text-gray-600">
                {editId
                  ? "Modify terminal details"
                  : "Fill in terminal details"}
              </p>
            </div>
            <nav className="flex items-center text-gray-500 text-sm">
              <NavLink to="/dashboard" className="flex items-center">
                <FaTachometerAlt className="mr-1" /> Home
              </NavLink>
              <BiChevronRight className="mx-2" />
              <NavLink to="/terminal-list">Terminal List</NavLink>
            </nav>
          </header>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* TID */}
              <div>
                <label className="block font-semibold">
                  Terminal ID <span className="text-red-500">*</span>
                </label>
                <input
                  name="tid"
                  value={formData.tid}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded"
                  placeholder="e.g. TID-12345"
                />
              </div>
              {/* Warehouse selector */}
              <div>
                <label className="block font-semibold">
                  Assign to Warehouse
                </label>
                <select
                  name="warehouse"
                  value={formData.warehouse}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="">(unassigned)</option>
                  {warehouses.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.warehouseName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {/* QR Code Upload */}
              <div>
                <label className="block font-semibold">QR Code</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full p-2 border rounded"
                />
                {qrFile && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected file: {qrFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-center gap-4">
            <button className="px-8 py-2 bg-green-600 text-white rounded">
              {editId ? "Update" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/terminal/list")}
              className="px-8 py-2 bg-orange-500 text-white rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTerminal;
