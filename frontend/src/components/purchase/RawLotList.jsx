import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import axios from "axios";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import Loading from "../../Loading.jsx";
import PackLotModal from "./PackLotModal.jsx";

export default function RawLotList() {
  /* ─── auth header once ─────────────────────────────────────────── */
  const token = localStorage.getItem("token") || "";
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  /* ─── state ────────────────────────────────────────────────────── */
  const [lots, setLots] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [busy, setBusy] = useState(true);
  const [openOnly, setOpenOnly] = useState(true);
  const [modal, setModal] = useState({ open: false, lot: null, editMode: false });
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

  /* ─── fetch warehouses ─────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get("/api/warehouses", auth);
        setWarehouses(data.data || []);
      } catch (err) {
        alert(err.response?.data?.message || err.message);
        setWarehouses([]);
      }
    })();
  }, []);

  /* ─── fetch lots (+pack summary) ───────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        setBusy(true);
        const { data } = await axios.get("/api/raw-lots", {
          ...auth,
          params: {
            packed: openOnly ? 0 : undefined,
            withPacks: 1,
            warehouse: selectedWarehouse || undefined, // Filter by selected warehouse
          },
        });
        setLots(data.data || []);
      } catch (err) {
        alert(err.response?.data?.message || err.message);
        setLots([]);
      } finally {
        setBusy(false);
      }
    })();
  }, [openOnly, selectedWarehouse]);

  /* helper: keep table fresh after a PATCH ───────────────────────── */
  const replaceLot = (updated) =>
    setLots((prev) => prev.map((l) => (l._id === updated._id ? updated : l)));

  /* ─── handle warehouse selection ───────────────────────────────── */
  const handleWarehouseChange = (e) => {
    setSelectedWarehouse(e.target.value);
  };

  /* ─── UI ───────────────────────────────────────────────────────── */
  if (busy) return <Loading />;

  return (
    <div className="flex h-screen">
      <Sidebar isSidebarOpen={sidebarOpen} />

      <div className="flex flex-1 flex-col">
        <Navbar isSidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <header className="flex items-center justify-between bg-gray-100 px-4 py-3">
          <h1 className="text-xl font-semibold">Raw Lots</h1>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="accent-cyan-600"
                checked={openOnly}
                onChange={(e) => setOpenOnly(e.target.checked)}
              />
              Show only <em>open</em> lots
            </label>

            <select
              value={selectedWarehouse}
              onChange={handleWarehouseChange}
              className="border rounded p-1 text-sm"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse._id} value={warehouse._id}>
                  {warehouse.warehouseName}
                </option>
              ))}
            </select>
          </div>
        </header>

        {lots.length === 0 ? (
          <p className="p-6 text-center text-gray-500">No raw lots found.</p>
        ) : (
          <div className="overflow-auto p-4">
            <table className="w-full min-w-[1200px] border text-sm">
              <thead className="bg-sky-600 text-white">
                <tr>
                  {[
                    "Date",
                    "Item",
                    "Bulk Qty",
                    "Bulk Cost (₹)",
                    "Pack Size",
                    "Pack Cost (₹)",
                    "Sales Price (₹)",
                    "Packs Made",
                    "Packs Left",
                    "Warehouse",
                    "Status",
                    "Action",
                  ].map((h) => (
                    <th key={h} className="border p-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {lots.map((lot) => {
                  const packsMade = lot.totalPacksMade || 0;
                  const statusTxt = lot.packSize
                    ? lot.isPacked
                      ? "Packed"
                      : "Partial"
                    : "Open";

                  return (
                    <tr key={lot._id} className="text-center">
                      <td className="border p-2">
                        {dayjs(lot.createdAt).format("DD-MMM-YY")}
                      </td>
                      <td className="border p-2">{lot.item?.itemName || "—"}</td>
                      <td className="border p-2">
                        {lot.bulkQty} {lot.bulkUnit}
                      </td>
                      <td className="border p-2">{lot.bulkCost.toFixed(2)}</td>
                      <td className="border p-2">
                        {lot.packSize ? `${lot.packSize.toFixed(4)} ${lot.bulkUnit}` : "—"}
                      </td>
                      <td className="border p-2">{lot.packCost ? lot.packCost.toFixed(2) : "—"}</td>
                      <td className="border p-2">{lot.salesPrice ? lot.salesPrice.toFixed(2) : "—"}</td>
                      <td className="border p-2">{packsMade}</td>
                      <td className="border p-2">{lot.packsLeft ?? "—"}</td>
                      <td className="border p-2">
                        {lot.warehouse?.warehouseName || "—"}
                      </td>
                      <td className="border p-2">{statusTxt}</td>
                      <td className="border p-2">
                        {lot.packSize == null ? (
                          <Link
                            to="#"
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => setModal({ open: true, lot, editMode: false })}
                          >
                            Define Pack
                          </Link>
                        ) : lot.packsLeft > 0 || !lot.isPacked ? (
                          <Link
                            to="#"
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => setModal({ open: true, lot, editMode: !lot.isPacked })}
                          >
                            {lot.isPacked ? "Edit" : "Pack More"}
                          </Link>
                        ) : (
                          <Link
                            to="#"
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => setModal({ open: true, lot, editMode: true })}
                          >
                            Edit
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <PackLotModal
          open={modal.open}
          lot={modal.lot}
          editMode={modal.editMode}
          onClose={() => setModal({ open: false, lot: null, editMode: false })}
          onSave={replaceLot}
        />
      </div>
    </div>
  );
}