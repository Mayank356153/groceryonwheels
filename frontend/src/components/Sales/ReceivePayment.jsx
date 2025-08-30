import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import LoadingScreen from "../../Loading";

const ReceivePayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const saleId = queryParams.get('id'); // Changed from 'invoice' to 'id' for consistency

  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState({
    customer: '',
    saleCode: '',
    totalAmount: 0,
    totalPaid: 0,
    dueAmount: 0
  });
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    paymentType: '',
    amount: '',
    account: '',
    paymentNote: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
    if (!saleId) {
      alert("Invalid sale ID");
      navigate('/sales-list');
      return;
    }
    fetchData();
  }, [saleId, navigate]);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("No token found, please log in");
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      // Fetch invoice details
      const invoicesResponse = await axios.get(`api/pos/invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Log the saleId and invoices response for debugging
      console.log("Sale ID:", saleId);
      console.log("Invoices Response:", invoicesResponse.data);

      // Try matching by _id first
      let matchingInvoice = invoicesResponse.data.find(invoice => invoice._id.toString() === saleId);

      // Fallback: Try matching by saleCode if _id doesn't match
      if (!matchingInvoice) {
        matchingInvoice = invoicesResponse.data.find(invoice => invoice.saleCode === saleId);
      }

      if (!matchingInvoice) {
        throw new Error(`Invoice not found for Sale ID or Sale Code: ${saleId}`);
      }

      // Fetch existing payments
      const paymentsResponse = await axios.get(`api/payments/${matchingInvoice._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch payment types
      const paymentTypesResponse = await axios.get(`api/paymenttypes`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch accounts (optional)
      let accountsData = [];
      try {
        const accountsResponse = await axios.get(`api/accounts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        accountsData = accountsResponse.data;
      } catch (err) {
        console.warn("Accounts endpoint not available, skipping accounts:", err.message);
      }

      const totalPaid = paymentsResponse.data.payments.reduce((sum, payment) => sum + (payment.paymentAmount || 0), 0);
      const totalAmount = matchingInvoice.amount || 0;
      const dueAmount = totalAmount - totalPaid;

      setInvoiceData({
        customer: matchingInvoice.customer?.customerName || "N/A",
        saleCode: matchingInvoice.saleCode || "N/A",
        totalAmount: totalAmount,
        totalPaid: totalPaid,
        dueAmount: dueAmount
      });

      setPaymentTypes(paymentTypesResponse.data || []);
      setAccounts(accountsData);

      if (paymentTypesResponse.data.length > 0) {
        setFormData(prev => ({ ...prev, paymentType: paymentTypesResponse.data[0]._id }));
      }

      if (accountsData.length > 0) {
        setFormData(prev => ({ ...prev, account: accountsData[0]._id }));
      }

      if (dueAmount > 0) {
        setFormData(prev => ({ ...prev, amount: dueAmount.toFixed(2) }));
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      alert(`Could not load invoice details: ${err.message}`);
      navigate('/sales-list');
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
    setError('');

    const token = localStorage.getItem("token");
    if (!token) {
      alert("No token found, please log in");
      navigate('/login');
      return;
    }

    if (!formData.paymentDate) {
      setError("Payment date is required");
      return;
    }
    if (!formData.paymentType) {
      setError("Payment type is required");
      return;
    }
    if (!formData.amount || formData.amount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        saleId: saleId,
        paymentDate: formData.paymentDate,
        paymentType: formData.paymentType,
        amount: parseFloat(formData.amount),
        account: formData.account || undefined,
        paymentNote: formData.paymentNote || undefined
      };

      await axios.post(`api/payments/receive`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Payment received successfully!");
      navigate('/sales-list');
    } catch (err) {
      console.error("Error submitting payment:", err);
      setError(`Failed to submit payment: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="box-border flex min-h-screen">
        <div className="w-auto">
          <Sidebar isSidebarOpen={isSidebarOpen} />
        </div>
        <div className="flex flex-col p-2 md:p-2 w-full mx-auto overflow-x-auto">
          <header className="flex flex-col items-center justify-between px-2 py-2 mb-2 bg-gray-100 rounded-md shadow md:flex-row">
            <div className="flex items-baseline gap-1 text-center sm:flex-row sm:text-left">
              <h1 className="text-lg font-semibold truncate sm:text-xl">
                Receive Payment
              </h1>
              <span className="text-xs text-gray-600 sm:text-sm">
                Payment for Invoice {invoiceData.saleCode}
              </span>
            </div>
          </header>
          <div className="p-4 bg-white shadow-md rounded-md mt-3 border-t-4 border-cyan-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <h3 className="font-semibold text-gray-700">Customer Details</h3>
                <p>{invoiceData.customer}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">Invoice Details</h3>
                <p>Invoice #: {invoiceData.saleCode}</p>
                <p>Grand Total: ₹{invoiceData.totalAmount.toFixed(2)}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">Payment Status</h3>
                <p>Paid Amount: ₹{invoiceData.totalPaid.toFixed(2)}</p>
                <p>Due Amount: ₹{invoiceData.dueAmount.toFixed(2)}</p>
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Payment Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="paymentDate"
                    value={formData.paymentDate}
                    onChange={handleChange}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Payment Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="paymentType"
                    value={formData.paymentType}
                    onChange={handleChange}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                    required
                  >
                    {paymentTypes.length === 0 ? (
                      <option value="">No payment types available</option>
                    ) : (
                      paymentTypes.map(type => (
                        <option key={type._id} value={type._id}>
                          {type.paymentTypeName}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Account (Optional)
                  </label>
                  <select
                    name="account"
                    value={formData.account}
                    onChange={handleChange}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    <option value="">Select Account</option>
                    {accounts.map(account => (
                      <option key={account._id} value={account._id}>
                        {account.accountName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Payment Note (Optional)
                  </label>
                  <textarea
                    name="paymentNote"
                    value={formData.paymentNote}
                    onChange={handleChange}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                    rows="3"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => navigate('/sales-list')}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-cyan-500 rounded-md hover:bg-cyan-600"
                >
                  Submit Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceivePayment;