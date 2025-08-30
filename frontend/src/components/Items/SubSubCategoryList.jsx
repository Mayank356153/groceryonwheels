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

export default function SubSubCategoryList() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [subSubCategories, setSubSubCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownIndex, setDropdownIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const BASE_URL = '/vps'; // or wherever your API/static server lives
  const [modalImage, setModalImage] = useState(null);
  const [viewModalSubSubCat, setViewModalSubSubCat] = useState(null);
  const [subSubCatItems, setSubSubCatItems] = useState([]);
  const [stockMap, setStockMap] = useState({});
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [inStockOnly, setInStockOnly] = useState(true);
  const [hasItemsOnly, setHasItemsOnly] = useState(false); // State for filtering sub-subcategories with items
  const [subSubCategoryItemCounts, setSubSubCategoryItemCounts] = useState({}); // Map of sub-subcategory ID to item count

  const auth = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
    (async () => {
      try {
        const whRes = await axios.get("/api/warehouses", {
          ...auth(),
          params: { scope: "mine" },
        });
        setWarehouseOptions(
          (whRes.data.data || []).map((w) => ({
            value: w._id,
            label: w.warehouseName,
          }))
        );
        await fetchSubSubCategories();
        await getSubSubCategoryItemCounts(); // Fetch item counts for sub-subcategories
      } catch (err) {
        console.error("Fetch warehouses error:", err);
      }
    })();
  }, []);

  useEffect(() => {
    if (!viewModalSubSubCat) return;
    (async () => {
      try {
        const map = await getTotalStocks();
        setStockMap(map);
      } catch (err) {
        console.error("Fetch stocks error:", err);
      }
    })();
  }, [viewModalSubSubCat, inStockOnly]);

  const fetchSubSubCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/sub-subcategories", auth());
      const arr = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.data)
        ? res.data.data
        : [];
      setSubSubCategories(arr);
    } catch (err) {
      console.error("Error fetching sub-subcategories:", err);
    } finally {
      setLoading(false);
    }
  };

  const getSubSubCategoryItemCounts = async () => {
    try {
      const { data } = await axios.get("/api/items", {
        ...auth(),
        params: { limit: 10000 }, // Fetch all items without inStock filter
      });
      const counts = {};
      (data.data || []).forEach((item) => {
        const subSubCatId = item.subSubCategory?._id;
        if (subSubCatId) {
          counts[subSubCatId] = (counts[subSubCatId] || 0) + 1;
        }
      });
      setSubSubCategoryItemCounts(counts);
    } catch (err) {
      console.error("Fetch item counts error:", err);
    }
  };

  const getTotalStocks = async () => {
    const active = warehouseOptions;
    if (!active.length) return {};
    const reqs = active.map((w) =>
      axios.get("/api/items", {
        ...auth(),
        params: {
          warehouse: w.value,
          subSubCategory: viewModalSubSubCat._id,
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
  const filtered = subSubCategories.filter((ssc) => {
    const matchesSearch = ssc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const hasItems = !hasItemsOnly || (subSubCategoryItemCounts[ssc._id] || 0) > 0;
    return matchesSearch && hasItems;
  });
  const totalPages = Math.ceil(filtered.length / entriesPerPage);
  const displayed = filtered.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );
  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  // exports
  const handleCopy = () => {
    const txt = displayed
      .map((i) => [i.name, i.description, i.status].join(","))
      .join("\n");
    navigator.clipboard.writeText(txt);
    alert("Copied to clipboard!");
  };
  const handleExcelDownload = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SubSubCategories");
    XLSX.writeFile(wb, "subsubcategories_list.xlsx");
  };
  const handlePdfDownload = () => {
    const doc = new jsPDF();
    doc.text("Sub-SubCategory List", 20, 20);
    autoTable(doc, {
      head: [["Name", "Description", "Status"]],
      body: filtered.map((i) => [i.name, i.description, i.status]),
    });
    doc.save("subsubcategories_list.pdf");
  };
  const handlePrint = () => window.print();
  const handleCsvDownload = () => {
    const csv =
      "data:text/csv;charset=utf-8," +
      filtered.map((i) => [i.name, i.description, i.status].join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = "subsubcategories_list.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // actions
  const toggleDropdown = (idx) => setDropdownIndex(dropdownIndex === idx ? null : idx);

  const toggleStatus = async (id) => {
    const ssc = subSubCategories.find((s) => s._id === id);
    if (!ssc) return;
    const upd = { ...ssc, status: ssc.status === "Active" ? "Inactive" : "Active" };
    setLoading(true);
    try {
      await axios.put(`/api/sub-subcategories/${id}`, upd, auth());
      fetchSubSubCategories();
    } catch (err) {
      console.error("Error toggling status:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this sub-subcategory?")) return;
    setLoading(true);
    try {
      await axios.delete(`/api/sub-subcategories/${id}`, auth());
      fetchSubSubCategories();
    } catch (err) {
      console.error("Error deleting sub-subcategory:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (subSubCat) => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/items", {
        ...auth(),
        params: {
          inStock: inStockOnly ? "true" : "false",
          limit: 10000,
        },
      });
      // Fetch all items, then filter client-side by subSubCategory
      setSubSubCatItems(
        (data.data || []).filter((it) => it.subSubCategory?._id === subSubCat._id)
      );
      setViewModalSubSubCat(subSubCat);
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
        <div className="w-full min-h-screen p-6 bg-gray-100">
          {/* Header */}
          <header className="flex flex-col items-center justify-between gap-2 mb-6 md:flex-row">
            <div>
              <h1 className="text-2xl font-semibold">Sub-SubCategory List</h1>
              <nav className="flex mt-1 text-sm text-gray-600">
                <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline">
                  <FaTachometerAlt />
                  <span className="ml-1">Home</span>
                </NavLink>
                <span> &gt; Sub-SubCategory List</span>
              </nav>
            </div>
            <div className="flex flex-col w-full gap-2 md:w-auto md:flex-row">
              <button
                onClick={() => navigate("/categories-list")}
                className="w-full px-4 py-2 text-white bg-indigo-600 rounded md:w-auto"
              >
                Category List
              </button>
              <button
                onClick={() => navigate("/subcategories-list")}
                className="w-full px-4 py-2 text-white bg-indigo-600 rounded md:w-auto"
              >
                SubCategory List
              </button>
              <NavLink to="/sub-subcategories/import">
                <button className="w-full px-4 py-2 text-white bg-green-600 rounded md:w-auto">
                  Import Sub-SubCategories
                </button>
              </NavLink>
            </div>
          </header>

          {/* Controls */}
          <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <label>Show</label>
              <select
                className="px-2 py-1 border"
                value={entriesPerPage}
                onChange={(e) => setEntriesPerPage(+e.target.value)}
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <label>Entries</label>
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={hasItemsOnly}
                  onChange={(e) => setHasItemsOnly(e.target.checked)}
                  className="mr-2"
                />
                <label className="text-gray-700">Show only sub-subcategories with items</label>
              </div>
              <div className="flex gap-1">
                <div className="flex flex-1 gap-1 text-sm">
                  <button onClick={handleCopy} className="px-2 bg-teal-300">
                    Copy
                  </button>
                  <button onClick={handleExcelDownload} className="px-2 bg-teal-300">
                    Excel
                  </button>
                  <button onClick={handlePdfDownload} className="px-2 bg-teal-300">
                    PDF
                  </button>
                  <button onClick={handlePrint} className="px-2 bg-teal-300">
                    Print
                  </button>
                  <button onClick={handleCsvDownload} className="px-2 bg-teal-300">
                    CSV
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full px-2 py-1 border"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          
          <div className="overflow-x-auto overflow-visible">
            <table className="w-full bg-white border">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2 border">#</th>
                  <th className="p-2 border">Image</th>
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Description</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border">Action</th>
                </tr>
              </thead>
             <tbody>
  {displayed.map((ssc, idx) => (
    <tr key={ssc._id} className="text-center border">
      <td className="p-2 border">{idx + 1}</td>
      <td className="p-2 border">
        {ssc.images && ssc.images.length > 0 ? (
          <img
            src={`/vps/Uploads/sub-subcategories/${ssc.images[0]}`}
            alt={ssc.name}
            className="inline-block object-cover w-12 h-12 rounded"
            onClick={() => setModalImage(ssc)}
            onError={(e) => console.error(`Failed to load image: ${e.target.src}`)}
          />
        ) : (
          <span className="text-gray-400">No image</span>
        )}
      </td>
      <td className="p-2 border">{ssc.name}</td>
      <td className="p-2 border">{ssc.description}</td>
      <td
        className="p-2 border cursor-pointer"
        onClick={() => toggleStatus(ssc._id)}
      >
        {ssc.status === "Active" ? (
          <span className="px-2 py-1 text-white bg-green-600 rounded">
            Active
          </span>
        ) : (
          <span className="px-2 py-1 text-white bg-red-600 rounded">
            Inactive
          </span>
        )}
      </td>
      <td className="relative p-2 border">
        <button
          onClick={() => toggleDropdown(idx)}
          className="px-2 py-1 text-white rounded bg-cyan-600"
        >
          Action
        </button>
        {dropdownIndex === idx && (
          <div className="absolute right-0 mt-1 w-32 bg-white border rounded shadow z-20">
            <button
              className="flex items-center w-full gap-1 px-3 py-2 hover:bg-gray-100"
              onClick={() => handleView(ssc)}
            >
              <FaEye /> View
            </button>
            <button
              className="flex items-center w-full gap-1 px-3 py-2 hover:bg-gray-100"
              onClick={() => navigate(`/sub-subcategories-form?id=${ssc._id}`)}
            >
              <FaEdit /> Edit
            </button>
            <button
              className="flex items-center w-full gap-1 px-3 py-2 text-red-600 hover:bg-gray-100"
              onClick={() => handleDelete(ssc._id)}
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

          
          <div className="flex items-center justify-between mt-4">
            <span>
              Showing {(currentPage - 1) * entriesPerPage + 1} to{" "}
              {Math.min(currentPage * entriesPerPage, filtered.length)} of {filtered.length} entries
            </span>
            <div className="flex gap-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

         
         {modalImage && (
  <div
    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
    onClick={() => setModalImage(null)}
  >
    <div className="relative max-w-5xl w-full">
      <button
        className="absolute top-0 right-0 m-2 text-white text-2xl"
        onClick={() => setModalImage(null)}
      >
        &times;
      </button>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modalImage.images?.map((img, i) => (
          <img
            key={i}
            src={`/vps/Uploads/sub-subcategories/${img}`}
            alt={`${modalImage.name} ${i + 1}`}
            className="max-w-full h-auto rounded"
            onError={(e) => console.error(`Failed to load image: ${e.target.src}`)}
          />
        ))}
      </div>
    </div>
  </div>
)}

          
          {viewModalSubSubCat && (
            <div
              className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
              onClick={() => setViewModalSubSubCat(null)}
            >
              <div
                className="bg-white p-6 rounded-lg shadow-xl max-w-5xl w-full max-h-[85vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    In-Stock Items in {viewModalSubSubCat.name}
                  </h2>
                  <button
                    className="text-gray-600 text-2xl font-bold hover:text-gray-800 transition-colors"
                    onClick={() => setViewModalSubSubCat(null)}
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
                      handleView(viewModalSubSubCat);
                    }}
                    className="mr-2"
                  />
                  <label className="text-gray-700">Show only in-stock items</label>
                </div>
                {subSubCatItems.length ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subSubCatItems.map((item) => (
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
                            const url = `${BASE_URL}/Uploads/qr/items/${img}`;
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
                    onClick={() => setViewModalSubSubCat(null)}
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