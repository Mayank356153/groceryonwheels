import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";
import LoadingScreen from "../../Loading";

function AddSubscription() {
  const navigate = useNavigate();
  // Use useParams() to extract the subscription id from the route.
  const { id: subscriptionId } = useParams();
  // Still use searchParams for storeId.
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get("storeId"); 

  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  // Dropdown options for package name (used in the Package Name dropdown)
  const packageTypeOptions = [
    { label: "Free", value: "free" },
    { label: "Regular", value: "regular" },
    { label: "Ultimate", value: "ultimate" },
  ];

  // Dropdown options for monthly price presets (we use the backend field "category" to store this numeric value)
  const monthlyPriceOptions = [
    { label: "250 Monthly", value: 250 },
    { label: "2000 Annually", value: 2000 },
  ];

  // Dropdown options for package count (duration in months)
  const productCountOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  // Payment types will be fetched from the API.
  const [paymentTypes, setPaymentTypes] = useState([]);
  const paymentTypePlaceholder = { label: "Select Payment Type", value: "" };

  // Initial form state.
  // Note:
  // • "store" will be set automatically from the query parameter.
  // • "packageName" holds the chosen package option.
  // • "category" holds the numeric monthly price.
  const [formData, setFormData] = useState({
    store: "",
    packageName: "", 
    category: "",
    productCount: "1",
    description: "",
    total: 0,
    paymentType: "",
    status: "active",
    startDate: "",
    endDate: ""
  });

  // Set the store from query params if available.
  useEffect(() => {
    if (storeId) {
      setFormData(prev => ({ ...prev, store: storeId }));
    }
  }, [storeId]);

  // Fetch Payment Types from the API.
  useEffect(() => {
    const fetchPaymentTypes = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("api/payment-types", {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Assuming API returns an array of payment type objects under res.data.data
        setPaymentTypes(res.data.data || []);
      } catch (error) {
        console.error("Error fetching payment types:", error.message);
      }
    };
    fetchPaymentTypes();
  }, []);

  // Automatically recalculate total whenever the monthly price (stored in "category") or product count changes.
  useEffect(() => {
    const price = parseFloat(formData.category) || 0;
    const count = parseInt(formData.productCount, 10) || 0;
    setFormData(prev => ({ ...prev, total: price * count }));
  }, [formData.category, formData.productCount]);

  // If editing, fetch the existing subscription details.
  useEffect(() => {
    if (subscriptionId) {
      fetchSubscription(subscriptionId);
    }
  }, [subscriptionId]);

  const fetchSubscription = async (id) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`api/subscriptions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data.data;
      setFormData({
        // If store is an object, use its _id; otherwise, use it as-is.
        store: data.store && typeof data.store === "object" ? data.store._id : data.store || "",
        packageName: data.packageName || "",
        category: data.category || "",
        productCount: data.productCount ? data.productCount.toString() : "1",
        description: data.description || "",
        total: data.total || 0,
        paymentType: data.paymentType?._id ||  data.paymentType || "",
        status: data.status || "active",
        startDate: data.startDate ? data.startDate.split("T")[0] : "",
        endDate: data.endDate ? data.endDate.split("T")[0] : ""
      });
    } catch (error) {
      console.error("Error fetching subscription:", error.message);
      alert("Error fetching subscription data.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const payload = { ...formData };

      if (subscriptionId) {
        // Update existing subscription.
       const response= await axios.put(`api/subscriptions/${subscriptionId}`, payload, { headers });
        alert("Subscription updated successfully!");
        console.log(response.data)
      } else {
        // Create new subscription.
        await axios.post("api/subscriptions", payload, { headers });
        alert("Subscription created successfully!");
      }
      // Navigate back to the subscription list while preserving the storeId in the URL.
      navigate(`/subscription-list?storeId=${storeId}`);
    } catch (error) {
      console.error("Error submitting subscription:", error.message);
      alert("Error submitting subscription.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col bg-gray-100">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <div>
          
        <Sidebar isSidebarOpen={isSidebarOpen} />
        </div>
        <div className={`flex-grow p-6  transition-all duration-300 w-full`}>
          <header className="flex flex-col items-center justify-between mb-6 md:flex-row">
            <h2 className="text-2xl font-bold">
              {subscriptionId ? "Edit Subscription" : "Add Subscription"}
            </h2>
            <nav className="flex items-center text-sm text-gray-500">
              <a href="/dashboard" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                <i className="mr-2 fas fa-tachometer-alt"></i> Home
              </a>
              <span className="mx-2">/</span>
              <a href={`/subscription-list?storeId=${storeId}`} className="text-gray-700 no-underline hover:text-cyan-600">
                Subscription List
              </a>
            </nav>
          </header>

          <div className="p-6 bg-white rounded shadow-md ">
            <form onSubmit={handleSubmit}>
              {/* Package Name as a Dropdown for Package Option */}
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Package Name</label>
                <select
                  name="packageName"
                  value={formData.packageName}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                >
                  <option value="">Select Package</option>
                  {packageTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Monthly Price Dropdown */}
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Monthly Price</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                >
                  <option value="">Select Price</option>
                  {monthlyPriceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Package Count Dropdown (Duration in months) */}
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Package Count (months)</label>
                <select
                  name="productCount"
                  value={formData.productCount}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                >
                  {productCountOptions.map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>

              {/* Total Amount (Calculated Automatically) */}
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Total</label>
                <input
                  type="number"
                  name="total"
                  value={formData.total}
                  readOnly
                  className="w-full p-2 bg-gray-100 border border-gray-300 rounded"
                />
              </div>

              {/* Payment Type Dropdown (Populated from API) */}
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Payment Type</label>
                <select
                  name="paymentType"
                  value={formData.paymentType || formData.paymentType?._id}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                >
                  <option value="">{paymentTypePlaceholder.label}</option>
                  {paymentTypes.map((pt) => (
                    <option key={pt._id} value={pt._id}>
                      {pt.paymentTypeName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subscription Status */}
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Subscription Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              {/* Start Date */}
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>

              {/* End Date */}
              <div className="mb-4">
                <label className="block mb-2 font-semibold">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className="w-full p-2 border border-gray-300 rounded"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="submit"
                  className="px-4 py-2 text-white transition-colors bg-green-500 rounded hover:bg-green-600"
                >
                  {subscriptionId ? "Update Subscription" : "Create Subscription"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/subscription-list?storeId=" + storeId)}
                  className="px-4 py-2 text-white bg-orange-500 rounded hover:bg-orange-600"
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

export default AddSubscription;
