import React, { useState } from "react";

export default function AuditAuditors({ auditors: initialAuditors, onClose }) {
  const [auditors, setAuditors] = useState(initialAuditors || []);
  const [showModal, setShowModal] = useState(false);
  const [newAuditor, setNewAuditor] = useState("");

  const handleAddAuditor = () => {
    if (!newAuditor.trim()) return;
    setAuditors([...auditors, { id: Date.now(), name: newAuditor }]);
    setNewAuditor("");
    setShowModal(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-6 relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Auditors in Audit</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        {/* Auditor List */}
        <ul className="divide-y divide-gray-200 mb-4">
          {auditors.length ? (
            auditors.map((a) => (
              <li key={a.id} className="py-2 flex items-center justify-between">
                <span>{a.name}</span>
              </li>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No auditors yet</p>
          )}
        </ul>

        {/* Add Button */}
        <button
          onClick={() => setShowModal(true)}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add Auditor
        </button>
      </div>

      {/* Add Auditor Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg w-80">
            <h3 className="text-lg font-semibold mb-3">Add New Auditor</h3>
            <input
              type="text"
              value={newAuditor}
              onChange={(e) => setNewAuditor(e.target.value)}
              placeholder="Enter auditor name"
              className="w-full border rounded-lg px-3 py-2 mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAuditor}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
