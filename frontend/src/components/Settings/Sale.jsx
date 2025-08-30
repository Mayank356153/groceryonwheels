import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt, FaBars, FaList, FaUsers, FaBox, FaFileInvoice, FaWindowMaximize } from "react-icons/fa";
import { MdOutlineDashboard } from "react-icons/md";
import Navbar from "../Navbar.jsx";    // Adjust the path as needed
import Sidebar from "../Sidebar.jsx";

const PosSettingsPage = () => {
  // Sidebar and Tab States
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("sales"); // Default to Sales tab
 useEffect(()=>{
      if(window.innerWidth < 768){
        setSidebarOpen(false)
      }
    },[])
  // POS Settings state (the form fields)
  const [settings, setSettings] = useState({
    defaultAccount: "",
    defaultSaleDiscount: 0,
    posInvoiceFormat: "Default",
    showWHColumnsOnPOSInvoice: false,
    showPaidAmountAndChangeReturnOnInvoice: false,
    invoiceFooterText: "",
    invoiceTermsAndConditions: "",
  });
  // Accounts for Default Account dropdown
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Other state for Navbar, Sidebar, etc.
  const navigate = useNavigate();

  // ------------------- Data Fetching -------------------
  // Fetch accounts for default account dropdown
  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("api/accounts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      setAccounts(data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  // Fetch current POS settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("api/pos-settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSettings(response.data);
    } catch (error) {
      console.error("Error fetching POS settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        "api/pos-settings",
        settings,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Settings updated successfully!");
      setSettings(response.data);
    } catch (error) {
      console.error("Error updating settings:", error);
      alert("Failed to update settings");
    }
  };

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex flex-grow">
        {/* Sidebar */}
        <Sidebar isSidebarOpen={isSidebarOpen} />

        {/* Main Content */}
        <div className={`flex-grow  p-4 transition-all duration-300 w-full`}>
          {/* Header & Breadcrumbs */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-semibold text-black">Store</h4>
              <nav className="flex items-center text-sm text-gray-500">
                <Link to="/dashboard" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                  <FaTachometerAlt className="mr-2" /> Home
                </Link>
                <BiChevronRight className="mx-1" />
                <span className="text-gray-700">Accounts List</span>
                <BiChevronRight className="mx-1" />
                <span className="text-gray-700">Accounts</span>
              </nav>
            </div>
            <div className="my-2 border-b"></div>
            {/* Tab Navigation */}
            <nav className="flex gap-2 ">
              <a href="/store" className="text-sm font-semibold no-underline hover:text-cyan-500">Store</a>
              
              <a href="/pos-settings" className="text-sm font-semibold no-underline hover:text-cyan-500">Sales</a>
              
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-4 bg-white border rounded shadow-md">
            {activeTab === "sales" ? (
              <div>
                <h3 className="mb-4 text-lg font-bold">Sales Settings</h3>
                {loading ? (
                  <p>Loading sales settings...</p>
                ) : (
                  <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
                    {/* Default Account */}
                    <div>
                      <label className="block mb-1 text-sm">Default Account</label>
                      <select
                        name="defaultAccount"
                        value={settings.defaultAccount || ""}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                      >
                        <option value="">Select an Account</option>
                        {accounts.map((acc) => (
                          <option key={acc._id} value={acc._id}>
                            {acc.accountName}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* Default Sale Discount */}
                    <div>
                      <label className="block mb-1 text-sm">Default Sale Discount (%)</label>
                      <input
                        type="number"
                        name="defaultSaleDiscount"
                        value={settings.defaultSaleDiscount}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    {/* POS Invoice Format */}
                    <div>
                      <label className="block mb-1 text-sm">POS Invoice Format</label>
                      <input
                        type="text"
                        name="posInvoiceFormat"
                        value={settings.posInvoiceFormat}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    {/* Show W/H Columns */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="showWHColumnsOnPOSInvoice"
                        checked={settings.showWHColumnsOnPOSInvoice}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <label className="text-sm">Show W/H Columns on POS Invoice</label>
                    </div>
                    {/* Show Paid Amount & Change Return */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="showPaidAmountAndChangeReturnOnInvoice"
                        checked={settings.showPaidAmountAndChangeReturnOnInvoice}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <label className="text-sm">Show Paid Amount & Change Return on Invoice</label>
                    </div>
                    {/* Invoice Footer Text */}
                    <div>
                      <label className="block mb-1 text-sm">Invoice Footer Text</label>
                      <textarea
                        name="invoiceFooterText"
                        value={settings.invoiceFooterText}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    {/* Invoice Terms & Conditions */}
                    <div>
                      <label className="block mb-1 text-sm">Invoice Terms & Conditions</label>
                      <textarea
                        name="invoiceTermsAndConditions"
                        value={settings.invoiceTermsAndConditions}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    {/* Form Actions */}
                    <div className="flex justify-end gap-4">
                      <button type="submit" className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700">
                        Update
                      </button>
                      <button type="button" on={() => navigate("/dashboard")} className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600">
                        Close
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div>
                <h3 className="mb-2 text-lg font-bold">
                  {activeTab === "store"
                    ? "Store Settings"
                    : activeTab === "system"
                    ? "System Settings"
                    : "Prefixes Settings"}
                </h3>
                <p className="text-sm text-gray-600">
                  {activeTab === "store"
                    ? "Store settings content goes here..."
                    : activeTab === "system"
                    ? "System settings content goes here..."
                    : "Prefixes settings content goes here..."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PosSettingsPage;
