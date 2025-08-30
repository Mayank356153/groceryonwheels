// src/components/Warehouse/WarehouseForm.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt } from "react-icons/fa";
import { useGeolocated } from "react-geolocated";
import { useNavigate, useSearchParams } from "react-router-dom";

import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import Loading from "../../Loading.jsx";

/* ───────────────────────────────────────────────────────────── */

const WarehouseForm = () => {
  /* routing */
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const warehouseId = params.get("id");

  /* auth helpers */
  const role = (localStorage.getItem("role") || "").toLowerCase();         // "admin" | "user"
  const userStores =
    JSON.parse(localStorage.getItem("stores") || "[]") || [];             // string[]
  const assignedStore = localStorage.getItem("storeId") || userStores[0]; // default
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  /* ui state */
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [loading, setLoading] = useState(false);

  /* look-ups */
  const [stores, setStores] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [terminals, setTerminals] = useState([]);

  /* parent account of *currently chosen* store */
  const [storeParent, setStoreParent] = useState(null);

  /* form */
  const [form, setForm] = useState({
    warehouseName: "",
    mobile: "",
    email: "",
    status: "Active",
    store: role === "admin" ? "" : assignedStore,
    cashAccount: "", // "" → auto-create
    terminalId: "",
    tid: "",
  });
  const [qrFile, setQrFile] = useState(null);

  /* geolocation */
  const {
    coords,
    isGeolocationAvailable,
  } = useGeolocated({ userDecisionTimeout: 5000, watchPosition: false });

  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  useEffect(() => {
    if (coords) {
      setLatitude(coords.latitude);
      setLongitude(coords.longitude);
    }
  }, [coords]);

  /* ────────────────── fetch Stores once */
  useEffect(() => {
    axios
      .get("admin/store/add/store", { headers })
      .then((res) => setStores(res.data.result ?? []))
      .catch(console.error);
  }, []);

  /* whenever Stores OR form.store change → compute storeParent */
  useEffect(() => {
    if (!form.store) return setStoreParent(null);

    const sel = stores.find((s) => s._id === form.store);
    const pid =
      typeof sel?.storeAccount === "string"
        ? sel.storeAccount
        : sel?.storeAccount?._id;
    setStoreParent(pid || null);
  }, [form.store, stores]);

  /* accounts & terminals (once) */
  useEffect(() => {
    axios
      .get("api/accounts", { headers })
      .then((r) => setAccounts(r.data.data ?? []))
      .catch(console.error);

    axios
      .get("api/terminals", { headers })
      .then((r) => setTerminals(r.data.data ?? []))
      .catch(console.error);
  }, []);

  /* edit mode */
  useEffect(() => {
    if (!warehouseId) return;
    setLoading(true);
    axios
      .get(`api/warehouses/${warehouseId}`, { headers })
      .then((res) => {
        const d = res.data.data;
        if (!d) return;
        setForm({
          warehouseName: d.warehouseName || "",
          mobile: d.mobile || "",
          email: d.email || "",
          status: d.status || "Active",
          store: d.store?._id || form.store,
          cashAccount: d.cashAccount?._id || "",
          terminalId: d.terminal?._id || "",
          tid: d.tid || "",
        });
        if (d.Latitude != null) setLatitude(d.Latitude);
        if (d.Longitude != null) setLongitude(d.Longitude);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [warehouseId]);

  /* handlers */
  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const onFile = (e) => setQrFile(e.target.files[0] || null);

  /* submit */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.terminalId && !form.tid.trim())
      return alert("Either choose a Terminal or enter a new TID");
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ""));
      if (latitude != null) fd.append("Latitude", latitude);
      if (longitude != null) fd.append("Longitude", longitude);
      if (qrFile) fd.append("qrCode", qrFile);

      if (warehouseId) {
        await axios.put(`api/warehouses/${warehouseId}`, fd, { headers });
        alert("Warehouse updated!");
      } else {
        await axios.post("api/warehouses", fd, { headers });
        alert("Warehouse created!");
      }
      navigate("/warehouse-list");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  /* cash-accounts filtered for user */
  const accountOptions =
    role === "admin"
      ? accounts
      : accounts.filter(
          (a) =>
            (typeof a.parentAccount === "string"
              ? a.parentAccount
              : a.parentAccount?._id) === storeParent
        );

  /* list of stores user MAY pick */
  const myStores =
    role === "admin"
      ? stores
      : stores.filter((s) => userStores.includes(s._id));

  /* ────────────────── render */
  if (loading) return <Loading />;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Navbar isSidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={sidebarOpen} />
        <main className="flex-grow p-6 overflow-auto">
          {/* heading */}
          <header className="flex justify-between items-center mb-6 bg-white p-4 rounded shadow">
            <div>
              <h1 className="text-2xl font-bold">
                {warehouseId ? "Edit Warehouse" : "Add Warehouse"}
              </h1>
              <p className="text-gray-600">
                {warehouseId ? "Update details" : "Fill in details"}
              </p>
            </div>
            <nav className="text-gray-500 text-sm">
              <a href="/dashboard" className="flex items-center">
                <FaTachometerAlt className="mr-1" /> Home
              </a>
              <BiChevronRight className="mx-2" />
              <a href="/warehouse-list">Warehouse List</a>
            </nav>
          </header>

          {/* form */}
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded shadow space-y-4"
          >
            {/* basic inputs */}
            {[
              { label: "Name*", name: "warehouseName", req: true },
              { label: "Mobile", name: "mobile" },
              { label: "Email", name: "email", type: "email" },
            ].map((f) => (
              <div key={f.name} className="flex items-center">
                <label className="w-40 font-semibold">{f.label}</label>
                <input
                  className="flex-grow p-2 border rounded"
                  name={f.name}
                  type={f.type || "text"}
                  required={f.req}
                  value={form[f.name]}
                  onChange={onChange}
                />
              </div>
            ))}

            {/* status */}
            <div className="flex items-center">
              <label className="w-40 font-semibold">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={onChange}
                className="flex-grow p-2 border rounded"
              >
                <option>Active</option>
                <option>Restricted</option>
                <option>Inactive</option>
              </select>
            </div>

            {/* store selector */}
            {myStores.length > 1 && (
              <div className="flex items-center">
                <label className="w-40 font-semibold">Store</label>
                <select
                  name="store"
                  value={form.store}
                  onChange={onChange}
                  required
                  className="flex-grow p-2 border rounded"
                >
                  <option value="">Select Store</option>
                  {myStores.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.StoreName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* cash account */}
            <div className="flex items-center">
              <label className="w-40 font-semibold">Cash Account</label>
              <select
                name="cashAccount"
                value={form.cashAccount}
                onChange={onChange}
                className="flex-grow p-2 border rounded"
              >
                <option value="">Auto-create (recommended)</option>
                {accountOptions.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.accountNumber} – {a.accountName}
                  </option>
                ))}
              </select>
            </div>

            {/* terminal */}
            <div className="flex items-center">
              <label className="w-40 font-semibold">Terminal</label>
              <select
                name="terminalId"
                value={form.terminalId}
                onChange={onChange}
                className="flex-grow p-2 border rounded"
              >
                <option value="">Create New</option>
                {terminals.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.tid}
                  </option>
                ))}
              </select>
            </div>

            {/* new TID */}
            {!form.terminalId && (
              <div className="flex items-center">
                <label className="w-40 font-semibold">New&nbsp;TID*</label>
                <input
                  name="tid"
                  required
                  value={form.tid}
                  onChange={onChange}
                  className="flex-grow p-2 border rounded"
                  placeholder="e.g. TID-12345"
                />
              </div>
            )}

            {/* QR */}
            <div className="flex items-center">
              <label className="w-40 font-semibold">QR Code</label>
              <input
                type="file"
                accept="image/*"
                onChange={onFile}
                className="flex-grow p-2 border rounded"
              />
            </div>

            {/* location helper */}
            <div className="flex items-center">
              <label className="w-40 font-semibold">Location</label>
              <button
                type="button"
                onClick={() =>
                  alert(
                    isGeolocationAvailable
                      ? "Fetching location..."
                      : "Geolocation unavailable"
                  )
                }
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                Get Current
              </button>
            </div>

            {/* actions */}
            <div className="text-center pt-6 space-x-4">
              <button className="px-8 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                {warehouseId ? "Update" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/warehouse-list")}
                className="px-8 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default WarehouseForm;
