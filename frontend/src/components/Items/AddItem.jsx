import React, { useEffect, useState } from "react";
import Input from "../contact/Input";
import Button from "../contact/Button";
import Select from "react-select";
import Scanner from "./Scanner";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";
import Pop from "./Pop";
import LoadingScreen from "../../Loading";
import { FaTachometerAlt } from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { useId } from "react";

export default function AddItem() {
  const navigate = useNavigate();
  const ID = useId();

  /* ---------------------------- form state --------------------------- */
  const [formData, setFormData] = useState({
    alertQuantity: 0,
    barcode: "",
    brand: null,
    category: null,
    description: "",
    discount: 0,
    discountType: "",
    expiryDate: "",
    hsn: "",
    itemCode: "",
    itemGroup: null,
    itemImage: null,
    itemName: "",
    mrp: 0,
    openingStock: 0,
    priceWithoutTax: 0,
    profitMargin: 0,
    purchasePrice: 0,
    salesPrice: 0,
    sku: "",
    subCategory: null,
    tax: null,
    unit: null,
    warehouse: null,
  });

  /* ------------------------------ UI state ---------------------------- */
  const [options, setOptions] = useState({
    brand: [],
    category: [],
    subCategory: [],
    itemGroup: [
      { label: "Single", value: "Single" },
      { label: "Variant", value: "Variant" },
    ],
    unit: [],
    discountType: [
      { label: "Percentage(%)", value: "Percentage" },
      { label: "Fixed", value: "Fixed" },
    ],
    tax: [],
    taxType: [
      { label: "Inclusive", value: "inclusive" },
      { label: "Exclusive", value: "exclusive" },
    ],
    warehouse: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  /* ---------------------------- data fetches ------------------------- */
  const tokenHeader = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "application/json",
    },
  });

  const fetchBrands = async () => {
    try {
      const { data } = await axios.get(
        "api/brands",
        tokenHeader()
      );
      setOptions((prev) => ({ ...prev, brand: data.data }));
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const { data } = await axios.get(
        "api/warehouses",
        tokenHeader()
      );
      setOptions((prev) => ({ ...prev, warehouse: data.data }));
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get(
        "api/categories",
        tokenHeader()
      );
      setOptions((prev) => ({ ...prev, category: data.data }));
    } catch (err) {
      setError(err.message);
    }
  };

// ⬅ the ONLY place you touch the array
const fetchSubCategories = async () => {
  try {
    const res = await axios.get(
      "api/subcategories",
      tokenHeader()
    );

    /* The array is ALWAYS in res.data.data */
   
   const list = Array.isArray(res.data.data) ? res.data.data : [];

   setOptions(prev => ({ ...prev, subCategory: list }));
   console.log("✅ subCategory saved →", list.length, "items");
  } catch (err) {
    setError(err.message);
  }
};


  const fetchTaxes = async () => {
    try {
      const { data } = await axios.get(
        "api/taxes",
        tokenHeader()
      );
      setOptions((prev) => ({ ...prev, tax: data.data }));
    } catch (err) {
      setError(err.message);
    }
  };

  const generateItemCode = (lastCode = "IT050000") => {
    const [, prefix, num] = lastCode.match(/(\D+)(\d+)/) || [];
    const next = (Number(num) + 1).toString().padStart(6, "0");
    return `${prefix || "IT"}${next}`;
  };

  const fetchLastItemCode = async () => {
    try {
      const { data } = await axios.get(
        "api/items",
        tokenHeader()
      );
      const lastItem = data.data.at(-1);
      setFormData((p) => ({
        ...p,
        itemCode: generateItemCode(lastItem?.itemCode),
      }));
    } catch {
      setFormData((p) => ({ ...p, itemCode: generateItemCode() }));
    }
  };

  /* ----------------------------- effects ----------------------------- */
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);

    Promise.all([
      fetchBrands(),
      fetchWarehouses(),
      fetchCategories(),
      fetchSubCategories(),
      fetchTaxes(),
      fetchLastItemCode(),
    ]).finally(() => setLoading(false));
    // eslint-disable-next-line
  }, []);

  /* ---------------------- general input handlers --------------------- */
  const handleChange = ({ target: { name, value } }) =>
    setFormData((prev) => ({ ...prev, [name]: value }));

  const handleSelectChange = (name) => (selected) =>
    setFormData((prev) => ({ ...prev, [name]: selected?.value || null }));

  /* --------------- price / profit‑margin auto‑calculations ----------- */
  const calcPrices = ({ target: { name, value } }) => {
    const v = Number(value);
    if (name === "priceWithoutTax") {
      const sales = v + (v * Number(formData.profitMargin)) / 100;
      setFormData((p) => ({ ...p, salesPrice: sales }));
    } else if (name === "profitMargin") {
      const sales =
        Number(formData.priceWithoutTax) +
        (Number(formData.priceWithoutTax) * v) / 100;
      setFormData((p) => ({ ...p, salesPrice: sales }));
    } else if (name === "salesPrice") {
      const margin =
        ((v - Number(formData.priceWithoutTax)) /
          Number(formData.priceWithoutTax)) *
        100;
      setFormData((p) => ({ ...p, profitMargin: margin }));
    }
  };

  /* --------------------------- image input --------------------------- */
  const handleImageChange = (e) =>
    setFormData((p) => ({ ...p, itemImage: e.target.files?.[0]?.name || null }));

  /* --------------------------- form submit --------------------------- */
  const postData = async () => {
    await axios.post(
      "api/items",
      formData,
      tokenHeader()
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await postData();
      alert("Item added successfully");
      setFormData((p) => ({
        ...p,
        ...{
          alertQuantity: 0,
          barcode: "",
          brand: null,
          category: null,
          description: "",
          discount: 0,
          discountType: "",
          expiryDate: "",
          hsn: "",
          itemCode: generateItemCode(p.itemCode),
          itemGroup: null,
          itemImage: null,
          itemName: "",
          mrp: 0,
          openingStock: 0,
          priceWithoutTax: 0,
          profitMargin: 0,
          purchasePrice: 0,
          salesPrice: 0,
          sku: "",
          subCategory: null,
          tax: null,
          unit: null,
          warehouse: null,
        },
      }));
    } catch (err) {
      alert("Unsuccessful: " + (err.response?.data?.message || err.message));
    }
  };

  /* ============================ RENDER =============================== */
  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex flex-grow mt-20">
        {/* Sidebar */}
        <Sidebar isSidebarOpen={isSidebarOpen} />

        {/* Main area */}
        <div className="w-full h-full px-6 py-4 bg-gray-300">
          {/* Breadcrumb */}
          <div className="flex flex-col items-start justify-between mt-4 sm:items-end md:flex-row">
            <div className="flex flex-wrap items-end w-full md:w-1/2">
              <span className="text-3xl">Items</span>
              <span className="ml-2 text-sm text-gray-700">
                Add / Update Items
              </span>
            </div>
            <div className="flex flex-wrap w-auto gap-2 pl-2 mb-2 text-sm font-semibold text-black bg-gray-500 bg-opacity-50 rounded-md md:text-gray-500 md:justify-end md:w-1/2 md:bg-transparent">
              <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline">
                <FaTachometerAlt /> Home
              </NavLink>
              <NavLink to="/contact/" className="text-gray-700 no-underline">
                &gt; Items List
              </NavLink>
              <NavLink to="/supplier/add" className="text-gray-700 no-underline">
                &gt; Items
              </NavLink>
            </div>
          </div>

          {/* Pop for dynamic add (Brand/Category/Unit/Tax) */}
          {formData.add && (
            <Pop
              add={formData.add}
              setAdd={(v) => setFormData((p) => ({ ...p, add: v }))}
              options={options}
              setOptions={setOptions}
              category={formData.name}
            />
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-5 px-4 py-5 mx-auto bg-white border-t-2 border-gray-100 rounded-lg border-t-blue-600">
              {/* Item code */}
              <Input
                div_class="flex flex-col"
                label="Item Code*"
                label_class="text-sm font-semibold"
                name="itemCode"
                value={formData.itemCode}
                onChange={handleChange}
                className="px-4 py-2 mt-1 text-sm text-gray-800 border-2 border-gray-300 rounded-md lg:w-1/4 focus:outline-none focus:border-blue-600"
              />

              {/* Item name | Brand | Category */}
              <div className="flex flex-col w-full gap-2 lg:flex-row lg:justify-between">
                <Input
                  label="Item Name*"
                  name="itemName"
                  value={formData.itemName}
                  onChange={handleChange}
                  label_class="text-sm font-semibold"
                  div_class="flex flex-col lg:w-1/4"
                  className="px-4 py-2 mt-1 text-sm text-gray-800 border-2 border-gray-300 rounded-md focus:outline-none focus:border-blue-600"
                />

                {/* Brand */}
                <div className="flex flex-col lg:w-1/4">
                  <label className="mb-1 text-sm font-semibold">Brand</label>
                  <label className="flex">
                    <select
                      name="brand"
                      onChange={handleChange}
                      className="w-full px-2 py-2 border-2 rounded-l-md"
                      value={formData.brand || ""}
                    >
                      <option disabled value="">
                        Select Brand
                      </option>
                      {options.brand.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.brandName}
                        </option>
                      ))}
                    </select>
                    <span
                      className="flex items-center px-2 text-lg font-bold text-blue-500 border-2 border-gray-300 rounded-r-sm cursor-pointer hover:bg-gray-100"
                      onClick={() =>
                        setFormData((p) => ({ ...p, add: true, name: "Brand" }))
                      }
                    >
                      +
                    </span>
                  </label>
                </div>

                {/* Category */}
                <div className="flex flex-col lg:w-1/4">
                  <label className="mb-1 text-sm font-semibold">Category</label>
                  <label className="flex">
                    <select
                      name="category"
                      onChange={handleChange}
                      className="w-full px-2 py-2 border-2 rounded-l-md"
                      value={formData.category || ""}
                    >
                      <option disabled value="">
                        Select Category
                      </option>
                      {options.category.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <span
                      className="flex items-center px-2 text-lg font-bold text-blue-500 border-2 border-l-0 border-gray-300 cursor-pointer rounded-r-md hover:bg-gray-100"
                      onClick={() =>
                        setFormData((p) => ({ ...p, add: true, name: "Category" }))
                      }
                    >
                      +
                    </span>
                  </label>
                </div>
              </div>

              {/* Sub‑category | Item group | Unit */}
              <div className="flex flex-col w-full gap-2 lg:flex-row lg:justify-between">
                {/* Sub‑Category (independent list) */}
                <div className="flex flex-col lg:w-1/4">
                  <label className="mb-1 text-sm font-semibold">Sub Category</label>
                  <select
  name="subCategory"
  value={formData.subCategory || ""}
  onChange={handleChange}
  className="w-full px-2 py-2 border-2 rounded-md"
>
  <option disabled value="">Select Sub‑Category</option>

  {options.subCategory.length ? (
    options.subCategory.map(sc => (
      <option key={sc._id} value={sc._id}>
        {sc.name}
      </option>
    ))
  ) : (
    <option>No option</option>
  )}
</select>

                </div>

                {/* Item group */}
                <div className="flex flex-col lg:w-1/4">
                  <label className="text-sm font-semibold">Item Group*</label>
                  <Select
                    options={options.itemGroup}
                    onChange={handleSelectChange("itemGroup")}
                    placeholder="Select Group"
                  />
                </div>

                {/* Unit */}
                <div className="flex flex-col lg:w-1/4">
                  <label className="text-sm font-semibold">Unit</label>
                  <label className="flex">
                    <Select
                      options={options.unit}
                      onChange={handleSelectChange("unit")}
                      className="w-full"
                      placeholder="Select Unit"
                    />
                    <span
                      className="flex items-center px-2 text-lg font-bold text-blue-500 border-2 border-gray-300 rounded-sm cursor-pointer hover:bg-gray-100"
                      onClick={() =>
                        setFormData((p) => ({ ...p, add: true, name: "Unit" }))
                      }
                    >
                      +
                    </span>
                  </label>
                </div>
              </div>

              {/* SKU | HSN | Alert qty */}
              <div className="flex flex-col w-full gap-2 lg:flex-row lg:justify-between">
                <Input
                  label="SKU"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  label_class="text-sm font-semibold"
                  div_class="flex flex-col lg:w-1/4"
                  className="px-4 py-2 mt-1 text-sm text-gray-800 border-2 border-gray-300 rounded-md focus:outline-none focus:border-blue-600"
                />
                <Input
                  label="HSN"
                  name="hsn"
                  value={formData.hsn}
                  onChange={handleChange}
                  label_class="text-sm font-semibold"
                  div_class="flex flex-col lg:w-1/4"
                  className="px-4 py-2 mt-1 text-sm text-gray-800 border-2 border-gray-300 rounded-md focus:outline-none focus:border-blue-600"
                />
                <Input
                  label="Alert Quantity"
                  name="alertQuantity"
                  value={formData.alertQuantity}
                  onChange={handleChange}
                  label_class="text-sm font-semibold"
                  div_class="flex flex-col lg:w-1/4"
                  className="px-4 py-2 mt-1 text-sm text-gray-800 border-2 border-gray-300 rounded-md focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Seller points | Scanner | Description */}
              <div className="flex flex-col w-full gap-2 lg:flex-row lg:justify-between">
                <Input
                  label="Seller Points"
                  name="sellerPoints"
                  onChange={handleChange}
                  label_class="text-sm font-semibold"
                  div_class="flex flex-col lg:w-1/4"
                  className="px-4 py-2 mt-1 text-sm text-gray-800 border-2 border-gray-300 rounded-md focus:outline-none focus:border-blue-600"
                />
                <Scanner />
                <div className="flex flex-col lg:w-1/4">
                  <label className="text-sm font-semibold">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="px-2 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Image upload */}
              <div className="flex flex-col w-full gap-2 lg:flex-row lg:justify-between">
                <Input
                  type="file"
                  label="Select Image"
                  onChange={handleImageChange}
                  label_class="text-sm font-semibold"
                  div_class="flex flex-col lg:w-1/4"
                  className="px-4 py-2 mt-1 text-sm text-gray-800 bg-gray-200 border-2 border-gray-300 rounded-md cursor-pointer file-input focus:outline-none hover:bg-gray-200"
                />
                <span className="text-sm text-red-500">
                  Max 1000×1000 px / 1 MB
                </span>
              </div>

              {/* Discount type / discount */}
              <div className="flex flex-col w-full gap-2 pt-5 border-t-2 border-gray-200 lg:flex-row lg:justify-between">
                <div className="flex flex-col lg:w-1/4">
                  <label className="mb-1 text-sm font-semibold">Discount Type</label>
                  <Select
                    options={options.discountType}
                    onChange={handleSelectChange("discountType")}
                    placeholder="Select Type"
                  />
                </div>
                <Input
                  label="Discount"
                  name="discount"
                  value={formData.discount}
                  onChange={handleChange}
                  label_class="text-sm font-semibold"
                  div_class="flex flex-col lg:w-1/4"
                  className="px-4 py-2 mt-1 text-sm text-gray-800 border-2 border-gray-300 rounded-md focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Price / Tax / Purchase price */}
              <div className="flex flex-col w-full gap-2 pt-5 border-t-2 border-gray-200 mt-7 lg:flex-row lg:justify-between">
                <Input
                  label="Price*"
                  name="priceWithoutTax"
                  value={formData.priceWithoutTax}
                  onChange={(e) => {
                    handleChange(e);
                    calcPrices(e);
                  }}
                  label_class="text-sm font-semibold"
                  div_class="flex flex-col lg:w-1/4"
                  className="px-4 py-2 mt-1 text-sm text-gray-800 border-2 border-gray-300 rounded-md focus:outline-none focus:border-blue-600"
                />
                <div className="flex flex-col w-full lg:w-1/4">
                  <label className="text-sm font-semibold">Tax*</label>
                  <label className="flex w-full">
                    <Select
                      options={options.tax}
                      onChange={handleSelectChange("tax")}
                      className="w-full"
                      placeholder="Select Tax"
                    />
                    <span
                      className="flex items-center px-2 text-lg font-bold text-blue-500 border-2 border-gray-300 rounded-sm cursor-pointer hover:bg-gray-100"
                      onClick={() =>
                        setFormData((p) => ({ ...p, add: true, name: "Tax" }))
                      }
                    >
                      +
                    </span>
                  </label>
                </div>
                <Input
                  label="Purchase Price*"
                  name="purchasePrice"
                  value={formData.priceWithoutTax}
                  readOnly
                  label_class="text-sm font-semibold"
                  div_class="flex flex-col lg:w-1/4"
                  className="px-4 py-2 mt-1 text-sm text-gray-800 bg-gray-200 border-2 border-gray-300 rounded-md focus:outline-none"
                  placeholder="Total Price with Tax"
                />
              </div>

              {/* Tax type / Profit / Sales price */}
              <div className="flex flex-col w-full lg:flex-row lg:justify-between">
                <div className="flex flex-col lg:w-1/4">
                  <label className="text-sm font-semibold">Tax Type*</label>
                  <Select
                    options={options.taxType}
                    onChange={handleSelectChange("taxType")}
                    placeholder="Select Tax Type"
                  />
                </div>
                <Input
                  label="Profit Margin (%)"
                  name="profitMargin"
                  placeholder="Profit in %"
                  value={formData.profitMargin}
                  onChange={(e) => {
                    handleChange(e);
                    calcPrices(e);
                  }}
                  label_class="text-sm font-semibold"
                  div_class="flex flex-col lg:w-1/4"
                  className="px-4 py-2 mt-1 text-sm text-gray-800 border-2 border-gray-300 rounded-md focus:outline-none focus:border-blue-600"
                />
                <Input
                  label="Sales Price*"
                  name="salesPrice"
                  placeholder="Sales Price"
                  value={formData.salesPrice}
                  onChange={(e) => {
                    handleChange(e);
                    calcPrices(e);
                  }}
                  label_class="text-sm font-semibold"
                  div_class="flex flex-col lg:w-1/4"
                  className="px-4 py-2 mt-1 text-sm text-gray-800 border-2 border-gray-300 rounded-md focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* MRP / Expiry */}
              <div className="flex flex-col w-full lg:flex-row lg:justify-between">
                <Input
                  label="Maximum Retail Price"
                  name="mrp"
                  value={formData.mrp}
                  onChange={handleChange}
                  label_class="text-sm font-semibold"
                  div_class="flex flex-col lg:w-1/4"
                  className="px-4 py-2 mt-1 text-sm text-gray-800 border-2 border-gray-300 rounded-md focus:outline-none focus:border-blue-600"
                />
                <Input
                  label="Expiry Date"
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  label_class="text-sm font-semibold"
                  div_class="flex flex-col lg:w-1/4"
                  className="px-4 py-2 mt-1 text-sm text-gray-800 border-2 border-gray-300 rounded-md focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Warehouse / Opening stock */}
              <div className="flex flex-col w-full gap-2 pt-5 pb-5 mt-5 border-t-2 border-b-2 border-gray-200 lg:flex-row lg:justify-between">
                <div className="flex flex-col lg:w-1/4">
                  <label className="mb-1 text-sm font-semibold">Warehouse</label>
                  <select
                    name="warehouse"
                    onChange={handleChange}
                    className="w-full px-2 py-2 border-2 rounded-md"
                    value={formData.warehouse || ""}
                  >
                    <option disabled value="">
                      Select Warehouse
                    </option>
                    {options.warehouse.length ? (
                      options.warehouse.map((w) => (
                        <option key={w._id} value={w._id}>
                          {w.warehouseName}
                        </option>
                      ))
                    ) : (
                      <option>No option</option>
                    )}
                  </select>
                </div>
                <Input
                  label="Opening Stock"
                  name="openingStock"
                  value={formData.openingStock}
                  onChange={handleChange}
                  label_class="text-sm font-semibold"
                  div_class="flex flex-col lg:w-1/4"
                  className="px-4 py-2 mt-1 text-sm text-gray-800 border-2 border-gray-300 rounded-md focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Buttons */}
              <div className="flex flex-col items-center justify-around w-full gap-2 mx-auto sm:flex-row">
                <Button
                  type="submit"
                  text="Save"
                  className="w-full text-white bg-green-500 rounded cursor-pointer hover:bg-green-600"
                />
                <Button
                  text="Close"
                  className="w-full text-white bg-orange-500 rounded cursor-pointer hover:bg-orange-600"
                  onClick={() => navigate(-1)}
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
