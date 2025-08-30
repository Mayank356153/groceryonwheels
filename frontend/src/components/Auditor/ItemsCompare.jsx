import React, { useState } from 'react';
import axios from "axios"
export default function ItemsCompare({ audit, onClose, sidebarOpen = true }) {
  const [items, setUpdateItems] = useState(audit.items);
  const [isDirty, setIsDirty] = useState(false);

  const link=""
  const handleChange = (e, id) => {
    const { name, value } = e.target;
    const numericValue = Number(value);

    const updated = items.map((item) => {
      if (item.itemId === id) {
        const updatedItem = {
          ...item,
          [name]: numericValue,
        };
        updatedItem.difference=updatedItem.expectedQty-updatedItem.scannedQty
        return updatedItem;
      }
      return item;
    });

    setUpdateItems(updated);
    setIsDirty(true);
  };

  const handleSave =async () => {
             try {
                console.log(audit)
            const response = await axios.put(`${link}/api/audit/update-quantity-db`,{
                auditId:audit._id,
                   items
            },{
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                  }});
            console.log(response);
           alert("Changes Save")
           onClose();
        } catch (error) {
            console.error("Error fetching warehouses:", error);
        }   
  };

  const handleClose = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Are you sure you want to close?')) {
      return;
    }
    onClose();
  };

  return (
      <div
  className={`fixed inset-0 w-full h-full overflow-y-auto bg-black/30 backdrop-blur-sm z-50 flex justify-center items-start pt-6 lg:pt-20 ${
    sidebarOpen ? "pl-0 lg:pl-10" : ""
  }`}
>
  <div className="relative w-full max-w-5xl p-4 mx-auto bg-white rounded-lg shadow-lg lg:p-6">
    {/* Header */}
    <div className="flex items-center justify-between pb-3 mb-4 border-b">
      <h3 className="text-lg font-semibold text-gray-900">
        Audit Items Comparison
      </h3>
      <button
        onClick={handleClose}
        className="text-gray-500 transition hover:text-gray-700"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    {/* Mobile View - Card layout */}
    <div className="space-y-4 lg:hidden">
      {items.map((item) => (
        <div
          key={item.itemId}
          className="p-4 border border-gray-200 rounded-lg shadow-sm bg-gray-50"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-gray-900">{item.itemName}</p>
            </div>
            <span
              className={`text-sm font-medium ${
                item.scannedQty >= item.expectedQty
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {item.scannedQty - item.expectedQty}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block mb-1 text-xs text-gray-500">
                Scanned Qty
              </label>
               <input
                type="number"
                value={item.scannedQty}
                className="w-full p-2 text-sm border rounded-md"
                onChange={(e) => handleChange(e, item.itemId)}
                name="scannedQty"
                min="0"
              />
            </div>
            <div>
              <label className="block mb-1 text-xs text-gray-500">
                Expected Qty
              </label>
             {item.expectedQty}
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Desktop View - Table layout */}
    <div className="hidden overflow-x-auto lg:block max-h-72">
      <table className="min-w-full overflow-hidden border border-gray-200 rounded-lg">
        <thead className="bg-gray-100">
          <tr>
            {[ "Name", "Scanned Qty", "Expected Qty", "Difference"].map(
              (head) => (
                <th
                  key={head}
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-600 uppercase border-b"
                >
                  {head}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item.itemId} className="hover:bg-gray-50">
             
              <td className="px-6 py-3 text-sm font-medium text-gray-900">
                {item.itemName}
              </td>
              <td className="px-6 py-3 text-sm text-gray-500">
              <input
                type="number"
                value={item.scannedQty}
                className="w-full p-2 text-sm border rounded-md"
                onChange={(e) => handleChange(e, item.itemId)}
                name="scannedQty"
                min="0"
              />
              </td>
              <td className="px-6 py-3">
                {item.expectedQty}
              </td>
              <td
                className={`px-6 py-3 text-sm font-medium ${
                  item.scannedQty >= item.expectedQty
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {item.scannedQty - item.expectedQty}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Action Buttons */}
    <div className="flex flex-col-reverse pt-4 mt-4 border-t sm:flex-row sm:justify-end sm:space-x-3">
      <button
        onClick={handleClose}
        className="px-4 py-2 text-sm font-medium text-gray-700 transition bg-gray-200 rounded-md hover:bg-gray-300"
      >
        Close
      </button>
      <button
        onClick={handleSave}
        disabled={!isDirty}
        className={`px-4 py-2 text-sm font-medium text-white rounded-md transition ${
          isDirty
            ? "bg-blue-600 hover:bg-blue-700"
            : "bg-blue-400 cursor-not-allowed"
        }`}
      >
        Save Changes
      </button>
    </div>
  </div>
</div>

  );
}