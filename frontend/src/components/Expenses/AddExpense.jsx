import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import LoadingScreen from "../../Loading";
import { BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt } from "react-icons/fa";

function AddExpense() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id"); // if present, we're in edit mode

  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  // Dropdown data
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  // Expense form data
  const [expenseData, setExpenseData] = useState({
    date: "",
    referenceNo: "",
    category: "",
    expenseFor: "",
    paymentType: "",
    account: "",
    amount: "",
    inOut: "Out", // Default to Out for backward compatibility
    note: "",
    status: "Active",
  });

  // Fetch dropdown data on mount
  useEffect(() => {
    fetchExpenseCategories();
    fetchPaymentTypes();
    fetchAccounts();
  }, []);

  const fetchExpenseCategories = async () => {
    try {
      const res = await axios.get("api/expense-categories", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setExpenseCategories(Array.isArray(res.data) ? res.data : (res.data.data || []));
    } catch (error) {
      console.error("Error fetching expense categories:", error.message);
    }
  };

  const fetchPaymentTypes = async () => {
    try {
      const res = await axios.get("api/payment-types", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      // Filter for Cash or Bank payment types
      const filteredPaymentTypes = (res.data.data || []).filter(
        (pt) => pt.paymentTypeName.toLowerCase() === "cash" || pt.paymentTypeName.toLowerCase() === "bank"
      );
      setPaymentTypes(filteredPaymentTypes);
    } catch (error) {
      console.error("Error fetching payment types:", error.message);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await axios.get("api/accounts", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setAccounts(res.data.data || []);
    } catch (error) {
      console.error("Error fetching accounts:", error.message);
    }
  };

  // If editing, fetch expense details
  useEffect(() => {
    if (id) {
      const fetchExpense = async () => {
        setLoading(true);
        try {
          const res = await axios.get(`api/expenses/${id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          });
          const data = res.data.data;
          setExpenseData({
            date: data.date ? data.date.split("T")[0] : "",
            referenceNo: data.referenceNo || "",
            category: data.category?._id || "",
            expenseFor: data.expenseFor || "",
            paymentType: data.paymentType?._id || "",
            account: data.account?._id || "",
            amount: data.amount || "",
            inOut: data.inOut || "Out", // Handle legacy expenses without inOut
            note: data.note || "",
            status: data.status || "Active",
          });
        } catch (error) {
          console.error("Error fetching expense:", error.message);
          alert("Error fetching expense: " + error.message);
        } finally {
          setLoading(false);
        }
      };
      fetchExpense();
    }
  }, [id]);

  // Handle form field changes
  const handleChange = (e) => {
    setExpenseData({ ...expenseData, [e.target.name]: e.target.value });
  };

  // Submit the expense form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Validate required fields
      if (!expenseData.account) {
        throw new Error("Account is required");
      }
      if (parseFloat(expenseData.amount) <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      // Prepare payload and remove empty strings for optional fields
      const expensePayload = { ...expenseData };
      if (expensePayload.category === "") delete expensePayload.category;
      if (expensePayload.referenceNo === "") delete expensePayload.referenceNo;
      if (expensePayload.expenseFor === "") delete expensePayload.expenseFor;
      if (expensePayload.note === "") delete expensePayload.note;

      if (id) {
        // Update expense
        await axios.put(`api/expenses/${id}`, expensePayload, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        alert("Transaction updated successfully!");
      } else {
        // Create new expense
        await axios.post("api/expenses", expensePayload, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        alert("Transaction created successfully!");
      }
      navigate("/expense-list");
    } catch (error) {
      console.error("Error submitting expense:", error.message);
      alert("Error submitting expense: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Close the form without saving
  const handleClose = () => {
    navigate("/expense-list");
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Navbar */}
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      {/* Main layout: Sidebar & Content */}
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <div className={`flex-grow p-4 transition-all duration-300`}>
          {/* Header with Breadcrumbs */}
          <header className="flex flex-col items-center justify-between p-4 mb-1 bg-white rounded-md shadow sm:flex-row">
            <div className="flex items-baseline gap-2 sm:flex-row">
              <h1 className="text-xl font-semibold text-gray-800">
                {id ? "Edit Transaction" : "Add Transaction"}
              </h1>
              <span className="text-sm text-gray-600">
                {id ? "Edit Transaction" : "Add Transaction"}
              </span>
            </div>
            <nav className="flex items-center text-sm text-gray-500">
              <a href="/dashboard" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                <FaTachometerAlt className="mr-2" /> Home
              </a>
              <BiChevronRight className="mx-2" />
              <a href="/expense-list" className="text-gray-700 no-underline hover:text-cyan-600">
                Transaction List
              </a>
            </nav>
          </header>
          {/* Form Container */}
          <div className="p-4 bg-white border-t-4 rounded-md shadow-md border-cyan-500">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* In/Out Selector */}
                <div>
                  <label className="block mb-1 font-semibold">Transaction Type</label>
                  <select
                    name="inOut"
                    value={expenseData.inOut}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="Out">Expense (Out)</option>
                    <option value="In">Income (In)</option>
                  </select>
                </div>
                {/* Expense Date */}
                <div>
                  <label className="block mb-1 font-semibold">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={expenseData.date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                {/* Category */}
                <div>
                  <label className="block mb-1 font-semibold">Category</label>
                  <select
                    name="category"
                    value={expenseData.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Category</option>
                    {expenseCategories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.categoryName}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Payment Type */}
                <div>
                  <label className="block mb-1 font-semibold">Payment Type</label>
                  <select
                    name="paymentType"
                    value={expenseData.paymentType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select</option>
                    {paymentTypes.map((pt) => (
                      <option key={pt._id} value={pt._id}>
                        {pt.paymentTypeName}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Account */}
                <div>
                  <label className="block mb-1 font-semibold">Account</label>
                  <select
                    name="account"
                    value={expenseData.account}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select Account</option>
                    {accounts.map((acc) => (
                      <option key={acc._id} value={acc._id}>
                        {acc.accountName}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Reference No */}
                <div>
                  <label className="block mb-1 font-semibold">Reference No.</label>
                  <input
                    type="text"
                    name="referenceNo"
                    value={expenseData.referenceNo}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                {/* Expense For */}
                <div>
                  <label className="block mb-1 font-semibold">Purpose</label>
                  <input
                    type="text"
                    name="expenseFor"
                    value={expenseData.expenseFor}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                {/* Amount */}
                <div>
                  <label className="block mb-1 font-semibold">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    value={expenseData.amount}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                {/* Note */}
                <div>
                  <label className="block mb-1 font-semibold">Note</label>
                  <textarea
                    name="note"
                    rows="2"
                    value={expenseData.note}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              {/* Form Buttons */}
              <div className="flex justify-end mt-4 space-x-2">
                <button
                  type="submit"
                  className="px-6 py-2 font-semibold text-white bg-green-500 rounded-md shadow hover:bg-green-600"
                >
                  {id ? "Update Transaction" : "Save"}
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

export default AddExpense;