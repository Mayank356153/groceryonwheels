import React, { useState, useEffect } from "react";
import axios from "axios";

export default function PackLotModal({ open, onClose, onSave, lot, editMode }) {
  // ── 1) Hooks always run first ───────────────────
  const [packSize, setPackSize] = useState(lot?.packSize ?? "");
  const [packsToMake, setPacks] = useState("");
  const [isFullyPacked, setIsFullyPacked] = useState(false);
  const [packCost, setPackCost] = useState(lot?.packCost ?? "");
  const [salesPrice, setSalesPrice] = useState(lot?.salesPrice ?? lot?.item?.salesPrice ?? "");

  useEffect(() => {
    // Reset whenever a new lot is opened
    if (lot) {
      setPackSize(lot.packSize ?? "");
      setPacks(editMode ? (lot.totalPacksMade || Math.floor(lot.packedQty / lot.packSize)) : ""); // Set current packs in edit mode
      setIsFullyPacked(lot.isPacked || false);
      setPackCost(lot.packCost ?? "");
      setSalesPrice(lot.salesPrice ?? lot.item?.salesPrice ?? "");
    }
  }, [lot, editMode]);

  // Auto-calculate packCost when packSize changes (only if packCost is not set)
  useEffect(() => {
    if (!lot?.packCost && packSize > 0 && lot?.bulkQty > 0 && lot?.bulkCost > 0) {
      const calculatedPackCost = (lot.bulkCost / (lot.bulkQty / packSize)).toFixed(2);
      setPackCost(calculatedPackCost);
    }
  }, [packSize, lot]);

  // ── 2) Then guard the render ───────────────────
  if (!open || !lot) return null;

  // ── 3) Derived values ───────────────────────────
  const totalPossible =
    (lot.packSize || packSize) > 0
      ? Math.floor(lot.bulkQty / (lot.packSize || packSize))
      : 0;
  const made = lot.packSize ? Math.floor((lot.packedQty || 0) / lot.packSize) : 0;
  const packsLeft = totalPossible - made;

  const canSave =
    (lot.packSize || packSize) > 0 &&
    packsToMake >= 0 &&
    packCost > 0 &&
    salesPrice >= 0 &&
    (isFullyPacked || packsToMake <= (editMode ? totalPossible : packsLeft)) &&
    (!editMode || (packsToMake !== made || packSize !== lot.packSize || packCost !== lot.packCost || salesPrice !== lot.salesPrice)); // Allow save in edit mode only if changes exist

  const handleSave = async () => {
    try {
      const payload = {
        packSize: !editMode && !lot.packSize ? +packSize : undefined, // Only send packSize if defining a new pack
        packs: +packsToMake,
        isFullyPacked,
        packCost: +packCost,
        salesPrice: +salesPrice,
      };
      const url = editMode ? `/api/raw-lots/${lot._id}/edit` : `/api/raw-lots/${lot._id}/pack`;
      const { data } = await axios.patch(url, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });
      onSave(data.data); // Update the lot in the parent component
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-96 rounded bg-white p-6 shadow-lg space-y-4">
        <h2 className="text-lg font-semibold text-center">
          {editMode ? "Edit Pack" : "Pack"} “{lot.item?.itemName}”
        </h2>

        {!lot.packSize || !editMode ? (
          <label className="block text-sm">
            Pack size (in {lot.bulkUnit}):
            <input
              type="number"
              min="0.001"
              step="0.001"
              value={packSize}
              onChange={(e) => setPackSize(+e.target.value)}
              className="mt-1 w-full rounded border px-2 py-1"
              autoFocus={!lot.packSize}
              disabled={editMode && lot.packSize} // Disable if editing and packSize is set
            />
          </label>
        ) : (
          <p className="text-sm">
            Pack size:{" "}
            <span className="font-medium">
              {lot.packSize} {lot.bulkUnit}
            </span>
          </p>
        )}

        <label className="block text-sm">
          Cost per pack (₹):
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={packCost}
            onChange={(e) => setPackCost(+e.target.value)}
            className="mt-1 w-full rounded border px-2 py-1"
            disabled={lot.packCost != null && !editMode} // Disable if packCost is set and not in edit mode
            placeholder="Auto-calculated from bulk cost"
          />
        </label>

        <label className="block text-sm">
          Sales price per pack (₹):
          <input
            type="number"
            min="0"
            step="0.01"
            value={salesPrice}
            onChange={(e) => setSalesPrice(+e.target.value)}
            className="mt-1 w-full rounded border px-2 py-1"
            placeholder="Enter sales price"
          />
        </label>

        <label className="block text-sm">
          {editMode ? "Total Packs" : "Packs to make"}{" "}
          <span className="text-gray-500">
            (max {editMode ? totalPossible : packsLeft})
          </span>
          <input
            type="number"
            min="0"
            step="1"
            value={packsToMake}
            onChange={(e) => setPacks(+e.target.value)}
            className="mt-1 w-full rounded border px-2 py-1"
            disabled={!editMode && !lot.packSize} // Disable if not in edit mode and no packSize
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isFullyPacked}
            onChange={(e) => setIsFullyPacked(e.target.checked)}
            className="accent-blue-600"
            disabled={editMode && lot.isPacked} // Disable if already fully packed in edit mode
          />
          Mark as fully packed
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <button
            className="rounded bg-gray-300 px-4 py-1 hover:bg-gray-400"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="rounded bg-blue-600 px-4 py-1 text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={!canSave}
            onClick={handleSave}
          >
            {editMode ? "Save Changes" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}