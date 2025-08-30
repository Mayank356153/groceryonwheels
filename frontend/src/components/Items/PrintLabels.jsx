import React, { useState, useEffect } from "react";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import { BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt } from "react-icons/fa";
import axios from "axios";
import LoadingScreen from "../../Loading";
import { Link } from "react-router-dom";

function PrintLabels() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");

  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [rowQuantities, setRowQuantities] = useState({});
  const [printList, setPrintList] = useState([]);

  // ─── FETCH WAREHOUSES ───────────────────────────────────────────────────
  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("api/warehouses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = res.data.data || [];
      setWarehouses(list);

      // If no warehouse selected yet, pick the restricted one by default:
      if (!selectedWarehouse && list.length > 0) {
        const restricted = list.find(
          (w) => w.isRestricted && w.status === "Active"
        );
        const defaultWh = restricted
          ? restricted._id
          : list.find((w) => w.status === "Active")?._id || "";
        setSelectedWarehouse(defaultWh);
      }
    } catch (err) {
      console.error("Error fetching warehouses:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── FETCH ITEMS ON SEARCH ───────────────────────────────────────────────
  const fetchSearchItems = async (query, warehouseId) => {
    if (!warehouseId || !query) {
      setFilteredItems([]);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      // We assume your backend supports `search` to match itemName, itemCode, or barcodes
      const res = await axios.get("api/items", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          warehouse: warehouseId,
          search: query, // if your API uses a different param (e.g. `q`), replace here
        },
      });
      const items = res.data.data || [];

      // Flatten variants exactly as in your other pages:
      const flattened = items.map((item) => {
        const isVariant = Boolean(item.parentItemId);
        return {
          ...item,
          parentId: isVariant ? item.parentItemId : item._id,
          variantId: isVariant ? item._id : null,
          itemName: isVariant
            ? `${item.itemName} / ${item.variantName || "Variant"}`
            : item.itemName,
          itemCode: item.itemCode || "",
          barcode: item.barcodes?.[0] || "",
          barcodes: item.barcodes || [],
          isVariant,
          currentStock: item.currentStock || 0,
          warehouse: item.warehouse,
        };
      });

      // Only keep items that belong to this warehouse and have stock > 0
      const filteredByWarehouse = flattened.filter(
        (it) => it.warehouse?._id === warehouseId && it.currentStock > 0
      );
      setFilteredItems(filteredByWarehouse);

      // If any item’s barcode or itemCode exactly matches `query`, auto‐add & clear search
      const exactHit = filteredByWarehouse.find(
        (it) => it.barcode === query || it.itemCode === query
      );
      if (exactHit) {
        handleAddItem(exactHit);
        setSearchQuery("");
      }
    } catch (err) {
      console.error("Error fetching search items:", err.message);
      setFilteredItems([]);
    } finally {
      setLoading(false);
    }
  };

  // ─── INITIALIZE ON MOUNT ─────────────────────────────────────────────────
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
    fetchWarehouses();
  }, []);

  // Whenever searchQuery changes, fetch matching items:
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (selectedWarehouse && trimmed !== "") {
      fetchSearchItems(trimmed, selectedWarehouse);
    } else {
      setFilteredItems([]);
    }
  }, [searchQuery, selectedWarehouse]);

  // Whenever warehouse changes, clear search & dropdown & printList:
  useEffect(() => {
    setSearchQuery("");
    setFilteredItems([]);
    setPrintList([]);
  }, [selectedWarehouse]);

  // ─── HANDLERS ───────────────────────────────────────────────────────────
  const handleQuantityChange = (itemId, value) => {
    const qty = parseInt(value, 10) || 1;
    setRowQuantities((prev) => ({
      ...prev,
      [itemId]: qty,
    }));
  };

  const handleAddItem = (item) => {
    const quantity = rowQuantities[item._id] || 1;
    if (!printList.find((p) => p._id === item._id)) {
      setPrintList([...printList, { ...item, quantity }]);
    }
  };

  const handleRemoveItem = (itemId) => {
    setPrintList(printList.filter((it) => it._id !== itemId));
  };

  const handlePreview = () => {
    alert("Preview:\n" + JSON.stringify(printList, null, 2));
  };

  const handleClose = () => {
    setPrintList([]);
  };

  const handlePrint = () => {
    window.print();
  };

  // ─── TOTAL LABELS ───────────────────────────────────────────────────────
  const totalLabels = printList.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/*────────────────────────────────────────────────────────────────────*/}
      {/* 1) Print‐only style block: hide everything except .print-area */}
      <style>
        {`
        @media print {
          /* Hide everything except the print‐area */
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
          }
        }
      `}
      </style>
      {/*────────────────────────────────────────────────────────────────────*/}

      {/* Navbar */}
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Sidebar + Main Content */}
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />

        <div className="flex-grow p-2 overflow-x-auto transition-all duration-300">
          {/* Header */}
          <header className="flex flex-col items-center justify-between p-4 mb-1 bg-white rounded-md shadow sm:flex-row">
            <div className="flex items-baseline gap-2 sm:flex-row">
              <h1 className="text-xl font-semibold text-gray-800">
                Print Labels
              </h1>
              <span className="text-sm text-gray-600">Add/Update Sales</span>
            </div>
            <nav className="flex items-center text-sm text-gray-500">
              <Link
                to="/dashboard"
                className="flex items-center text-gray-700 no-underline hover:text-cyan-600"
              >
                <FaTachometerAlt className="mr-2" /> Home
              </Link>
              <BiChevronRight className="mx-2" />
              <Link
                to="/print-labels"
                className="text-gray-700 no-underline hover:text-cyan-600"
              >
                Print Labels
              </Link>
            </nav>
          </header>

          {/*──────────────────────────────────────────────────────────────*/}
          {/* 2) Main Content: Warehouse Selector, Search, Table, and Print */}
          {/*──────────────────────────────────────────────────────────────*/}
          <div className="p-4 mt-5 overflow-auto border-t-4 rounded-lg border-cyan-500">
            {/* ─── Warehouse Selector ─────────────────────────────────── */}
            <div className="flex justify-center mb-4">
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="w-full max-w-xs px-4 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value="">Select Warehouse</option>
                {warehouses
                  .filter((w) => w.status === "Active")
                  .map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.warehouseName}
                    </option>
                  ))}
              </select>
            </div>

            {/* ─── Search Bar ─────────────────────────────────────────── */}
            <div className="flex justify-center mb-4">
              <input
                type="text"
                placeholder="Item name / Barcode / Itemcode"
                className="w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-md md:w-1/2 lg:w-1/2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={!selectedWarehouse}
              />
            </div>

            {/* ─── Dropdown of Filtered Items ───────────────────────────── */}
            {searchQuery.trim() !== "" && filteredItems.length > 0 && (
              <ul className="max-h-60 overflow-y-auto bg-white border rounded shadow mb-4 p-2">
                {filteredItems.map((item) => (
                  <li
                    key={item._id}
                    className="flex items-center justify-between px-3 py-2 border-b last:border-none hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleAddItem(item)}
                  >
                    <span className="text-gray-800">
                      <strong>{item.itemCode}</strong> — {item.itemName}
                    </span>
                    <span className="text-sm text-gray-500">
                      Stock: {item.currentStock}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {/* ─── Items to Print Table ─────────────────────────────────── */}
            <div className="p-4 bg-white rounded-md shadow-md">
              {/* Table Header */}
              <div className="flex justify-center gap-x-2">
                <div className="w-64 px-4 py-2 text-sm font-semibold text-center text-white bg-cyan-600">
                  Item Name
                </div>
                <div className="w-64 px-4 py-2 text-sm font-semibold text-center text-white bg-cyan-600">
                  Quantity
                </div>
                <div className="w-24 px-4 py-2 text-sm font-semibold text-center text-white bg-cyan-600">
                  Action
                </div>
              </div>

              {/* Table Body */}
              {printList.length === 0 ? (
                <div className="py-4 text-center text-gray-500">
                  No items in print list
                </div>
              ) : (
                printList.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-center py-2 border-t gap-x-2"
                  >
                    <div className="w-64 text-center">{item.itemName}</div>
                    <div className="w-64 text-center">
                      <input
                        type="number"
                        min="1"
                        className="w-20 py-1 text-center border border-gray-300 rounded-md"
                        value={item.quantity}
                        onChange={(e) =>
                          setPrintList((prev) =>
                            prev.map((p) =>
                              p._id === item._id
                                ? {
                                    ...p,
                                    quantity:
                                      parseInt(e.target.value, 10) || 1,
                                  }
                                : p
                            )
                          )
                        }
                      />
                    </div>
                    <div className="w-24 text-center">
                      <button
                        className="px-2 py-1 text-white bg-red-500 rounded"
                        onClick={() => handleRemoveItem(item._id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}

              {/* Total Labels */}
              <div className="flex items-center mt-1 ml-20">
                <span className="mr-2 font-semibold text-gray-700">
                  Total Labels:
                </span>
                <span className="text-gray-600">{totalLabels}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center mt-2 space-x-4">
                <button
                  className="w-40 px-6 py-2 font-semibold text-white transition duration-300 bg-green-500 shadow-md hover:bg-green-600"
                  onClick={handlePreview}
                >
                  Preview
                </button>
                <button
                  className="w-40 px-6 py-2 font-semibold text-white transition duration-300 bg-orange-500 shadow-md hover:bg-orange-600"
                  onClick={handleClose}
                >
                  Close
                </button>
              </div>
            </div>

            {/* ─── Print Button Section ────────────────────────────────────── */}
            <div className="px-6 py-4 mt-2 bg-white rounded-md shadow-md">
              <div className="mb-4 border-b-2 border-cyan-500"></div>
              <div className="flex justify-end">
                <button
                  className="px-4 py-1 font-bold text-white transition duration-300 shadow-md bg-cyan-600 hover:bg-cyan-600"
                  onClick={handlePrint}
                >
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/*────────────────────────────────────────────────────────────────────*/}
      {/* 3) Print‐only area: render the label cards here.                  */}
      {/*    When you click “Print,” the @media print block above will hide   */}
      {/*    everything else except this .print-area.                         */}
      {/*────────────────────────────────────────────────────────────────────*/}
      <div className="print-area hidden">
        <div className="p-4">
          <div className="grid grid-cols-3 gap-4">
            {printList.map((item) => (
              <div
                key={item._id}
                className="border p-3 text-center break-inside-avoid"
                style={{ pageBreakInside: "avoid" }}
              >
                <div className="font-bold mb-2 text-lg">
                  {item.itemName}
                </div>
                <div className="text-sm mb-1">Code: {item.itemCode}</div>
                <div className="text-sm mb-1">Qty: {item.quantity}</div>
                {/* If you have a barcode image source, you can insert it here: */}
                {/* <img src={item.barcodeImageUrl} alt="Barcode" className="mx-auto" /> */}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/*────────────────────────────────────────────────────────────────────*/}
    </div>
  );
}

export default PrintLabels;
