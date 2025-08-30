// src/pages/AddMoneyTransfer.jsx
import React, { useEffect, useState } from "react";
import Select from "react-select";
import { useNavigate, useSearchParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";
import LoadingScreen from "../../Loading";
import axios from "axios";

export default function AddMoneyTransfer() {
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");

  const token = localStorage.getItem("token");
  useEffect(() => { if (!token) navigate("/"); }, [token, navigate]);
  if (!token) return null;
  const headers = { Authorization: `Bearer ${token}` };

  // stores allowed for this user (from JWT)
  const decoded = jwtDecode(token);
  const allowedStoreIds = Array.isArray(decoded.stores)
    ? decoded.stores
    : decoded.stores ? [decoded.stores] : [];

  // UI/data
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState([]);     // filtered by allowedStoreIds
  const [accounts, setAccounts] = useState([]);

  // selection & derived
  const [storeId, setStoreId] = useState(allowedStoreIds[0] || null); // current store
  const [storeCashAccId, setStoreCashAccId] = useState(null);         // store.storeAccount (creditAccount)
  const [debitOptions, setDebitOptions] = useState([]);               // children of storeCashAccId

  const [formData, setFormData] = useState({
    transferDate: new Date().toLocaleDateString("en-CA"),
    transferCode: "",
    debitAccount: "",
    creditAccount: "", // will be storeCashAccId
    amount: "",
    referenceNo: "",
    note: "",
  });

  // sidebar responsiveness
  useEffect(() => {
    const onResize = () => setSidebarOpen(window.innerWidth >= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // initial fetch (stores, accounts, existing transfer if editing)
  useEffect(() => {
    const fetchStores = axios
      .get("/admin/store/add/store", { headers })
      .then(res => {
        const all = res.data.result || [];
        // only show stores the user is assigned to (unless none in token, show none)
        const visible = all.filter(s => allowedStoreIds.includes(String(s._id)));
        setStores(visible);
      });

    const fetchAccounts = axios
      .get("/api/accounts", { headers })
      .then(res => setAccounts(res.data.data || []));

    const fetchTransfer = editId
      ? axios.get(`/api/money-transfers/${editId}`, { headers }).then(res => {
          const t = res.data.data;
          // infer store by matching creditAccount === store.storeAccount
          // (credit is the store’s cash account by your rule)
          const creditId = typeof t.creditAccount === "string"
            ? t.creditAccount : t.creditAccount?._id;
          setFormData({
            transferDate: new Date(t.transferDate).toISOString().slice(0, 10),
            transferCode: t.transferCode || "",
            debitAccount: typeof t.debitAccount === "string"
              ? t.debitAccount : t.debitAccount?._id || "",
            creditAccount: creditId || "",
            amount: t.amount || "",
            referenceNo: t.referenceNo || "",
            note: t.note || "",
          });
          // we’ll set storeId after stores load (below) by finding the store whose storeAccount === creditId
          setStoreId(prev => prev || null); // keep placeholder; next effect resolves it
        })
      : Promise.resolve();

    Promise.all([fetchStores, fetchAccounts, fetchTransfer])
      .catch(err => console.error("init-load error", err))
      .finally(() => setLoading(false));
  }, [editId, token]); // navigate guarded above

  // when stores are loaded, set storeId if editing (from creditAccount)
  useEffect(() => {
    if (!stores.length) return;
    if (editId && formData.creditAccount && !storeId) {
      const found = stores.find(s => {
        const sa = typeof s.storeAccount === "string" ? s.storeAccount : s.storeAccount?._id;
        return sa === formData.creditAccount;
      });
      if (found) setStoreId(found._id);
    }
    // if user only has one store, default to it
    if (!editId && stores.length === 1 && !storeId) {
      setStoreId(stores[0]._id);
    }
  }, [stores, editId, formData.creditAccount, storeId]);

  // when store changes: resolve storeCashAccId and set creditAccount
  useEffect(() => {
    if (!storeId || !stores.length) return;
    const st = stores.find(s => s._id === storeId);
    if (!st) return;

    const cashId = typeof st.storeAccount === "string"
      ? st.storeAccount
      : st.storeAccount?._id;
    setStoreCashAccId(cashId || null);

    setFormData(f => ({
      ...f,
      creditAccount: cashId || "",
      // if switching store, clear debitAccount (must choose from new children)
      debitAccount: editId ? f.debitAccount : ""
    }));
  }, [storeId, stores, editId]);

  // build debit options (children of storeCashAccId)
  useEffect(() => {
    if (!storeCashAccId || !accounts.length) {
      setDebitOptions([]);
      return;
    }
    const kids = accounts
      .filter(a => {
        const pid = typeof a.parentAccount === "string"
          ? a.parentAccount
          : a.parentAccount?._id;
        return pid === storeCashAccId;
      })
      .map(a => ({ value: a._id, label: `${a.accountNumber} – ${a.accountName}` }));
    setDebitOptions(kids);
  }, [storeCashAccId, accounts]);

  const onChange = e => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
  };
  const onSelect = (field, sel) => {
    setFormData(f => ({ ...f, [field]: sel ? sel.value : "" }));
  };

  const submit = async e => {
    e.preventDefault();
    try {
      // validations
      if (!storeId) return alert("Please select a store.");
      if (!formData.debitAccount) return alert("Please choose a debit account.");
      if (!formData.creditAccount) return alert("Missing credit account (store account).");
      if (formData.debitAccount === formData.creditAccount) {
        return alert("Debit and credit cannot be the same account.");
      }

      const url = editId ? `/api/money-transfers/${editId}` : "/api/money-transfers";
      const method = editId ? "put" : "post";
      await axios[method](url, { ...formData, store: storeId }, {
        headers: { "Content-Type": "application/json", ...headers }
      });
      alert(editId ? "Updated!" : "Created!");
      navigate("/money-transfer-list");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message);
    }
  };

  const creditLabel = (() => {
    if (!storeCashAccId) return "—";
    const a = accounts.find(x => x._id === storeCashAccId);
    return a ? `${a.accountNumber} – ${a.accountName}` : "—";
  })();

  if (loading) return <LoadingScreen />;

  const storeOptions = stores.map(s => ({ value: s._id, label: s.StoreName }));

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <div className="flex-1 p-4 bg-gray-100 overflow-auto">
          <div className="bg-white p-6 rounded shadow max-w-3xl mx-auto">
            <h1 className="text-2xl font-semibold mb-4">
              {editId ? "Edit" : "New"} Money Transfer
            </h1>

            {/* Store picker when user has multiple stores */}
            {allowedStoreIds.length > 1 && (
              <div className="mb-6">
                <label className="block font-medium">Store</label>
                <Select
                  options={storeOptions}
                  value={storeOptions.find(o => o.value === storeId) || null}
                  onChange={sel => {
                    setStoreId(sel ? sel.value : null);
                    setStoreCashAccId(null);
                    setDebitOptions([]);
                    setFormData(f => ({ ...f, debitAccount: "", creditAccount: "" }));
                  }}
                  placeholder="— pick store —"
                  required
                />
              </div>
            )}

            {storeId ? (
              <form onSubmit={submit} className="space-y-4">
                {/* Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium">Transfer Date</label>
                    <input
                      type="date"
                      name="transferDate"
                      value={formData.transferDate}
                      onChange={onChange}
                      className="w-full border p-2 rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium">Transfer Code</label>
                    <input
                      type="text"
                      name="transferCode"
                      value={formData.transferCode}
                      onChange={onChange}
                      className="w-full border p-2 rounded"
                      placeholder="e.g. MT1001"
                      required
                    />
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium">Debit Account</label>
                    <Select
                      options={debitOptions}
                      value={debitOptions.find(o => o.value === formData.debitAccount) || null}
                      onChange={sel => onSelect("debitAccount", sel)}
                      placeholder="— choose debit account —"
                      isDisabled={!debitOptions.length}
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium">Credit Account (Store)</label>
                    <div className="p-2 border rounded bg-gray-100">
                      {creditLabel}
                    </div>
                  </div>
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium">Amount</label>
                    <input
                      type="number"
                      name="amount"
                      min="0"
                      step="0.01"
                      value={formData.amount}
                      onChange={onChange}
                      className="w-full border p-2 rounded"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium">Reference No</label>
                    <input
                      type="text"
                      name="referenceNo"
                      value={formData.referenceNo}
                      onChange={onChange}
                      className="w-full border p-2 rounded"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                {/* Row 4 */}
                <div>
                  <label className="block font-medium">Note</label>
                  <textarea
                    name="note"
                    rows={2}
                    value={formData.note}
                    onChange={onChange}
                    className="w-full border p-2 rounded"
                    placeholder="Optional"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    {editId ? "Update" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    className="px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                  >
                    Close
                  </button>
                </div>
              </form>
            ) : (
              <p className="mt-8 text-center text-gray-500">
                Please select a store to continue.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
