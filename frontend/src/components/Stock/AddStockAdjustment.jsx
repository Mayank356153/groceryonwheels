import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import LoadingScreen from "../../Loading";
import { BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt } from "react-icons/fa";

function AddStockAdjustment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id"); // if present, we are editing

  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  // Warehouse dropdown data
  const [warehouses, setWarehouses] = useState([]);

  // Items for searching
  const [allItems, setAllItems] = useState([]);
  const [filteredItemsByWarehouse, setFilteredItemsByWarehouse] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Table of selected items
  const [selectedItems, setSelectedItems] = useState([]);

  // Stock Adjustment form data
  const [formData, setFormData] = useState({
    warehouse: "",                                  // ⬅️ will default later if not editing
    adjustmentDate: new Date().toLocaleDateString("en-CA"),
    referenceNo: "",
    note: "",
    totalQuantity: 0,
  });

  // Compute total quantity from selected items
  const totalQuantity = selectedItems.reduce(
    (sum, it) => sum + (it.quantity || 0),
    0
  );

  // ─── FETCH INITIAL DATA ─────────────────────────────────────────────────
  useEffect(() => {
    fetchWarehouses();
    if (!id) {
      generateNextRefNumber();
    }
  }, []);

  // Whenever formData.warehouse changes (including the automatic default),
  // re-fetch items for that warehouse.
  useEffect(() => {
    if (formData.warehouse) {
      fetchItems(formData.warehouse);
    } else {
      setAllItems([]);
      setFilteredItemsByWarehouse([]);
      if (!id) {
        setSelectedItems([]);
      }
    }
  }, [formData.warehouse, id]);

  // If we’re in “edit” mode, wait for warehouses ➝ items ➝ then load the existing adjustment.
  useEffect(() => {
    if (id && formData.warehouse && allItems.length > 0) {
      loadStockAdjustment(id);
    }
  }, [id, formData.warehouse, allItems]);

  // ─── FETCH AND SET WAREHOUSES ─────────────────────────────────────────────
  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
       const res = await axios.get("api/warehouses", {
     headers: { Authorization: `Bearer ${token}` },
     params : { scope: "mine" }          // 👈 show me only the warehouses I’m allowed to see
   });

      // Only “Active” warehouses
      const activeWh = (res.data.data || [])
        .filter((w) => w.status === "Active")
        .map((w) => ({
          ...w,
          label: w.warehouseName,
          value: w._id,
        }));

      setWarehouses(activeWh);

      // ⬅️ If not editing, pick the “store’s warehouse” (the restricted one) as default:
      if (!id && activeWh.length > 0) {
        // assume your “store’s warehouse” is flagged with isRestricted === true
        const restricted = activeWh.find((w) => w.isRestricted);
        const defaultWhId = restricted ? restricted._id : activeWh[0]._id;
        setFormData((prev) => ({ ...prev, warehouse: defaultWhId }));
      }
    } catch (error) {
      console.error("Error fetching warehouses:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── FETCH ITEMS FOR THE SELECTED WAREHOUSE ───────────────────────────────
  const fetchItems = async (warehouseId = null) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = warehouseId ? { warehouse: warehouseId } : {};
      const res = await axios.get("api/items", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      const items = res.data.data || [];
      const flattenedItems = items.map((it) => {
        const isVariant = Boolean(it.parentItemId);
        return {
          ...it,
          parentId: isVariant ? it.parentItemId : it._id,
          variantId: isVariant ? it._id : null,
          displayName: isVariant
            ? `${it.itemName} / ${it.variantName || "Variant"}`
            : it.itemName,
          itemCode: it.itemCode || "",
          barcode: it.barcodes?.[0] || "",
          barcodes: it.barcodes || [],
          isVariant,
        };
      });
      setAllItems(flattenedItems);
      setFilteredItemsByWarehouse(flattenedItems);
    } catch (error) {
      console.error("Error fetching items:", error.message);
      setAllItems([]);
      setFilteredItemsByWarehouse([]);
    } finally {
      setLoading(false);
    }
  };

  // ─── LOAD EXISTING STOCK ADJUSTMENT FOR EDITING ─────────────────────────
  const loadStockAdjustment = async (id) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `api/stock-adjustments/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = res.data.data;

      // Populate form fields
      setFormData({
        warehouse: data.warehouse?._id || data.warehouse || "",
        adjustmentDate: data.adjustmentDate
          ? data.adjustmentDate.split("T")[0]
          : "",
        referenceNo: data.referenceNo || "",
        note: data.note || "",
        totalQuantity: data.totalQuantity || 0,
      });

      // If the fetched warehouse differs, refetch items for that warehouse:
      if (data.warehouse?._id && formData.warehouse !== data.warehouse?._id) {
        await fetchItems(data.warehouse._id);
      }

      // Map existing items into selectedItems state
      const itemsArray = (data.items || []).map((it) => {
        const item = allItems.find(
          (i) => i._id === (it.item?._id || it.item)
        ) || {};
        return {
          itemId: it.item?._id || it.item,
          itemName:
            item.displayName || it.item?.itemName || "Unknown Item",
          quantity: it.quantity || 0,
          isVariant: item.isVariant || false,
          variantName: item.variantName || "",
        };
      });

      setSelectedItems(itemsArray);
    } catch (error) {
      console.error("Error loading stock adjustment:", error.message);
      alert("Error loading stock adjustment");
    } finally {
      setLoading(false);
    }
  };

  // ─── GENERATE NEXT REFERENCE NUMBER ─────────────────────────────────────
  const generateNextRefNumber = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("api/stock-adjustments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const adjustments = res.data.data || [];
      const year = new Date().getFullYear();
      let nextRef = `ADJ/${year}/01`;
      if (adjustments.length > 0) {
        const sorted = adjustments
          .filter((a) => !a.isReturn && !!a.referenceNo)
          .sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
        if (sorted.length > 0) {
          const latest = sorted[0].referenceNo;
          const [prefix, yr, num] = latest.split("/");
          if (
            prefix === "ADJ" &&
            yr === year.toString() &&
            !isNaN(num)
          ) {
            const nextNum = parseInt(num, 10) + 1;
            nextRef = `ADJ/${year}/${nextNum
              .toString()
              .padStart(2, "0")}`;
          }
        }
      }
      setFormData((prev) => ({ ...prev, referenceNo: nextRef }));
    } catch (error) {
      console.error("Error generating next reference number:", error.message);
      setFormData((prev) => ({
        ...prev,
        referenceNo: `ADJ/${new Date().getFullYear()}/01`,
      }));
    }
  };

  // ─── FILTERED ITEMS FOR AUTOCOMPLETE DROPDOWN ──────────────────────────
  const filteredItems = searchQuery
    ? filteredItemsByWarehouse.filter((item) => {
        const q = searchQuery.toLowerCase();
        return (
          item.displayName?.toLowerCase().includes(q) ||
          item.itemCode?.toLowerCase().includes(q) ||
          (item.barcodes &&
            item.barcodes.some((b) =>
              b.toLowerCase().includes(q)
            ))
        );
      })
    : [];

  // ─── ADD AN ITEM TO SELECTED ITEMS ─────────────────────────────────────
  const handleAddItem = (targetItem) => {
  if (!targetItem) return;

  // see if it's already in the list
  const existing = selectedItems.find(it => it.itemId === targetItem._id);

  if (existing) {
    // increment its quantity
    setSelectedItems(selectedItems.map(it =>
      it.itemId === targetItem._id
        ? { ...it, quantity: it.quantity + 1 }
        : it
    ));
  } else {
    // otherwise add new with qty 1
    setSelectedItems([
      ...selectedItems,
      {
        itemId:       targetItem._id,
        itemName:     targetItem.displayName,
        quantity:     1,
        isVariant:    targetItem.isVariant,
        variantName:  targetItem.variantName,
      },
    ]);
  }

  // clear search box in both cases
  setSearchQuery("");
};

  // ─── REMOVE AN ITEM FROM SELECTED ITEMS ───────────────────────────────
  const handleRemoveItem = (itemId) => {
    setSelectedItems(
      selectedItems.filter((it) => it.itemId !== itemId)
    );
  };

  // ─── UPDATE QUANTITY IN SELECTED ITEMS ─────────────────────────────────
  const handleQuantityChange = (itemId, qty) => {
    const newItems = selectedItems.map((it) =>
      it.itemId === itemId
        ? { ...it, quantity: parseInt(qty) || 0 }
        : it
    );
    setSelectedItems(newItems);
  };

  // ─── HANDLE FORM FIELD CHANGES ────────────────────────────────────────
  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ─── SUBMIT (CREATE OR UPDATE) ─────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.warehouse) {
      alert("Please select a warehouse.");
      return;
    }
    if (selectedItems.length === 0) {
      alert("Please add at least one item.");
      return;
    }
    setLoading(true);
    try {
      const itemsPayload = selectedItems.map((it) => ({
        item: it.itemId,
        quantity: it.quantity,
      }));

      const payload = {
        warehouse: formData.warehouse,
        adjustmentDate: formData.adjustmentDate,
        referenceNo: formData.referenceNo,
        items: itemsPayload,
        totalQuantity: totalQuantity,
        note: formData.note,
      };
      const token = localStorage.getItem("token");
      if (id) {
        await axios.put(
          `api/stock-adjustments/${id}`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        alert("Stock Adjustment updated successfully!");
      } else {
        await axios.post(
          "api/stock-adjustments",
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        alert("Stock Adjustment created successfully!");
      }
      navigate("/stock-adjustment");
    } catch (error) {
      console.error(
        "Error submitting stock adjustment:",
        error.message
      );
      alert("Error submitting stock adjustment");
    } finally {
      setLoading(false);
    }
  };

  // ─── CLOSE OR CANCEL ───────────────────────────────────────────────────
  const handleClose = () => {
    navigate("/stock-adjustment");
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Navbar
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <div className={`flex-grow p-4 transition-all duration-300 w-full`}>
          <header className="flex flex-col items-center justify-between p-4 mb-2 bg-white rounded-md shadow sm:flex-row">
            <div className="flex items-baseline gap-2 text-sm sm:flex-row">
              <h1 className="text-sm font-semibold text-gray-800 md:text-xl">
                {id ? "Edit Stock Adjustment" : "Add Stock Adjustment"}
              </h1>
              <span className="text-sm text-gray-600">
                {id
                  ? "Update Stock Adjustment"
                  : "Create Stock Adjustment"}
              </span>
            </div>
            <nav className="flex items-center text-sm text-gray-500">
              <a
                href="/dashboard"
                className="flex items-center text-gray-700 no-underline hover:text-cyan-600"
              >
                <FaTachometerAlt className="mr-2" />
                Home
              </a>
              <BiChevronRight className="mx-2" />
              <a
                href="/adjustment-list"
                className="text-gray-700 no-underline hover:text-cyan-600"
              >
                Stock Adjustment List
              </a>
            </nav>
          </header>

          <div className="p-4 bg-white border-t-4 rounded-md shadow-md border-cyan-500">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-3">
                <div>
                  <label className="block mb-1 font-semibold">
                    Warehouse
                  </label>
                  <select
                    name="warehouse"
                    value={formData.warehouse}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map((wh) => (
                      <option key={wh._id} value={wh._id}>
                        {wh.warehouseName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Date</label>
                  <input
                    type="date"
                    name="adjustmentDate"
                    value={formData.adjustmentDate}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">
                    Reference No.
                  </label>
                  <input
                    type="text"
                    name="referenceNo"
                    value={formData.referenceNo}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    readOnly
                  />
                </div>
              </div>

              {/* ─── SEARCH & AUTOCOMPLETE ───────────────────────────────── */}
              <div className="relative w-full mb-4">
                <label className="block mb-1 font-semibold">
                  Search Item
                </label>
                <input
                  type="text"
                  placeholder="Item name / Barcode / Itemcode"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  value={searchQuery}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    setSearchQuery(val);

                    // ⬅️ If user typed a full barcode (or exact itemCode), add immediately:
                    const hit = allItems.find(
                      (i) =>
                        i.barcodes?.includes(val) ||
                        i.itemCode === val
                    );
                    if (hit) {
                      handleAddItem(hit);
                      setSearchQuery("");
                    }
                  }}
                  disabled={!formData.warehouse}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && filteredItems[0]) {
                      handleAddItem(filteredItems[0]);
                      setSearchQuery("");
                    }
                  }}
                />

                {/* ⬅️ AUTOCOMPLETE DROPDOWN */}
                {searchQuery && filteredItems.length > 0 && (
                  <div
                    className="absolute z-50 w-full overflow-y-auto bg-white border rounded-lg shadow-lg top-14 sm:w-96 max-h-60 touch-auto"
                    style={{ WebkitOverflowScrolling: "touch" }}
                  >
                    <ul>
                      {filteredItems.map((list) => (
                        <li
                          key={list._id}
                          onClick={() => {
                            handleAddItem(list);
                            setSearchQuery("");
                          }}
                          className="p-2 cursor-pointer hover:bg-gray-100"
                        >
                          <strong>{list.itemCode}</strong> -{" "}
                          {list.displayName}{" "}
                          {list.isVariant
                            ? `(${list.variantName})`
                            : ""}
                          {list.barcodes?.[0] && (
                            <span className="text-gray-500">
                              {" "}
                              - {list.barcodes[0]}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* ─── SELECTED ITEMS TABLE ───────────────────────────────────── */}
              <div className="p-4 mb-4 bg-white rounded-md shadow-md">
                <div className="flex justify-center gap-2 py-2 text-sm font-semibold text-white bg-cyan-600">
                  <div className="w-64 text-center">Item Name</div>
                  <div className="w-32 text-center">
                    Quantity (Negative to Decrease)
                  </div>
                  <div className="w-24 text-center">Action</div>
                </div>

                {selectedItems.length === 0 ? (
                  <div className="py-4 text-center text-gray-500">
                    No items selected.
                  </div>
                ) : (
                  selectedItems.map((sel) => (
                    <div
                      key={sel.itemId}
                      className="flex items-center justify-center gap-2 py-2 border-t"
                    >
                      <div className="w-64 text-center">
                        {sel.itemName}
                      </div>
                      <div className="w-32 text-center">
                        <input
                          type="number"
                          className="w-16 text-center border border-gray-300 rounded"
                          value={sel.quantity}
                          onChange={(e) =>
                            handleQuantityChange(
                              sel.itemId,
                              e.target.value
                            )
                          }
                          min="-9999"
                          max="9999"
                        />
                      </div>
                      <div className="w-24 text-center">
                        <button
                          type="button"
                          className="px-2 py-1 text-white bg-red-500 rounded"
                          onClick={() =>
                            handleRemoveItem(sel.itemId)
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center mb-4">
                <label className="mr-2 font-semibold text-gray-700">
                  Total Quantity:
                </label>
                <span className="text-gray-600">
                  {totalQuantity}
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  (Negative indicates decrease)
                </span>
              </div>

              <div className="mb-4">
                <label className="block mb-1 font-semibold">
                  Note
                </label>
                <textarea
                  name="note"
                  rows="2"
                  value={formData.note}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="submit"
                  className="px-6 py-2 font-semibold text-white bg-green-500 rounded-md shadow hover:bg-green-600"
                >
                  {id ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2 font-semibold text-white bg-orange-500 rounded-md shadow hover:bg-orange-600"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddStockAdjustment;
