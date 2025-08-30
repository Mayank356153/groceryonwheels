import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import Navbar from '../Navbar.jsx';
import Sidebar from '../Sidebar.jsx';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { FaTachometerAlt } from 'react-icons/fa';
import { BiChevronRight } from 'react-icons/bi';

const API_BASE = 'api';

function parseQs(search) {
  const p = new URLSearchParams(search);
  return {
    from: p.get('from') || '',
    to: p.get('to') || '',
    on: p.get('on') || new Date().toISOString().slice(0, 10)
  };
}

export default function AccountLedger() {
  const { accountId } = useParams();
  const { search } = useLocation();
  const { from, to, on } = parseQs(search);

  const [accountName, setAccountName] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salesModal, setSalesModal] = useState(null); // { paymentMethod: 'Cash'|'Bank', date: 'YYYY-MM-DD', invoices: [] }
  const [purchaseModal, setPurchaseModal] = useState(null); // { date: 'YYYY-MM-DD', purchases: [] }
  const [purchaseReturnModal, setPurchaseReturnModal] = useState(null); // { date: 'YYYY-MM-DD', returns: [] }
  const [saleReturnModal, setSaleReturnModal] = useState(null); // { date: 'YYYY-MM-DD', returns: [] }
  const [itemsModal, setItemsModal] = useState(null); // { code: string, items: [] }

  // Helper: list of YYYY-MM-DD between start/end
  function dateRange(start, end) {
    const out = [];
    const cur = new Date(start);
    const last = new Date(end);
    while (cur <= last) {
      out.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  }

  // Fetch ledger data
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    axios
      .get(`${API_BASE}/accounts/${accountId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      .then(res => {
        if (!mounted) return;
        const acct = res.data.data;
        setAccountName(acct.accountName);

        return axios.get(`${API_BASE}/by-cash-account/${accountId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      })
      .then(res2 => {
        if (!mounted) return;
        const wid = res2.data.warehouseId;
        setWarehouseId(wid);
        const dates = from && to ? dateRange(from, to) : [on];

        return Promise.all(
          dates.map(d =>
            axios
              .get(`${API_BASE}/cash-summary`, {
                params: { warehouseId: wid, date: d },
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
              })
              .then(r => ({ date: d, ...r.data }))
          )
        );
      })
      .then(results => {
        if (mounted) setRows(results);
      })
      .catch(err => {
        console.error('Error loading ledger:', err);
        if (mounted) setRows([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [accountId, from, to, on]);

  // Compute column keys once
  const columns = useMemo(() => {
    return rows.length ? Object.keys(rows[0]) : [];
  }, [rows]);

  // Compute totals for each column (sum numeric values only)
  const totals = useMemo(() => {
    const t = {};
    columns.forEach(col => {
      const sum = rows.reduce((acc, r) => {
        const val = r[col];
        if (typeof val === 'number' && !isNaN(val)) {
          return acc + val;
        }
        const num = Number(val);
        return !isNaN(num) ? acc + num : acc;
      }, 0);
      t[col] = sum;
    });
    return t;
  }, [rows, columns]);

  // Fetch sales for a specific payment method and date
  const fetchSales = async (paymentMethod, date) => {
    setLoading(true);
    try {
      const startDate = new Date(date).toISOString();
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      console.log(`Fetching ${paymentMethod} sales for warehouse ${warehouseId}, date range: ${startDate} to ${endDate}`);
      const response = await axios.get(`${API_BASE}/pos/invoices`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        params: { warehouseId, start: startDate, end: endDate.toISOString(), paymentMethod }
      });
      const invoices = Array.isArray(response.data) ? response.data.map(inv => ({
        ...inv,
        paymentAmount: inv.payments?.reduce((sum, p) => p.paymentType?.paymentTypeName === paymentMethod ? sum + (p.amount || p.paymentAmount || 0) : sum, 0) || 0,
        totalAmount: inv.amount || inv.grandTotal || 0
      })) : [];
      console.log(`Fetched ${paymentMethod} sales for ${date}:`, invoices);
      setSalesModal({ paymentMethod, date, invoices });
    } catch (err) {
      console.error(`Error fetching ${paymentMethod} sales:`, err);
      alert(`Failed to load ${paymentMethod} sales: ${err.message}`);
      setSalesModal(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch purchases for a specific date
  const fetchPurchases = async (date) => {
    setLoading(true);
    try {
      const startDate = new Date(date).toISOString().split('T')[0] + 'T00:00:00.000Z';
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      console.log(`Fetching purchases for warehouse ${warehouseId}, date range: ${startDate} to ${endDate}`);
      console.log('Current warehouseId:', warehouseId); // Debug warehouseId

      // Fetch all purchases (no params for now, as backend might ignore them)
      const response = await axios.get(`${API_BASE}/purchases`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('Raw response:', response.data); // Debug raw response

      // Filter purchases client-side
      const purchases = Array.isArray(response.data?.data) 
        ? response.data.data.filter(p => 
            p.warehouse?._id === warehouseId && 
            new Date(p.purchaseDate) >= new Date(startDate) && 
            new Date(p.purchaseDate) <= new Date(endDate)
          ).map(p => ({
            ...p,
            amount: p.payments?.[0]?.amount || 0,
            code: p.purchaseCode || 'N/A'
          })) 
        : Array.isArray(response.data) 
        ? response.data.filter(p => 
            p.warehouse?._id === warehouseId && 
            new Date(p.purchaseDate) >= new Date(startDate) && 
            new Date(p.purchaseDate) <= new Date(endDate)
          ).map(p => ({
            ...p,
            amount: p.payments?.[0]?.amount || 0,
            code: p.purchaseCode || 'N/A'
          })) 
        : [];

      console.log(`Filtered purchases for ${date}:`, purchases);
      setPurchaseModal({ date, purchases });
    } catch (err) {
      console.error('Error fetching purchases:', err);
      alert(`Failed to load purchases: ${err.message}`);
      setPurchaseModal(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch purchase returns for a specific date
  const fetchPurchaseReturns = async (date) => {
    setLoading(true);
    try {
      const startDate = new Date(date).toISOString();
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      console.log(`Fetching purchase returns for warehouse ${warehouseId}, date range: ${startDate} to ${endDate}`);
      const response = await axios.get(`${API_BASE}/purchases/purchase-returns`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        params: { warehouseId, purchaseDate: date, start: startDate, end: endDate.toISOString() }
      });
      const returns = Array.isArray(response.data) ? response.data.map(r => ({
        ...r,
        amount: r.paidPayment || 0,
        code: r.returnCode || 'N/A'
      })) : [];
      console.log(`Fetched purchase returns for ${date}:`, returns);
      setPurchaseReturnModal({ date, returns });
    } catch (err) {
      console.error('Error fetching purchase returns:', err);
      alert(`Failed to load purchase returns: ${err.message}`);
      setPurchaseReturnModal(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sale returns for a specific date
  const fetchSaleReturns = async (date) => {
    setLoading(true);
    try {
      const startDate = new Date(date).toISOString();
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      console.log(`Fetching sale returns for warehouse ${warehouseId}, date range: ${startDate} to ${endDate}`);
      console.log('Current warehouseId:', warehouseId); // Debug warehouseId

      // Fetch all sale returns
      const response = await axios.get(`${API_BASE}/sales-return`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('Raw response:', response.data); // Debug raw response

      // Use 'returns' from the response, matching SalesReturnList structure
      const unfilteredReturns = Array.isArray(response.data.returns) ? response.data.returns : [];
      console.log('Unfiltered returns:', unfilteredReturns); // Check raw data before filtering

      // Filter by warehouseId and returnDate
      const filteredReturns = unfilteredReturns.filter(r => 
        r.warehouse?._id === warehouseId && 
        new Date(r.returnDate) >= new Date(startDate) && 
        new Date(r.returnDate) <= new Date(endDate)
      ).map(r => {
        const amount = r.totalRefund || r.payments?.[0]?.amount || 0;
        console.log(`Mapping return ${r.returnCode || 'N/A'}: totalRefund=${r.totalRefund}, payments[0]?.amount=${r.payments?.[0]?.amount}, calculated amount=${amount}`); // Debug amount
        return {
          ...r,
          amount: amount,
          code: r.returnCode || 'N/A'
        };
      });

      console.log(`Filtered sale returns for ${date}:`, filteredReturns);
      setSaleReturnModal({ date, returns: filteredReturns });
    } catch (err) {
      console.error('Error fetching sale returns:', err);
      alert(`Failed to load sale returns: ${err.message}`);
      setSaleReturnModal(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch items for a specific entry
  const fetchItems = async (id, code, type) => {
    setLoading(true);
    try {
      let endpoint;
      if (type === 'purchase') {
        endpoint = `/purchases/${id}`;
      } else if (type === 'purchaseReturn') {
        endpoint = `/purchases/purchase-returns/${id}`;
      } else if (type === 'saleReturn') {
        endpoint = `/sales-return/${id}`;
      } else if (type === 'cashSale' || type === 'bankSale') {
        endpoint = `/pos/${id}`;
      }

      const response = await axios.get(`${API_BASE}${endpoint}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      console.log(`Raw response for ${code}:`, response.data); // Debug raw response
      const items = response.data.items || (response.data.data?.items || []); // Fallback for nested items
      console.log(`Fetched items for ${code}:`, items);
      setItemsModal({ code, items });
    } catch (err) {
      console.error(`Error fetching items for ${code}:`, err);
      alert(`Failed to load items: ${err.message}`);
      setItemsModal(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch items for a specific invoice (for sales)
  const fetchInvoiceItems = async (id, code, source) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/pos/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      console.log(`Raw response for invoice ${code}:`, response.data); // Debug raw response
      const items = response.data.items || (response.data.data?.items || []); // Fallback for nested items
      console.log(`Fetched items for invoice ${code}:`, items);
      setItemsModal({ code, items });
    } catch (err) {
      console.error(`Error fetching items for invoice ${code}:`, err);
      alert(`Failed to load items: ${err.message}`);
      setItemsModal(null);
    } finally {
      setLoading(false);
    }
  };

  // CSV export (with UTF-8 BOM)
  const exportCSV = () => {
    if (!rows.length) return;
    const header = Object.keys(rows[0]);
    const lines = [
      header.join(','),
      ...rows.map(r => header.map(k => `"${(r[k] ?? '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const totalLine = header.map((col, idx) => idx === 0 ? '"Total"' : `"${totals[col] !== 0 ? totals[col].toFixed(2) : ''}"`).join(',');
    const csv = '\uFEFF' + lines + '\n' + totalLine;
    saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `ledger-${accountName || accountId}.csv`);
  };

  // Excel export
  const exportExcel = () => {
    if (!rows.length) return;
    const dataWithTotal = [
      ...rows,
      columns.reduce((acc, col, idx) => {
        acc[col] = idx === 0 ? 'Total' : totals[col] !== 0 ? totals[col].toFixed(2) : '';
        return acc;
      }, {})
    ];
    const ws = XLSX.utils.json_to_sheet(dataWithTotal);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ledger');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `ledger-${accountName || accountId}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen">
        <Navbar />
        <div className="flex flex-grow">
          <Sidebar />
          <main className="flex-grow p-4">Loading…</main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex flex-grow">
        <Sidebar />
        <main className="flex-grow p-4 overflow-x-auto bg-gray-50">
          <nav className="flex items-center text-gray-500 text-sm mb-4">
            <Link to="/account-list" className="flex items-center">
              <FaTachometerAlt className="mr-1" /> Accounts
            </Link>
            <BiChevronRight className="mx-2" />
            <span>Ledger</span>
          </nav>
          <h2 className="text-xl font-bold mb-4">
            Ledger for <span className="text-indigo-600">{accountName}</span>
          </h2>
          <div className="mb-4 space-x-2">
            <button onClick={exportCSV} className="px-4 py-2 bg-blue-600 text-white rounded">
              Export CSV
            </button>
            <button onClick={exportExcel} className="px-4 py-2 bg-green-600 text-white rounded">
              Export Excel
            </button>
          </div>
          {rows.length > 0 ? (
            <div className="overflow-x-auto bg-white rounded shadow">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-200">
                  <tr>
                    {columns.map(col => (
                      <th key={col} className="border p-2">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      {columns.map((k, j) => (
                        <td key={j} className="border p-2">
                          {k === 'cashSale' || k === 'bankSale' ? (
                            <button
                              onClick={() => fetchSales(k === 'cashSale' ? 'Cash' : 'Bank', r.date)}
                              className="text-blue-600 hover:underline"
                            >
                              {(r[k] ?? 0).toFixed(2)}
                            </button>
                          ) : k === 'purchase' ? (
                            <button
                              onClick={() => fetchPurchases(r.date)}
                              className="text-blue-600 hover:underline"
                            >
                              {(r[k] ?? 0).toFixed(2)}
                            </button>
                          ) : k === 'purchaseReturn' ? (
                            <button
                              onClick={() => fetchPurchaseReturns(r.date)}
                              className="text-blue-600 hover:underline"
                            >
                              {(r[k] ?? 0).toFixed(2)}
                            </button>
                          ) : k === 'saleReturn' ? (
                            <button
                              onClick={() => fetchSaleReturns(r.date)}
                              className="text-blue-600 hover:underline"
                            >
                              {(r[k] ?? 0).toFixed(2)}
                            </button>
                          ) : (
                            r[k]?.toString() ?? ''
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 font-semibold">
                  <tr>
                    {columns.map((col, idx) => (
                      <td key={col} className="border p-2">
                        {idx === 0
                          ? 'Total'
                          : totals[col] !== 0 ? totals[col].toFixed(2) : ''
                        }
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-center py-8">No ledger summary found.</p>
          )}

          {/* Sales Modal */}
          {salesModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-4xl shadow-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {salesModal.paymentMethod} Sales for {salesModal.date}
                  </h3>
                  <button
                    onClick={() => {/* Implement new tab logic if needed */}}
                    className="px-4 py-2 bg-gray-200 rounded text-gray-700 hover:bg-gray-300 transition-colors"
                  >
                    Open in New Tab
                  </button>
                </div>
                <div className="overflow-y-auto flex-grow">
                  <table className="min-w-full text-sm border-collapse">
                    <thead className="bg-gradient-to-r from-cyan-500 to-cyan-700 text-white sticky top-0">
                      <tr>
                        <th className="border p-3 text-left font-medium">Sale Code</th>
                        <th className="border p-3 text-right font-medium">Total Amount</th>
                        <th className="border p-3 text-right font-medium">Payment Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesModal.invoices.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="border p-3 text-center text-gray-500">
                            No sales found
                          </td>
                        </tr>
                      ) : (
                        salesModal.invoices.map(inv => (
                          <tr key={inv._id} className="hover:bg-gray-50 transition-colors">
                            <td className="border p-3">
                              <button
                                onClick={() => fetchInvoiceItems(inv._id, inv.saleCode, inv.source)}
                                className="text-blue-600 hover:underline"
                              >
                                {inv.saleCode}
                              </button>
                            </td>
                            <td className="border p-3 text-right">
                              {(inv.totalAmount || 0).toFixed(2)}
                            </td>
                            <td className="border p-3 text-right">
                              {(inv.paymentAmount || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setSalesModal(null)}
                    className="px-4 py-2 bg-gray-200 rounded text-gray-700 hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Purchase Modal */}
          {purchaseModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-4xl shadow-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Purchases for {purchaseModal.date}
                  </h3>
                  <button
                    onClick={() => {/* Implement new tab logic if needed */}}
                    className="px-4 py-2 bg-gray-200 rounded text-gray-700 hover:bg-gray-300 transition-colors"
                  >
                    Open in New Tab
                  </button>
                </div>
                <div className="overflow-y-auto flex-grow">
                  <table className="min-w-full text-sm border-collapse">
                    <thead className="bg-gradient-to-r from-cyan-500 to-cyan-700 text-white sticky top-0">
                      <tr>
                        <th className="border p-3 text-left font-medium">Purchase Code</th>
                        <th className="border p-3 text-right font-medium">Paid Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseModal.purchases.length === 0 ? (
                        <tr>
                          <td colSpan="2" className="border p-3 text-center text-gray-500">
                            No purchases found
                          </td>
                        </tr>
                      ) : (
                        purchaseModal.purchases.map(p => (
                          <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                            <td className="border p-3">
                              <button
                                onClick={() => fetchItems(p._id, p.code, 'purchase')}
                                className="text-blue-600 hover:underline"
                              >
                                {p.code}
                              </button>
                            </td>
                            <td className="border p-3 text-right">
                              {(p.amount || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setPurchaseModal(null)}
                    className="px-4 py-2 bg-gray-200 rounded text-gray-700 hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Purchase Return Modal */}
          {purchaseReturnModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-4xl shadow-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Purchase Returns for {purchaseReturnModal.date}
                  </h3>
                  <button
                    onClick={() => {/* Implement new tab logic if needed */}}
                    className="px-4 py-2 bg-gray-200 rounded text-gray-700 hover:bg-gray-300 transition-colors"
                  >
                    Open in New Tab
                  </button>
                </div>
                <div className="overflow-y-auto flex-grow">
                  <table className="min-w-full text-sm border-collapse">
                    <thead className="bg-gradient-to-r from-cyan-500 to-cyan-700 text-white sticky top-0">
                      <tr>
                        <th className="border p-3 text-left font-medium">Return Code</th>
                        <th className="border p-3 text-right font-medium">Paid Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseReturnModal.returns.length === 0 ? (
                        <tr>
                          <td colSpan="2" className="border p-3 text-center text-gray-500">
                            No returns found
                          </td>
                        </tr>
                      ) : (
                        purchaseReturnModal.returns.map(r => (
                          <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                            <td className="border p-3">
                              <button
                                onClick={() => fetchItems(r._id, r.code, 'purchaseReturn')}
                                className="text-blue-600 hover:underline"
                              >
                                {r.code}
                              </button>
                            </td>
                            <td className="border p-3 text-right">
                              {(r.amount || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setPurchaseReturnModal(null)}
                    className="px-4 py-2 bg-gray-200 rounded text-gray-700 hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sale Return Modal */}
          {saleReturnModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-4xl shadow-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Sale Returns for {saleReturnModal.date}
                  </h3>
                  <button
                    onClick={() => {/* Implement new tab logic if needed */}}
                    className="px-4 py-2 bg-gray-200 rounded text-gray-700 hover:bg-gray-300 transition-colors"
                  >
                    Open in New Tab
                  </button>
                </div>
                <div className="overflow-y-auto flex-grow">
                  <table className="min-w-full text-sm border-collapse">
                    <thead className="bg-gradient-to-r from-cyan-500 to-cyan-700 text-white sticky top-0">
                      <tr>
                        <th className="border p-3 text-left font-medium">Return Code</th>
                        <th className="border p-3 text-right font-medium">Paid Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {saleReturnModal.returns.length === 0 ? (
                        <tr>
                          <td colSpan="2" className="border p-3 text-center text-gray-500">
                            No returns found
                          </td>
                        </tr>
                      ) : (
                        saleReturnModal.returns.map(r => (
                          <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                            <td className="border p-3">
                              <button
                                onClick={() => fetchItems(r._id, r.code, 'saleReturn')}
                                className="text-blue-600 hover:underline"
                              >
                                {r.code}
                              </button>
                            </td>
                            <td className="border p-3 text-right">
                              {(r.amount || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setSaleReturnModal(null)}
                    className="px-4 py-2 bg-gray-200 rounded text-gray-700 hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Items Modal */}
          {itemsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-4xl shadow-lg max-h-[90vh] flex flex-col">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  Items for Transaction {itemsModal.code}
                </h3>
                <div className="overflow-y-auto flex-grow">
                  <table className="min-w-full text-sm border-collapse">
                    <thead className="bg-gradient-to-r from-cyan-500 to-cyan-700 text-white sticky top-0">
                      <tr>
                        <th className="border p-3 text-left font-medium">Item Name</th>
                        <th className="border p-3 text-left font-medium">Quantity</th>
                        <th className="border p-3 text-right font-medium">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsModal.items.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="border p-3 text-center text-gray-500">
                            No items found
                          </td>
                        </tr>
                      ) : (
                        itemsModal.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="border p-3">
                              {item.item?.itemName || 'N/A'}
                            </td>
                            <td className="border p-3">
                              {item.quantity || 0}
                            </td>
                            <td className="border p-3 text-right">
  {(item.purchasePrice || item.unitPrice || item.price || item.salesPrice || 0).toFixed(2)}
</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setItemsModal(null)}
                    className="px-4 py-2 bg-gray-200 rounded text-gray-700 hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}