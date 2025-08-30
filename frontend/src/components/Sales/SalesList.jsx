import React, { useEffect, useState, useRef } from "react";
import { ShoppingBagIcon, CashIcon } from "@heroicons/react/outline";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoneyBill, faBuilding } from "@fortawesome/free-solid-svg-icons";
import { FaDollarSign, FaTachometerAlt } from 'react-icons/fa';
import { BiChevronRight } from 'react-icons/bi';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { jsPDF } from "jspdf";
import Select from 'react-select';
import axios from 'axios';
import LoadingScreen from "../../Loading";

const PurchaseOverview = () => {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState([]);
  const [warehouse, setWarehouse] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [salesList, setSalesList] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [paidPayment, setPaidPayment] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionMenu, setActionMenu] = useState(null);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [editPaymentModal, setEditPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [newPaymentType, setNewPaymentType] = useState(null);
  const [cashSalesTotal, setCashSalesTotal] = useState(0);
  const [bankSalesTotal, setBankSalesTotal] = useState(0);
  const dropdownRef = useRef(null);
  const buttonRef = useRef({});

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (actionMenu && dropdownRef.current && buttonRef.current[actionMenu]) {
      const dropdown = dropdownRef.current;
      const button = buttonRef.current[actionMenu];
      const buttonRect = button.getBoundingClientRect();
      const dropdownRect = dropdown.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;

      // Position dropdown fixed, to the left and slightly above
      const offsetAbove = 10; // Slight upward offset
      const offsetLeft = buttonRect.width + 5; // Space from button
      let topPosition = buttonRect.top + window.scrollY - offsetAbove;
      let leftPosition = buttonRect.left + window.scrollX - dropdownRect.width - offsetLeft;

      // Prevent dropdown from overflowing top
      if (topPosition < window.scrollY) {
        topPosition = buttonRect.bottom + window.scrollY + 5;
      }
      // Prevent dropdown from overflowing bottom
      if (topPosition + dropdownRect.height > window.scrollY + windowHeight) {
        topPosition = buttonRect.top + window.scrollY - dropdownRect.height - offsetAbove;
      }
      // Prevent dropdown from overflowing left
      if (leftPosition < 0) {
        leftPosition = buttonRect.right + window.scrollX + 5;
      }

      dropdown.style.position = 'fixed';
      dropdown.style.top = `${topPosition}px`;
      dropdown.style.left = `${leftPosition}px`;
      dropdown.style.right = 'auto';
      dropdown.style.bottom = 'auto';
    }
  }, [actionMenu]);

  const fetchPaymentTypes = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found for payment types");
      return;
    }
    try {
      const response = await axios.get("api/payment-types", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.data) {
        const formattedPaymentTypes = response.data.data.map(pt => ({
          label: pt.paymentTypeName,
          value: pt._id,
        }));
        setPaymentTypes(formattedPaymentTypes);
        console.log("Fetched payment types:", formattedPaymentTypes);
      }
    } catch (error) {
      console.error("Error fetching payment types:", error.message);
      alert(`Failed to load payment types: ${error.message}`);
    }
  };

  const handleViewSales = (inv) => {
    navigate(`/view-sale?id=${inv._id}&source=${inv.source}`);
  };

  const handleEdit = (inv) => {
    const created = new Date(inv.saleDate);
    const now = new Date();
    console.log("created",created)
    console.log("now",now)
    const diffDays = (now - created) / (1000*60*60*24);
    console.log("difference",diffDays)
    if (diffDays > 2) {
      return alert("You can only edit invoices up to 7 days old.");
    }
    if (inv.source === "Sale") {
      navigate(`/add-sale?id=${inv._id}`);
    } else {
      navigate(`/pos?id=${inv._id}`);
    }
  };

  {/*const handleEditPaymentType = (inv) => {
    const saleDate = new Date(inv.saleDate).toISOString().slice(0, 10);
    if (saleDate !== today) {
      alert("Editing payment type is only allowed for invoices from today.");
      return;
    }
    setSelectedInvoice(inv);
    setNewPaymentType(null);
    setEditPaymentModal(true);
  };*/}


  const handleEditPaymentType = (inv) => {
  setSelectedInvoice(inv);
  setNewPaymentType(null);
  setEditPaymentModal(true);
};

  const savePaymentType = async () => {
    if (!newPaymentType) {
      alert("Please select a payment type.");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const endpoint = selectedInvoice.source === "Sale"
        ? `api/sales/${selectedInvoice._id}/paymentType`
        : `api/pos/${selectedInvoice._id}/paymentType`;
      await axios.put(endpoint, { paymentType: newPaymentType.value }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Payment type updated successfully!");
      setEditPaymentModal(false);
      setSelectedInvoice(null);
      setNewPaymentType(null);
      await fetchInvoices();
    } catch (error) {
      console.error("Error updating payment type:", error.message);
      alert(`Failed to update payment type: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPayments = (inv) => {
    navigate(`/view-payment?saleId=${inv._id}`);
  };

  const handleReceivePayment = (inv) => {
    navigate(`/receive-payment?invoice=${inv.saleCode}`);
  };

  const handleDownloadPDF = async (inv) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No token found, please log in");
        navigate('/login');
        return;
      }

      const endpoint = inv.source === "Sale" 
        ? `api/sales/${inv._id}` 
        : `api/pos/${inv._id}`;
      const { data } = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const paymentsResponse = await axios.get(`api/payments/${inv._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payments = paymentsResponse.data.payments || [];

      generateInvoicePDF(data, payments, inv.source);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(`Failed to generate PDF: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateInvoicePDF = (invoice, payments, source) => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("Invoice", 14, 20);
    doc.setFontSize(12);
    doc.text(`Invoice #: ${invoice.saleCode || 'N/A'}`, 14, 5);
    doc.text(`Date: ${new Date(invoice.saleDate).toLocaleDateString()}`, 14, 10);
    doc.text(`Source: ${source}`, 14, 15);

    doc.setFontSize(14);
    doc.text("Customer Information", 14, 25);
    doc.setFontSize(12);
    doc.text(`Name: ${invoice.customer?.customerName || 'N/A'}`, 14, 35);
    doc.text(`Mobile: ${invoice.customer?.mobile || 'N/A'}`, 14, 40);
    const addrObj = invoice.customer?.address || {};
    const addrStr = [
      addrObj.street,
      addrObj.city,
      addrObj.state,
      addrObj.zip,
      addrObj.country
    ].filter(part => part).join(', ');
    doc.text(`Address: ${addrStr || 'N/A'}`, 14, 45);

    doc.setFontSize(14);
    doc.text("Items", 14, 55);
    const items = invoice.items || [];
    const itemRows = items.map(item => [
      item.item?.itemName || 'N/A',
      item.quantity || 0,
      `Rs. ${(item.unitPrice || item.price || 0).toFixed(2)}`,
      `Rs. ${(item.discount || 0).toFixed(2)}`,
      `Rs. ${(item.subtotal || ((item.unitPrice || item.price || 0) * (item.quantity || 0) - (item.discount || 0))).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 60,
      head: [['Item Name', 'Quantity', 'Unit Price', 'Discount', 'Subtotal']],
      body: itemRows,
      theme: 'striped',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 123, 255] },
    });

    let finalY = doc.lastAutoTable.finalY || 60;
    doc.setFontSize(12);
    doc.text(`Subtotal: Rs. ${(invoice.subtotal || invoice.totalAmount || 0).toFixed(2)}`, 14, finalY + 5);
    if (invoice.discountOnBill || invoice.totalDiscount) {
      doc.text(`Discount: Rs. ${(invoice.discountOnBill || invoice.totalDiscount || 0).toFixed(2)}`, 14, finalY + 10);
    }
    doc.text(`Grand Total: Rs. ${(invoice.grandTotal || invoice.totalAmount || 0).toFixed(2)}`, 14, finalY + 15);

    if (payments.length > 0) {
      finalY = finalY + 20;
      doc.setFontSize(14);
      doc.text("Payments", 14, finalY);
      const paymentRows = payments.map(payment => [
        new Date(payment.paymentDate).toLocaleDateString(),
        payment.paymentType?.paymentTypeName || 'N/A',
        `Rs. ${(payment.amount || payment.paymentAmount || 0).toFixed(2)}`,
        payment.paymentNote || '-',
      ]);

      autoTable(doc, {
        startY: finalY + 5,
        head: [['Date', 'Payment Type', 'Amount', 'Note']],
        body: paymentRows,
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [0, 123, 255] },
      });

      finalY = doc.lastAutoTable.finalY;
      const totalPaid = payments.reduce((sum, p) => sum + (p.amount || p.paymentAmount || 0), 0);
      doc.setFontSize(12);
      doc.text(`Total Paid: Rs. ${totalPaid.toFixed(2)}`, 14, finalY + 5);
      const dueAmount = (invoice.grandTotal || invoice.totalAmount || 0) - totalPaid;
      doc.text(`Due Amount: Rs. ${dueAmount.toFixed(2)}`, 14, finalY + 10);
    }

    finalY = payments.length > 0 ? finalY + 15 : finalY + 20;
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Thank you for your business!", 14, finalY + 5);
    doc.text("Generated by Grocery on Wheels", 14, finalY + 10);

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  };

  const handlePOSInvoice = (inv) => {
    navigate(`/pos-invoice/${inv._id}`);
  };

  const handleSalesReturn = (inv) => {
    navigate(`/sales-return?saleId=${inv._id}`);
  };

  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  const fetchWarehouses = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found redirecting...");
      return;
    }
    setLoading(true);
    try {
      const isElevated = ["admin", "ca", "saleanalyst"]
  .includes((localStorage.getItem("role") || "").toLowerCase());

const response = await axios.get("api/warehouses", {
  headers: { Authorization: `Bearer ${token}` },
  ...(isElevated ? {} : { params: { scope: "mine" } })
});

      if (response.data.data) {
        const newwarehouse = [
          { label: "All", value: "all" },
          ...response.data.data.map(warehouse => ({
            label: warehouse.warehouseName,
            value: warehouse._id,
          }))
        ];
        setWarehouses(newwarehouse);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found redirecting...");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.get(
        "api/pos/invoices",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSalesList(data);
    } catch (err) {
      alert(`Could not load invoices: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, source) => {
    const conf = window.confirm("Do you want to delete this sale?");
    if (!conf) {
      return;
    }
    setLoading(true);
    try {
      const endpoint = source === "POS" ? `api/pos/${id}` : `api/sales/${id}`;
      await axios.delete(endpoint, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      alert("Deleted Successfully");
    } catch (error) {
      console.error(error.message);
      alert(`Error deleting: ${error.message}`);
    } finally {
      fetchInvoices();
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
    fetchInvoices();
    fetchPaymentTypes();
  }, []);

  useEffect(() => {
    let cash = 0, bank = 0;
    salesList.forEach(inv => {
      const p = inv.payments?.[0];
      const name = p?.paymentType?.paymentTypeName;
      if (name === "Cash") cash += p.amount || p.paymentAmount || 0;
      if (name === "Bank") bank += p.amount || p.paymentAmount || 0;
    });
    setCashSalesTotal(cash);
    setBankSalesTotal(bank);
  }, [salesList]);

 const filteredData = salesList.filter(item => {
  const searchTermLower = searchTerm.toLowerCase();
  const creatorName = item.creatorName?.toLowerCase() || '';

  const customerMatch =
    creatorName.includes(searchTermLower) ||
    (typeof item.customer === 'string'
      ? item.customer.toLowerCase()
      : item.customer?.customerName?.toLowerCase()
    )?.includes(searchTermLower) ||
    item.customer?.mobile?.toLowerCase().includes(searchTermLower) ||
    item.saleCode?.toLowerCase().includes(searchTermLower);

  const createdAtTime = new Date(item.saleDate).getTime();

  let startDateTime = startDate ? new Date(startDate).setHours(0,0,0,0) : 0;
  let endDateTime   = endDate ? new Date(endDate).setHours(23,59,59,999) : Infinity;

  const dateMatch = createdAtTime >= startDateTime && createdAtTime <= endDateTime;
  const warehouseCondition =
    warehouse === "all" || warehouse === "" || item.warehouse?._id === warehouse;

  return (customerMatch && dateMatch) && warehouseCondition;
});


  const totalInvoices = filteredData.length;
  const totalInvoiceAmt = filteredData.reduce((sum, inv) => sum + inv.amount, 0);
  const totalReceivedAmt = filteredData.reduce(
    (sum, inv) =>
      sum +
      (inv.payments?.reduce(
        (pSum, payment) => pSum + (payment.amount || payment.paymentAmount || 0),
        0
      ) || 0),
    0
  );
  const totalSalesDue = totalInvoiceAmt - totalReceivedAmt;

  const handleCopy = () => {
    const data = filteredData
      .map(
        (inv) => {
          const totalPaid = inv.payments?.reduce(
            (sum, payment) => sum + (payment.amount || payment.paymentAmount || 0),
            0
          ) || 0;
          return `${new Date(inv.saleDate).toDateString()}, ${inv.saleCode}, ${
            typeof inv.customer === 'string' ? inv.customer : inv.customer?.customerName || "N/A"
          }, ${inv.amount.toFixed(2)}, ${totalPaid.toFixed(2)}, ${inv.source}`;
        }
      )
      .join('\n');
    navigator.clipboard.writeText(data);
    alert("Data copied to clipboard!");
  };

  const handleExcelDownload = () => {
    const data = filteredData.map(inv => ({
      Date: new Date(inv.saleDate).toDateString(),
      Code: inv.saleCode,
      Customer: typeof inv.customer === 'string' ? inv.customer : inv.customer?.customerName || "N/A",
      Amount: inv.amount.toFixed(2),
      "Amount Paid": (inv.payments?.reduce(
        (sum, payment) => sum + (payment.amount || payment.paymentAmount || 0),
        0
      ) || 0).toFixed(2),
      Source: inv.source
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices");
    XLSX.writeFile(wb, "invoices.xlsx");
  };

  const handlePdfDownload = () => {
    const doc = new jsPDF();
    doc.text("Invoices List", 20, 20);
    const tableData = filteredData.map(inv => [
      new Date(inv.saleDate).toDateString(),
      inv.saleCode,
      typeof inv.customer === 'string' ? inv.customer : inv.customer?.customerName || "N/A",
      inv.amount.toFixed(2),
      (inv.payments?.reduce(
        (sum, payment) => sum + (payment.amount || payment.paymentAmount || 0),
        0
      ) || 0).toFixed(2),
      inv.source,
    ]);

    autoTable(doc, {
      head: [['Date', 'Code', 'Customer', 'Amount', 'Amount Paid', 'Source']],
      body: tableData,
    });

    doc.save("invoice_list.pdf");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCsvDownload = () => {
    const headers = ['Date', 'Code', 'Customer', 'Amount', 'Amount Paid', 'Source'];
    const data = filteredData.map(inv => [
      new Date(inv.saleDate).toDateString(),
      inv.saleCode,
      typeof inv.customer === 'string' ? inv.customer : inv.customer?.customerName || "N/A",
      inv.amount.toFixed(2),
      (inv.payments?.reduce(
        (sum, payment) => sum + (payment.amount || payment.paymentAmount || 0),
        0
      ) || 0).toFixed(2),
      inv.source
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + 
      headers.join(",") + "\n" + 
      data.map(row => row.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "invoices.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const indexOfLastItem = currentPage * entriesPerPage;
  const indexOfFirstItem = indexOfLastItem - entriesPerPage;
  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  const currentUsers = filteredData.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const calculate = () => {
    const total = currentUsers.reduce((sum, inv) => sum + inv.amount, 0);
    const paid = currentUsers.reduce(
      (sum, inv) =>
        sum +
        (inv.payments?.reduce(
          (pSum, payment) => pSum + (payment.amount || payment.paymentAmount || 0),
          0
        ) || 0),
      0
    );
    setGrandTotal(total);
    setPaidPayment(paid);
  };

  useEffect(() => {
    calculate();
  }, [currentUsers]);

  if (loading) return (<LoadingScreen />);

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
              <h1 className="text-lg font-semibold truncate sm:text-xl">Invoices List</h1>
              <span className="text-xs text-gray-600 sm:text-sm">View/Search Invoices</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center text-xs text-gray-500 sm:justify-start sm:text-sm sm:mt-0">
              <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                <FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600" />
                Home
              </NavLink>
              <BiChevronRight className="mx-1 sm:mx-2" />
              <NavLink to="/sales-list" className="text-gray-700 no-underline hover:text-cyan-600">
                Invoices List
              </NavLink>
            </nav>
          </header>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-center text-black bg-white rounded-lg shadow-md">
                <ShoppingBagIcon className="w-16 text-white rounded bg-cyan-500" />
                <div className="flex flex-col justify-center ml-4">
                  <h2 className="text-xl">{totalInvoices}</h2>
                  <p className='font-bold'>Total Invoices</p>
                </div>
              </div>
              <div className="flex items-center text-black bg-white rounded-lg shadow-md">
                <FaDollarSign className='w-16 h-16 text-white rounded bg-cyan-500'/>
                <div className="flex flex-col justify-center ml-4">
                  <h2 className="text-xl">₹{totalInvoiceAmt.toFixed(2)}</h2>
                  <p className='font-bold'>Total Invoices Amount</p>
                </div>
              </div>
              <div className="flex items-center text-black bg-white rounded-lg shadow-md">
                <FontAwesomeIcon icon={faMoneyBill} className="w-16 h-16 text-white rounded bg-cyan-500" />
                <div className="flex flex-col justify-center ml-4">
                  <h2 className="text-xl">₹{totalReceivedAmt.toFixed(2)}</h2>
                  <p className='font-bold'>Total Received Amount</p>
                </div>
              </div>
              <div className="flex items-center text-black bg-white rounded-lg shadow-md">
                <CashIcon className="h-16 text-white rounded bg-cyan-500 w-18" />
                <div className="flex flex-col justify-center ml-4">
                  <h2 className="text-xl">₹{totalSalesDue.toFixed(2)}</h2>
                  <p className='font-bold'>Total Sales Due</p>
                </div>
              </div>
              <div className="flex items-center text-black bg-white rounded-lg shadow-md">
                <FontAwesomeIcon icon={faMoneyBill} className="w-16 h-16 text-white rounded bg-cyan-500" />
                <div className="flex flex-col justify-center ml-4">
                  <h2 className="text-xl">₹{cashSalesTotal.toFixed(2)}</h2>
                  <p className='font-bold'>Cash Sales</p>
                </div>
              </div>
              <div className="flex items-center text-black bg-white rounded-lg shadow-md">
                <FontAwesomeIcon icon={faBuilding} className="w-16 h-16 text-white rounded bg-cyan-500" />
                <div className="flex flex-col justify-center ml-4">
                  <h2 className="text-xl">₹{bankSalesTotal.toFixed(2)}</h2>
                  <p className='font-bold'>Bank Sales</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white shadow-md rounded-md mt-3 border-t-4 border-cyan-500">
            <div className='flex items-center justify-between mb-10'>
              <div></div>
              <div className="flex items-end">
                <button
                  className="w-full px-4 py-2 text-white rounded-md bg-cyan-500 hover:bg-cyan-600"
                  onClick={() => navigate('/add-sale')}
                >
                  + Create Invoice
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block font-semibold text-gray-700">
                  Warehouse <span className="text-red-500">*</span>
                </label>
                <Select
                  options={warehouses}
                  onChange={(selectedoption) => setWarehouse(selectedoption.value)}
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700">Customers</label>
                <input
                  type="text"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search Name/Mobile"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700">Users</label>
                <select className="w-full p-2 border rounded-md">
                  <option>All</option>
                  <option>Admin</option>
                  <option>Manager</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
              <div>
                <label className="block font-semibold text-gray-700">From Date</label>
                <div className="flex items-center p-2 border rounded-md">
                  <span className="mr-2">📅</span>
                  <input
                    type="date"
                    className="w-full outline-none"
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-gray-700">To Date</label>
                <div className="flex items-center p-2 border rounded-md">
                  <span className="mr-2">📅</span>
                  <input
                    type="date"
                    className="w-full outline-none"
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-between mt-4 mb-4 space-y-2 md:flex-row md:space-y-0 md:items-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm">Show</span>
              <select
                className="p-2 text-sm border border-gray-300 rounded-md"
                value={entriesPerPage}
                onChange={handleEntriesChange}
              >
                <option>10</option>
                <option>20</option>
                <option>50</option>
                <option>100</option>
                <option>200</option>
                <option>500</option>
                <option>1000</option>
              </select>
              <span className="text-sm">Entries</span>
            </div>
            <div className="flex flex-col gap-2 md:flex-row">
              <div className='flex items-center justify-between flex-1 gap-2'>
                <button onClick={handleCopy} className="px-3 py-2 text-sm text-white bg-cyan-500">Copy</button>
                <button onClick={handleExcelDownload} className="px-3 py-2 text-sm text-white bg-cyan-500">Excel</button>
                <button onClick={handlePdfDownload} className="px-3 py-2 text-sm text-white bg-cyan-500">PDF</button>
                <button onClick={handlePrint} className="px-3 py-2 text-sm text-white bg-cyan-500">Print</button>
                <button onClick={handleCsvDownload} className="px-3 py-2 text-sm text-white bg-cyan-500">CSV</button>
              </div>
              <input
                type="text"
                placeholder="Search"
                className="w-full p-2 text-sm border border-gray-300"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300 shadow-sm">
              <thead className="bg-gray-200">
                <tr>
                  {[
                    'Date', 'Code', 'Customer', 'Amount', 'Amount Paid', 'Source', 'Creator', 'Payment Method', 'Action'
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-4 py-2 text-sm font-medium text-left border"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentUsers.length <= 0 ? (
                  <tr>
                    <td colSpan="8" className="p-4 text-center text-gray-500 border">
                      No data available in table
                    </td>
                  </tr>
                ) : (
                  currentUsers.map((inv) => {
                    const totalPaid = inv.payments?.reduce(
                      (sum, payment) => sum + (payment.amount || payment.paymentAmount || 0),
                      0
                    ) || 0;
                    const paymentMethod = inv.payments?.[0]?.paymentType?.paymentTypeName || 'Hold';
                    const isHold = inv.status === 'OnHold';
                    const isMultiple = inv.payments?.length > 1;
                    const method = isHold ? 'Hold' : isMultiple ? 'Multiple' : paymentMethod;

                    return (
                      <tr className="bg-gray-100" key={inv._id}>
                        <td className="border px-2 py-1">
                          {new Date(inv.saleDate).toLocaleDateString()}
                        </td>
                        <td className="border px-2 py-1">{inv.saleCode}</td>
                        <td className="border px-2 py-1">
                          {typeof inv.customer === 'string' ? inv.customer : inv.customer?.customerName || "N/A"}
                        </td>
                        <td className="border px-2 py-1">₹{inv.amount.toFixed(2)}</td>
                        <td className="border px-2 py-1">₹{totalPaid.toFixed(2)}</td>
                        <td className="border px-2 py-1">{inv.source}</td>
                        <td className="border px-2 py-1">
  {inv.creatorName || '—'}
</td>
                        <td className="border px-2 py-1">
                          <span
                            className={`inline-block px-2 py-1 text-xs font-semibold rounded 
                              ${method === 'Cash' ? 'bg-green-100 text-green-800' 
                              : method === 'Bank' ? 'bg-blue-100 text-blue-800' 
                              : method === 'Hold' ? 'bg-yellow-100 text-yellow-800' 
                              : method === 'Multiple' ? 'bg-purple-100 text-purple-800' 
                              : 'bg-red-100 text-red-800'}`}
                          >
                            {method}
                          </span>
                        </td>
                        <td className="relative p-2 border">
                          <button
                            ref={(el) => (buttonRef.current[inv._id] = el)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-full shadow-sm 
                              hover:bg-cyan-700 active:scale-95 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-400`}
                            onClick={() => {
                              if (actionMenu === inv._id) setActionMenu(null);
                              else setActionMenu(inv._id);
                            }}
                          >
                            <span>Action</span>
                            <svg
                              className={`w-4 h-4 transition-transform duration-200 ${
                                actionMenu === inv._id ? "rotate-180" : ""
                              }`}
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {actionMenu === inv._id && (
  <div
    ref={dropdownRef}
    className="z-50 bg-white border border-gray-200 shadow-xl rounded-lg w-48 transition-all duration-200 ease-in-out transform scale-100 opacity-100 animate-dropdown-open"
    style={{ minWidth: '150px', maxHeight: '300px', overflowY: 'auto' }}
  >
                              <button
                                className="w-full px-3 py-2 text-left text-blue-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                onClick={() => handleViewSales(inv)}
                              >
                                📄 View Sales
                              </button>
                              <button
                                className="w-full px-3 py-2 text-left text-green-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                onClick={() => handleEdit(inv)}
                              >
                                ✏️ Edit
                              </button>
                              <button
                                className="w-full px-3 py-2 text-left text-teal-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                onClick={() => handleEditPaymentType(inv)}
                              >
                                💵 Edit Payment Type
                              </button>
                              <button
                                className="w-full px-3 py-2 text-left text-purple-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                onClick={() => handleViewPayments(inv)}
                              >
                                💳 View Payments
                              </button>
                              <button
                                className="w-full px-3 py-2 text-left text-indigo-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                onClick={() => handleDownloadPDF(inv)}
                              >
                                📥 PDF
                              </button>
                              <button
                                className="w-full px-3 py-2 text-left text-red-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                onClick={() => handleDelete(inv._id, inv.source)}
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
                {currentUsers.length > 0 && (
                  <tr className="font-bold bg-gray-100">
                    <td colSpan="3" className="text-right border">Total :</td>
                    <td className="text-center border">{grandTotal.toFixed(2)}</td>
                    <td className="text-center border">
                      {currentUsers
                        .reduce(
                          (sum, inv) =>
                            sum +
                            (inv.payments?.reduce(
                              (pSum, payment) => pSum + (payment.amount || payment.paymentAmount || 0),
                              0
                            ) || 0),
                          0
                        )
                        .toFixed(2)}
                    </td>
                    <td className="text-center border"></td>
                    <td className="text-center border"></td>
                    <td className="text-center border"></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col items-start justify-between gap-2 p-2 md:justify-between md:flex-row">
            <span>
              <span>Showing {entriesPerPage * (currentPage - 1) + 1} to {Math.min(entriesPerPage * currentPage, filteredData.length)} of {filteredData.length} entries</span>
            </span>
            <div className='flex justify-between w-full md:w-auto md:gap-2'>
              <button
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 shadow-md 
                  ${currentPage === 1 
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                    : "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"}`}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              <button
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 shadow-md 
                  ${currentPage === totalPages 
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                    : "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"}`}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          {editPaymentModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-lg font-semibold mb-4">Edit Payment Type</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Invoice: {selectedInvoice.saleCode} ({selectedInvoice.source})
                </p>
                <label className="block font-semibold text-gray-700 mb-2">
                  Select Payment Type
                </label>
                <Select
                  options={paymentTypes}
                  value={newPaymentType}
                  onChange={setNewPaymentType}
                  placeholder="Choose payment type"
                  className="mb-4"
                />
                <div className="flex justify-end gap-2">
                  <button
                    className="px-4 py-2 text-sm text-gray-600 bg-gray-200 rounded hover:bg-gray-300"
                    onClick={() => {
                      setEditPaymentModal(false);
                      setSelectedInvoice(null);
                      setNewPaymentType(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 text-sm text-white bg-cyan-500 rounded hover:bg-cyan-600"
                    onClick={savePaymentType}
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes dropdown-open {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-dropdown-open {
          animation: dropdown-open 0.2s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
};

export default PurchaseOverview;