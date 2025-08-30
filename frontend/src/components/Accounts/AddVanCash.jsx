// src/components/Ledger/AddVanCash.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";

const API_BASE = "api";

export default function AddVanCash() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token") || "";
  axios.defaults.headers.common = { Authorization: `Bearer ${token}` };
    const [isSidebarOpen, setSidebarOpen] = useState(true);

  const [warehouses, setWarehouses] = useState([]);
  const [form, setForm] = useState({
    date:        new Date().toLocaleDateString('en-CA'),
    amount:      "",
    warehouseId: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  // fetch warehouses array
  useEffect(() => {
    axios
      .get(`${API_BASE}/warehouses`)
      .then(res => {
        // res.data.data should be an array
        const arr = Array.isArray(res.data.data) ? res.data.data : [];
        setWarehouses(arr);
      })
      .catch(err => {
        console.error("Fetch warehouses:", err);
        setWarehouses([]);
        setError("Failed to load warehouses");
      });
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    if (!form.warehouseId || !form.amount) {
      return setError("Please select a warehouse and enter an amount");
    }

    setLoading(true);
    try {
      const payload = {
        date:        form.date,
        amount:      Number(form.amount),
        warehouseId: form.warehouseId
      };
      await axios.post(`${API_BASE}/ledger/van-cash`, payload);
      navigate(-1);
    } catch (err) {
      console.error("postVanCash:", err);
      setError(err.response?.data?.message || "Failed to record van cash");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <main className="p-6 bg-gray-50 flex-1 overflow-auto">
          <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
            <h2 className="text-2xl font-semibold mb-4">Record Van Cash</h2>
            {error && (
              <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Date</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Warehouse</label>
                <select
                  name="warehouseId"
                  value={form.warehouseId}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="">Select warehouse…</option>
                  {warehouses.map(w => (
                    <option key={w._id} value={w._id}>
                      {w.warehouseName || w.name || w._id}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
              >
                {loading ? "Saving…" : "Save Van Cash"}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
