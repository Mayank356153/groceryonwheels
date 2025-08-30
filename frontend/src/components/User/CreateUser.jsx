// src/components/CreateUser.jsx
import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";
import LoadingScreen from "../../Loading";
import { FaTachometerAlt } from "react-icons/fa";
import { BiChevronRight } from "react-icons/bi";

const CreateUser = () => {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const navigate = useNavigate();

  // ── Token + headers ─────────────────────────────────────────────
  const token = localStorage.getItem("token") || "";
  const headers = { Authorization: `Bearer ${token}` };
  if (!token) navigate("/");

  // Parse store IDs from token (used to restrict non-admin)
  let tokenStoreIds = [];
  try {
    const payload = JSON.parse(window.atob(token.split(".")[1]));
    tokenStoreIds = Array.isArray(payload.stores) ? payload.stores.map(String) : [];
  } catch (_) {
    // ignore
  }

  // ── UI state ───────────────────────────────────────────────────
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);
  const [loading, setLoading] = useState(false);

  // ── Role / permissions context ─────────────────────────────────
  const [isAdminUser, setIsAdminUser] = useState(false);

  // ── Lookup data ────────────────────────────────────────────────
  const [roles, setRoles] = useState([]);
  const [stores, setStores] = useState([]);
  const [allowedWarehouses, setAllowedWarehouses] = useState([]);

  // ── Form state ────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    userName: "",
    FirstName: "",
    LastName: "",
    Mobile: "",
    Email: "",
    Role: "",
    Store: [], // Admin: any stores; Non-admin: subset of tokenStoreIds
  });
  const [warehouseGroup, setWarehouseGroup] = useState([]);
  const [defaultWarehouse, setDefaultWarehouse] = useState("");
  const [password, setPassword] = useState("");
  const [confPassword, setConfPassword] = useState("");
  const [status, setStatus] = useState("active");

  // ── Fetch profile (role) + roles + stores ──────────────────────
 // ── Fetch profile (role) + roles + stores — robust admin + array/object responses
useEffect(() => {
  if (!token) { navigate("/"); return; }

  let mounted = true;

  (async () => {
    // 1) Read admin/stores from token
    let roleFromToken = "";
    let tokenStoreIdsLocal = [];
    try {
      const payload = JSON.parse(window.atob(token.split(".")[1]));
      roleFromToken = String(payload.role || "").toLowerCase(); // should be "admin" per your log
      tokenStoreIdsLocal = Array.isArray(payload.stores) ? payload.stores.map(String) : [];
    } catch {}

    try {
      // 2) Fetch in parallel
      const [rolesP, storesP, profileP] = await Promise.allSettled([
        axios.get("/admincreatingrole/api/roles", { headers }),
        axios.get("/admin/store/add/store", { headers }),
        axios.get("/admiaddinguser/profile", { headers }),
      ]);

      if (!mounted) return;

      // 3) Roles
      const rolesList = rolesP.status === "fulfilled" ? (rolesP.value.data.roles || []) : [];
      setRoles(rolesList);

      // 4) Determine admin from either profile or token
      const profRoleName = (profileP.status === "fulfilled"
        ? (profileP.value.data?.role || "")
        : ""
      ).toLowerCase();
      const isAdmin = profRoleName === "admin" || roleFromToken === "admin";
      setIsAdminUser(isAdmin);

      // 5) Stores — support both array and object envelopes
      const storesRaw = storesP.status === "fulfilled" ? storesP.value.data : [];
      const allStores = Array.isArray(storesRaw)
        ? storesRaw
        : (storesRaw.result ?? storesRaw.data ?? storesRaw.stores ?? []);

      setStores(
        isAdmin
          ? allStores
          : allStores.filter(s => tokenStoreIdsLocal.includes(String(s._id)))
      );
    } catch (e) {
      console.error("Bootstrap error:", e);
      if (mounted) {
        setIsAdminUser(false);
        setStores([]);
      }
    }
  })();

  return () => { mounted = false; };
  // include navigate/token so effect runs correctly
}, [token, navigate]);

  // ── Load warehouses for currently selected stores ──────────────
  const loadWarehousesForStores = async (storeIds) => {
    if (!storeIds || storeIds.length === 0) {
      setAllowedWarehouses([]);
      setWarehouseGroup([]);
      setDefaultWarehouse("");
      return;
    }
    try {
      // Try server-side filtering first (recommended)
    const { data } = await axios.get("api/warehouses", {
     headers,
     params: { scope: "mine" },
   });
   // 2) keep only the ones whose `store` sits in the current Store field
   const listAll = Array.isArray(data) ? data
                : (data.data || data.result || data.warehouses || []);
   const list    = listAll.filter(w => {
     const sid = String(w.store?._id || w.store || "");
     return storeIds.includes(sid);
   });
      setAllowedWarehouses(list);

      // prune current picks
      setWarehouseGroup(prev => prev.filter(id => list.some(w => String(w._id) === String(id))));
      setDefaultWarehouse(prev => (list.some(w => String(w._id) === String(prev)) ? prev : ""));
    } catch (e) {
      console.warn("Server filter failed or not available. Falling back to client filter.", e);
      try {
        const { data: allData } = await axios.get("api/warehouses", { headers });
        const all = Array.isArray(allData) ? allData : (allData.data || allData.result || allData.warehouses || []);
        // keep if w.store equals any of the storeIds (support both populated and raw id)
        const filtered = all.filter(w => {
          const sid = (w.store && (w.store._id || w.store)) ? String(w.store._id || w.store) : "";
          return storeIds.includes(sid);
        });
        setAllowedWarehouses(filtered);

        setWarehouseGroup(prev => prev.filter(id => filtered.some(w => String(w._id) === String(id))));
        setDefaultWarehouse(prev => (filtered.some(w => String(w._id) === String(prev)) ? prev : ""));
      } catch (err2) {
        console.error("Failed to load warehouses:", err2);
        setAllowedWarehouses([]);
        setWarehouseGroup([]);
        setDefaultWarehouse("");
      }
    }
  };

  // ── Preload for edit ───────────────────────────────────────────
  useEffect(() => {
    if (!editId) return;
    setLoading(true);
    axios
      .get("admiaddinguser/userlist", { headers })
      .then(res => {
        const u = (res.data || []).find(x => String(x._id) === String(editId));
        if (!u) return;

        const preloadStores = (u.Store || []).map(s => String(s._id || s));
        // If non-admin, clamp to subset of allowed stores (tokenStoreIds)
        const safeStores = isAdminUser ? preloadStores : preloadStores.filter(id => tokenStoreIds.includes(id));

        setFormData({
          userName: u.userName || "",
          FirstName: u.FirstName || "",
          LastName: u.LastName || "",
          Mobile: u.Mobile || "",
          Email: u.Email || "",
          Role: u.Role || "",
          Store: safeStores,
        });

        setWarehouseGroup((u.WarehouseGroup || []).map(String));
        setDefaultWarehouse(u.Defaultwarehouse ? String(u.Defaultwarehouse) : "");
        setStatus(u.status || "active");

        // refresh allowed warehouses for the preloaded stores
        if (safeStores.length) loadWarehousesForStores(safeStores);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, isAdminUser, token]);

  // ── Handlers ───────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
  };

  const addStore = (id) => {
    if (!id) return;
    // Non-admin: restrict selection to allowed set (stores already filtered in UI, this is a guard)
    if (!isAdminUser && !stores.some(s => String(s._id) === String(id))) return;

    setFormData(f => {
      if (f.Store.includes(id)) return f;
      return { ...f, Store: [...f.Store, id] };
    });
  };

  const removeStore = (id) => {
    setFormData(f => ({ ...f, Store: f.Store.filter(s => String(s) !== String(id)) }));
  };

  const addWarehouse = (id) => {
    if (
      id &&
      !warehouseGroup.includes(id) &&
      allowedWarehouses.some(w => String(w._id) === String(id))
    ) {
      setWarehouseGroup(prev => [...prev, id]);
    }
  };

  const removeWarehouse = (id) => {
    setWarehouseGroup(prev => prev.filter(x => String(x) !== String(id)));
    if (String(defaultWarehouse) === String(id)) setDefaultWarehouse("");
  };

  // When Store(s) change, reload allowed warehouses and prune invalid picks
  useEffect(() => {
    loadWarehousesForStores(formData.Store.map(String));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.Store.join(",")]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((password || confPassword) && password !== confPassword) {
      return alert("Passwords do not match");
    }
    setLoading(true);
    const payload = {
      ...formData,
      WarehouseGroup: warehouseGroup,
      Defaultwarehouse: defaultWarehouse || null,
      status,
    };
    if (password.trim()) payload.Password = password.trim();

    try {
      if (editId) {
        await axios.put(`admiaddinguser/${editId}`, payload, { headers });
        alert("User updated");
      } else {
        await axios.post("admiaddinguser/adduserbyadmin", payload, { headers });
        alert("User created");
      }
      navigate("/admin/user/list");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error saving user");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />

        <form onSubmit={handleSubmit} className="flex-grow p-6 overflow-auto bg-gray-100">
          {/* Header & Breadcrumb */}
          <header className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold">{editId ? "Edit User" : "Create User"}</h1>
              <p className="text-gray-600">
                {editId ? "Modify user details" : "Fill in user details"}
              </p>
            </div>
            <nav className="flex items-center text-gray-500">
              <NavLink to="/dashboard" className="flex items-center">
                <FaTachometerAlt className="mr-1" /> Home
              </NavLink>
              <BiChevronRight className="mx-2" />
              <NavLink to="/admin/user/list">User List</NavLink>
            </nav>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left */}
            <div className="space-y-4">
              {[
                { label: "Username", name: "userName", req: true },
                { label: "First Name", name: "FirstName", req: true },
                { label: "Last Name", name: "LastName", req: true },
                { label: "Mobile", name: "Mobile" },
                { label: "Email", name: "Email", type: "email", req: true },
              ].map(({ label, name, type = "text", req }) => (
                <div key={name}>
                  <label className="block font-semibold">
                    {label}
                    {req && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type={type}
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    required={req}
                    className="w-full p-2 border rounded"
                  />
                </div>
              ))}

              {/* Role */}
              <div>
                <label className="block font-semibold">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="Role"
                  value={formData.Role}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Role</option>
                  {roles.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.roleName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Password */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold">
                    Password{!editId && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!editId}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold">
                    Confirm{!editId && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="password"
                    name="confirmNewPassword"
                    autoComplete="new-password"
                    value={confPassword}
                    onChange={(e) => setConfPassword(e.target.value)}
                    required={!editId}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="space-y-4">
              {/* Store (admin = all stores; non-admin = subset only) */}
              <div>
                <label className="block font-semibold">Store</label>
                <select
                  onChange={(e) => addStore(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Store</option>
                  {stores.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.StoreName}
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.Store.map((id) => {
                    const name = stores.find((s) => String(s._id) === String(id))?.StoreName || id;
                    return (
                      <span
                        key={id}
                        className="px-2 py-1 bg-gray-200 rounded flex items-center"
                      >
                        {name}
                        <button
                          type="button"
                          onClick={() => removeStore(id)}
                          className="ml-1 text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Warehouse Group */}
              <div>
                <label className="block font-semibold">Warehouse Group</label>
                <select
                  onChange={(e) => addWarehouse(e.target.value)}
                  disabled={allowedWarehouses.length === 0}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Warehouse</option>
                  {allowedWarehouses.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.warehouseName}
                    </option>
                  ))}
                </select>
                {allowedWarehouses.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Select a store first to pick its warehouses.
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {warehouseGroup.map((id) => {
                    const name =
                      allowedWarehouses.find((w) => String(w._id) === String(id))?.warehouseName ||
                      id;
                    return (
                      <span
                        key={id}
                        className="px-2 py-1 bg-gray-200 rounded flex items-center"
                      >
                        {name}
                        <button
                          type="button"
                          onClick={() => removeWarehouse(id)}
                          className="ml-1 text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Default Warehouse */}
              <div>
                <label className="block font-semibold">Default Warehouse</label>
                <select
                  value={defaultWarehouse}
                  onChange={(e) => setDefaultWarehouse(e.target.value)}
                  disabled={warehouseGroup.length === 0}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Default</option>
                  {warehouseGroup.map((id) => {
                    const name =
                      allowedWarehouses.find((w) => String(w._id) === String(id))?.warehouseName ||
                      id;
                    return (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block font-semibold">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-6 flex justify-center gap-4">
            <button type="submit" className="px-8 py-2 bg-green-600 text-white rounded">
              {editId ? "Update" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/user/list")}
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

export default CreateUser;
