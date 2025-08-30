import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import axios from "axios";

function AddPaymentType() {
  const navigate = useNavigate();
  const { paymentTypeId } = useParams(); // if present, we are editing

  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
 useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[])
  const [formData, setFormData] = useState({
    paymentTypeName: "",
    status: "active",
  });

  // If editing, fetch the existing record
  useEffect(() => {
    if (paymentTypeId) {
      fetchPaymentType(paymentTypeId);
    }
  }, [paymentTypeId]);

  const fetchPaymentType = async (id) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `api/payment-types/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = res.data.data;
      setFormData({
        paymentTypeName: data.paymentTypeName || "",
        status: data.status || "active",
      });
    } catch (error) {
      console.error("Error fetching payment type:", error.message);
      alert("Error fetching payment type data.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      if (paymentTypeId) {
        // Update existing
        await axios.put(
          `api/payment-types/${paymentTypeId}`,
          formData,
          { headers }
        );
        alert("Payment Type updated successfully!");
      } else {
        // Create new
        await axios.post(
          "api/payment-types",
          formData,
          { headers }
        );
        alert("Payment Type created successfully!");
      }
      navigate("/payment-types-list"); // your list route
    } catch (error) {
      console.error("Error submitting payment type:", error.message);
      alert("Error submitting payment type.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate("/payment-types-list");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <div
          className={`flex-grow p-4 mt-24 transition-all duration-300 ${
            isSidebarOpen ? "ml-64" : "ml-0"
          }`}
        >
          <h1 className="mb-4 text-2xl font-bold">
            {paymentTypeId ? "Edit Payment Type" : "Add Payment Type"}
          </h1>
          <div className="max-w-lg p-6 bg-white rounded shadow-md">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block mb-1 font-semibold">Payment Type Name</label>
                <input
                  type="text"
                  name="paymentTypeName"
                  value={formData.paymentTypeName}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-green-500 rounded hover:bg-green-600"
                  disabled={loading}
                >
                  {paymentTypeId ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
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

export default AddPaymentType;
