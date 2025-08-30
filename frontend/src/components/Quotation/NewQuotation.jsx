import React, { useState, useEffect } from 'react';
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import { BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt, FaBarcode } from "react-icons/fa";
import axios from 'axios';
import Select from 'react-select';
import { useNavigate, useParams } from 'react-router-dom';

const QuotationForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isEditing, setIsEditing] = useState(!!id);
  const [warehouses, setWarehouses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    warehouse: null,
    customer: null,
    quotationCode: `QT/${new Date().getFullYear()}/${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
    quotationDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
    referenceNo: "",
    items: [],
    otherCharges: 0,
    discountOnAll: 0,
    note: "",
    subtotal: 0,
    grandTotal: 0,
    status: "Draft"
  });

  useEffect(() => {
    fetchWarehouses();
    fetchCustomers();
    fetchAllItems();
    if (id) {
      fetchQuotation(id);
    }
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, [id]);

  // Warehouse-based item filtering
  useEffect(() => {
    if (formData.warehouse?.value) {
      const filtered = allItems.filter(item =>
        item.warehouse?._id === formData.warehouse.value
      );
      setFilteredItems(filtered);
    }
  }, [formData.warehouse, allItems]);

  const fetchWarehouses = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("api/warehouses", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWarehouses(response.data.data.map(w => ({
        value: w._id,
        label: w.warehouseName
      })));
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("api/customer-data/all", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const customerOptions = response.data.map(c => ({
        value: c._id,
        label: c.customerName
      }));
      setCustomers(customerOptions);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setCustomers([]);
    }
  };

  const fetchAllItems = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("api/items", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllItems(response.data.data);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const fetchQuotation = async (quotationId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`api/quotation/${quotationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const quotation = response.data;
      setFormData({
        warehouse: { value: quotation.warehouse._id, label: quotation.warehouse.warehouseName },
        customer: { value: quotation.customer._id, label: quotation.customer.customerName },
        quotationCode: quotation.quotationCode,
        quotationDate: new Date(quotation.quotationDate).toISOString().split("T")[0],
        expiryDate: quotation.expiryDate ? new Date(quotation.expiryDate).toISOString().split("T")[0] : "",
        referenceNo: quotation.referenceNo,
        items: quotation.items.map(item => ({
          item: item.item._id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          taxAmount: item.taxAmount,
          subtotal: item.subtotal
        })),
        otherCharges: quotation.otherCharges,
        discountOnAll: 0, // Assuming discountOnAll is not stored in backend
        note: quotation.note,
        subtotal: quotation.subtotal,
        grandTotal: quotation.grandTotal,
        status: quotation.status
      });
    } catch (error) {
      console.error("Error fetching quotation:", error);
      alert("Failed to load quotation data");
    }
  };

  const handleAddItem = (selectedOption) => {
    const item = allItems.find(i => i._id === selectedOption.value);
    if (!item) return;

    const newItem = {
      item: item._id,
      quantity: 1,
      unitPrice: item.salesPrice,
      discount: 0,
      taxAmount: item.taxAmount || 0,
      subtotal: item.salesPrice * 1
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
      subtotal: prev.subtotal + newItem.subtotal,
      grandTotal: prev.grandTotal + newItem.subtotal
    }));
  };

  const handleRemoveItem = (index) => {
    const removedItem = formData.items[index];
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
      subtotal: prev.subtotal - removedItem.subtotal,
      grandTotal: prev.grandTotal - removedItem.subtotal
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = formData.items.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };
        updatedItem.subtotal = (updatedItem.unitPrice - updatedItem.discount + updatedItem.taxAmount) * updatedItem.quantity;
        return updatedItem;
      }
      return item;
    });

    const newSubtotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const newGrandTotal = newSubtotal + formData.otherCharges - formData.discountOnAll;

    setFormData(prev => ({
      ...prev,
      items: updatedItems,
      subtotal: newSubtotal,
      grandTotal: newGrandTotal
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      // Validate required fields
      if (!formData.warehouse?.value || !formData.customer?.value || formData.items.length === 0) {
        alert("Please fill all required fields and add items!");
        return;
      }

      // Prepare payload
      const payload = {
        warehouse: formData.warehouse.value,
        customer: formData.customer.value,
        quotationCode: formData.quotationCode,
        quotationDate: formData.quotationDate,
        expiryDate: formData.expiryDate || null,
        referenceNo: formData.referenceNo,
        items: formData.items.map(item => ({
          item: item.item,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discount: Number(item.discount),
          taxAmount: Number(item.taxAmount),
          subtotal: Number(item.subtotal)
        })),
        otherCharges: Number(formData.otherCharges),
        note: formData.note,
        status: formData.status
      };

      if (isEditing) {
        // Update existing quotation
        const response = await axios.put(
          `api/quotation/${id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Quotation updated successfully!");
      } else {
        // Create new quotation
        const response = await axios.post(
          "api/quotation",
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Quotation created successfully!");
      }

      navigate("/quotation-list");
    } catch (error) {
      console.error("Error submitting quotation:", error);
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <div className={`flex-grow mt-24 p-4 ${isSidebarOpen ? "ml-64" : "ml-0"}`}>
          <header className="flex flex-col justify-between p-4 bg-gray-100 rounded sm:flex-row">
            <div>
              <h1 className="text-xl font-semibold">{isEditing ? "Edit Quotation" : "Create Quotation"}</h1>
              <nav className="flex items-center mt-2 text-sm text-gray-600">
                <FaTachometerAlt className="mr-2" />
                <BiChevronRight className="mx-1" />
                <span>{isEditing ? "Edit Quotation" : "New Quotation"}</span>
              </nav>
            </div>
          </header>
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 font-medium">Warehouse *</label>
                  <Select
                    options={warehouses}
                    onChange={selected => setFormData({ ...formData, warehouse: selected })}
                    value={formData.warehouse}
                    isRequired
                    placeholder="Select Warehouse"
                    getOptionLabel={option => option.label}
                    getOptionValue={option => option.value}
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium">Customer *</label>
                  <Select
                    options={customers}
                    onChange={selected => setFormData({ ...formData, customer: selected })}
                    value={formData.customer}
                    isRequired
                    placeholder="Select Customer"
                    getOptionLabel={option => option?.label || ''}
                    getOptionValue={option => option?.value || ''}
                    noOptionsMessage={() => "No customers found"}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 font-medium">Quotation Date</label>
                  <input
                    type="date"
                    value={formData.quotationDate}
                    onChange={e => setFormData({ ...formData, quotationDate: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium">Reference No</label>
                  <input
                    type="text"
                    value={formData.referenceNo}
                    onChange={e => setFormData({ ...formData, referenceNo: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium">Add Items</label>
              <div className="flex gap-2">
                <Select
                  options={filteredItems.map(item => ({
                    value: item._id,
                    label: item.itemName,
                    unitPrice: item.salesPrice
                  }))}
                  onChange={handleAddItem}
                  placeholder={formData.warehouse ? "Search items..." : "Select warehouse first"}
                  className="flex-grow"
                  isDisabled={!formData.warehouse}
                  getOptionLabel={option => option.label}
                  getOptionValue={option => option.value}
                  filterOption={({ data }, query) =>
                    data.label.toLowerCase().includes(query.toLowerCase()) ||
                    (data.barcode && data.barcode.includes(query))
                  }
                />
              </div>
            </div>
            <div className="mb-4 overflow-x-auto">
              <table className="w-full border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">Item</th>
                    <th className="p-2 border">Quantity</th>
                    <th className="p-2 border">Unit Price</th>
                    <th className="p-2 border">Discount</th>
                    <th className="p-2 border">Tax</th>
                    <th className="p-2 border">Total</th>
                    <th className="p-2 border">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => {
                    const itemData = allItems.find(i => i._id === item.item);
                    return (
                      <tr key={index}>
                        <td className="p-2 border">{itemData?.itemName || 'N/A'}</td>
                        <td className="p-2 border">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))}
                            className="w-20 p-1 border rounded"
                            min="1"
                          />
                        </td>
                        <td className="p-2 border">
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={e => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                            className="w-24 p-1 border rounded"
                          />
                        </td>
                        <td className="p-2 border">
                          <input
                            type="number"
                            value={item.discount}
                            onChange={e => handleItemChange(index, 'discount', Number(e.target.value))}
                            className="w-20 p-1 border rounded"
                          />
                        </td>
                        <td className="p-2 border">
                          <input
                            type="number"
                            value={item.taxAmount}
                            onChange={e => handleItemChange(index, 'taxAmount', Number(e.target.value))}
                            className="w-20 p-1 border rounded"
                          />
                        </td>
                        <td className="p-2 border">₹{item.subtotal.toFixed(2)}</td>
                        <td className="p-2 border">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-2">
              <div>
                <label className="block mb-2 font-medium">Note</label>
                <textarea
                  value={formData.note}
                  onChange={e => setFormData({ ...formData, note: e.target.value })}
                  className="w-full p-2 border rounded h-28"
                  placeholder="Add any additional notes..."
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{formData.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Other Charges:</span>
                  <input
                    type="number"
                    value={formData.otherCharges}
                    onChange={e => setFormData({
                      ...formData,
                      otherCharges: Number(e.target.value),
                      grandTotal: formData.subtotal + Number(e.target.value) - formData.discountOnAll
                    })}
                    className="w-32 p-1 border rounded"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span>Discount on All:</span>
                  <input
                    type="number"
                    value={formData.discountOnAll}
                    onChange={e => setFormData({
                      ...formData,
                      discountOnAll: Number(e.target.value),
                      grandTotal: formData.subtotal + formData.otherCharges - Number(e.target.value)
                    })}
                    className="w-32 p-1 border rounded"
                  />
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Grand Total:</span>
                  <span>₹{formData.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                type="submit"
                className="px-6 py-2 text-white bg-green-600 rounded hover:bg-green-700"
              >
                {isEditing ? "Update Quotation" : "Save Quotation"}
              </button>
              <button
                type="button"
                onClick={() => navigate('/quotation-list')}
                className="px-6 py-2 text-white bg-gray-600 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QuotationForm;