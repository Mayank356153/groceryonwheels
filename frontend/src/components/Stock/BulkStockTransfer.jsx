import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import LoadingScreen from "../../Loading";
import { BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt } from "react-icons/fa";

/*
  BulkStockTransfer.jsx
  ---------------------
  • Transfers *all* positive‑stock SKUs from one warehouse to another.
  • Leaves `leaveBehind` (default 1) units of each SKU in the source warehouse.
  • Backend endpoint:  POST /api/stock-transfers/bulk
    payload → { fromWarehouse, toWarehouse, leaveBehind }
*/

const API = ""; // ⬅ change if you prefix your API routes

export default function BulkStockTransfer() {
  /* ───────── internal state ───────── */
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [loading,        setLoading]    = useState(false);

  const [warehouses, setWarehouses] = useState([]);
  const [formData,   setFormData]   = useState({
    fromWarehouse: "",
    toWarehouse  : "",
    leaveBehind  : 1,
  });

  /* ───────── utilities ───────── */
  const token      = localStorage.getItem("token") || "";
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };
  const auth = {
  headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
};

  /* ───────── fetch warehouses once ───────── */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${API}/api/warehouses`, {
        ...auth,
        params: { scope: "mine" }            // 👈 one-liner filter
      });
        const active   = (data.data || []).filter(w => w.status === "Active");
        setWarehouses(active);

        // default “from” = first restricted‑then‑first active
        const restricted = active.find(w => w.isRestricted);
        if (restricted) {
          setFormData(prev => ({ ...prev, fromWarehouse: restricted._id }));
        } else if (active[0]?._id) {
          setFormData(prev => ({ ...prev, fromWarehouse: active[0]._id }));
        }
      } catch (err) {
        console.error("warehouses:", err);
        alert(err.response?.data?.message || err.message);
      } finally { setLoading(false); }
    })();
  }, []);

  /* ───────── handlers ───────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fromWarehouse || !formData.toWarehouse)
      return alert("Select both warehouses");
    if (formData.fromWarehouse === formData.toWarehouse)
      return alert("Cannot transfer to the same warehouse");

    setLoading(true);
    try {
      await axios.post(
        `${API}/api/stock-transfers/stock-transfers/bulk`,
        {
          fromWarehouse: formData.fromWarehouse,
          toWarehouse  : formData.toWarehouse,
          leaveBehind  : formData.leaveBehind,
        },
        auth  
      );
      alert("Bulk transfer completed!");
      navigate("/transfer-list");
    } catch (err) {
      console.error("bulk transfer:", err);
      alert(err.response?.data?.message || err.message);
    } finally { setLoading(false); }
  };

  /* ───────── render ───────── */
  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* nav + sidebar */}
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />

        {/* main */}
        <div className="flex-grow p-4">
          {/* header */}
          <header className="flex flex-col items-center justify-between p-4 mb-3 bg-white rounded shadow md:flex-row">
            <div className="flex items-baseline gap-2">
              <h1 className="text-xl font-semibold">Bulk Stock Transfer</h1>
              <span className="text-sm text-gray-600">Move every SKU at once</span>
            </div>
            <nav className="flex items-center text-sm text-gray-500">
              <a href="/dashboard" className="flex items-center hover:text-cyan-600">
                <FaTachometerAlt className="mr-1" /> Home
              </a>
              <BiChevronRight className="mx-2" />
              <a href="/transfer-list" className="hover:text-cyan-600">Stock Transfer List</a>
            </nav>
          </header>

          {/* form */}
          <form onSubmit={handleSubmit} className="p-4 bg-white border-t-4 rounded shadow border-cyan-500 max-w-xl mx-auto">
            {/* From / To */}
            <div className="grid gap-4 mb-4 md:grid-cols-2">
              <div>
                <label className="block mb-1 font-semibold">From Warehouse</label>
                <select
                  required
                  value={formData.fromWarehouse}
                  onChange={e => setFormData({ ...formData, fromWarehouse: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Select</option>
                  {warehouses.map(w => (
                    <option key={w._id} value={w._id}>{w.warehouseName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 font-semibold">To Warehouse</label>
                <select
                  required
                  value={formData.toWarehouse}
                  onChange={e => setFormData({ ...formData, toWarehouse: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Select</option>
                  {warehouses.map(w => (
                    <option key={w._id} value={w._id}>{w.warehouseName}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Leave‑behind */}
            <div className="mb-6">
              <label className="block mb-1 font-semibold">Leave Behind (units)</label>
              <input
                type="number"
                min="0"
                value={formData.leaveBehind}
                onChange={e => setFormData({ ...formData, leaveBehind: Math.max(0, +e.target.value) })}
                className="w-32 px-3 py-2 border rounded"
              />
              <p className="mt-1 text-xs text-gray-500">Set to 1 to keep at least one unit per SKU in source warehouse.</p>
            </div>

            {/* submit */}
            <div className="flex justify-end gap-2">
              <button
                type="submit"
                className="px-6 py-2 text-white rounded shadow bg-cyan-500 hover:bg-cyan-600"
              >
                Transfer All
              </button>
              <button
                type="button"
                onClick={() => navigate("/transfer-list")}
                className="px-6 py-2 text-white bg-gray-400 rounded shadow hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
