import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import LoadingScreen from "../../Loading";
import { BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt } from "react-icons/fa";

/* Change this if your base URL differs */
const API = "";
const sndNew = new Audio("/sounds/beep-new.mp3");
const sndRepeat = new Audio("/sounds/beep-repeat.mp3");
function playBeep(snd) {
  try {
    snd.pause();
    snd.currentTime = 0;
    snd.play();
  } catch {}
}

function AddStockTransfer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id"); // editing?

  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  /* ───────── sidebar collapse on mobile ───────── */
  useEffect(() => { if (window.innerWidth < 768) setSidebarOpen(false); }, []);

  const [warehouses, setWarehouses] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [filteredItemsByWarehouse, setFiltered] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);

  const [formData, setFormData] = useState({
    transferDate: new Date().toLocaleDateString("en-CA"), // YYYY-MM-DD (IST)
    fromWarehouse: "",
    toWarehouse: "",
    details: "",
    note: "",
  });

  const auth = {
    headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
  };

  /* ───────────────── WAREHOUSES ───────────────── */
  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/warehouses", {
        ...auth,
        params: { scope: "mine" }
      });
      const list = data.data || [];
      setWarehouses(list);

      if (!id && list.length) {
        const restricted = list.find(w => w.isRestricted && w.status === "Active");
        const defFrom = restricted
          ? restricted._id
          : list.find(w => w.status === "Active")?._id || "";
        setFormData(prev => ({ ...prev, fromWarehouse: defFrom }));
      }
    } catch (err) { console.error("warehouses:", err.message); }
    finally { setLoading(false); }
  };

  /* ───────────────── ITEMS FOR A SOURCE WAREHOUSE ───────────────── */
  const fetchItems = async (warehouseId = formData.fromWarehouse) => {
    try {
      setLoading(true);
      const params = warehouseId ? { warehouse: warehouseId } : {};
      const { data } = await axios.get(`${API}/api/items`, {
        ...auth,
        params,
      });
      const items = data.data || [];

      const flat = items
        .map(item => {
          const isVar = Boolean(item.parentItemId);
          return {
            ...item,
            parentId: isVar ? item.parentItemId : item._id,
            variantId: isVar ? item._id : null,
            displayName: isVar
              ? `${item.itemName} / ${item.variantName || "Variant"}`
              : item.itemName,
            itemCode: item.itemCode || "",
            barcode: item.barcodes?.[0] || "",
            barcodes: item.barcodes || [],
            isVariant: isVar,
            currentStock: item.currentStock || 0,
            warehouse: item.warehouse,
          };
        })
        .filter(it => it.currentStock > 0); // only positive stock

      setAllItems(flat);
      setFiltered(flat);
      return flat; 
    } catch (err) {
      console.error("items:", err.message);
      setAllItems([]); setFiltered([]);
    } finally { setLoading(false); }
  };

  /* ───────────────── EXISTING TRANSFER (edit mode) ───────────────── */
  const loadStockTransfer = async (transferId) => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API}/api/stock-transfers/${transferId}`, auth);
      const tr = data.data;

      setFormData({
        transferDate: tr.transferDate?.split("T")[0] || "",
        fromWarehouse: tr.fromWarehouse?._id || "",
        toWarehouse: tr.toWarehouse?._id || "",
        details: tr.details || "",
        note: tr.note || "",
      });

      let live = [];
      if (tr.fromWarehouse?._id) {
        live = await fetchItems(tr.fromWarehouse._id); // ← get the list back
      }

      const mapped = (tr.items || []).map(it => {
        const doc = live.find(i => i._id.toString() === (it.item?._id || it.item).toString()) || {};
        const origQty = it.quantity || 1;
        return {
          itemId: it.item?._id || it.item,
          itemName: doc.displayName || it.item?.itemName || "Unknown Item",
          quantity: origQty,
          origQty: origQty, // Store original quantity for edit mode
          maxQty: origQty, // Use original quantity as max for editing
          isVariant: doc.isVariant || false,
          variantName: doc.variantName || "",
        };
      });
      setSelectedItems(mapped);
    } catch (err) {
      console.error("load transfer:", err.message);
      alert("Error loading stock transfer");
    } finally { setLoading(false); }
  };

  /* ───────────────── EFFECTS ───────────────── */
  useEffect(() => {
    fetchWarehouses();
  }, []);
  useEffect(() => {
    if (formData.fromWarehouse) fetchItems(formData.fromWarehouse);
    else { setAllItems([]); setFiltered([]); }
  }, [formData.fromWarehouse]);

  useEffect(() => {
    if (id) loadStockTransfer(id);
  }, [id]); 

  /* filter list strictly to the chosen warehouse (safety) */
  useEffect(() => {
    if (formData.fromWarehouse) {
      const f = allItems.filter(it => it.warehouse?._id === formData.fromWarehouse);
      setFiltered(f);
      if (!id) setSelectedItems([]); // reset when user switches warehouse
    } else {
      setFiltered([]);
      if (!id) setSelectedItems([]);
    }
  }, [formData.fromWarehouse, allItems, id]);

  /* ───────────────── SEARCH (autocomplete) ───────────────── */
  const dropdown = searchQuery
    ? filteredItemsByWarehouse.filter(it => {
        const q = searchQuery.toLowerCase();
        return (
          it.displayName.toLowerCase().includes(q) ||
          it.itemCode.toLowerCase().includes(q) ||
          (it.barcode && it.barcode.toLowerCase().includes(q))
        );
      })
    : [];

  /* ───────────────── ADD ITEM (with stock check) ───────────────── */
  const handleAddItem = (item) => {
    if (!item) return;

    if ((item.currentStock || 0) <= 0) {
      alert(
        `${item.displayName} has only ${item.currentStock || 0} in stock.\n` +
        "You must leave at least one unit behind."
      );
      return;
    }

    const exists = selectedItems.find(it => it.itemId === item._id);

    if (exists) {
      if (exists.quantity >= exists.maxQty) {
        alert(`Max transferable qty is ${exists.maxQty}.`);
        return;
      }
      setSelectedItems(
        selectedItems.map(it =>
          it.itemId === item._id ? { ...it, quantity: it.quantity + 1 } : it
        )
      );
      playBeep(sndRepeat); 
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          itemId: item._id,
          itemName: item.displayName,
          quantity: 1,
          maxQty: item.currentStock,
          isVariant: item.isVariant,
          variantName: item.variantName,
        },
      ]);
      playBeep(sndNew);  
    }
    setSearchQuery("");
  };

  /* ───────────────── UPDATE QTY ───────────────── */
  const handleItemChange = (id, val) => {
    setSelectedItems(selectedItems.map(it => {
      if (it.itemId !== id) return it;
      const want = parseInt(val, 10) || 1;
      console.log(`Attempting to change ${it.itemName} from ${it.quantity} to ${want}`); // Debug log
      const allow = it.maxQty; // Use original maxQty for edit mode
      if (want > allow) {
        alert(`Stock limit exceeded. Max transferable is ${allow}.`);
        return { ...it, quantity: allow };
      }
      return { ...it, quantity: want };
    }));
  };

  /* ───────────────── REMOVE ITEM ───────────────── */
  const handleRemoveItem = id =>
    setSelectedItems(selectedItems.filter(it => it.itemId !== id));

  /* ───────────────── SUBMIT ───────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.transferDate || !formData.fromWarehouse || !formData.toWarehouse)
      return alert("Fill date, From & To warehouse.");
    if (formData.fromWarehouse === formData.toWarehouse)
      return alert("Cannot transfer to the same warehouse.");
    if (selectedItems.length === 0)
      return alert("Add at least one item.");

    setLoading(true);
    try {
      console.log("Current selectedItems before payload:", selectedItems); // Debug log
      const payload = {
        ...formData,
        items: selectedItems.map(it => ({
          item: it.itemId,
          quantity: it.quantity,
        })),
      };
      console.log("Payload being sent:", payload); // Debug log
      const token = localStorage.getItem("token");
      if (id) {
        await axios.put(`${API}/api/stock-transfers/${id}`, payload, auth);
        alert("Stock transfer updated!");
      } else {
        await axios.post(`${API}/api/stock-transfers`, payload, auth);
        alert("Stock transfer created!");
      }
      navigate("/transfer-list");
    } catch (err) {
      console.error("submit:", err);
      alert(err.response?.data?.message || "Submit failed.");
    } finally { setLoading(false); }
  };

  /* ───────────────── RENDER ───────────────── */
  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />

        <div className="flex-grow p-4">
          {/* Header */}
          <header className="flex flex-col items-center justify-between p-4 mb-2 bg-white rounded shadow md:flex-row">
            <div className="flex items-baseline gap-2">
              <h1 className="text-xl font-semibold">
                {id ? "Edit Stock Transfer" : "Add Stock Transfer"}
              </h1>
              <span className="text-sm text-gray-600">
                {id ? "Update existing transfer" : "Create new transfer"}
              </span>
            </div>
            <nav className="flex items-center text-sm text-gray-500">
              <a href="/dashboard" className="flex items-center hover:text-cyan-600">
                <FaTachometerAlt className="mr-2" /> Home
              </a>
              <BiChevronRight className="mx-2" />
              <a href="/transfer-list" className="hover:text-cyan-600">
                Stock Transfer List
              </a>
            </nav>
          </header>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="p-4 bg-white border-t-4 rounded shadow border-cyan-500"
          >

            {/* ─── Row 1: Date / From / To ─── */}
            <div className="grid gap-4 mb-4 md:grid-cols-3">
              <div>
                <label className="block mb-1 font-semibold">Transfer Date</label>
                <input
                  type="date"
                  value={formData.transferDate}
                  onChange={e => setFormData({ ...formData, transferDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold">From Warehouse</label>
                <select
                  value={formData.fromWarehouse}
                  onChange={e => setFormData({ ...formData, fromWarehouse: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map(w => (
                    <option key={w._id} value={w._id}>{w.warehouseName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 font-semibold">To Warehouse</label>
                <select
                  value={formData.toWarehouse}
                  onChange={e => setFormData({ ...formData, toWarehouse: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map(w => (
                    <option key={w._id} value={w._id}>{w.warehouseName}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* ─── Row 2: Details / Note ─── */}
            <div className="grid gap-4 mb-4 md:grid-cols-2">
              <div>
                <label className="block mb-1 font-semibold">Details</label>
                <input
                  type="text"
                  value={formData.details}
                  onChange={e => setFormData({ ...formData, details: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold">Note</label>
                <input
                  type="text"
                  value={formData.note}
                  onChange={e => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>

            {/* ─── Search & autocomplete ─── */}
            <div className="relative mb-4">
              <label className="block mb-1 font-semibold">Search Item</label>
              <input
                type="text"
                placeholder="Name / Code / Barcode"
                value={searchQuery}
                onChange={e => {
                  const val = e.target.value.trim();
                  setSearchQuery(val);

                  const hit = allItems.find(
                    i => i.barcodes?.includes(val) || i.itemCode === val
                  );
                  if (hit) handleAddItem(hit);
                }}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault(); // ⏹︎ stop form submit
                  }
                }}
                className="w-full px-4 py-2 border rounded"
                disabled={!formData.fromWarehouse}
              />
              {searchQuery && dropdown.length > 0 && (
                <ul className="absolute z-50 w-full max-h-60 overflow-y-auto bg-white border rounded shadow mt-1">
                  {dropdown.map(it => (
                    <li
                      key={it._id}
                      className="p-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleAddItem(it)}
                    >
                      <strong>{it.itemCode}</strong> – {it.displayName}
                      {it.isVariant ? ` (${it.variantName})` : ""}
                      {it.barcode && <span className="text-gray-500"> – {it.barcode}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* ─── Selected list ─── */}
            <div className="p-4 mb-4 bg-white rounded shadow overflow-x-auto">
              <div className="flex px-2 py-2 text-sm font-semibold text-white bg-cyan-600">
                <div className="w-2/3">Item Name</div>
                <div className="w-1/3 text-center">Qty</div>
                <div className="w-1/3 text-center">Action</div>
              </div>

              {selectedItems.length === 0 && (
                <div className="p-4 text-center text-gray-500">No items added.</div>
              )}

              {selectedItems.map(sel => (
                <div key={sel.itemId} className="flex items-center px-2 py-2 border-t">
                  <div className="w-2/3">{sel.itemName}</div>

                  <div className="w-1/3 text-center">
                    <input
                      type="number"
                      min="1"
                      max={sel.maxQty}
                      value={sel.quantity}
                      onChange={e => handleItemChange(sel.itemId, e.target.value)}
                      className="w-16 text-center border rounded"
                    />
                    <div className="text-xs text-gray-400">max {sel.maxQty}</div>
                  </div>

                  <div className="w-1/3 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(sel.itemId)}
                      className="px-2 py-1 text-white bg-red-500 rounded"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ─── Buttons ─── */}
            <div className="flex justify-end gap-2">
              <button
                type="submit"
                className="px-6 py-2 text-white rounded shadow bg-cyan-500 hover:bg-cyan-600"
              >
                {id ? "Update" : "Save"}
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

export default AddStockTransfer;