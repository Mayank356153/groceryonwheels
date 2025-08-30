import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Navbar   from "../Navbar";
import Sidebar  from "../Sidebar";
import Loading  from "../../Loading";

const API = "";

export default function TransferDetails() {
  const { id } = useParams();
  const nav    = useNavigate();
  const [data, setData] = useState(null);
  const [side, setSide] = useState(true);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/api/stock-transfers/${id}`, {
        headers:{ Authorization:`Bearer ${token}` }
      });
      setData(data.data);
    })();
  }, [id]);

  const downloadPdf = () => {
    if (!data) return;
    const doc = new jsPDF();
    doc.text(`Stock Transfer #${data._id}`, 14, 18);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date(data.transferDate).toDateString()}`, 14, 26);
    doc.text(`From: ${data.fromWarehouse.warehouseName}`, 14, 32);
    doc.text(`To:   ${data.toWarehouse.warehouseName}`, 14, 38);

    autoTable(doc, {
      startY: 45,
      head: [["Item Code","Item Name","Qty"]],
      body: data.items.map(l => [
        l.item.itemCode,
        l.item.itemName + (l.variant?.variantName ? ` / ${l.variant.variantName}` : ""),
        l.quantity
      ])
    });

    doc.save(`transfer-${data._id}.pdf`);
  };

  if (!data) return <Loading/>;

  return (
    <div className="flex h-screen flex-col">
      <Navbar isSidebarOpen={side} setSidebarOpen={setSide}/>
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={side}/>
        <main className="flex-1 p-4 space-y-4 overflow-y-auto">

          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Stock Transfer Details</h1>
            <button onClick={downloadPdf}
                    className="px-4 py-2 text-white bg-cyan-600 rounded">
              Download PDF
            </button>
          </div>

          <div className="p-4 bg-white rounded shadow">
            <p><b>Date:</b> {new Date(data.transferDate).toDateString()}</p>
            <p><b>From:</b> {data.fromWarehouse.warehouseName}</p>
            <p><b>To&nbsp;&nbsp;:</b> {data.toWarehouse.warehouseName}</p>
            <p><b>Details:</b> {data.details || "—"}</p>
            <p><b>Note:</b> {data.note || "—"}</p>
          </div>

          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-2">Item Code</th>
                  <th className="p-2">Item Name</th>
                  <th className="p-2 w-24 text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map(l => (
                  <tr key={l._id} className="border-t">
                    <td className="p-2">{l.item.itemCode}</td>
                    <td className="p-2">
                      {l.item.itemName}
                      {l.variant?.variantName && ` / ${l.variant.variantName}`}
                    </td>
                    <td className="p-2 text-right">{l.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={() => nav(-1)}
                  className="px-4 py-2 text-white bg-gray-500 rounded">
            Back
          </button>
        </main>
      </div>
    </div>
  );
}
