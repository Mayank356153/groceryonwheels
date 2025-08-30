import React, { useState, useEffect, useRef } from "react";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import { BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt } from "react-icons/fa";
import axios from "axios";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import ImagePreview from "../ImagePreview.jsx";

const BASE_URL = ""; // ← set your API base

export default function ImportItems() {
  /* ─────────────────────────────── STATE ───────────────────────────── */
  const [file, setFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]); // optional local uploads
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [subSubCategories, setSubSubCategories] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    phase: "idle", // "validating", "uploading", "importing", "finalizing", "idle"
  });

  // toggle: require images when imageCode exists? (default: false)
  const [requireImageWhenCode, setRequireImageWhenCode] = useState(false);

  const preloadedImages = useRef({}); // filename -> url | url[]
  const navigate = useNavigate();

  /* ─────────────────────────────── UTILS ───────────────────────────── */
  const token = localStorage.getItem("token") || "";
  const headers = useRef({
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const cache = useRef({ units: {}, brands: {}, taxes: {} });
  const str = (v) => String(v ?? "").trim();

  /* ──────────────────────────── LOOK-UPS ───────────────────────────── */
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);

    Promise.all([
      axios.get(`${BASE_URL}/api/warehouses`, headers.current),
      axios.get(`${BASE_URL}/api/categories`, headers.current),
      axios.get(`${BASE_URL}/api/subcategories`, headers.current),
      axios.get(`${BASE_URL}/api/sub-subcategories`, headers.current),
    ])
      .then(([wRes, cRes, sRes, ssRes]) => {
        setWarehouses((wRes.data.data || wRes.data).filter((w) => w.status === "Active"));
        setCategories(cRes.data.data || cRes.data);
        setSubCategories(sRes.data.data || sRes.data);
        setSubSubCategories(ssRes.data.data || ssRes.data); // ← fix: was sRes earlier
      })
      .catch(() => alert("Failed to load lookup data. Refresh to retry."))
      .finally(() => setInitializing(false));
  }, []);

  // Preload the local images filename→URL map from server
  useEffect(() => {
    axios
      .get(`${BASE_URL}/api/items/available-images`, headers.current)
      .then((r) => {
        preloadedImages.current = r.data || {};
      })
      .catch(() => {
        // ok to ignore; mapping will just find nothing
      });
  }, []);

  /* Helper that finds/creates and caches an id */
  const ensureOne = async (endpoint, nameField, rawName, extra = {}) => {
    if (!rawName) return undefined;
    const name = str(rawName);
    cache.current[endpoint] = cache.current[endpoint] || {};
    if (cache.current[endpoint][name]) return cache.current[endpoint][name];

    const list = await axios
      .get(`${BASE_URL}/api/${endpoint}?search=${encodeURIComponent(name)}`, headers.current)
      .then((r) => r.data.data || r.data)
      .catch(() => []);

    const found = list.find((it) => str(it[nameField]).toLowerCase() === name.toLowerCase());
    let id = found?._id;

    if (!id) {
      const body = { [nameField]: name };
      if (endpoint === "taxes") {
        body.taxPercentage = Number(extra.value) || 0;
        body.type = extra.type || "percentage";
      }
      id = await axios
        .post(`${BASE_URL}/api/${endpoint}`, body, headers.current)
        .then((r) => (r.data.data || r.data)?._id)
        .catch(() => null);
    }
    cache.current[endpoint][name] = id;
    return id;
  };

  /* ─────────────────────────── HANDLERS ────────────────────────────── */
  const handleFileChange = (e) => setFile(e.target.files[0] || null);

  const handleImageFilesChange = (e) => {
    const pile = Array.from(e.target.files);
    if (pile.length + imageFiles.length > 20000) {
      alert("You can upload up to 20,000 images in total.");
      return;
    }
    for (const f of pile) {
      if (f.size > 10 * 1024 * 1024) {
        alert(`File ${f.name} exceeds the 10 MB limit.`);
        return;
      }
    }
    setImageFiles((prev) => [...prev, ...pile]);
  };
  const removeImageFile = (i) => setImageFiles((prev) => prev.filter((_, idx) => idx !== i));

  /* ─────────────────────────── MAIN IMPORT ─────────────────────────── */
  const handleImport = async () => {
    if (initializing) return alert("Loading lookup data; please wait...");
    if (!selectedWarehouse) return alert("Please select a warehouse.");
    if (!file) return alert("Please choose a CSV file.");

    setLoading(true);
    setProgress({ current: 0, total: 100, phase: "validating" });

    try {
      /* 0️⃣ Parse CSV */
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "", raw: false });
      const totalRows = rows.length;
      setProgress({ current: 5, total: 100, phase: "validating" }); // 5% for parsing

      // collect codes (no stock gate)
      const neededCodes = new Set();
      rows.forEach((r) => {
        const code = str(r["IMAGE CODE"]);
        if (code) neededCodes.add(code.toLowerCase());
      });

      /* Prepare image map from server & optional local uploads */
      let uploadedImageMap = { ...preloadedImages.current }; // filename -> url | url[]

      // Optional: also accept local files selected in UI and upload them (not required)
      const imagesToUpload = imageFiles.filter((f) => {
        const base = f.name.replace(/\.[^.]+$/, "").toLowerCase();
        return [...neededCodes].some((c) => base.includes(c));
      });
      if (imageFiles.length && !imagesToUpload.length) {
        alert("None of the selected images are referenced in the CSV; they'll be skipped.");
      }

      if (imagesToUpload.length) {
        const CHUNK_SIZE = 1000;
        const totalImages = imagesToUpload.length;
        let uploadedCount = 0;

        for (let start = 0; start < totalImages; start += CHUNK_SIZE) {
          const chunk = imagesToUpload.slice(start, start + CHUNK_SIZE);
          const form = new FormData();
          chunk.forEach((f) => form.append("itemImages", f));

          const up = await axios.post(
            `${BASE_URL}/api/items/upload-images`,
            form,
            { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
          );

          if (!up.data || up.data.success === false) {
            throw new Error(up.data?.message || "Image upload failed");
          }
          Object.assign(uploadedImageMap, up.data.uploadedImages || {});
          uploadedCount += chunk.length;

          setProgress({
            current: 20 + (uploadedCount / totalImages) * 20, // 20%→40%
            total: 100,
            phase: "uploading",
          });
        }
      }

      /* 3️⃣ Validate rows & build payload */
      const payload = [];
      const failed = [];
      setProgress({ current: 40, total: 100, phase: "validating" }); // 40% for starting validation

      for (let idx = 0; idx < rows.length; idx++) {
        try {
          const row = rows[idx];

          /* Look-ups — category, etc. */
          const catName = str(row["CATEGORY NAME"]);
          const cat = categories.find((c) => c.name.toLowerCase() === catName.toLowerCase());
          if (!cat) throw new Error(`Category "${row["CATEGORY NAME"]}" not found`);

          let subId, subSubId;
          const subName = str(row["SUB CATEGORY NAME"]).toLowerCase();
          const subSubName = str(row["SUB SUBCATEGORY NAME"]).toLowerCase();
          if (subName) {
            const sub = subCategories.find((s) => s.name.toLowerCase() === subName);
            if (!sub) throw new Error(`SubCategory "${row["SUB CATEGORY NAME"]}" not found`);
            subId = sub._id;
          }
          if (subSubName) {
            const ssc = subSubCategories.find((s) => s.name.toLowerCase() === subSubName);
            if (!ssc) throw new Error(`SubSubCategory "${row["SUB SUBCATEGORY NAME"]}" not found`);
            subSubId = ssc._id;
          }

          /* Other refs */
          const unitId = await ensureOne("units", "unitName", row["UNIT NAME"]);
          const brandId = await ensureOne("brands", "brandName", row["BRAND NAME"]);
          const taxId = await ensureOne("taxes", "taxName", row["TAX NAME"], {
            value: row["TAX VALUE"],
            type: row["TAX TYPE"],
          });
          if (!unitId || !taxId) throw new Error("Missing unit/tax id");

          /* Barcodes (preserve long numbers) */
          const toPlain = (v) =>
            /e\+/i.test(v) ? Number(v).toLocaleString("fullwide", { useGrouping: false }) : v;
          const barcodes = str(row["BARCODES"])
            .split(",")
            .map((b) => toPlain(str(b)))
            .filter(Boolean);

          /* Image mapping (LOCAL ONLY; no S3; no stock gate) */
          const imageCode = str(row["IMAGE CODE"]);
          let mapped = [];

          if (imageCode) {
            mapped = Object.entries(uploadedImageMap)
              .filter(([orig]) =>
                orig.replace(/\.[^.]+$/, "").toLowerCase().includes(imageCode.toLowerCase())
              )
              .flatMap(([, server]) => (Array.isArray(server) ? server : [server]));
          }

          // Fallback: ITEM IMAGES column (comma-separated filenames)
          if ((!mapped || mapped.length === 0) && str(row["ITEM IMAGES"])) {
            const names = str(row["ITEM IMAGES"]).split(",").map(str).filter(Boolean);
            mapped = names
              .map((name) => uploadedImageMap[name])
              .flatMap((v) => (Array.isArray(v) ? v : v ? [v] : []));
          }

          // If we want to enforce “image required when code exists”, use toggle:
          if (requireImageWhenCode && imageCode && mapped.length === 0) {
            throw new Error(`No uploaded images contain IMAGE CODE "${imageCode}"`);
          }
          // Otherwise we keep imageCode (for later linking) and allow empty itemImages.

          /* Expiry date optional */
          let expiry = row["EXPIRY DATE"];
          if (typeof expiry === "number") {
            expiry = new Date((expiry - 25569) * 86400 * 1000).toISOString();
          } else if (expiry) {
            const d = new Date(expiry);
            expiry = isNaN(d.getTime()) ? null : d.toISOString();
          } else {
            expiry = null;
          }

          /* Mandatory checks */
          if (!str(row["ITEM NAME"])) throw new Error("ITEM NAME is required");
          if (!catName) throw new Error("CATEGORY NAME is required");
          if (!str(row["UNIT NAME"])) throw new Error("UNIT NAME is required");
          if (!str(row["TAX NAME"])) throw new Error("TAX NAME is required");
          if (row["TAX VALUE"] === undefined || row["TAX VALUE"] === "") throw new Error("TAX VALUE is required");
          if (!str(row["TAX TYPE"])) throw new Error("TAX TYPE is required");
          if (row["PRICE WITHOUT TAX"] === undefined || row["PRICE WITHOUT TAX"] === "") throw new Error("PRICE WITHOUT TAX is required");
          if (row["SALES PRICE"] === undefined || row["SALES PRICE"] === "") throw new Error("SALES PRICE is required");
          if (row["OPENING STOCK"] === undefined || row["OPENING STOCK"] === "") throw new Error("OPENING STOCK is required");

          payload.push({
            itemCode: str(row["ITEM CODE"]),
            itemName: str(row["ITEM NAME"]),
            category: cat._id,
            subCategory: subId,
            subSubCategory: subSubId,
            itemGroup: str(row["ITEM GROUP"]) || "Single",
            unit: unitId,
            brand: brandId,
            tax: taxId,
            sku: str(row["SKU"]),
            hsn: str(row["HSN"]),
            barcodes,
            priceWithoutTax: Number(row["PRICE WITHOUT TAX"] || 0),
            purchasePrice: Number(row["PURCHASE PRICE"] || 0),
            salesPrice: Number(row["SALES PRICE"] || 0),
            mrp: Number(row["MRP"] || 0),
            openingStock: Number(row["OPENING STOCK"] || 0),
            alertQuantity: Number(row["ALERT QTY"] || 0),
            sellerPoints: Number(row["SELLER POINTS"] || 0),
            discountType: str(row["DISCOUNT TYPE"]).toLowerCase().includes("flat") ? "Fixed" : "Percentage",
            discount: Number(row["DISCOUNT"] || 0),
            discountPolicy: str(row["DISCOUNT POLICY"]) || "None",
            requiredQuantity: Number(row["REQUIRED QUANTITY"] || 0),
            freeQuantity: Number(row["FREE QUANTITY"] || 0),
            warehouse: selectedWarehouse,
            description: str(row["ITEM DESCRIPTION"]),
            expiryDate: expiry,
            itemImages: mapped,          // ← from local uploads map
            imageCode: imageCode,        // ← always included
            isOnline: !["offline", "no", "0"].includes(str(row["VISIBILITY"]).toLowerCase()),
          });

          // Update progress for each row (40% → 60%)
          setProgress({
            current: 40 + ((idx + 1) / totalRows) * 20,
            total: 100,
            phase: "validating",
          });
          await new Promise((resolve) => setTimeout(resolve, 0)); // yield
        } catch (err) {
          failed.push({ ...rows[idx], ERROR: err.message, ROW_NUMBER: idx + 1 });
        }
      }

      /* 4️⃣ Export fail sheet (if any) */
      if (failed.length) {
        const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(failed));
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "failed_imports.csv";
        link.click();
      }
      if (!payload.length) throw new Error("No valid items to import");

      /* 5️⃣ Bulk upsert in chunks (server should upsert) */
      const CHUNK = 200;
      let affected = 0;
      const chunkErrs = [];
      setProgress({ current: 60, total: 100, phase: "importing" }); // 60% start

      for (let i = 0; i < payload.length; i += CHUNK) {
        const slice = payload.slice(i, i + CHUNK);
        try {
          const r = await axios.post(`${BASE_URL}/api/items/bulk`, slice, headers.current);
          // server should respond with counts; fallback to slice length
          affected += r.data.count ?? r.data.upserted ?? r.data.modified ?? slice.length;
        } catch (err) {
          chunkErrs.push(`Chunk ${i / CHUNK + 1}: ${err.message}`);
        }
        setProgress({
          current: 60 + ((i + slice.length) / payload.length) * 35, // 60%→95%
          total: 100,
          phase: "importing",
        });
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      setProgress({ current: 95, total: 100, phase: "finalizing" });
      alert(`Imported/updated ${affected}/${payload.length} rows.\n${chunkErrs.length ? chunkErrs.join("\n") : ""}`);
      navigate("/item-list");
    } catch (err) {
      console.error("[bulk] import failed:", err);
      alert(err.message || "Bulk import error");
    } finally {
      setLoading(false);
      setProgress({ current: 0, total: 0, phase: "idle" });
    }
  };

  /* ───────────────────────────── RENDER ───────────────────────────── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <div className="text-2xl font-semibold text-gray-700">
          {progress.phase === "validating" && "Validating CSV Rows..."}
          {progress.phase === "uploading" && "Uploading Images..."}
          {progress.phase === "importing" && "Importing Items..."}
          {progress.phase === "finalizing" && "Finalizing Import..."}
        </div>
        <div className="text-lg text-gray-600 mt-2">
          {Math.round(progress.current)}% Complete
        </div>
        <div className="w-64 bg-gray-200 rounded-full h-2.5 mt-4 overflow-hidden">
          <div
            className="bg-green-500 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress.current}%` }}
          />
        </div>
      </div>
    );
  }

  const instructions = [
    { col: 1,  name: "ITEM CODE",        value: "Optional",  desc: "" },
    { col: 2,  name: "ITEM NAME",        value: "Required",  desc: "" },
    { col: 3,  name: "CATEGORY NAME",    value: "Required",  desc: "" },
    { col: 4,  name: "SUB CATEGORY NAME",value: "Optional",  desc: "" },
    { col: 5,  name: "SUB SUBCATEGORY NAME", value: "Optional", desc: "" },
    { col: 6,  name: "UNIT NAME",        value: "Required",  desc: "" },
    { col: 7,  name: "BRAND NAME",       value: "Optional",  desc: "" },
    { col: 8,  name: "TAX NAME",         value: "Required",  desc: "" },
    { col: 9,  name: "TAX VALUE",        value: "Required",  desc: "" },
    { col: 10, name: "TAX TYPE",         value: "Required",  desc: "'Inclusive' or 'Exclusive'" },
    { col: 11, name: "ITEM GROUP",       value: "Optional",  desc: "Defaults to 'Single'" },
    { col: 12, name: "SKU",              value: "Optional",  desc: "" },
    { col: 13, name: "HSN",              value: "Optional",  desc: "" },
    { col: 14, name: "BARCODES",         value: "Optional",  desc: "Comma-separated" },
    { col: 15, name: "PRICE WITHOUT TAX",value: "Required",  desc: "" },
    { col: 16, name: "PURCHASE PRICE",   value: "Optional",  desc: "" },
    { col: 17, name: "SALES PRICE",      value: "Required",  desc: "" },
    { col: 18, name: "MRP",              value: "Optional",  desc: "" },
    { col: 19, name: "OPENING STOCK",    value: "Required",  desc: "" },
    { col: 20, name: "ALERT QTY",        value: "Optional",  desc: "" },
    { col: 21, name: "SELLER POINTS",    value: "Optional",  desc: "" },
    { col: 22, name: "DISCOUNT TYPE",    value: "Optional",  desc: "'Percentage' or 'Flat'" },
    { col: 23, name: "DISCOUNT",         value: "Optional",  desc: "" },
    { col: 24, name: "DISCOUNT POLICY",  value: "Optional",  desc: "'None' or 'BuyXGetY'" },
    { col: 25, name: "REQUIRED QUANTITY",value: "Optional",  desc: "Needed for BuyXGetY" },
    { col: 26, name: "FREE QUANTITY",    value: "Optional",  desc: "Needed for BuyXGetY" },
    { col: 27, name: "ITEM DESCRIPTION", value: "Optional",  desc: "" },
    { col: 28, name: "EXPIRY DATE",      value: "Optional",  desc: "Date or Excel serial" },
    { col: 29, name: "IMAGE CODE",       value: "Optional",  desc: "Used to link images; matched against filenames" },
    { col: 30, name: "ITEM IMAGES",      value: "Optional",  desc: "Fallback—comma-separated filenames" },
    { col: 31, name: "VISIBILITY",       value: "Optional",  desc: "'Online' (default) or 'Offline'" },
  ];

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <div className="flex-grow p-4 bg-gray-100 overflow-y-auto">
          {/* Header */}
          <header className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded shadow mb-4">
            <h1 className="text-xl font-semibold">Import Items (Bulk CSV)</h1>
            <nav className="flex items-center space-x-2 text-sm text-gray-600">
              <a href="/dashboard" className="hover:text-cyan-600 flex items-center">
                <FaTachometerAlt className="mr-1" /> Home
              </a>
              <BiChevronRight />
              <a href="/item-list" className="hover:text-cyan-600">Items List</a>
            </nav>
          </header>

          {/* Form card */}
          <div className="bg-white p-6 rounded shadow space-y-4">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={requireImageWhenCode}
                  onChange={(e) => setRequireImageWhenCode(e.target.checked)}
                />
                Require image files when IMAGE CODE is present
              </label>
            </div>

            {/* Warehouse */}
            <div>
              <label className="block mb-1 font-semibold">
                Warehouse <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full md:w-1/2 p-2 border rounded"
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
              >
                <option value="">Select Warehouse</option>
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.warehouseName}
                  </option>
                ))}
              </select>
            </div>

            {/* CSV */}
            <div>
              <label className="block mb-1 font-semibold">
                Import CSV <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="w-full md:w-1/2 p-2 border rounded"
              />
              <p className="text-sm text-red-500 mt-1">
                Column names must match the list below. Images are mapped by matching <b>IMAGE CODE</b> inside filenames in your <code>uploads/qr/items</code> folder (via <code>/api/items/available-images</code>).
              </p>
            </div>

            {/* Images (optional) */}
            <div>
              <label className="block mb-1 font-semibold">Upload Images (Optional)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageFilesChange}
                className="w-full md:w-1/2 p-2 border rounded"
              />
              <p className="text-sm text-gray-600 mt-1">
                Optional: add extra files here. The importer links files whose names contain the IMAGE CODE. (Not required if images already exist in <code>uploads/qr/items</code>.)
              </p>
              {imageFiles.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-semibold">Selected Files:</p>
                  <ImagePreview files={imageFiles} onRemove={removeImageFile} />
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Import
              </button>
              <button
                onClick={() => navigate("/item-list")}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Close
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-white rounded shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Import Instructions</h2>
              <a
                href="/templates/bulk-items-example.csv"
                download
                className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600"
              >
                Download Example Format
              </a>
            </div>
            <table className="w-full text-sm border border-gray-300">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2 border">#</th>
                  <th className="p-2 border">Column Name</th>
                  <th className="p-2 border">Value</th>
                  <th className="p-2 border">Description</th>
                </tr>
              </thead>
              <tbody>
                {instructions.map((i) => (
                  <tr key={i.col} className="even:bg-gray-50">
                    <td className="p-2 border text-center">{i.col}</td>
                    <td className="p-2 border">{i.name}</td>
                    <td className="p-2 border font-semibold">
                      {i.value === "Required" ? (
                        <span className="px-2 bg-green-100 text-green-800 rounded text-xs">{i.value}</span>
                      ) : (
                        <span className="px-2 bg-gray-100 text-gray-600 rounded text-xs italic">{i.value}</span>
                      )}
                    </td>
                    <td className="p-2 border">{i.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
