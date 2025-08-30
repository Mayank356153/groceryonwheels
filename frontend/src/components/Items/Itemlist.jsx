import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "../Sidebar";
import Navbar from "../Navbar";
import { BiChevronRight } from "react-icons/bi";
import {
  FaTachometerAlt,
  FaEdit,
  FaTrash,
  FaSortUp,
  FaSortDown,
  FaEllipsisH,
} from "react-icons/fa";
import { Link, NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import Select from "react-select";
import * as XLSX from "xlsx";
import LoadingScreen from "../../Loading";

const FILES_BASE = "/vps/uploads/qr/items";
const escapeRegex = (str) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* ---------------- CSV / XLSX helpers ---------------- */
const downloadCSV = (rows, file = "items_export.csv") => {
  const ws = XLSX.utils.json_to_sheet(rows);
  const blob = new Blob([XLSX.utils.sheet_to_csv(ws)], {
    type: "text/csv;charset=utf-8;",
  });
  Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(blob),
    download: file,
  }).click();
};
const downloadXLSX = (rows, file = "items_export.xlsx") => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Items");
  XLSX.writeFile(wb, file);
};

export default function ItemList() {
  const navigate = useNavigate();

  /* ---------------- basic state ---------------- */
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* full catalogue, NOT filtered by warehouse */
  const [items, setItems] = useState([]);

  /* live stocks for the currently-selected warehouse
     (or total across all)  ->  { itemId: qty }            */
  const [stockMap, setStockMap] = useState({});

  /* dropdown look-ups */
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);

  /* filters & sort */
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("itemCode");
  const [sortDir, setSortDir] = useState("asc");
  const [inStockOnly, setInStockOnly] = useState(true); // New state for in-stock filter

  /* pagination */
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  /* misc pop-ups */
  const [dropdownOpenFor, setDropdownOpenFor] = useState(null);
  const [stockModal, setStockModal] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [popupImage, setPopupImage] = useState(null);
  const [popupIndex, setPopupIndex] = useState(null);

  const auth = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  /* ---------- 1. fetch full catalogue once ---------- */
  const fetchCatalogue = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("api/items", {
        ...auth(),
        params: { inStock: inStockOnly ? "true" : "false" }, // Pass inStock param
      });
      setItems(data.data || []);
    } catch {
      setError("Failed to fetch items — try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- 2. fetch stocks for ONE warehouse ---------- */
  const fetchWarehouseStocks = async (whId) => {
    if (whId === "all") return {};
    const { data } = await axios.get("api/items", {
      ...auth(),
      params: { warehouse: whId, page: 1, limit: 10000, inStock: inStockOnly ? "true" : "false" },
    });
    const map = {};
    (data.data || []).forEach(
      (it) => (map[it._id] = it.currentStock ?? 0)
    );
    return map;
  };

  /* ---------- 3. compute TOTAL stock across all ---------- */
  const fetchTotalsAcrossWarehouses = async () => {
    const active = warehouseOptions.filter((w) => w.value !== "all");
    if (active.length === 0) return {};
    const reqs = active.map((w) =>
      axios.get("api/items", {
        ...auth(),
        params: { warehouse: w.value, page: 1, limit: 10000, inStock: inStockOnly ? "true" : "false" },
      })
    );
    const res = await Promise.all(reqs);
    const totals = {};
    res.forEach(({ data }) => {
      (data.data || []).forEach((it) => {
        const id = it._id;
        totals[id] = (totals[id] || 0) + (it.currentStock ?? 0);
      });
    });
    return totals;
  };

  /* ---------- 4. master “refreshStocks” ---------- */
  const refreshStocks = async (whId) => {
    setLoading(true);
    try {
      const map =
        whId === "all"
          ? await fetchTotalsAcrossWarehouses()
          : await fetchWarehouseStocks(whId);
      setStockMap(map);
    } catch {
      setError("Failed to fetch stock numbers.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- initial load ---------- */
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
    (async () => {
      const [whRes, catRes] = await Promise.all([
     // ↓ ask for just the warehouses the current user may operate on
     axios.get("api/warehouses", {
       ...auth(),
       params: { scope: "mine" },                      // 🔑 key change
     }),
        axios.get("api/categories", auth()),
      ]);
      setWarehouseOptions([
        { label: "All Warehouses", value: "all" },
        ...(whRes.data.data || []).map((w) => ({
          label: w.warehouseName,
          value: w._id,
        })),
      ]);
      setCategoryOptions([
        { label: "All Categories", value: "all" },
        ...(catRes.data.data || []).map((c) => ({
          label: c.name,
          value: c._id,
        })),
      ]);
      await fetchCatalogue();
      await refreshStocks("all");
    })();
  }, []);

  /* ---------- whenever warehouse or inStockOnly changes ---------- */
  useEffect(() => {
    fetchCatalogue();
    refreshStocks(warehouseFilter);
    setCurrentPage(1);
  }, [warehouseFilter, inStockOnly]);

  /* ---------- derive rows with rowStock ---------- */
  const rows = useMemo(() => {
    const result = items.map((it) => ({
      ...it,
      rowStock: stockMap[it._id] ?? 0,
      presentInWh: stockMap.hasOwnProperty(it._id),
    }));
    return result;
  }, [items, stockMap]);

  /* ---------- filter / search / sort ---------- */
  const filtered = useMemo(() => {
    let data = [...rows];
    // Hide items that are not in the selected warehouse
    if (warehouseFilter !== "all") {
      data = data.filter(
        (it) =>
          stockMap.hasOwnProperty(it._id) ||
          it.warehouse?._id === warehouseFilter
      );
    }
    if (searchTerm.trim()) {
      const safeTerm = escapeRegex(searchTerm.trim());
      const re = new RegExp(safeTerm, "i");
      data = data.filter(
        (it) =>
          re.test(it.itemName) ||
          re.test(it.itemCode) ||
          (it.barcodes || []).some((b) => re.test(b))
      );
    }

    if (categoryFilter !== "all")
      data = data.filter((it) => it.category?._id === categoryFilter);

    data.sort((a, b) => {
      const get = (o) =>
        sortField === "rowStock" ? o.rowStock : o[sortField] ?? "";
      const v1 = get(a);
      const v2 = get(b);
      if (v1 < v2) return sortDir === "asc" ? -1 : 1;
      if (v1 > v2) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [rows, searchTerm, categoryFilter, sortField, sortDir]);

  /* ---------- pagination ---------- */
  const totalPages = Math.ceil(filtered.length / perPage);
  const pageStart = (currentPage - 1) * perPage;
  const pageSlice = filtered.slice(pageStart, pageStart + perPage);

  /* ---------- delete ---------- */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    setLoading(true);
    try {
      await axios.delete(`api/items/${id}`, auth());
      await fetchCatalogue();
      await refreshStocks(warehouseFilter);
    } catch {
      setError("Delete failed — try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- visibility toggle ---------- */
  const toggleVisibility = async (row) => {
    setRowsOptimistic(row._id, { isOnline: !row.isOnline });
    try {
      await axios.put(
        `api/items/${row._id}`,
        { isOnline: !row.isOnline },
        auth()
      );
    } catch {
      setRowsOptimistic(row._id, { isOnline: row.isOnline });
      alert("Could not update visibility.");
    }
  };
  const setRowsOptimistic = (id, patch) =>
    setItems((prev) =>
      prev.map((it) => (it._id === id ? { ...it, ...patch } : it))
    );

  /* ---------- stock modal ---------- */
  const openStockModal = async (item) => {
    try {
      const active = warehouseOptions.filter((w) => w.value !== "all");
      const reqs = active.map((w) =>
        axios.get("api/items", {
          ...auth(),
          params: { warehouse: w.value, search: item.itemCode, page: 1, limit: 1, inStock: inStockOnly ? "true" : "false" },
        })
      );
      const res = await Promise.allSettled(reqs);
      const stocksByWh = res.map((r, i) => {
        const wh = active[i];
        if (r.status !== "fulfilled") return { id: wh.value, name: wh.label, stock: "N/A" };
        const row = r.value.data.data?.[0];
        return { id: wh.value, name: wh.label, stock: row ? row.currentStock ?? 0 : 0 };
      });
      setStockModal({ ...item, stocksByWh });
    } catch {
      alert("Failed to load stock breakdown.");
    }
  };

  /* ---------- render ---------- */
  if (loading) return <LoadingScreen />;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />

        <div className="flex-grow p-4 mt-20">
          {/* header */}
          <header className="flex flex-col md:flex-row justify-between mb-6">
            <h2 className="text-2xl font-bold">Items List</h2>
            <nav className="flex text-gray-600 gap-2 mt-2 md:mt-0">
              <NavLink to="/dashboard" className="flex items-center">
                <FaTachometerAlt /> Home
              </NavLink>
              <BiChevronRight />
              <NavLink to="/item-list">Items List</NavLink>
            </nav>
          </header>

          {/* filters */}
          <div className="mb-4 p-4 bg-white rounded shadow flex flex-wrap gap-4 items-end">
            <div className="w-48">
              <label className="block mb-1">Warehouse</label>
              <Select
                options={warehouseOptions}
                value={warehouseOptions.find((o) => o.value === warehouseFilter)}
                onChange={(o) => setWarehouseFilter(o.value)}
              />
            </div>

            <div className="w-48">
              <label className="block mb-1">Category</label>
              <Select
                options={categoryOptions}
                value={categoryOptions.find((o) => o.value === categoryFilter)}
                onChange={(o) => {
                  setCategoryFilter(o.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block mb-1">Search</label>
              <input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Code / name / barcode"
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div className="w-48">
              <label className="block mb-1">Sort by</label>
              <Select
                options={[
                  { label: "Item Code ↑", value: "itemCode|asc" },
                  { label: "Item Code ↓", value: "itemCode|desc" },
                  { label: "Stock Low→High", value: "rowStock|asc" },
                  { label: "Stock High→Low", value: "rowStock|desc" },
                  { label: "Price Low→High", value: "salesPrice|asc" },
                  { label: "Price High→Low", value: "salesPrice|desc" },
                ]}
                onChange={(o) => {
                  const [f, d] = o.value.split("|");
                  setSortField(f);
                  setSortDir(d);
                }}
              />
            </div>

            {/* In-Stock Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => {
                  setInStockOnly(e.target.checked);
                  setCurrentPage(1);
                }}
                className="mr-2"
              />
              <label>Show only in-stock items</label>
            </div>

            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => downloadCSV(filtered)}
                className="px-4 py-2 bg-gray-500 text-white rounded"
              >
                CSV
              </button>
              <button
                onClick={() => downloadXLSX(filtered)}
                className="px-4 py-2 bg-gray-700 text-white rounded"
              >
                XLSX
              </button>
              <Link to="/items/add">
                <button className="px-4 py-2 bg-cyan-500 text-white rounded">
                  + Create Item
                </button>
              </Link>
            </div>
          </div>

          {/* table */}
          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  {[
                    { label: "Image", field: null },
                    { label: "Code", field: "itemCode" },
                    { label: "Name", field: null },
                    { label: "Category", field: null },
                    { label: "Stock", field: "rowStock" },
                    { label: "Price", field: "salesPrice" },
                    { label: "Visibility", field: null },
                    { label: "Action", field: null },
                  ].map(({ label, field }) => (
                    <th key={label} className="px-2 py-1 border">
                      <div className="flex items-center justify-center">
                        {label}
                        {field && (
                          <span className="ml-1 flex flex-col">
                            <FaSortUp
                              className={`cursor-pointer ${
                                sortField === field && sortDir === "asc"
                                  ? "text-blue-600"
                                  : "text-gray-400"
                              }`}
                              onClick={() => {
                                setSortField(field);
                                setSortDir("asc");
                              }}
                            />
                            <FaSortDown
                              className={`cursor-pointer ${
                                sortField === field && sortDir === "desc"
                                  ? "text-blue-600"
                                  : "text-gray-400"
                              }`}
                              onClick={() => {
                                setSortField(field);
                                setSortDir("desc");
                              }}
                            />
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageSlice.length ? (
                  pageSlice.map((it) => {
                    const img = it.itemImages?.[0]
                      ? `${FILES_BASE}/${it.itemImages[0]}`
                      : null;
                    return (
                      <tr key={it._id}>
                        <td className="border px-2 py-1 text-center">
                          {img ? (
                            <img
                              src={img}
                              alt={it.itemName}
                              className="w-10 h-10 object-cover mx-auto cursor-pointer"
                              onClick={() => setPreviewItem(it)}
                            />
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="border px-2 py-1">{it.itemCode}</td>
                        <td className="border px-2 py-1">{it.itemName}</td>
                        <td className="border px-2 py-1">
                          {it.category?.name || "—"}
                        </td>
                        <td className="border px-2 py-1 text-center">
                          {it.rowStock}
                          <FaEllipsisH
                            className="inline ml-1 cursor-pointer"
                            onClick={() => openStockModal(it)}
                          />
                        </td>
                        <td className="border px-2 py-1 text-right">
                          {it.salesPrice}
                        </td>
                        <td className="border px-2 py-1 text-center">
                          <span
                            onClick={() => toggleVisibility(it)}
                            className={`px-2 py-1 rounded text-xs cursor-pointer select-none ${
                              it.isOnline
                                ? "bg-green-600 text-white hover:bg-green-700"
                                : "bg-red-500 text-white hover:bg-red-600"
                            }`}
                          >
                            {it.isOnline ? "Online" : "Offline"}
                          </span>
                        </td>
                        <td className="border px-2 py-1 relative">
                          <button
                            onClick={() =>
                              setDropdownOpenFor(
                                dropdownOpenFor === it._id ? null : it._id
                              )
                            }
                            className="px-2 py-1 bg-cyan-600 text-white rounded"
                          >
                            Action ▼
                          </button>
                          {dropdownOpenFor === it._id && (
                            <div className="absolute right-0 mt-1 bg-white border rounded shadow z-50">
                              <button
                                className="flex items-center w-full px-3 py-2 hover:bg-gray-100"
                                onClick={() =>
                                  navigate(
                                    `/items/add?id=${
                                      it.parentItemId || it._id
                                    }`
                                  )
                                }
                              >
                                <FaEdit className="mr-2" /> Edit
                              </button>
                              <button
                                className="flex items-center w-full px-3 py-2 text-red-600 hover:bg-gray-100"
                                onClick={() => handleDelete(it._id)}
                              >
                                <FaTrash className="mr-2" /> Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="py-4 text-center">
                      No data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* pagination */}
          <div className="flex justify-between items-center mt-4 px-2">
            <span>
              Showing {pageStart + 1}–
              {Math.min(pageStart + perPage, filtered.length)} of{" "}
              {filtered.length}
            </span>
            <div className="space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- Stock Modal ---------------- */}
      {stockModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setStockModal(null)}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-4 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Warehouse Wise Stock</h3>
              <button
                className="text-red-600 text-2xl font-bold"
                onClick={() => setStockModal(null)}
              >
                ×
              </button>
            </div>
            <div className="mb-2">
              <p>
                <strong>Item Name:</strong>{" "}
                {stockModal.itemName || "N/A"}
              </p>
              <p>
                <strong>Sales Price:</strong>{" "}
                {stockModal.salesPrice || "N/A"}
              </p>
            </div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-blue-500 text-white">
                  <th className="border px-2 py-1">#</th>
                  <th className="border px-2 py-1">Warehouse</th>
                  <th className="border px-2 py-1">Stock</th>
                </tr>
              </thead>
              <tbody>
                {stockModal.stocksByWh.map((row, i) => (
                  <tr key={row.id} className="border">
                    <td className="border px-2 py-1">{i + 1}</td>
                    <td className="border px-2 py-1">{row.name}</td>
                    <td className="border px-2 py-1">{row.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              className="mt-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              onClick={() => setStockModal(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ---------------- Image Preview ---------------- */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => {
            setPreviewItem(null);
            setPopupImage(null);
          }}
        >
          <div
            className="bg-white rounded shadow-lg max-w-4xl w-full max-h-[90vh] p-4 overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {previewItem.itemName} – images
              </h3>
              <button
                className="text-red-600 text-2xl font-bold"
                onClick={() => {
                  setPreviewItem(null);
                  setPopupImage(null);
                }}
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {previewItem.itemImages.map((fn, idx) => {
                const url = fn.startsWith("http")
                  ? fn
                  : `${FILES_BASE}/${fn}`;
                return (
                  <div key={idx} className="relative group">
                    <img
                      src={url}
                      alt={`${previewItem.itemName} ${idx + 1}`}
                      className="w-full h-64 object-cover rounded cursor-pointer"
                      onClick={() => {
                        setPopupImage(fn);
                        setPopupIndex(idx);
                      }}
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://via.placeholder.com/150";
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* confirm delete */}
            {popupImage && (
              <div
                className="fixed inset-0 z-60 flex items-center justify-center bg-black/50"
                onClick={() => setPopupImage(null)}
              >
                <div
                  className="bg-white rounded-lg p-6 shadow-lg max-w-sm w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h4 className="text-lg font-semibold mb-4">
                    Remove this image?
                  </h4>
                  <p className="text-sm mb-6 text-gray-700">
                    Are you sure you want to remove{" "}
                    <span className="font-medium">{popupImage}</span>?
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                      onClick={() => setPopupImage(null)}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      onClick={() => {
                        handleRemoveImage(popupIndex);
                        setPopupImage(null);
                      }}
                    >
                      Yes, Remove
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}