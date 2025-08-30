// src/pages/AddDeposit.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Select    from 'react-select';
import { jwtDecode } from 'jwt-decode';

import axios     from 'axios';

import Navbar  from '../Navbar';
import Sidebar from '../Sidebar';
import Loading from '../../Loading';      // ← spinner component you already have

export default function AddDeposit() {
  /* ─────────────────── essentials ─────────────────── */
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');          // null on “add”
  const nav    = useNavigate();

  const token = localStorage.getItem('token');
 useEffect(() => { if (!token) nav('/'); }, [token, nav]);
if (!token) return null;
        // boot to login when no token
  const headers = { Authorization: `Bearer ${token}` };

  /* decode once – pull the store list (might be [], a single id, or array) */
  const decoded         = jwtDecode(token);
  const allowedStoreIds = Array.isArray(decoded.stores)
    ? decoded.stores
    : decoded.stores ? [decoded.stores] : [];

  /* ─────────────────── ui / data state ─────────────────── */
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [loading,     setLoading    ] = useState(true);
  const [saving,      setSaving     ] = useState(false);

  const [stores,      setStores     ] = useState([]);            // filtered list
  const [accounts,    setAccounts   ] = useState([]);

  /* selection & derived */
  const [storeId,   setStoreId  ] = useState(allowedStoreIds[0] || null);
  const [cashAccId, setCashAccId] = useState(null);              // storeAccount
  const [creditOpts,setCreditOpts] = useState([]);               // children of cashAccId

  /* form fields */
  const [form, setForm] = useState({
    depositDate  : new Date().toLocaleDateString('en-CA'),
    referenceNo  : '',
    debitAccount : '',
    creditAccount: '',
    amount       : '',
    note         : ''
  });

  /* ─────────────────── helpers ─────────────────── */
  const handleInput  = e            => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleSelect = (k, sel)     => setForm(f => ({ ...f, [k]: sel ? sel.value : '' }));
  const resetFormForStore = ()      => setForm(f => ({ ...f, creditAccount: '', debitAccount: cashAccId }));

  /* ─────────────────── sidebar collapse on resize ─────────────────── */
  useEffect(() => {
    const onResize = () => setSidebarOpen(window.innerWidth >= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* ─────────────────── initial fetch (stores, accounts, deposit) ─────────────────── */
  useEffect(() => {
    const fetchStores = axios.get('/admin/store/add/store', { headers })
      .then(res => {
        const all = res.data.result || [];
        setStores(all.filter(s => allowedStoreIds.includes(String(s._id))));
      });

    const fetchAccounts = axios.get('/api/accounts', { headers })
      .then(res => setAccounts(res.data.data || []));

    const fetchDeposit = editId
      ? axios.get(`/api/deposits/${editId}`, { headers }).then(res => {
          const d = res.data.data;
         // Only override storeId if the deposit actually contains a store
         if (d.store) {
           const sId = typeof d.store === 'string' ? d.store : d.store._id;
           if (sId) setStoreId(sId);
         }

         // defensive extraction for accounts — the API might return either populated object or raw id
         const debitId  = d.debitAccount && (d.debitAccount._id || d.debitAccount) || '';
         const creditId = d.creditAccount && (d.creditAccount._id || d.creditAccount) || '';

         setForm({
           depositDate   : d.depositDate ? new Date(d.depositDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0,10),
           referenceNo   : d.referenceNo  || '',
           debitAccount  : debitId,
           creditAccount : creditId,
           amount        : d.amount       || '',
           note          : d.note         || ''
         });
        })
      : Promise.resolve();

    Promise.all([fetchStores, fetchAccounts, fetchDeposit])
      .catch(err => console.error('init-load error', err))
      .finally(() => setLoading(false));
  }, [editId, token]);   // nav not needed; we guard above

  /* ─────────────────── whenever store changes: resolve its “cash” account ─────────────────── */
  useEffect(() => {
    if (!storeId || !stores.length) return;

    const st = stores.find(s => s._id === storeId);
    const accId = typeof st.storeAccount === 'string'
      ? st.storeAccount
      : st.storeAccount?._id;

    setCashAccId(accId);
    setForm(f => ({ ...f, debitAccount: accId, creditAccount: '' })); // reset credit
  }, [storeId, stores]);

  /* ─────────────────── when cashAccId or account list available → build credit dropdown ─────────────────── */
  useEffect(() => {
    if (!cashAccId || !accounts.length) return;

    const kids = accounts
      .filter(a => {
        const pid = typeof a.parentAccount === 'string'
          ? a.parentAccount
          : a.parentAccount?._id;
        return pid === cashAccId;
      })
      .map(a => ({
        value: a._id,
        label: `${a.accountNumber} – ${a.accountName}`
      }));

    setCreditOpts(kids);
  }, [cashAccId, accounts]);

  /* ─────────────────── submit ─────────────────── */
  const submit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const url    = editId ? `/api/deposits/${editId}` : '/api/deposits';
      const method = editId ? 'put' : 'post';

      await axios[method](
        url,
        { ...form, store: storeId },
        { headers: { 'Content-Type': 'application/json', ...headers } }
      );

      alert(editId ? 'Deposit updated!' : 'Deposit created!');
      nav('/deposit-list');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ─────────────────── derived label for debit (cash) account ─────────────────── */
  const debitLabel = (() => {
    if (!cashAccId) return '—';
    const acc = accounts.find(a => a._id === cashAccId);
    return acc ? `${acc.accountNumber} – ${acc.accountName}` : '—';
  })();

  /* ─────────────────── render ─────────────────── */
  if (loading) return <Loading />;

  const storeOptions = stores.map(s => ({ value: s._id, label: s.StoreName }));

  return (
    <div className="flex h-screen flex-col">
      <Navbar isSidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={sidebarOpen} />
        <main className="flex-1 overflow-auto bg-gray-100 p-6">
          <div className="mx-auto max-w-3xl rounded bg-white p-6 shadow">
            <h1 className="mb-4 text-2xl font-bold">
              {editId ? 'Edit Deposit' : 'Add Deposit'}
            </h1>

            {/* Store selector appears ONLY when user has >1 store */}
            {allowedStoreIds.length > 1 && (
              <div className="mb-6">
                <label className="mb-1 block font-semibold">Store</label>
                <Select
                  options={storeOptions}
                  value={storeOptions.find(o => o.value === storeId) || null}
                  onChange={sel => {
                    setStoreId(sel ? sel.value : null);
                    /* reset derived pieces */
                    setCashAccId(null);
                    setCreditOpts([]);
                    setForm(f => ({ ...f, debitAccount: '', creditAccount: '' }));
                  }}
                  placeholder="— pick store —"
                  required
                />
              </div>
            )}

            {storeId ? (
              <form onSubmit={submit} className="space-y-6">
                {/* Date + Ref */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-semibold">Deposit Date</label>
                    <input
                      type="date"
                      name="depositDate"
                      value={form.depositDate}
                      onChange={handleInput}
                      required
                      className="w-full rounded border p-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-semibold">Reference No.</label>
                    <input
                      type="text"
                      name="referenceNo"
                      value={form.referenceNo}
                      onChange={handleInput}
                      placeholder="optional"
                      className="w-full rounded border p-2"
                    />
                  </div>
                </div>

                {/* Debit (fixed) */}
                <div>
                  <label className="mb-1 block font-semibold">Out</label>
                  <div className="rounded border bg-gray-100 p-2">{debitLabel}</div>
                </div>

                {/* Credit selector */}
                <div>
                  <label className="mb-1 block font-semibold">In</label>
                  <Select
                    options={creditOpts}
                    value={creditOpts.find(o => o.value === form.creditAccount) || null}
                    onChange={sel => handleSelect('creditAccount', sel)}
                    placeholder="— select credit account —"
                    isDisabled={!creditOpts.length}
                    required
                  />
                </div>

                {/* Amount + Note */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-semibold">Amount</label>
                    <input
                      type="number"
                      name="amount"
                      min="0"
                      step="0.01"
                      value={form.amount}
                      onChange={handleInput}
                      required
                      className="w-full rounded border p-2"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-semibold">Note</label>
                    <textarea
                      name="note"
                      rows={2}
                      value={form.note}
                      onChange={handleInput}
                      className="w-full rounded border p-2"
                      placeholder="optional"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className={`rounded px-6 py-2 text-white ${
                      saving
                        ? 'cursor-not-allowed bg-gray-400'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {saving ? 'Saving…' : editId ? 'Update' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => nav('/deposit-list')}
                    className="rounded bg-gray-500 px-6 py-2 text-white hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <p className="mt-8 text-center text-gray-500">
                Please select a store to continue.
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
