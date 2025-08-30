import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaTrash,
  FaEdit,
  FaTachometerAlt,
  FaPencilAlt
} from "react-icons/fa";
import { BiChevronRight } from "react-icons/bi";
import Navbar  from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import LoadingScreen from "../../Loading.jsx";
import axios   from "axios";

const API_BASE = "api";
const todayISO = () => new Date().toISOString().slice(0, 10);
const safe     = n => Number(n ?? 0).toFixed(2);

export default function AccountList() {
  const navigate = useNavigate();
  const token    = localStorage.getItem("token") || "";
  axios.defaults.headers.common = { Authorization: `Bearer ${token}` };

  /* ───────── UI & filter state ───────── */
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [loading,       setLoading]     = useState(false);
  const [error,         setError]       = useState("");
  const [searchTerm,    setSearchTerm]  = useState("");
  const [currentPage,   setCurrentPage] = useState(1);
  const [entriesPerPage]               = useState(10);

  const [onDate,   setOnDate]   = useState(todayISO());
  const [fromDate, setFromDate] = useState("");
  const [toDate,   setToDate]   = useState("");

  const [pollTick, setPollTick] = useState(0);

  /* ───────── data stores ───────── */
  const [accounts,   setAccounts]   = useState([]);
  const [statsByAcc, setStatsByAcc] = useState({});
  const [todayLive,  setTodayLive]  = useState({});
  const [accWhMap,   setAccWhMap]   = useState({});  // account → { warehouseId, warehouseName }

  const stores   = JSON.parse(localStorage.getItem("stores") || "[]");
 const storeId  = stores.length === 1 ? stores[0] : stores[0] ?? ""; // 1st store or ""
  const role    = (localStorage.getItem("role") || "").toLowerCase();
  const isAdmin = role === "admin";

  const tableRef = useRef();


  /* ───────── 1 – Load accounts & their warehouses ───────── */
  useEffect(() => {
    setLoading(true);

    if (!isAdmin && stores.length === 0) {
      setError("No store ID found. Please log in again.");
      setLoading(false);
      return;
    }

    Promise.all([
   axios.get(`${API_BASE}/accounts`),
   axios.get(`${API_BASE}/warehouses`, { params: { scope: "mine" } })   // 👈
 ])
   .then(([accRes, whRes]) => {
    const wMap = {};
      (whRes.data.data || []).forEach(w => (wMap[w._id] = w));

      // now that wMap exists we can derive the set of IDs the user may see
      const allowedIds = new Set(Object.keys(wMap));
        (whRes.data.data||[]).forEach(w => wMap[w._id] = w);

        // for each account, ask which warehouse it uses
        const ps = (accRes.data.data||[]).map(acc =>
          axios.get(`${API_BASE}/by-cash-account/${acc._id}`)
            .then(r => {
              const wid = r.data.warehouseId;
              const wh  = wMap[wid];
              const keep = isAdmin
   ? !!wh                      // admin sees every account tied to *some* warehouse
   : allowedIds.has(wid);  
              if (!keep) return null;
              setAccWhMap(m => ({ ...m,
                [acc._id]: {
                  warehouseId: wid,
                  warehouseName: wh.warehouseName
                }
              }));
              return acc;
            })
            .catch(()=>null)
        );

        Promise.all(ps).then(arr => {
          const ok = arr.filter(Boolean);
          setAccounts(ok);
          if (!ok.length) setError("No accounts found for your store.");
        });
      })
      .catch(err=>{
        console.error(err);
        setError(err.response?.data?.message||"Failed to load data.");
      })
      .finally(()=>setLoading(false));
  }, [isAdmin]);

  /* ───────── 2 – Fetch summary for each account ───────── */
  const isRange = ()=>Boolean(fromDate && toDate);
  const isToday = ()=>!isRange() && onDate===todayISO();
  const activeKey = ()=> isRange()
    ? `range:${fromDate}_${toDate}`
    : `day:${onDate}`;
  const dateParams = p => isRange()
    ? { ...p, start: fromDate, end: toDate }
    : { ...p, date: onDate };

  useEffect(()=>{
    if (isToday()) {
      const id = setInterval(()=>setPollTick(t=>t+1),30_000);
      return ()=>clearInterval(id);
    }
  },[onDate,fromDate,toDate]);

  const fetchSummary = async accId => {
    const key = `${activeKey()}#${pollTick}`;
    if (statsByAcc[accId]?.key===key) return;

    setStatsByAcc(s=>({
      ...s,
      [accId]: { loading:true, key }
    }));
    try {
      const { warehouseId } = await axios
        .get(`${API_BASE}/by-cash-account/${accId}`)
        .then(r=>r.data);
      console.log("date params",dateParams({ warehouseId }));
      const row = await axios
        .get(`${API_BASE}/cash-summary`,{
          params: dateParams({ warehouseId })
        })
        .then(r=>r.data);
        console.log("fetchSummary",accId,row);
      if (isToday()) {
        setTodayLive(t=>({
          ...t,
          [accId]: row.liveBalance
        }));
      }

      setStatsByAcc(s=>({
        ...s,
        [accId]: { loading:false, key, data:row }
      }));
    } catch(err) {
      console.error(`fetchSummary(${accId}) failed`,err.message);
      const zeros = {
        deposit:0, cashSale:0, bankSale:0,holdSale:0, totalSale:0,
        moneyTransfer:0, vanCash:0, vanCashRemark: "", diff:0,
        openingBalance:0, closingBalance:0, liveBalance:0
      };
      setStatsByAcc(s=>({
        ...s,
        [accId]: {
          loading:false,
          key,
          data: err.response?.status===404
            ? zeros
            : { ...zeros, error:err.message }
        }
      }));
    }
  };

  useEffect(()=>{
    accounts.forEach(a=>fetchSummary(a._id));
  },[accounts,onDate,fromDate,toDate,pollTick]);

  /* ───────── 3 – Edit Van Cash ───────── */
  const handleEditVanCash = async accId => {
    if (isRange()) {
      alert("Edit Van Cash only in single-day view.");
      return;
    }
    const row = statsByAcc[accId]?.data||{};
    const current = row.vanCash||0;
    const currentRemark = row.vanCashRemark||"";
    const amountInput = window.prompt("New Van Cash amount", current);
    if (amountInput === null) return;
    const amt = parseFloat(amountInput);
    if (isNaN(amt)) {
      alert("Please enter a valid number for the amount.");
      return;
    }
    const remarkInput = window.prompt("Enter remark for Van Cash (optional)", currentRemark);
    if (remarkInput === null) return; // Allow cancellation
    const remark = remarkInput.trim();
    const wh = accWhMap[accId]?.warehouseId;
    if (!wh) {
      alert("Warehouse missing.");
      return;
    }
    try {
      setLoading(true);
      await axios.put(`${API_BASE}/ledger/van-cash`, {
        warehouseId: wh,
        date: `${onDate}T12:00:00Z`,
        amount: amt,
        remark: remark
      });
      fetchSummary(accId);
      alert("Updated!");
    } catch(e) {
      console.error(e);
      alert(e.response?.data?.message || "Failed to update Van Cash");
    } finally {
      setLoading(false);
    }
  };

  /* ───────── 4 – Search & paginate ───────── */
  const filtered = accounts.filter(a=>{
    const q = searchTerm.toLowerCase();
    return a.accountName?.toLowerCase().includes(q)
       || a.accountNumber?.toLowerCase().includes(q)
       || accWhMap[a._id]?.warehouseName?.toLowerCase().includes(q)
       || a._id.includes(q);
  });

  const totalPages     = Math.ceil(filtered.length/entriesPerPage)||1;
  const currentRecords = filtered.slice(
    (currentPage-1)*entriesPerPage,
    currentPage*entriesPerPage
  );

  if (loading) return <LoadingScreen />;
  if (error)   return <p className="p-4 text-red-600">{error}</p>;

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen}/>
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen}/>
        <main className="flex-grow p-3 bg-gray-100 overflow-x-auto">
          {/* header */}
          <header className="flex justify-between mb-3 bg-white p-3 rounded shadow">
            <div>
              <h1 className="font-bold text-lg">Accounts</h1>
              <p className="text-sm text-gray-500">View / Search</p>
            </div>
            <nav className="text-gray-500 text-sm flex items-center">
              <Link to="/dashboard" className="flex items-center">
                <FaTachometerAlt className="mr-1"/>Home
              </Link>
              <BiChevronRight className="mx-2"/>
              <span>Accounts</span>
            </nav>
          </header>

          {/* controls */}
          <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
            <div className="flex gap-2">
              <Link to="/add-account" className="px-4 py-2 bg-cyan-600 text-white rounded">
                + Create Account
              </Link>
              <Link to="/ledger/van-cash/new" className="px-4 py-2 bg-green-600 text-white rounded">
                + Van Cash
              </Link>
              <Link to="/add-deposit" className="px-4 py-2 bg-green-600 text-white rounded">
                + Add Deposit
              </Link>
              <Link to="/add-money-transfer" className="px-4 py-2 bg-green-600 text-white rounded">
                + Add Money Transfer
              </Link>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={onDate}
                onChange={e => { setOnDate(e.target.value); setFromDate(""); setToDate(""); }}
                className="border p-1 text-sm"
              />
              <span className="text-sm">or</span>
              <input
                type="date"
                value={fromDate}
                onChange={e => { setFromDate(e.target.value); setOnDate(""); }}
                className="border p-1 text-sm"
              />
              <span className="text-sm">to</span>
              <input
                type="date"
                value={toDate}
                onChange={e => { setToDate(e.target.value); setOnDate(""); }}
                className="border p-1 text-sm"
              />
              <input
                type="text"
                placeholder="Search…"
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="border p-1 text-sm"
              />
            </div>
          </div>

          {/* table */}
          <div className="overflow-x-auto bg-white rounded shadow">
            <table ref={tableRef} className="min-w-full text-sm">
              <thead className="bg-gray-200">
                <tr>
                  {[
                    "Account #","Account Name","Warehouse",
                    "Deposit","Cash Sale","Bank Sale","Hold Sale","Total Sale",
                    "Money Trf","Van Cash","Van Cash Remark","Diff",
                    "Opening","Closing","Live Bal","Action"
                  ].map(h=>(
                    <th key={h} className="border p-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentRecords.length===0
                  ? <tr><td colSpan={15} className="text-center p-4">No accounts.</td></tr>
                  : currentRecords.map(acc=>{
                      const row   = statsByAcc[acc._id]?.data||{};
                      const live  = isToday()
                        ? todayLive[acc._id] ?? row.liveBalance
                        : row.liveBalance;
                      const whRec = accWhMap[acc._id]||{};
                      // build link with query
                      const qs = isRange()
                        ? `?from=${fromDate}&to=${toDate}`
                        : `?on=${onDate}`;
                      const ledgerPath = `/accounts/${acc._id}/ledger${qs}`;
                      console.log("row",row)
                      return (
                        <tr key={acc._id} className="hover:bg-gray-50">
                          <td className="border p-2">{acc.accountNumber}</td>
                          <td className="border p-2 text-blue-600 hover:underline">
                            <Link to={ledgerPath}>{acc.accountName}</Link>
                          </td>
                          <td className="border p-2 text-blue-600 hover:underline">
                            <Link to={ledgerPath}>{whRec.warehouseName||"-"}</Link>
                          </td>
                          <td className="border p-2 text-right">{safe(row.deposit)}</td>
                          <td className="border p-2 text-right">{safe(row.cashSale)}</td>
                          <td className="border p-2 text-right">{safe(row.bankSale)}</td>
                          <td className="border p-2 text-right">{safe(row.holdSale)}</td>
                          <td className="border p-2 text-right">{safe(row.totalSale)}</td>
                          <td className="border p-2 text-right">{safe(row.moneyTransfer)}</td>
                          <td className="border p-2 text-right flex items-center justify-end gap-1">
                            {safe(row.vanCash)}
                            <button
                              onClick={()=>handleEditVanCash(acc._id)}
                              title="Edit Van Cash"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <FaPencilAlt size={12}/>
                            </button>
                          </td>
                          <td className="border p-2">{row.vanCashRemark || "-"}</td>
                          <td className="border p-2 text-right font-semibold">{safe(row.diff)}</td>
                          <td className="border p-2 text-right">{safe(row.openingBalance)}</td>
                          <td className="border p-2 text-right">
                            {safe(isRange()
                              ? row.totalClosingBalanceInRange
                              : row.closingBalance
                            )}
                          </td>
                          <td className="border p-2 text-right font-semibold">{safe(live)}</td>
                          <td className="border p-2">
                            <button onClick={()=>navigate(`/add-account?id=${acc._id}`)}
                              className="text-blue-600 mr-2"><FaEdit/></button>
                            <button onClick={()=>{/* delete... */}}
                              className="text-red-600"><FaTrash/></button>
                          </td>
                        </tr>
                      );
                    })
                }
              </tbody>
            </table>
          </div>

          {/* pager */}
          <div className="flex justify-between items-center mt-3 text-sm">
            <span>
              Showing{" "}
              {filtered.length===0?0:(currentPage-1)*entriesPerPage+1}{" "}
              to{" "}
              {Math.min(currentPage*entriesPerPage, filtered.length)}{" "}
              of {filtered.length} entries
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage<=1}
                onClick={()=>setCurrentPage(p=>p-1)}
                className={`px-4 py-1 rounded ${
                  currentPage<=1?"bg-gray-300":"bg-blue-500 text-white"
                }`}
              >
                Prev
              </button>
              <button
                disabled={currentPage>=totalPages}
                onClick={()=>setCurrentPage(p=>p+1)}
                className={`px-4 py-1 rounded ${
                  currentPage>=totalPages?"bg-gray-300":"bg-blue-500 text-white"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
