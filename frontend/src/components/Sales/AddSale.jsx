// src/components/AddSale.jsx

import React, { useEffect, useState, useRef, useMemo } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt, FaBarcode } from "react-icons/fa";
import { CameraIcon } from "@heroicons/react/outline";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import axios from "axios";
import Select from "react-select";
import dayjs from "dayjs";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
 const generateSaleRef = (lastRef) => {
   const year = new Date().getFullYear();
   if (!lastRef || typeof lastRef !== "string") {
     return `SO/${year}/01`;
   }
   const [prefix, yr, num] = lastRef.split("/");
   if (prefix !== "SO" || !/^\d{4}$/.test(yr) || isNaN(+num)) {
    return `SO/${year}/01`;
   }
   return `SO/${yr}/${String(+num + 1).padStart(2, "0")}`;
 };


export default function AddSale() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("id");

  // look-ups
  const [allItems, setAllItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [terminals, setTerminals] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // selections & form state
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [saleDate, setSaleDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [dueDate, setDueDate] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [items, setItems] = useState([]);
  const [otherCharges, setOtherCharges] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [couponType, setCouponType] = useState("");
  const [couponValue, setCouponValue] = useState(0);
  const [discountOnAll, setDiscountOnAll] = useState(0);
  const [discountOnAllType, setDiscountOnAllType] = useState("percentage");
  const [note, setNote] = useState("");

  // payment row
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [selectedPaymentType, setSelectedPaymentType] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedTerminal, setSelectedTerminal] = useState(null);
  const [paymentNote, setPaymentNote] = useState("");

  // previous payments
  const [prevPayments, setPrevPayments] = useState([]);

  // UI
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [query, setQuery] = useState("");
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const auth = {
  headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
};

  function stopScanner() {
  const reader = readerRef.current;

  if (reader) {
    if (typeof reader.reset === "function") {
      reader.reset();                     // old API (<= 0.0.8)
    } else if (typeof reader.stopContinuousDecode === "function") {
      reader.stopContinuousDecode();      // mid-API
    } else if (typeof reader.stopStreams === "function") {
      reader.stopStreams();               // newest API (2023+)
    }
    readerRef.current = null;             // keep things tidy
  }

  // always stop the MediaStream so the camera LED goes off
  videoRef.current?.srcObject?.getTracks().forEach(t => t.stop());
}

  // load look-ups
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return navigate("/login");
        const auth = { headers: { Authorization: `Bearer ${token}` } };

        const [respCust, respWh, respPT, respAcc, respTerm] =
  await Promise.all([
    axios.get("api/customer-data/all", auth),
    axios.get("api/warehouses", {                     // ← new
      ...auth,
      params: { scope: "mine" }                       //   filter to mine
    }),
            axios.get("api/payment-types", auth),
            axios.get("api/accounts", auth),
            axios.get("api/terminals", auth),
          ]);

        // flatten variants
       

        const custData = respCust.data.data || respCust.data;
        const custOptions = custData.map((c) => ({
          label: c.customerName,
          value: c._id,
        }));
        setCustomers(custOptions);

        // ── default to “Walk-in Customer” on a brand-new sale ──
        if (!editId) {
          const walkIn = custOptions.find(
            (o) => o.label.toLowerCase() === "walk-in customer"
          );
          setSelectedCustomer(walkIn ? walkIn.value : null);
        }

        // map warehouses and pull in cashAccount._id
        // map warehouses and pull in cashAccount._id
const allWh = respWh.data.data || [];
const activeWh = allWh.filter(w => w.status === "Active");
setWarehouses(
  activeWh.map(w => ({
    label: w.warehouseName,
    value: w._id,
    store: w.store,
    cashAccount: w.cashAccount?._id || w.cashAccount
  }))
);
if (!editId && activeWh.length) {
  const restrictedWarehouse = activeWh.find((w) => w.isRestricted && w.status === "Active");
  setSelectedWarehouse(restrictedWarehouse?._id || activeWh[0]?._id || null);
}

        setPaymentTypes(
          (respPT.data.data || respPT.data).map((p) => ({
            label: p.paymentTypeName,
            value: p._id,
            name: p.paymentTypeName.toLowerCase(),
          }))
        );

        setAccounts(
          (respAcc.data.data || respAcc.data).map((a) => ({
            label: a.accountName,
            value: a._id,
            parent: a.parentAccount,
          }))
        );

        setTerminals(
          (respTerm.data.data || respTerm.data).map((t) => ({
            label: t.tid,
            value: t._id,
            warehouse: t.warehouse,
          }))
        );

        if (editId) {
          const { data: sale } = await axios.get(
            `api/sales/${editId}`,
            auth
          );
          hydrateForEdit(sale);
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  async function fetchItems() {
  if (!selectedWarehouse) {
    setAllItems([]);
    return;
  }
  try {
    const token = localStorage.getItem("token");
    const auth  = { headers: { Authorization: `Bearer ${token}` } };
    const resp  = await axios.get(
      "api/items",
      { ...auth, params: { warehouse: selectedWarehouse } }
    );
    const raw = resp.data.data || [];
    const flat = raw.map((it) => {
      const isVar = Boolean(it.parentItemId);
      return {
        ...it,
        parentId:  isVar ? it.parentItemId : it._id,
        variantId: isVar ? it._id : null,
        itemName:  isVar
          ? `${it.itemName} / ${it.variantName}`
          : it.itemName,
      };
    });
    setAllItems(flat);
  } catch (err) {
    console.error("Fetch items error", err);
    setAllItems([]);
  }
}

useEffect(() => {
  fetchItems();
}, [selectedWarehouse]);


  const hydrateForEdit = (s) => {
    setSelectedWarehouse(s.warehouse?._id);
    setSelectedCustomer(s.customer?._id);
    setSaleDate(dayjs(s.saleDate).format("YYYY-MM-DD"));
    setDueDate(s.dueDate ? dayjs(s.dueDate).format("YYYY-MM-DD") : "");
    setReferenceNo(s.referenceNo || "");
    setOtherCharges(s.otherCharges || 0);
    setCouponCode(s.discountCouponCode || "");
    setCouponType(s.couponType || "");
    setCouponValue(s.couponValue || 0);
    setDiscountOnAll(s.discountOnBill || 0);
    setNote(s.note || "");
    const pay = s.payments?.[0];
    if (pay) {
      setPaymentAmount(pay.amount || 0);
      setPaymentNote(pay.paymentNote || "");
      setSelectedPaymentType(pay.paymentType?._id);
      setSelectedAccount(pay.account || null);
      setSelectedTerminal(pay.terminal || null);
    }
    setPrevPayments(s.payments || []);
    setItems(
      s.items.map((it) => ({
        parentId: it.item?._id || it._id,
        variantId: it.variant || null,
        itemName: it.itemName,
        itemCode: it.itemCode,
        salesPrice: it.unitPrice,
        discount: it.discount,
        taxRate: it.taxAmount
          ? (it.taxAmount * 100) / (it.unitPrice * it.quantity - it.discount)
          : 0,
        quantity: it.quantity,
        tax: it.tax?._id || null,
      }))
    );
  };

  // filter items by warehouse
  const filteredItems = useMemo(
    () => allItems.filter((i) => i.warehouse?._id === selectedWarehouse),
    [allItems, selectedWarehouse]
  );
  useEffect(() => {
    setItems((prev) =>
      prev.filter((it) => filteredItems.some((f) => f._id === it.parentId))
    );
  }, [filteredItems]);

  // live search
  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const rx = new RegExp(esc(query.trim()), "i");
    return filteredItems
      .filter(
        (it) =>
          rx.test(it.itemName) ||
          rx.test(it.itemCode) ||
          rx.test(it.barcodes?.join(" ") || "")
      )
      .slice(0, 15);
  }, [query, filteredItems]);

  const addItem = (row) => {
  const nameTxt = row.variantName
    ? `${row.itemName} / ${row.variantName}`
    : row.itemName;

  const existingIdx = items.findIndex(
    (it) =>
      it.parentId === (row.parentId || row._id) &&
      (it.variantId || null) === (row.variantId || null)
  );

  if (existingIdx !== -1) {
    // If item already exists, just increase quantity
    setItems((prev) =>
      prev.map((it, i) =>
        i === existingIdx
          ? {
              ...it,
              quantity: it.quantity + 1,
            }
          : it
      )
    );
  } else {
    // Otherwise, add as new
    setItems((prev) => [
      ...prev,
      {
        parentId: row.parentId || row._id,
        variantId: row.variantId || null,
        itemName: nameTxt,
        itemCode: row.itemCode,
        salesPrice: row.salesPrice || 0,
        discount: 0,
        taxRate: row.tax?.taxPercentage || 0,
        quantity: 1,
        tax: row.tax?._id || null,
      },
    ]);
  }
};


  // barcode scanner
  useEffect(() => {
    if (!scanning) return;
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;
    reader.decodeFromConstraints(
      { video: { facingMode: { exact: "environment" } } },
      videoRef.current,
      (res) => {
        if (res) {
          const code = res.getText();
          const hit = filteredItems.find(
            (i) =>
              i.itemCode === code ||
              i.barcodes?.includes(code) ||
              i.itemName.toLowerCase() === code.toLowerCase()
          );
          if (hit) addItem(hit);
          setScanning(false);
          stopScanner();
        }
      }
    );
    return () => {
      stopScanner();
    };
  }, [scanning, filteredItems]);

  // table helpers
  const modItem = (idx, field, value) =>
    setItems((p) =>
      p.map((row, i) =>
        i === idx
          ? {
              ...row,
              [field]: field === "itemName" ? value : Number(value),
            }
          : row
      )
    );
  const delItem = (i) => setItems((p) => p.filter((_, idx) => idx !== i));

  // totals
  const totals = useMemo(() => {
    
    let sub = 0;
    items.forEach((it) => {
      const base = (it.salesPrice || 0) * it.quantity - (it.discount || 0);
      const tax = (base * (it.taxRate || 0)) / 100;
      sub += base + tax;
    });
    
    const oc = Number(otherCharges) || 0;
    const coup =
      couponType === "percentage"
        ? (sub * couponValue) / 100
        : couponType === "value"
        ? Number(couponValue)
        : 0;
    const doa =
      discountOnAllType === "percentage"
        ? (sub * discountOnAll) / 100
        : Number(discountOnAll);
    const grand = sub + oc - coup - doa;
    return {
      sub: sub.toFixed(2),
      coup: coup.toFixed(2),
      doa: doa.toFixed(2),
      grand: grand > 0 ? grand.toFixed(2) : "0.00",
    };
  }, [
    items,
    otherCharges,
    couponType,
    couponValue,
    discountOnAll,
    discountOnAllType,
  ]);
  useEffect(() => {
    if (!editId) {
      setPaymentAmount(Number(totals.grand));
    }
  }, [totals.grand, editId]);

  // save / update
  const save = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const auth = { headers: { Authorization: `Bearer ${token}` } };

      if (!selectedWarehouse || !selectedCustomer || !items.length)
        return alert("Fill mandatory fields");
      if (paymentAmount > 0 && !selectedPaymentType)
        return alert("Pick payment type");
      setIsSubmitting(true);
      const mappedItems = items.map((row) => {
        const base = (row.salesPrice || 0) * row.quantity - (row.discount || 0);
        const tax = (base * (row.taxRate || 0)) / 100;
        return {
          item: row.parentId,
          variant: row.variantId || null,
          quantity: row.quantity,
          unitPrice: row.salesPrice,
          discount: row.discount,
          tax: row.tax || null,
          taxAmount: tax,
          subtotal: base + tax,
        };
      });

      const payments = [];
      if (paymentAmount > 0) {
        const p = {
          paymentType: selectedPaymentType,
          amount: Number(paymentAmount),
          paymentNote,
        };
        const mode = paymentTypes.find((x) => x.value === selectedPaymentType)
          ?.name;
        if (mode === "cash") p.account = selectedAccount;
        if (mode === "bank") p.terminal = selectedTerminal;
        payments.push(p);
      }

      const body = {
        warehouse: selectedWarehouse,
        customer: selectedCustomer,
        saleDate,
        dueDate: dueDate || null,
        referenceNo,
        items: mappedItems,
        otherCharges: Number(otherCharges) || 0,
        discountCouponCode: couponCode,
        couponType,
        couponValue: Number(couponValue) || 0,
        discountOnBill: Number(totals.doa),
        note,
        payments,
        subtotal: Number(totals.sub),
        grandTotal: Number(totals.grand),
        status: "Completed",
      };

      if (editId)
        await axios.put(
          `api/sales/${editId}`,
          body,
          auth
        );
      else
        await axios.post("api/sales", body, auth);

      alert("Saved ✔️");
      navigate("/sale-list");
    } catch (err) {
      alert(err.response?.data?.message || err.message);
      console.error(err);
    }
    finally{
      setIsSubmitting(false);
    }
  };

  // derive cash accounts from selected warehouse
  const selectedWh = warehouses.find((w) => w.value === selectedWarehouse);
  const cashAccounts =
    selectedWh && selectedWh.cashAccount
      ? accounts.filter((a) => a.value === selectedWh.cashAccount)
      : [];

  const mode = paymentTypes.find((p) => p.value === selectedPaymentType)
    ?.name;
  const isCash = mode === "cash";
  const isBank = mode === "bank";
   useEffect(() => {
  if (editId) return; // Don’t override when editing
  (async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found, redirecting to login");
        navigate("/login");
        return;
      }
      const auth = { headers: { Authorization: `Bearer ${token}` } };
      const resp = await axios.get("api/sales", auth);
      // backend replies { summary: {...}, sales: [...] }
      const sales = Array.isArray(resp.data.sales) ? resp.data.sales : [];
      
      // Filter non-return sales and sort by createdAt
      const normal = sales
        .filter((s) => !s.isReturn && !!s.referenceNo)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      console.log("Non-return sales:", normal); // Debug log
      
      // Get last referenceNo
      const lastRef = normal.length ? normal[0].referenceNo : null;
      console.log("Last referenceNo:", lastRef); // Debug log
      
      const newRef = generateSaleRef(lastRef);
      console.log("Generated referenceNo:", newRef); // Debug log
      
      setReferenceNo(newRef);
    } catch (e) {
      console.error("Could not auto-gen ref:", e);
      // Set default referenceNo on error
      const defaultRef = generateSaleRef(null);
      console.log("Using default referenceNo:", defaultRef); // Debug log
      setReferenceNo(defaultRef);
    }
  })();
}, [editId, navigate]);

  return (
    <div className="flex flex-col h-screen">
      <Navbar
        isSidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={sidebarOpen} />
        <main className="flex flex-col flex-grow p-2 md:p-4 overflow-x-auto">
          {/* breadcrumb */}
          <header className="bg-gray-200 rounded-md p-2 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-baseline gap-1">
              <h1 className="font-semibold text-lg">Sales</h1>
              <span className="text-xs">
                {editId ? "Update" : "Add"} Sale
              </span>
            </div>
            <nav className="flex items-center text-xs gap-1 text-gray-600">
              <NavLink
                to="/dashboard"
                className="flex items-center gap-1 hover:text-cyan-600"
              >
                <FaTachometerAlt /> Home
              </NavLink>
              <BiChevronRight />
              <NavLink to="/sale-list" className="hover:text-cyan-600">
                Sales List
              </NavLink>
            </nav>
          </header>

          {/* top grid */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="font-semibold text-sm">
                Warehouse *
              </label>
              <Select
                options={warehouses}
                value={
                  warehouses.find((o) => o.value === selectedWarehouse) ||
                  null
                }
                onChange={(o) => setSelectedWarehouse(o.value)}
              />
            </div>
            <div>
              <label className="font-semibold text-sm">
                Sale Date *
              </label>
              <input
                type="date"
                className="border rounded p-2 w-full"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
              />
            </div>
            <div>
              <label className="font-semibold text-sm">
                Due Date
              </label>
              <input
                type="date"
                className="border rounded p-2 w-full"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div>
              <label className="font-semibold text-sm">
                Customer *
              </label>
              <Select
                options={customers}
                value={
                  customers.find((o) => o.value === selectedCustomer) ||
                  null
                }
                onChange={(o) => setSelectedCustomer(o.value)}
              />
            </div>
            <div>
              <label className="font-semibold text-sm">
                Reference No
              </label>
              <input
                className="border rounded p-2 w-full"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
              />
            </div>
          </div>

          {/* search / barcode */}
          <div className="relative flex items-center mt-4">
            <FaBarcode className="mr-2 text-gray-500" />
            <input
              className="border rounded p-2 w-full"
              placeholder="Item name / code / barcode"
              value={query}
              onChange={(e) => {
                const val = e.target.value;
                setQuery(val);

                // if this is an exact barcode match, auto-add and clear
                const hit = filteredItems.find(i => i.barcodes?.includes(val));
                if (hit) {
                  addItem(hit);
                  setQuery("");
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && suggestions[0]) {
                  addItem(suggestions[0]);
                  setQuery("");
                }
              }}
            />
            <button
              className="ml-2"
              disabled={!selectedWarehouse}
              onClick={() => setScanning(true)}
            >
              <CameraIcon className="w-6 h-6 text-gray-500" />
            </button>

            {query && suggestions.length > 0 && (
              <ul className="absolute top-11 bg-white border rounded shadow w-full max-h-64 overflow-auto z-50">
                {suggestions.map((s) => (
                  <li
                    key={s._id}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      addItem(s);
                      setQuery("");
                    }}
                  >
                    <b>{s.itemCode}</b> – {s.itemName}
                    {s.barcodes?.length > 0 && (
                      <span className="text-gray-500">
                        ({s.barcodes[0]})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* items table */}
          <div className="overflow-x-auto mt-4 rounded">
            <table className="min-w-full border">
              <thead className="bg-sky-600 text-white text-sm">
                <tr>
                  <th className="p-1 border">Name</th>
                  <th className="p-1 border">Code</th>
                  <th className="p-1 border">Qty</th>
                  <th className="p-1 border">Price</th>
                  <th className="p-1 border">Disc</th>
                  <th className="p-1 border">Tax %</th>
                  <th className="p-1 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center p-2">
                      No items
                    </td>
                  </tr>
                ) : (
                  items.map((it, i) => (
                    <tr
                      key={i}
                      className="text-center text-sm odd:bg-gray-50"
                    >
                      <td className="border p-1">{it.itemName}</td>
                      <td className="border p-1">{it.itemCode}</td>
                      <td className="border p-1">
                        <input
                          type="number"
                          min="1"
                          className="border w-16"
                          value={it.quantity}
                          onChange={(e) =>
                            modItem(i, "quantity", e.target.value)
                          }
                        />
                      </td>
                      <td className="border p-1">
                        <input
                          type="number"
                          className="border w-20"
                          value={it.salesPrice}
                          onChange={(e) =>
                            modItem(i, "salesPrice", e.target.value)
                          }
                        />
                      </td>
                      <td className="border p-1">
                        <input
                          type="number"
                          className="border w-20"
                          value={it.discount}
                          onChange={(e) =>
                            modItem(i, "discount", e.target.value)
                          }
                        />
                      </td>
                      <td className="border p-1">
                        <input
                          type="number"
                          className="border w-16"
                          value={it.taxRate}
                          onChange={(e) =>
                            modItem(i, "taxRate", e.target.value)
                          }
                        />
                      </td>
                      <td className="border p-1">
                        <button
                          className="text-red-600"
                          onClick={() => delItem(i)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* totals & discounts */}
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <label>Other Charges</label>
                <input
                  type="number"
                  className="border p-1 w-28"
                  value={otherCharges}
                  onChange={(e) => setOtherCharges(e.target.value)}
                />
              </div>
              <div className="flex justify-between">
                <label>Coupon Code</label>
                <input
                  className="border p-1 w-40"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
              </div>
              <div className="flex justify-between items-center">
                <label>
                  Coupon {couponType === "percentage" ? "%" : "₹"}
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    className="border p-1 w-24"
                    value={couponValue}
                    onChange={(e) => setCouponValue(e.target.value)}
                  />
                  <select
                    className="border p-1"
                    value={couponType}
                    onChange={(e) => setCouponType(e.target.value)}
                  >
                    <option value="">None</option>
                    <option value="percentage">%</option>
                    <option value="value">Fixed</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <label>Discount on All</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    className="border p-1 w-24"
                    value={discountOnAll}
                    onChange={(e) => setDiscountOnAll(e.target.value)}
                  />
                  <select
                    className="border p-1"
                    value={discountOnAllType}
                    onChange={(e) =>
                      setDiscountOnAllType(e.target.value)
                    }
                  >
                    <option value="percentage">%</option>
                    <option value="value">Fixed</option>
                  </select>
                </div>
              </div>
              <div>
                <label>Note</label>
                <textarea
                  className="border p-2 w-full min-h-[80px]"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>
            <div className="border-l pl-4 space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold">Subtotal</span>
                <span>{totals.sub}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Other Charges</span>
                <span>{Number(otherCharges).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Coupon Disc.</span>
                <span>{totals.coup}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Disc. on All</span>
                <span>{totals.doa}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Grand Total</span>
                <span>{totals.grand}</span>
              </div>
            </div>
          </div>

          {/* previous payments */}
          {prevPayments.length > 0 && (
            <div className="mt-6">
              <h2 className="text-base font-semibold text-cyan-500 mb-2">
                Previous Payments
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full border bg-white">
                  <thead className="bg-gray-200 text-sm">
                    <tr>
                      <th className="border p-1">#</th>
                      <th className="border p-1">Date</th>
                      <th className="border p-1">Type</th>
                      <th className="border p-1">Amount</th>
                      <th className="border p-1">Note</th>
                      <th className="border p-1">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prevPayments.map((p, i) => (
                      <tr
                        key={i}
                        className="text-center odd:bg-gray-50 text-sm"
                      >
                        <td className="border p-1">{i + 1}</td>
                        <td className="border p-1">
                          {dayjs(p.paymentDate).format("DD-MMM-YY")}
                        </td>
                        <td className="border p-1">
                          {
                            paymentTypes.find(
                              (t) => t.value === p.paymentType
                            )?.label
                          }
                        </td>
                        <td className="border p-1">{p.amount}</td>
                        <td className="border p-1">{p.paymentNote || "–"}</td>
                        <td className="border p-1">
                          <Link
                            to={`/receipt/${editId}`}
                            className="text-sky-600 underline"
                          >
                            view
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* payment entry */}
          <div className="bg-gray-100 p-4 mt-6 rounded-lg space-y-4">
            <h2 className="text-lg font-semibold">Payment</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label>Amount</label>
                <input
                  type="number"
                  min="0"
                  className="border p-2 w-full"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              <div>
                <label>Payment Type</label>
                <Select
                  options={paymentTypes}
                  value={
                    paymentTypes.find(
                      (o) => o.value === selectedPaymentType
                    ) || null
                  }
                  onChange={(o) => {
                    setSelectedPaymentType(o.value);
                    setSelectedAccount(null);
                    setSelectedTerminal(null);
                  }}
                />
              </div>
              {isCash && (
                <div>
                  <label>Account</label>
                  <Select
                    options={cashAccounts}
                    value={
                      cashAccounts.find(
                        (o) => o.value === selectedAccount
                      ) || null
                    }
                    onChange={(o) =>
                      setSelectedAccount(o ? o.value : null)
                    }
                  />
                </div>
              )}
              {isBank && (
                <div>
                  <label>Terminal</label>
                  <Select
                    options={terminals.filter(
                      (t) => t.warehouse === selectedWarehouse
                    )}
                    value={
                      terminals.find(
                        (t) => t.value === selectedTerminal
                      ) || null
                    }
                    onChange={(o) =>
                      setSelectedTerminal(o ? o.value : null)
                    }
                    placeholder="Select TID"
                  />
                </div>
              )}
            </div>
            <div>
              <label>Payment Note</label>
              <textarea
                className="border p-2 w-full min-h-[80px]"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
              />
            </div>
          </div>

          {/* actions */}
          <div className="flex justify-center gap-4 mt-6">
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-10 py-2 rounded"
              onClick={save}
              disabled={isSubmitting}
            >
              {editId ? "Update" : "Save"}
            </button>
            <button
              className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-2 rounded"
              onClick={() => navigate("/sale-list")}
            >
              Cancel
            </button>
          </div>

          {/* scanner overlay */}
          {scanning && (
            <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-50">
              <div className="w-72 h-72 border-4 border-white overflow-hidden relative">
                <video
                  ref={videoRef}
                  className="object-cover w-full h-full"
                  autoPlay
                  muted
                  playsInline
                />
              </div>
              <button
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded"
                onClick={() => {
                  stopScanner();
                  setScanning(false);
                }}
              >
                Close
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
