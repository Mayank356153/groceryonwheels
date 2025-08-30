import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar";
import Navbar from "../Navbar";
import LoadingScreen from "../../Loading";
import axios from "axios";
import { BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt, FaEdit, FaTrash, FaEye } from "react-icons/fa";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function CategoriesList() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [category, setCategory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownIndex, setDropdownIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasItemsOnly, setHasItemsOnly] = useState(false); // New state for filtering categories with items
  const [categoryItemCounts, setCategoryItemCounts] = useState({}); // Map of category ID to item count
  const navigate = useNavigate();
  const BASE_URL = ''; // or wherever your API/static server lives
  const [modalImage, setModalImage] = useState(null);
  const [viewModalCat, setViewModalCat] = useState(null);
  const [catItems, setCatItems] = useState([]);
  const [stockMap, setStockMap] = useState({});
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [inStockOnly, setInStockOnly] = useState(true);

  const auth = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
    (async () => {
      try {
        const whRes = await axios.get("api/warehouses", {
          ...auth(),
          params: { scope: "mine" },
        });
        setWarehouseOptions(
          (whRes.data.data || []).map((w) => ({
            value: w._id,
            label: w.warehouseName,
          }))
        );
        await fetchCategory();
        await getCategoryItemCounts(); // Fetch item counts for categories
      } catch (err) {
        console.error("Fetch error:", err);
      }
    })();
  }, []);

  useEffect(() => {
    if (!viewModalCat) return;
    (async () => {
      try {
        const map = await getTotalStocks();
        setStockMap(map);
      } catch (err) {
        console.error("Fetch stocks error:", err);
      }
    })();
  }, [viewModalCat, inStockOnly]);

  const fetchCategory = async () => {
    setLoading(true);
    try {
      const response = await axios.get("api/categories", auth());
      const dataArr = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data.data)
        ? response.data.data
        : [];
      setCategory(dataArr);
    } catch (err) {
      console.error("Fetch categories error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryItemCounts = async () => {
    try {
      const { data } = await axios.get("api/items", {
        ...auth(),
        params: { limit: 10000 }, // Fetch all items without inStock filter
      });
      const counts = {};
      (data.data || []).forEach((item) => {
        const catId = item.category?._id;
        if (catId) {
          counts[catId] = (counts[catId] || 0) + 1;
        }
      });
      setCategoryItemCounts(counts);
    } catch (err) {
      console.error("Fetch item counts error:", err);
    }
  };

  const getTotalStocks = async () => {
    const active = warehouseOptions;
    if (!active.length) return {};
    const reqs = active.map((w) =>
      axios.get("api/items", {
        ...auth(),
        params: {
          warehouse: w.value,
          category: viewModalCat._id,
          page: 1,
          limit: 10000,
          inStock: inStockOnly ? "true" : "false",
        },
      })
    );
    const res = await Promise.all(reqs);
    const totals = {};
    res.forEach(({ data }) => {
      (data.data || []).forEach((it) => {
        totals[it._id] = (totals[it._id] || 0) + (it.currentStock ?? 0);
      });
    });
    return totals;
  };

  // filter & paginate
  const filteredData = category.filter((cat) => {
    const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase());
    const hasItems = !hasItemsOnly || (categoryItemCounts[cat._id] || 0) > 0;
    return matchesSearch && hasItems;
  });
  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  const currentUsers = filteredData.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // exports
  const handleCopy = () => {
    const text = currentUsers
      .map((i) => [i.name, i.description, i.status].join(","))
      .join("\n");
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };
  const handleExcelDownload = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Categories");
    XLSX.writeFile(wb, "categories_list.xlsx");
  };
  const handlePdfDownload = () => {
    const doc = new jsPDF();
    doc.text("Category List", 20, 20);
    autoTable(doc, {
      head: [["Name", "Description", "Status"]],
      body: filteredData.map((i) => [i.name, i.description, i.status]),
    });
    doc.save("categories_list.pdf");
  };
  const handlePrint = () => window.print();
  const handleCsvDownload = () => {
    const csv =
      "data:text/csv;charset=utf-8," +
      filteredData
        .map((i) => [i.name, i.description, i.status].join(","))
        .join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = "categories_list.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // actions
  const toggleDropdown = (idx) =>
    setDropdownIndex(dropdownIndex === idx ? null : idx);

  const toggleStatus = async (id) => {
    const cat = category.find((c) => c._id === id);
    if (!cat) return;
    const updated = {
      ...cat,
      status: cat.status === "Active" ? "Inactive" : "Active",
    };
    setLoading(true);
    try {
      await axios.put(`api/categories/${id}`, updated, auth());
      fetchCategory();
    } catch (err) {
      console.error("Status toggle error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    setLoading(true);
    try {
      await axios.delete(`api/categories/${id}`, auth());
      fetchCategory();
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (cat) => {
    setLoading(true);
    try {
      const { data } = await axios.get("api/items", {
        ...auth(),
        params: {
          inStock: inStockOnly ? "true" : "false",
          limit: 10000,
        },
      });
      setCatItems(
        (data.data || []).filter((it) => it.category?._id === cat._id)
      );
      setViewModalCat(cat);
    } catch (err) {
      console.error("Fetch items error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex">
        <div className="w-auto">
          <Sidebar isSidebarOpen={isSidebarOpen} />
        </div>
        <div className="w-full min-h-screen p-6 overflow-x-auto bg-gray-100">
          {/* Header */}
          <header className="flex flex-col items-center justify-between mb-6 md:flex-row">
            <div>
              <h1 className="text-2xl font-semibold">Categories List</h1>
              <nav className="flex mt-1 text-sm text-gray-600">
                <NavLink
                  to="/dashboard"
                  className="flex items-center text-gray-500 no-underline"
                >
                  <FaTachometerAlt />
                  <span className="ml-1">Home</span>
                </NavLink>
                <span> &gt; Categories List</span>
              </nav>
            </div>
            <div className="flex flex-col w-full gap-2 md:w-auto md:flex-row">
              <button
                onClick={() => navigate("/subcategories-list")}
                className="w-full px-4 py-2 text-white bg-indigo-600 rounded md:w-auto hover:bg-indigo-700 transition-colors"
              >
                SubCategory List
              </button>
              <button
                onClick={() => navigate("/sub-subcategory-list")}
                className="w-full px-4 py-2 text-white bg-indigo-600 rounded md:w-auto hover:bg-indigo-700 transition-colors"
              >
                Sub‑SubCategory List
              </button>
              <NavLink to="/categories/import">
                <button className="w-full px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700 transition-colors">
                  Import Categories
                </button>
              </NavLink>
            </div>
          </header>

          {/* Controls */}
          <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <label className="text-gray-700">Show</label>
              <select
                className="px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={entriesPerPage}
                onChange={(e) => setEntriesPerPage(+e.target.value)}
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <label className="text-gray-700">Entries</label>
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={hasItemsOnly}
                  onChange={(e) => setHasItemsOnly(e.target.checked)}
                  className="mr-2"
                />
                <label className="text-gray-700">Show only categories with items</label>
              </div>
              <div className="flex gap-1">
                <div className="flex flex-1 gap-1 text-sm">
                  <button
                    onClick={handleCopy}
                    className="px-2 py-1 bg-teal-500 text-white rounded hover:bg-teal-600 transition-colors"
                  >
                    Copy
                  </button>
                  <button
                    onClick={handleExcelDownload}
                    className="px-2 py-1 bg-teal-500 text-white rounded hover:bg-teal-600 transition-colors"
                  >
                    Excel
                  </button>
                  <button
                    onClick={handlePdfDownload}
                    className="px-2 py-1 bg-teal-500 text-white rounded hover:bg-teal-600 transition-colors"
                  >
                    PDF
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-2 py-1 bg-teal-500 text-white rounded hover:bg-teal-600 transition-colors"
                  >
                    Print
                  </button>
                  <button
                    onClick={handleCsvDownload}
                    className="px-2 py-1 bg-teal-500 text-white rounded hover:bg-teal-600 transition-colors"
                  >
                    CSV
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto overflow-visible">
            <table className="w-full bg-white border rounded-lg shadow-sm">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-3 border-b text-left text-gray-700">#</th>
                  <th className="p-3 border-b text-left text-gray-700">Image</th>
                  <th className="p-3 border-b text-left text-gray-700">Name</th>
                  <th className="p-3 border-b text-left text-gray-700">Description</th>
                  <th className="p-3 border-b text-left text-gray-700">Status</th>
                  <th className="p-3 border-b text-left text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((cat, idx) => (
                  <tr
                    key={cat._id}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-3 text-gray-700">{idx + 1}</td>
                    <td className="p-3">
                      {cat.image ? (
                        <img
                          src={`/vps/uploads/categories/${cat.image}`}
                          alt={cat.name}
                          className="inline-block object-cover w-12 h-12 rounded-md hover:cursor-pointer"
                          onClick={() =>
                            setModalImage(`/vps/uploads/categories/${cat.image}`)
                          }
                        />
                      ) : (
                        <span className="text-gray-400">No image</span>
                      )}
                    </td>
                    <td className="p-3 text-gray-700">{cat.name}</td>
                    <td className="p-3 text-gray-700">{cat.description}</td>
                    <td
                      className="p-3 cursor-pointer"
                      onClick={() => toggleStatus(cat._id)}
                    >
                      {cat.status === "Active" ? (
                        <span className="px-3 py-1 text-white bg-green-600 rounded-full text-sm">
                          Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-white bg-red-600 rounded-full text-sm">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="relative p-3">
                      <button
                        onClick={() => toggleDropdown(idx)}
                        className="px-3 py-1 text-white rounded bg-cyan-600 hover:bg-cyan-700 transition-colors"
                      >
                        Action
                      </button>
                      {dropdownIndex === idx && (
                        <div className="absolute right-0 mt-2 w-36 bg-white border rounded-lg shadow-lg z-20">
                          <button
                            className="flex items-center w-full gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                            onClick={() => handleView(cat)}
                          >
                            <FaEye /> View
                          </button>
                          <button
                            className="flex items-center w-full gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                            onClick={() =>
                              navigate(`/categories-list-form?id=${cat._id}`)
                            }
                          >
                            <FaEdit /> Edit
                          </button>
                          <button
                            className="flex items-center w-full gap-2 px-4 py-2 text-red-600 hover:bg-gray-100 transition-colors"
                            onClick={() => handleDelete(cat._id)}
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <span className="text-gray-700">
              Showing {(currentPage - 1) * entriesPerPage + 1} to{" "}
              {Math.min(currentPage * entriesPerPage, filteredData.length)} of{" "}
              {filteredData.length} entries
            </span>
            <div className="flex gap-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>

          {/* Category Image Modal */}
          {modalImage && (
            <div
              className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
              onClick={() => setModalImage(null)}
            >
              <div className="relative max-w-3xl w-full">
                <button
                  className="absolute top-2 right-2 text-white text-2xl font-bold bg-gray-800 rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-700 transition-colors"
                  onClick={() => setModalImage(null)}
                >
                  &times;
                </button>
                <img
                  src={modalImage}
                  alt="Category"
                  className="w-full h-auto rounded-lg"
                />
              </div>
            </div>
          )}

          {/* View Items Modal */}
          {viewModalCat && (
            <div
              className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
              onClick={() => setViewModalCat(null)}
            >
              <div
                className="bg-white p-6 rounded-lg shadow-xl max-w-5xl w-full max-h-[85vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    In-Stock Items in {viewModalCat.name}
                  </h2>
                  <button
                    className="text-gray-600 text-2xl font-bold hover:text-gray-800 transition-colors"
                    onClick={() => setViewModalCat(null)}
                  >
                    &times;
                  </button>
                </div>
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => {
                      setInStockOnly(e.target.checked);
                      handleView(viewModalCat);
                    }}
                    className="mr-2"
                  />
                  <label className="text-gray-700">Show only in-stock items</label>
                </div>
                {catItems.length ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {catItems.map((item) => (
                      <div
                        key={item._id}
                        className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4"
                      >
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          {item.itemName}
                        </h3>
                        <p className="text-sm text-gray-600 mb-1">
                          Code: {item.itemCode}
                        </p>
                        <p className="text-sm text-gray-600 mb-3">
                          Stock: {stockMap[item._id] ?? 0}
                        </p>
                        <div className="space-y-3">
                          {(item.itemImages || []).map((img, i) => {
                            const url = `/vps/uploads/qr/items/${img}`;
                            return (
                              <div
                                key={i}
                                className="relative group rounded-lg overflow-hidden"
                              >
                                <img
                                  src={url}
                                  alt={`${item.itemName} ${i + 1}`}
                                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                                <a
                                  href={url}
                                  download
                                  className="absolute bottom-2 right-2 bg-indigo-600 text-white text-sm px-3 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                >
                                  Download
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-4">
                    No {inStockOnly ? "in-stock" : ""} items.
                  </p>
                )}
                <div className="mt-6 flex justify-end">
                  <button
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    onClick={() => setViewModalCat(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}