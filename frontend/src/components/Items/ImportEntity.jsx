import React, { useEffect, useState } from "react";
import { useParams, useNavigate, NavLink, useLocation } from "react-router-dom";
import Sidebar from "../Sidebar";
import Navbar from "../Navbar";
import LoadingScreen from "../../Loading";
import axios from "axios";
import * as XLSX from "xlsx";

const BASE_URL = "";

export default function ImportEntity({ entity: propEntity }) {
  const { entity: paramEntity } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const entity = propEntity ?? paramEntity;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mode, setMode] = useState("single"); // "single" | "bulk"
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "Active",
    image: "",
    images: "",
    features: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [entityId, setEntityId] = useState(null);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const id = query.get("id");
    if (id) {
      setIsEditing(true);
      setEntityId(id);
      fetchEntity(id);
    }
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, [location.search]);

  const fetchEntity = async (id) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/${entity}/${id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      const data = res.data.data;
      setForm({
        name: data.name || "",
        description: data.description || "",
        status: data.status || "Active",
        image: data.image || "",
        images: Array.isArray(data.images) ? data.images.join(";") : "",
        features: Array.isArray(data.features) ? data.features.join(";") : "",
      });
    } catch (err) {
      alert("Failed to fetch: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const titleMap = {
    categories: "Category",
    subcategories: "SubCategory",
    "sub-subcategories": "Sub-SubCategory",
  };
  const listRouteMap = {
    categories: "/categories-list",
    subcategories: "/subcategories-list",
    "sub-subcategories": "/sub-subcategory-list",
  };
  const title = titleMap[entity] || "Entity";
  const listRoute = listRouteMap[entity] || "/";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSingleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("images", file);
    try {
      setLoading(true);
      const { data } = await axios.post(
        `/api/${entity}/upload-images`,
        fd,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (data.success) {
        setForm((f) => ({ ...f, image: data.uploadedImages[file.name] }));
      } else {
        alert("Upload failed: " + data.message);
      }
    } catch (err) {
      alert("Upload error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSingleImagesChange = async (e) => {
    const files = Array.from(e.target.files);
    const fd = new FormData();
    files.forEach((f) => fd.append("images", f));
    try {
      setLoading(true);
      const { data } = await axios.post(
        `/api/${entity}/upload-images`,
        fd,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (data.success) {
        const joined = files
          .map((f) => data.uploadedImages[f.name])
          .filter(Boolean)
          .join(";");
        setForm((f) => ({ ...f, images: joined }));
      } else {
        alert("Upload failed: " + data.message);
      }
    } catch (err) {
      alert("Upload error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status,
      features: form.features.split(/;|,/).map((s) => s.trim()).filter(Boolean),
    };
    if (entity === "sub-subcategories") {
      payload.images = form.images.split(/;|,/).map((s) => s.trim()).filter(Boolean);
    } else {
      payload.image = form.image;
    }
    try {
      if (isEditing) {
        await axios.put(
          `/api/${entity}/${entityId}`,
          payload,
          { headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        alert(`${title} updated`);
      } else {
        await axios.post(
          `/api/${entity}`,
          payload,
          { headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        alert(`${title} created`);
      }
      navigate(listRoute);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a file");
    setLoading(true);
    let uploadedMap = {};
    try {
      if (imageFiles.length) {
        const fd = new FormData();
        imageFiles.forEach((f) => fd.append("images", f));
        const { data } = await axios.post(
          `/api/${entity}/upload-images`,
          fd,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "multipart/form-data" } }
        );
        if (!data.success) throw new Error(data.message);
        uploadedMap = data.uploadedImages;
      }
    } catch (err) {
      setLoading(false);
      return alert("Image upload failed: " + err.message);
    }
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const arr = new Uint8Array(evt.target.result);
        const wb = XLSX.read(arr, { type: "array" });
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
        const payload = rows.map((r) => {
          const obj = {
            name: String(r.name || "").trim(),
            description: String(r.description || "").trim(),
            status: String(r.status || "Active").trim(),
            features: String(r.features || "").split(/;|,/).map((s) => s.trim()).filter(Boolean),
          };
          if (entity === "sub-subcategories") {
            const names = String(r.images || r.image || "").split(/;|,/).map((s) => s.trim()).filter(Boolean);
            obj.images = names.map((n) => {
              if (!uploadedMap[n]) throw new Error(`Image "${n}" not found`);
              return uploadedMap[n];
            });
          } else {
            const n = String(r.image || "").trim();
            obj.image = n ? (uploadedMap[n] || (() => { throw new Error(`Image "${n}" not found`); })()) : "";
          }
          return obj;
        });
        await axios.post(
          `/api/${entity}/bulk`,
          payload,
          { headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        alert(`Bulk import of ${title}s successful`);
        navigate(listRoute);
      } catch (err) {
        alert("Bulk import failed: " + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadSample = () => {
    const headers = entity === "sub-subcategories"
      ? "name,description,status,images,features"
      : "name,description,status,image,features";
    const sample = entity === "sub-subcategories"
      ? "Name,Desc,Active,img1;img2,feat1;feat2"
      : "Name,Desc,Active,img,feat1;feat2";
    const blob = new Blob([`${headers}\n${sample}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sample_${entity}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImageFilesChange = (e) => {
    const files = Array.from(e.target.files);
    if (imageFiles.length + files.length > 50) return alert("Max 50 images");
    for (let f of files) if (f.size > 1024 * 1024) return alert(`${f.name} too large`);
    setImageFiles((prev) => [...prev, ...files]);
  };

  const removeImageFile = (idx) => setImageFiles((prev) => prev.filter((_, i) => i !== idx));

  const removeSingleImage = (fn) => {
    setForm((f) => ({
      ...f,
      images: f.images
        .split(';')
        .filter((name) => name !== fn)
        .join(';'),
    }));
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Navbar isSidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow md:flex-row">
        <Sidebar isSidebarOpen={sidebarOpen} />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {mode === "single"
                  ? isEditing
                    ? `Edit ${title}`
                    : `Create ${title}`
                  : `Bulk Import ${title}s`}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {mode === "single"
                  ? `Manage individual ${title.toLowerCase()} details`
                  : `Import multiple ${title.toLowerCase()}s via file upload`}
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <button
                onClick={() => setMode("single")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  mode === "single"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Single
              </button>
              <button
                onClick={() => setMode("bulk")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  mode === "bulk"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Bulk
              </button>
              <NavLink
                to={listRoute}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                View {title} List
              </NavLink>
            </div>
          </header>

          {mode === "single" ? (
            <form
              onSubmit={handleSingleSubmit}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-2xl mx-auto"
            >
              <div className="grid gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    rows="4"
                    placeholder="Enter description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                {entity !== "sub-subcategories" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSingleImageChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
                    />
                    {form.image && (
                      <div className="mt-3">
                        <img
                          src={`/vps/uploads/${entity}/${form.image}`}
                          alt="preview"
                          className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Images
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleSingleImagesChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
                    />
                    {form.images && (
                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {form.images.split(';').map((fn) => (
                          <div key={fn} className="relative">
                            <img
                              src={`/vps/uploads/${entity}/${fn}`}
                              className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                              alt=""
                            />
                            <button
                              type="button"
                              onClick={() => removeSingleImage(fn)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                              title="Remove image"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Features
                  </label>
                  <input
                    name="features"
                    value={form.features}
                    onChange={handleChange}
                    placeholder="feat1;feat2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Separate features with semicolons or commas (e.g., feat1;feat2)
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  {isEditing ? `Update ${title}` : `Create ${title}`}
                </button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={handleBulkSubmit}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-2xl mx-auto"
            >
              <div className="grid gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Images (Optional)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageFilesChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
                  />
                  {imageFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {imageFiles.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <span className="text-sm text-gray-700">
                            {f.name} ({(f.size / 1024).toFixed(1)} KB)
                          </span>
                          <button
                            type="button"
                            onClick={() => removeImageFile(i)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File Format Instructions
                  </label>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-700">
                      Upload a CSV, XLS, or XLSX file with the following headers:
                    </p>
                    <p className="mt-1 font-mono text-sm text-gray-900">
                      {entity === "sub-subcategories"
                        ? "name,description,status,images,features"
                        : "name,description,status,image,features"}
                    </p>
                    <button
                      type="button"
                      onClick={handleDownloadSample}
                      className="mt-2 inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                    >
                      Download Sample File
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload CSV / XLS / XLSX <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Import {title}s
                </button>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}