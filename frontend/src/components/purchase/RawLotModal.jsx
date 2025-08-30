import React, { useState, useEffect } from "react";

export default function RawLotModal({ open, onClose, onSave, init }) {
  const [bulkQty,  setBulkQty]  = useState("");
  const [bulkUnit, setBulkUnit] = useState("kg");
  const [bulkCost, setBulkCost] = useState("");

  useEffect(() => {
    if (!init) return;
    setBulkQty(String(init.bulkQty ?? ""));
    setBulkUnit(init.bulkUnit ?? "kg");
    setBulkCost(String(init.bulkCost ?? ""));
  }, [init]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-80 rounded-md shadow p-6">
        <h2 className="text-lg font-semibold mb-4">
          {init ? "Edit Raw Material" : "Add Raw Material"}
        </h2>

        <label className="block text-sm mb-1">Bulk Quantity</label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={bulkQty}
          onChange={(e) => setBulkQty(e.target.value)}
          className="w-full border px-2 py-1 mb-3"
        />

        <label className="block text-sm mb-1">Unit (kg/ltr…)</label>
        <input
          type="text"
          value={bulkUnit}
          onChange={(e) => setBulkUnit(e.target.value)}
          className="w-full border px-2 py-1 mb-3"
        />

        <label className="block text-sm mb-1">Total Cost (₹)</label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={bulkCost}
          onChange={(e) => setBulkCost(e.target.value)}
          className="w-full border px-2 py-1 mb-6"
        />

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-1 bg-gray-300 rounded">
            Cancel
          </button>
          <button
            onClick={() =>
              onSave({
                bulkQty : Number(bulkQty),
                bulkUnit: bulkUnit.trim() || "kg",
                bulkCost: Number(bulkCost),
              })
            }
            disabled={!bulkQty || !bulkCost}
            className="px-4 py-1 bg-green-600 text-white rounded disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
