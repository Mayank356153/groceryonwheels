/*  ────────────────────────────────────────────────────────────────
    CreateRolelist.jsx  •  Auto-cascading permissions
    Last edit: 24-Jun-2025
   ───────────────────────────────────────────────────────────────── */

import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";
import LoadingScreen from "../../Loading";

/* ╭──────────────────────────────────────────────────────────────╮
   │ 1.  Parent → helper dependency map                           │
   ╰──────────────────────────────────────────────────────────────╯ */
const MODULE_DEPENDENCIES = {
  /*  POS / Sales  */
  posorders:      ["warehouses","customers","paymenttypes","items","taxgroups","taxes","accounts","sales"],
  sales:          ["warehouses","customers","paymenttypes","items","taxgroups","taxes","accounts"],
  salesreturn:    ["warehouses","customers","paymenttypes","items","accounts","cashsummary"],

  /*  Purchases  */
  purchases:      ["warehouses","suppliers","paymenttypes","items","taxgroups","taxes","accounts","cashsummary"],
  purchasesreturn:["warehouses","suppliers","paymenttypes","items","accounts"],

  /*  Stock movement  */
  stocktransfers: ["warehouses","items"],
  stockadjustments:["warehouses","items"],

  /*  Cash / bank  */
  moneytransfers: ["accounts","warehouses","stores"],
  deposits:       ["accounts","warehouses","stores"],
  cashsummary:    ["accounts","warehouses"],

  /*  Catalogue  */
  items: [
    "brands","categories","subcategories","subsubcategories",
    "units","taxgroups","taxes","variants"
  ],
  marketingitems: ["items","categories","brands"],

  /*  Misc  */
  terminals:      ["warehouses"],
};

/* ╭──────────────────────────────────────────────────────────────╮
   │ 2.  Helper utilities                                         │
   ╰──────────────────────────────────────────────────────────────╯ */
function applyDependencies(base, key, actions) {
  const deps = MODULE_DEPENDENCIES[key] || [];
  const merged = { ...base, [key]: actions };
  deps.forEach((d) => {
    merged[d] = Array.from(new Set([...(merged[d] || []), ...actions]));
  });
  return merged;
}
function expandPermissions(obj) {
  let out = { ...obj };
  Object.entries(obj).forEach(([k, acts]) => {
    out = applyDependencies(out, k, acts);
  });
  return out;
}

/* ╭──────────────────────────────────────────────────────────────╮
   │ 3.  Component                                                │
   ╰──────────────────────────────────────────────────────────────╯ */
const CreateRolelist = () => {
  /* ───────────────── state & hooks ───────────────── */
  const [roleName,        setRoleName]   = useState("");
  const [description,     setDescription]= useState("");
  const [permissions,     setPermissions]= useState({});
  const [isSidebarOpen,   setSidebarOpen]= useState(true);
  const [localPermissions,setLocalPerms] = useState([]);
  const [loading,         setLoading]    = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");

  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  /* ────────── fetch existing role (edit mode) ────────── */
  useEffect(() => {
    (async () => {
      if (!id) return;
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return navigate("/");

      try {
        const { data } = await axios.get("/admincreatingrole/api/roles", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const current = data.roles.find((r) => r._id === id);
        if (current) {
          setRoleName(current.roleName || "");
          setDescription(current.description || "");
          const map = current.permissions.reduce((a, p) => {
            a[p.module.toLowerCase()] = p.actions;
            return a;
          }, {});
          setPermissions(map);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  /* ────────── get current user’s own perms (for guard) ────────── */
  useEffect(() => {
    try {
      setLocalPerms(JSON.parse(localStorage.getItem("permissions") || "[]"));
    } catch { setLocalPerms([]); }
  }, []);

  const hasPermissionFor = (module, action) => {
    if ((localStorage.getItem("role") || "").toLowerCase() === "admin")
      return true;
    return localPermissions.some(
      (p) =>
        p.module.toLowerCase() === module.toLowerCase() &&
        p.actions.map((a) => a.toLowerCase()).includes(action.toLowerCase())
    );
  };
  if (!hasPermissionFor("roles", "add"))
    return <div className="p-8">Insufficient permissions to create roles.</div>;

  /* ────────── master lists ────────── */
  const permissionTypes = ["Add", "Edit", "Delete", "View"];
  const modules = [
    { id:  1, name: "Accounts" },
    { id:  2, name: "AdvancePayment" },
    { id:  3, name: "Brands" },
    { id:  4, name: "Categories" },
    { id:  5, name: "Countries" },
    { id:  6, name: "Coupons" },
    { id:  7, name: "CustomerCoupons" },
    { id:  8, name: "Customers" },
    { id:  9, name: "Expenses" },
    { id: 10, name: "Help" },
    { id: 11, name: "Items" },
    { id: 12, name: "PaymentTypes" },
    { id: 13, name: "POSOrders" },
    { id: 14, name: "Purchases" },
    { id: 15, name: "PurchasesReturn" },
    { id: 16, name: "Quotations" },
    { id: 17, name: "Report" },
    { id: 18, name: "Roles" },
    { id: 19, name: "Sales" },
    { id: 20, name: "SalesReturn" },
    { id: 21, name: "SendMessages" },
    { id: 22, name: "Services" },
    { id: 23, name: "States" },
    { id: 24, name: "StockAdjustments" },
    { id: 25, name: "StockTransfers" },
    { id: 26, name: "Store" },
    { id: 27, name: "Stores" },
    { id: 28, name: "Suppliers" },
    { id: 29, name: "Taxes" },
    { id: 30, name: "TaxGroups" },
    { id: 31, name: "Units" },
    { id: 32, name: "Users" },
    { id: 33, name: "Variants" },
    { id: 34, name: "Warehouses" },
    { id: 35, name: "ExpenseCategories" },
    { id: 36, name: "SubCategories" },
    { id: 37, name: "SubSubCategories" },
    { id: 38, name: "MoneyTransfers" },
    { id: 39, name: "Deposits" },
    { id: 40, name: "CashSummary" },
    { id: 41, name: "Dashboard" },
    { id: 42, name: "MarketingItems" },
    { id: 43, name: "Banner" },
    { id: 44, name: "Terminals" },
    { id: 45, name: "Product" },
    { id: 46, name: "Order" },
    { id: 47, name: "Rider" },
    { id: 48, name: "DeliverySlot" },
    { id: 49, name: "Audit" },
    { id: 50, name: "ImageManagement" },
    { id: 51, name: "Bookings"},
    { id: 52, name: "salesPrice"},
    { id: 53, name: "rider commission"},
    { id: 54, name: "mastercoupon"},
    { id: 55, name: "AccountEdit"},
  ];

  /* ────────── checkbox helpers ────────── */
  const isEverythingSelected = () =>
    modules.every(
      (m) =>
        (permissions[m.name.toLowerCase()] || []).length ===
        permissionTypes.length
    );

  const toggleAll = () =>
    setPermissions((prev) => {
      if (isEverythingSelected()) return {};
      const all = {};
      modules.forEach(
        (m) => (all[m.name.toLowerCase()] = [...permissionTypes])
      );
      return expandPermissions(all);
    });

  const togglePermission = (module, action) => {
    const key   = module.toLowerCase();
    const prev  = permissions[key] || [];
    const next  = prev.includes(action)
      ? prev.filter((p) => p !== action)
      : [...prev, action];
    setPermissions((p) => applyDependencies(p, key, next));
  };

  const handleSelectAll = (module) => {
    const key  = module.toLowerCase();
    const full = (permissions[key] || []).length === permissionTypes.length;
    const next = full ? [] : [...permissionTypes];
    setPermissions((p) => applyDependencies(p, key, next));
  };

  /* ────────── submit ────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roleName.trim()) return alert("Role name is required");

    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    const payload = {
      roleName: roleName.trim(),
      description,
      permissions: Object.entries(expandPermissions(permissions)).map(
        ([module, actions]) => ({ module: module.replace(" ", "_"), actions })
      ),
    };

    setLoading(true);
    try {
      if (id) {
        await axios.put(`/admincreatingrole/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Role updated");
      } else {
        await axios.post("/admincreatingrole/api/roles", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Role created");
      }
      navigate("/admin/role/list");
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ────────── render ────────── */
  if (loading) return <LoadingScreen />;
  return (
    <div className="flex h-screen flex-col">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <main className="w-full p-8 overflow-auto">
          <h1 className="text-2xl font-bold mb-6">
            {id ? "Update Role" : "Create Role"}
          </h1>

          <form onSubmit={handleSubmit}>
            {/* name & description */}
            <div className="mb-4">
              <label className="block font-semibold mb-2">Role Name</label>
              <input
                className="border rounded p-2 w-full"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
              />
            </div>
            <div className="mb-6">
              <label className="block font-semibold mb-2">Description</label>
              <textarea
                rows="3"
                className="border rounded p-2 w-full"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* permissions grid */}
            <div className="overflow-auto">
              <table className="min-w-full bg-gray-50">
                <thead>
                  <tr className="bg-gray-300">
                    <th className="border px-4 py-2">#</th>
                    <th className="border px-4 py-2">Module</th>
                    <th className="border px-4 py-2 text-center">Permissions</th>
                    <th className="border px-4 py-2 text-center">Row All</th>
                    <th className="border px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={isEverythingSelected()}
                        onChange={toggleAll}
                        title="Select ALL permissions on ALL modules"
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {modules.map((m, idx) => {
                    const key = m.name.toLowerCase();
                    const selected = permissions[key] || [];
                    return (
                      <tr key={m.id}>
                        <td className="border px-4 py-2">{idx + 1}</td>
                        <td className="border px-4 py-2">{m.name}</td>
                        <td className="border px-4 py-2">
                          <div className="flex flex-wrap gap-2">
                            {permissionTypes.map((perm) => (
                              <label
                                key={`${m.name}-${perm}`}
                                className="flex items-center gap-1"
                              >
                                <input
                                  type="checkbox"
                                  checked={selected.includes(perm)}
                                  onChange={() => togglePermission(m.name, perm)}
                                />
                                <span>{perm}</span>
                              </label>
                            ))}
                          </div>
                        </td>
                        <td className="border px-4 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={
                              selected.length === permissionTypes.length
                            }
                            onChange={() => handleSelectAll(m.name)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* buttons */}
            <div className="flex justify-center gap-8 mt-8">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded w-[150px]"
              >
                {id ? "Update" : "Save"}
              </button>
              <button
                type="button"
                className="bg-orange-500 text-white px-6 py-2 rounded w-[150px]"
                onClick={() => {
                  setRoleName("");
                  setDescription("");
                  setPermissions({});
                }}
              >
                Clear
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default CreateRolelist;
