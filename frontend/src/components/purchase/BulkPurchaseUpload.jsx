import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar   from "../Navbar.jsx";
import Sidebar  from "../Sidebar.jsx";
import Loading  from "../../Loading";

export default function BulkPurchaseUpload() {
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers,  setSuppliers]  = useState([]);
  const [form, setForm] = useState({ warehouse: "", supplier: "" });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = { headers:{ Authorization:`Bearer ${localStorage.getItem("token")}` } };

  useEffect(() => {
    (async () => {
      const [w,s] = await Promise.all([
        axios.get("/api/warehouses", {                 // only the ones the user may use
    ...auth,
    params: { scope: "mine" }                    // 👈 one-liner
  }),
        axios.get("/api/suppliers" , auth)
      ]);
      setWarehouses((w.data.data||[]).filter(x=>x.status==="Active"));
      setSuppliers ( s.data.data||[]);
    })();
  },[]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.warehouse || !form.supplier) return alert("Pick warehouse & supplier");
    if (!file) return alert("Choose a CSV file");
    const fd = new FormData();
    fd.append("file"     , file);
    fd.append("warehouse", form.warehouse);
    fd.append("supplier" , form.supplier);
    try {
      setLoading(true);
      await axios.post("/api/purchases/bulk", fd, auth);
      alert("Bulk purchase saved!");
      navigate("/purchase-list");
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally { setLoading(false); }
  };

  if (loading) return <Loading/>;

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <Navbar/>
      <div className="flex flex-grow">
        <Sidebar/>
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-semibold mb-4">Bulk Purchase Upload</h1>
          <form onSubmit={handleSubmit} className="max-w-md space-y-4 bg-white p-6 rounded shadow">
            <div>
              <label>Warehouse</label>
              <select value={form.warehouse}
                      onChange={e=>setForm({...form,warehouse:e.target.value})}
                      className="w-full border p-2 rounded">
                <option value="">Select</option>
                {warehouses.map(w=><option key={w._id} value={w._id}>{w.warehouseName}</option>)}
              </select>
            </div>
            <div>
              <label>Supplier</label>
              <select value={form.supplier}
                      onChange={e=>setForm({...form,supplier:e.target.value})}
                      className="w-full border p-2 rounded">
                <option value="">Select</option>
                {suppliers.map(s=><option key={s._id} value={s._id}>{s.supplierName}</option>)}
              </select>
            </div>
            <div>
              <label>CSV File</label>
              <input type="file"
                     accept=".csv"
                     onChange={e=>setFile(e.target.files[0])}
                     className="w-full border p-2 rounded"/>
              <p className="text-xs text-gray-500 mt-1">
                Columns: <code>itemCode,quantity,price</code> (price optional)
              </p>
            </div>
            <button type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded w-full">
              Upload
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}
