// QuotationSummary.jsx  — optimized + toggle to include non‑stock items

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import dayjs from "dayjs";
import axios from "axios";
import Select from "react-select";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt, FaBarcode } from "react-icons/fa";
import { useNavigate, Link, useSearchParams } from "react-router-dom";

import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import SupplierPopup from "./SupplierPopup";
import RawLotModal from "./RawLotModal";

const sndNew = new Audio("/sounds/beep-new.mp3");
const sndRepeat = new Audio("/sounds/beep-repeat.mp3");
function beep(snd) {
  try {
    const oneShot = snd.cloneNode(true);
    const p = oneShot.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  } catch {}
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function useDebounced(value, ms = 160) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

const generateReferenceNo = (lastReferenceNo) => {
  const currentYear = new Date().getFullYear();
  if (!lastReferenceNo || typeof lastReferenceNo !== "string") {
    return `PO/${currentYear}/01`;
  }
  const parts = lastReferenceNo.split("/");
  if (
    parts.length !== 3 ||
    parts[0] !== "PO" ||
    !/^\d{4}$/.test(parts[1]) ||
    isNaN(parseInt(parts[2], 10))
  ) {
    return `PO/${currentYear}/01`;
  }
  const lastNumber = parseInt(parts[2], 10);
  return `PO/${parts[1]}/${String(lastNumber + 1).padStart(2, "0")}`;
};

export default function QuotationSummary() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const navigate = useNavigate();

  const token = localStorage.getItem("token") || "";
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const [isSidebarOpen, setSidebarOpen] = useState(
    () => !(typeof window !== "undefined" && window.innerWidth < 768)
  );

  const [defaultWarehouse, setDefaultWarehouse] = useState(null);

  const [options, setOptions] = useState({
    warehouse: [],
    suppliers: [],
    accounts: [],
    paymentType: [],
    terminals: [],
  });

  const [formData, setFormData] = useState({
    discountOnAll: 0,
    grandTotal: 0,
    items: [],
    note: "",
    otherCharges: 0,
    payments: [
      {
        account: null,
        amount: 0,
        paymentNote: "",
        paymentType: null,
        terminal: null,
      },
    ],
    purchaseCode: "",
    purchaseDate: dayjs().format("YYYY-MM-DD"),
    referenceNo: "",
    supplier: null,
    warehouse: null,
    createdBy: "",
    createdByModel: "",
  });

  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("amount");
  const [grandtotal, setGrandTotal] = useState(0);
  const [discountMoney, setDiscountMoney] = useState(0);

  const [showSupplierPop, setShowSupplierPop] = useState(false);
  const [rawModal, setRawModal] = useState({ open: false, rowIdx: null });

  // Items for the selected warehouse
  const [allItems, setAllItems] = useState([]);
  const [itemsFetching, setItemsFetching] = useState(false);
  const [isPending, startTransition] = useTransition();
  const itemsCtrl = useRef(null);

  // Cache items per (warehouse|includeZero)
  const cacheRef = useRef(new Map()); // key: `${whId}|${includeZero?1:0}` -> array

  // Include out-of-stock toggle (default off for speed)
  const [includeZero, setIncludeZero] = useState(false);

  // Scanner
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  // Search
  const [search, setSearch] = useState("");
  const debounced = useDebounced(search.trim().toLowerCase(), 160);

  // ─────────────────────────── Profile for default warehouse
  useEffect(() => {
    (async () => {
      try {
        if (!token) return navigate("/");
        const role = localStorage.getItem("role");
        const url = role === "admin" ? "/auth/profile" : "/admiaddinguser/profile";
        const { data } = await axios.get(url, authHeader);
        const dw =
          typeof data.defaultWarehouse === "string"
            ? data.defaultWarehouse
            : data.defaultWarehouse?._id;
        setDefaultWarehouse(dw || null);
      } catch (err) {
        console.error("Profile fetch failed:", err);
      }
    })();
  }, [navigate, token]);

  // ─────────────────────────── Fetch lists
  useEffect(() => {
    (async () => {
      try {
        if (!token) return navigate("/");

        // Warehouses
        const wRes = await axios.get("/api/warehouses", {
   ...authHeader,
   params: { scope: "mine" },     // 🔑 show only Default + Group + sub-user WHs
 });
        const allWh = wRes.data.data || [];
        const activeWh = allWh
          .filter((w) => w.status === "Active")
          .map((w) => ({
            label: w.warehouseName,
            value: w._id,
            cashAccount: w.cashAccount?._id || w.cashAccount,
          }));
        setOptions((p) => ({ ...p, warehouse: activeWh }));

        // Default: use profile’s default warehouse if not editing
        if (!id && activeWh.length) {
          const first = activeWh[0]?.value || null;
          setFormData((prev) => ({
            ...prev,
            warehouse: defaultWarehouse || first,
          }));
        }

        // Suppliers
        const sRes = await axios.get("/api/suppliers", authHeader);
        const suppliers = (sRes.data.data || [])
          .filter((s) => s.supplierName)
          .map((s) => ({ label: s.supplierName, value: s._id }));
        setOptions((p) => ({ ...p, suppliers }));

        // Accounts
        const aRes = await axios.get("/api/accounts", authHeader);
        const accounts = (aRes.data.data || []).map((acc) => ({
          label: acc.accountNumber,
          value: acc._id,
        }));
        setOptions((p) => ({ ...p, accounts }));

        // Payment types
        const ptRes = await axios.get("/api/payment-types", authHeader);
        const paymentType = (ptRes.data.data || []).map((t) => ({
          label: t.paymentTypeName,
          value: t._id,
          name: t.paymentTypeName.toLowerCase(),
        }));
        setOptions((p) => ({ ...p, paymentType }));

        // Terminals
        const tRes = await axios.get("/api/terminals", authHeader);
        const terminals = (tRes.data.data || []).map((t) => ({
          label: t.tid,
          value: t._id,
          warehouse: t.warehouse?._id || t.warehouse,
        }));
        setOptions((p) => ({ ...p, terminals }));
      } catch (err) {
        alert(err.response?.data?.message || err.message);
      }
    })();
  }, [id, defaultWarehouse, navigate, token]);

  // ─────────────────────────── When creating, auto referenceNo (skip returns & BULK/)
  useEffect(() => {
    if (id) return;
    (async () => {
      try {
        const { data } = await axios.get("/api/purchases", authHeader);
        const purchases = data.data || [];
        const normal = purchases.filter(
          (p) => !p.isReturn && !(p.referenceNo || "").startsWith("BULK/")
        );
        const lastRef = normal.length ? normal[normal.length - 1].referenceNo : null;
        const newRef = generateReferenceNo(lastRef);
        setFormData((p) => ({ ...p, referenceNo: newRef }));
      } catch (e) {
        console.error("Ref no fetch failed:", e);
      }
    })();
  }, [id]);

  // ─────────────────────────── Edit flow: fetch purchase by id
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data } = await axios.get(`/api/purchases/${id}`, authHeader);
        const purchase = data.data;

        setFormData({
          ...purchase,
          warehouse: purchase.warehouse?._id || purchase.warehouse,
          supplier: purchase.supplier?._id || purchase.supplier,
          purchaseDate: purchase.purchaseDate
            ? dayjs(purchase.purchaseDate).format("YYYY-MM-DD")
            : dayjs().format("YYYY-MM-DD"),
          items: (purchase.items || []).map((it) => ({
            item: it.item?._id || it.item,
            variant: it.variant || null,
            itemName:
              it.item?.parentItemId
                ? `${it.item?.itemName} / ${it.item?.variantName || "Variant"}`
                : it.item?.itemName,
            quantity: it.quantity || 1,
            purchasePrice: it.purchasePrice || 0,
            mrp: it.mrp || 0,
            expiryDate: it.expiryDate || "",
            discount: it.discount || 0,
            salesPrice: it.salesPrice || 0,
            totalAmount:
              it.totalAmount ||
              (it.quantity || 0) * (it.purchasePrice || 0) - (it.discount || 0),
          })),
          payments:
            purchase.payments?.length > 0
              ? purchase.payments.map((p) => ({
                  account: p.account?._id || p.account,
                  amount: p.amount || 0,
                  paymentNote: p.paymentNote || "",
                  paymentType: p.paymentType?._id || p.paymentType,
                  terminal: p.terminal?._id || p.terminal,
                }))
              : [
                  {
                    account: null,
                    amount: 0,
                    paymentNote: "",
                    paymentType: null,
                    terminal: null,
                  },
                ],
        });

        setGrandTotal(purchase.grandTotal || 0);
        setSubtotal(purchase.subtotal || 0);
        setDiscountMoney(purchase.discountOnAll || 0);
        setDiscount(purchase.discountOnAll || 0);
      } catch (err) {
        alert(err.response?.data?.message || err.message);
      }
    })();
  }, [id]);

  // ─────────────────────────── Items of selected warehouse (with abort + cache + toggle)
  async function fetchItems(whId, includeZeroFlag) {
  if (!whId) {
    setAllItems([]);
    return;
  }

  const cacheKey = `${whId}|${includeZeroFlag ? 1 : 0}`;
  const cached = cacheRef.current.get(cacheKey);
  if (cached) {
    startTransition(() => setAllItems(cached));
  }

  if (itemsCtrl.current) itemsCtrl.current.abort();
  const ctrl = new AbortController();
  itemsCtrl.current = ctrl;

  setItemsFetching(true);
  try {
    const { data } = await axios.get("/api/items", {
      ...authHeader,
      signal: ctrl.signal,
      params: { warehouse: whId, includeZero: includeZeroFlag ? 1 : 0 },
    });

    const flat = (data.data || []).map((it) => {
      const isVar = Boolean(it.parentItemId);
      return {
        id: isVar ? it.parentItemId : it._id,
        variantId: isVar ? it._id : null,
        itemName: isVar
          ? `${it.itemName} / ${it.variantName || "Variant"}`
          : it.itemName,
        itemCode: it.itemCode || "",
        barcodes: it.barcodes || [],
        mrp: it.mrp || 0,
        purchasePrice: it.purchasePrice || 0,
        salesPrice: it.salesPrice || 0, // Add salesPrice
        expiryDate: it.expiryDate || null,
        warehouseId: it.warehouse?._id || it.warehouse || null,
      };
    });

    cacheRef.current.set(cacheKey, flat);
    startTransition(() => setAllItems(flat));
  } catch (e) {
    if (e.name !== "CanceledError" && e.code !== "ERR_CANCELED") {
      alert(e.response?.data?.message || e.message);
    }
  } finally {
    setItemsFetching(false);
  }
}

  // trigger on warehouse OR toggle change
  useEffect(() => {
    fetchItems(formData.warehouse, includeZero);
    return () => itemsCtrl.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.warehouse, includeZero]);

  // ─────────────────────────── Search results (memoized + debounced)
  const filteredItems = useMemo(() => {
    if (!debounced) return [];
    const rx = new RegExp(esc(debounced), "i");
    return allItems
      .filter(
        (i) =>
          rx.test(i.itemName) ||
          rx.test(i.itemCode) ||
          (i.barcodes || []).some((b) => rx.test(b))
      )
      .slice(0, 15);
  }, [debounced, allItems]);

  // ─────────────────────────── Table row edits
 function handleItemFieldChange(index, field, raw, operation = null) {
  setFormData((prev) => {
    const items = [...prev.items];

    if (field === "mrp" || field === "purchasePrice" || field === "salesPrice") {
      if (raw === "") {
        items[index] = { ...items[index], [field]: "" };
        return { ...prev, items };
      }
    }

    const curMRP = Number(items[index].mrp) || 0;
    const curSalesPrice = Number(items[index].salesPrice) || 0;

    let value = raw;
    if (field === "quantity" && operation) {
      const q = Number(items[index].quantity) || 1;
      value = operation === "increment" ? q + 1 : Math.max(1, q - 1);
    } else if (field === "purchasePrice" && Number(raw) > curSalesPrice && curSalesPrice > 0) {
      alert(`Purchase Price cannot exceed Sales Price (${curSalesPrice}).`);
      value = curSalesPrice;
    } else if ((field === "salesPrice" || field === "purchasePrice") && Number(raw) > curMRP && curMRP > 0) {
      alert(
        `${field === "salesPrice" ? "Sales Price" : "Purchase Price"} cannot exceed MRP (${curMRP}).`
      );
      value = curMRP;
    } else {
      value = field === "expiryDate" ? raw : Number(raw) || 0;
    }

    const old = items[index];
    const q = field === "quantity" ? Number(value) || 1 : Number(old.quantity) || 1;
    const cost =
      field === "purchasePrice" ? Number(value) || 0 : Number(old.purchasePrice) || 0;
    const disc = field === "discount" ? Number(value) || 0 : Number(old.discount) || 0;

    items[index] = {
      ...old,
      [field]: field === "expiryDate" ? value : Number(value) || (field.endsWith("Price") ? 0 : old[field]),
      totalAmount: q * cost - disc,
    };

    return { ...prev, items };
  });
}

  function handleRemoveItem(idx) {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  }

  // ─────────────────────────── Add item from list
  function addItem(hit) {
  if (!hit) return;

  setFormData((prev) => {
    const idx = prev.items.findIndex(
      (r) => r.item === hit.id && (r.variant || null) === (hit.variantId || null)
    );

    if (idx >= 0) {
      const items = [...prev.items];
      const r = items[idx];
      const qty = (r.quantity || 1) + 1;
      items[idx] = {
        ...r,
        quantity: qty,
        totalAmount: qty * (r.purchasePrice || 0) - (r.discount || 0),
      };
      beep(sndRepeat);
      return { ...prev, items };
    }

    beep(sndNew);
    return {
      ...prev,
      items: [
        ...prev.items,
        {
          item: hit.id,
          variant: hit.variantId || null,
          itemName: hit.itemName,
          quantity: 1,
          purchasePrice: hit.purchasePrice || 0,
          mrp: hit.mrp || 0,
          expiryDate: hit.expiryDate || "",
          discount: 0,
          salesPrice: hit.salesPrice || 0, // Use salesPrice from hit
          totalAmount: (hit.purchasePrice || 0) - 0,
        },
      ],
    };
  });

  setSearch("");
}

  // ─────────────────────────── Totals
  useEffect(() => {
    const sub = (formData.items || []).reduce((acc, it) => {
      const t =
        (Number(it.quantity) || 0) * (Number(it.purchasePrice) || 0) -
        (Number(it.discount) || 0);
      return acc + t;
    }, 0);

    let discAmt = Number(discount) || 0;
    if (discountType === "percent") discAmt = (sub * (Number(discount) || 0)) / 100;

    const g = sub + (Number(formData.otherCharges) || 0) - discAmt;

    setSubtotal(sub);
    setDiscountMoney(discAmt);
    setGrandTotal(g > 0 ? g : 0);

    setFormData((prev) => ({
      ...prev,
      grandTotal: Number.isFinite(g) ? g : 0,
      discountOnAll: discAmt,
    }));
  }, [formData.items, formData.otherCharges, discount, discountType]);

  // keep payment amount synced to grand total
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      payments: [{ ...(prev.payments?.[0] || {}), amount: grandtotal }],
    }));
  }, [grandtotal]);

  // ─────────────────────────── Payment helpers
  const selectedWarehouse = options.warehouse.find((w) => w.value === formData.warehouse);
  const cashAccounts =
    selectedWarehouse && selectedWarehouse.cashAccount
      ? options.accounts.filter((a) => a.value === selectedWarehouse.cashAccount)
      : [];
  const paymentMode = options.paymentType.find(
    (pt) => pt.value === formData.payments?.[0]?.paymentType
  )?.name;
  const isCashMode = paymentMode === "cash";
  const isBankMode = paymentMode === "bank";

  function handleChange(e) {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]:
        e.target.type === "number" ? Number(e.target.value) : e.target.value,
    }));
  }

  function handlePayment(e) {
    setFormData((prev) => ({
      ...prev,
      payments: [
        {
          ...(prev.payments?.[0] || {}),
          [e.target.name]:
            e.target.type === "number" ? Number(e.target.value) : e.target.value,
        },
      ],
    }));
  }

  const handlePaymentSelect = (name) => (opt) => {
    setFormData((prev) => ({
      ...prev,
      payments: [
        {
          ...(prev.payments?.[0] || {}),
          [name]: opt ? opt.value : null,
        },
      ],
    }));
  };

  function handleSelectChange(opt, name) {
    setFormData((prev) => ({ ...prev, [name]: opt ? opt.value : null }));
  }

  async function getLiveBalance(accountId) {
    const { data: wrap } = await axios.get(`/api/by-cash-account/${accountId}`, authHeader);
    const warehouseId = wrap?.warehouseId;
    const { data } = await axios.get("/api/cash-summary", {
      ...authHeader,
      params: { warehouseId },
    });
    return data.liveBalance;
  }

  // ─────────────────────────── Submit
 async function sendData() {
  const updatedFormData = {
    ...formData,
    items: formData.items.map(item => 
      item.isRaw ? { ...item, quantity: 0 } : item
    ),
  };
  await axios.post("/api/purchases", updatedFormData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  alert("Created Successfully");
  navigate("/purchase-list");
}

async function postData() {
  const updatedFormData = {
    ...formData,
    items: formData.items.map(item => 
      item.isRaw ? { ...item, quantity: 0 } : item
    ),
  };
  await axios.put(`/api/purchases/${id}`, updatedFormData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  alert("Updated Successfully");
  navigate("/purchase-list");
}

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.warehouse) return alert("Please select a warehouse.");
    if (!formData.supplier) return alert("Please select a supplier.");
    if (!formData.purchaseDate) return alert("Please select a purchase date.");
    if ((formData.items || []).length === 0) return alert("Please add at least one item.");
    if (formData.grandTotal <= 0) return alert("Grand total must be greater than zero.");
    if (formData.payments?.[0]?.amount > 0 && !formData.payments?.[0]?.paymentType) {
      return alert("Please select a payment type.");
    }

    const payment = formData.payments?.[0] || {};
    if (payment.amount > 0 && payment.account) {
      const balance = await getLiveBalance(payment.account);
      if (payment.amount > balance) {
        alert(`Insufficient funds. You only have ₹${balance.toFixed(2)} available.`);
        return;
      }
    }

    try {
      if (id) await postData();
      else await sendData();
    } catch (err) {
      alert(`Unsuccessful: ${err.response?.data?.message || err.message}`);
    }
  }

  // clear cart / stop scanner on warehouse change (keep)
  const prevWarehouse = useRef(null);
  useEffect(() => {
    if (!prevWarehouse.current) {
      prevWarehouse.current = formData.warehouse;
      return;
    }
    if (prevWarehouse.current !== formData.warehouse) {
      const reader = codeReaderRef.current;
      if (reader?.stopStreams) reader.stopStreams();
      const s = videoRef.current?.srcObject;
      if (s) s.getTracks().forEach((t) => t.stop());
      setScanning(false);
      setFormData((fd) => ({ ...fd, items: [] }));
      setSearch("");
    }
    prevWarehouse.current = formData.warehouse;
  }, [formData.warehouse]);

  // ─────────────────────────── Scanner
  async function startScanner() {
    if (!formData.warehouse) {
      alert("Please select a warehouse to scan items.");
      return;
    }
    setScanning(true);

    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;

    try {
      const devices = await codeReader.listVideoInputDevices();
      if (!devices.length) throw new Error("No camera found");
      const deviceId = devices[0].deviceId;

      const result = await codeReader.decodeOnceFromVideoDevice(
        deviceId,
        videoRef.current
      );

      const s = videoRef.current?.srcObject;
      if (s) {
        s.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }

      const text = result.getText();
      const hit = allItems.find(
        (i) =>
          i.warehouseId === formData.warehouse &&
          (i.itemCode === text || (i.barcodes || []).includes(text))
      );
      if (hit) addItem(hit);
      else alert("Scanned code not found.");
    } catch (e) {
      console.error("Scanner error:", e);
      alert("Scanner failed: " + e.message);
    } finally {
      setScanning(false);
    }
  }

  useEffect(() => {
    return () => {
      const reader = codeReaderRef.current;
      if (!reader) return;
      if (typeof reader.stopStreams === "function") reader.stopStreams();
      else if (typeof reader.reset === "function") reader.reset();
    };
  }, []);

  // ─────────────────────────── Raw material modal
  function saveRawData({ bulkQty, bulkUnit, bulkCost }) {
    setFormData((prev) => {
      const items = [...prev.items];
      const it = items[rawModal.rowIdx];
      items[rawModal.rowIdx] = {
        ...it,
        isRaw: true,
        bulkQty,
        bulkUnit,
        bulkCost,
        quantity: bulkQty,
        mrp: +(bulkCost / bulkQty).toFixed(4),
        purchasePrice: +(bulkCost / bulkQty).toFixed(4),
        discount: 0,
        totalAmount: bulkCost,
        salesPrice: 0,
      };
      return { ...prev, items };
    });
    setRawModal({ open: false, rowIdx: null });
  }

  // ─────────────────────────── Render
  const refreshing = itemsFetching || isPending;

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex">
        <div className="w-auto">
          <Sidebar isSidebarOpen={isSidebarOpen} />
        </div>

        <div className="overflow-x-auto flex flex-col p-2 md:p-2 min-h-screen w-full">
          <header className="flex flex-col items-center justify-between p-4 bg-gray-100 rounded-md shadow sm:flex-row">
            <div className="flex items-baseline gap-1 text-center sm:flex-row sm:text-left">
              <h1 className="text-lg font-semibold truncate sm:text-xl">Purchase</h1>
              <span className="text-xs text-gray-600 sm:text-sm">Add/Update Purchase</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center mt-2 text-xs text-gray-500 sm:justify-start sm:text-sm sm:mt-0">
              <Link to="/dashboard" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                <FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600" /> Home
              </Link>
              <BiChevronRight className="mx-1 sm:mx-2" />
              <Link to="/purchase-list" className="text-gray-700 no-underline hover:text-cyan-600">Purchase List</Link>
              <BiChevronRight className="mx-1 sm:mx-2" />
              <Link to="/purchase-new" className="text-gray-700 no-underline hover:text-cyan-600">New Purchase</Link>
            </nav>
          </header>

          <form onSubmit={handleSubmit}>
            {/* Header block */}
            <div className="p-2 mt-2 border-t-4 rounded-lg border-cyan-500">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <label className="block text-sm font-medium">
                  Warehouse <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center w-full sm:w-64">
                  <Select
                    className="w-full"
                    options={options.warehouse}
                    onChange={(opt) => handleSelectChange(opt, "warehouse")}
                    value={options.warehouse.find((o) => o.value === formData.warehouse) || null}
                    placeholder="Select Warehouse"
                  />
                  {refreshing && (
                    <span className="ml-2 text-xs text-gray-500">Refreshing…</span>
                  )}
                </div>

                {/* ⬅️ New: Include out-of-stock toggle */}
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeZero}
                    onChange={(e) => setIncludeZero(e.target.checked)}
                    disabled={!formData.warehouse}
                  />
                  Include out‑of‑stock
                </label>
              </div>

              <div className="flex flex-col mb-4 sm:flex-row items-start sm:items-center">
                <label className="block mt-2 mb-1 text-sm font-medium">
                  Supplier Name <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center w-full mt-2 sm:mt-0 sm:ml-4 sm:w-64 border rounded">
                  <Select
                    className="w-full"
                    options={options.suppliers}
                    onChange={(o) => handleSelectChange(o, "supplier")}
                    value={options.suppliers.find((x) => x.value === formData.supplier) || null}
                    placeholder="Select Supplier"
                  />
                  <span
                    onClick={() => setShowSupplierPop(true)}
                    title="Add new supplier"
                    className="px-3 py-[6px] text-lg font-bold text-blue-600 border-l cursor-pointer hover:bg-gray-100"
                  >
                    +
                  </span>
                </div>
              </div>

              <div className="flex flex-col mb-2 sm:flex-row items-start sm:items-center">
                <label className="block mt-2 mb-1 text-sm font-medium">Reference No.</label>
                <input
                  type="text"
                  name="referenceNo"
                  value={formData.referenceNo}
                  readOnly
                  className="w-full px-3 py-2 mt-2 border rounded bg-gray-100 sm:w-64 sm:mt-0 sm:ml-7"
                  placeholder="Auto-generated"
                />
              </div>

              <div className="flex flex-col mb-2 sm:flex-row items-start sm:items-center">
                <label className="block mt-2 mb-1 text-sm font-medium">Purchase Date</label>
                <input
                  type="date"
                  name="purchaseDate"
                  onChange={handleChange}
                  className="w-full px-3 py-2 mt-2 border rounded sm:w-64 sm:mt-0 sm:ml-6"
                  required
                  value={formData.purchaseDate ? dayjs(formData.purchaseDate).format("YYYY-MM-DD") : ""}
                />
              </div>
            </div>

            {/* Search / barcode */}
            <div className="relative flex justify-center p-2 border-t-2 border-gray-500 rounded-lg">
              <FaBarcode className="w-12 h-10 mt-2 mr-2 text-gray-500" />
              <input
                type="text"
                placeholder="Item name / Barcode / Item code"
                className="w-full h-10 p-2 mt-2 border sm:w-96"
                disabled={!formData.warehouse}
                value={search}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearch(val);

                  // auto-add on exact barcode hit for current warehouse
                  const hit = allItems.find(
                    (i) =>
                      i.warehouseId === formData.warehouse &&
                      (i.barcodes || []).includes(val)
                  );
                  if (hit) addItem(hit);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (filteredItems[0]) addItem(filteredItems[0]);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => filteredItems[0] && addItem(filteredItems[0])}
                disabled={!search || !formData.warehouse || !filteredItems[0]}
                className={`ml-2 px-4 py-2 text-white ${
                  search && formData.warehouse && filteredItems[0]
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                Add
              </button>
              <button
                type="button"
                onClick={startScanner}
                disabled={!formData.warehouse}
                className={`ml-2 p-2 rounded-full ${
                  formData.warehouse
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "bg-gray-400 text-gray-600 cursor-not-allowed"
                }`}
              >
                📷
              </button>

              {scanning && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-70">
                  <div className="w-72 h-72 border-4 border-white rounded-lg overflow-hidden">
                    <video ref={videoRef} className="object-cover w-full h-full" autoPlay muted playsInline />
                  </div>
                  <button
                    onClick={() => {
                      const reader = codeReaderRef.current;
                      if (reader?.stopStreams) reader.stopStreams();
                      setScanning(false);
                    }}
                    className="px-4 py-2 mt-6 text-white bg-red-600 rounded hover:bg-red-700"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {search && filteredItems.length > 0 && (
                <div className="absolute z-50 w-full bg-white border rounded-lg shadow-lg top-20 sm:w-96 max-h-60 overflow-y-auto">
                  <ul>
                    {filteredItems.map((i) => (
                      <li
                        key={i.id + (i.variantId || "")}
                        className="p-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => addItem(i)}
                      >
                        <strong>{i.itemCode}</strong> - {i.itemName}
                        {i.barcodes?.length > 0 && (
                          <span className="text-gray-500"> ({i.barcodes[0]})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {search && filteredItems.length === 0 && (
                <p className="mt-2 text-sm text-gray-500">No items found.</p>
              )}
            </div>

            {/* Items table */}
            <div className="mt-4 overflow-x-auto border-b-2 border-gray-500 rounded-lg max-h-96">
              <table className="w-full min-w-[1200px] border border-gray-300 text-sm">
                <thead>
                  <tr className="text-center text-white bg-sky-600">
                    <th className="p-3 text-base font-semibold border">Item Name</th>
                    <th className="p-3 text-base font-semibold border">Quantity</th>
                    <th className="p-3 text-base font-semibold border">MRP</th>
                    <th className="p-3 text-base font-semibold border">Expiry Date</th>
                    <th className="p-3 text-base font-semibold border">Purchase Price</th>
                    <th className="p-3 text-base font-semibold border">Discount (₹)</th>
                    <th className="p-3 text-base font-semibold border">Sales Price</th>
                    <th className="p-3 text-base font-semibold border">Total Amount</th>
                    <th className="p-3 text-base font-semibold border">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="p-4 text-center border text-base">
                        No items added
                      </td>
                    </tr>
                  ) : (
                    formData.items.map((row, index) => (
                      <tr key={row.item + (row.variant || "")} className="text-center">
                        <td className="p-3 border text-base">{row.itemName || "N/A"}</td>
                        <td className="p-3 border">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleItemFieldChange(index, "quantity", null, "decrement")}
                              className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 text-lg"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={row.quantity || 1}
                              onChange={(e) =>
                                handleItemFieldChange(index, "quantity", e.target.value)
                              }
                              className="w-24 px-2 py-1 border rounded text-center text-base"
                              style={{ MozAppearance: "textfield" }}
                            />
                            <button
                              type="button"
                              onClick={() => handleItemFieldChange(index, "quantity", null, "increment")}
                              className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 text-lg"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="p-3 border">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={row.mrp ?? ""}
                            onChange={(e) => handleItemFieldChange(index, "mrp", e.target.value)}
                            className="w-24 px-2 py-1 border rounded text-center text-base"
                          />
                        </td>
                        <td className="p-3 border">
                          <input
                            type="date"
                            value={row.expiryDate ? dayjs(row.expiryDate).format("YYYY-MM-DD") : ""}
                            onChange={(e) =>
                              handleItemFieldChange(index, "expiryDate", e.target.value)
                            }
                            className="w-32 px-2 py-1 border rounded text-base"
                          />
                        </td>
                        <td className="p-3 border">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={row.purchasePrice ?? ""}
                            onChange={(e) =>
                              handleItemFieldChange(index, "purchasePrice", e.target.value)
                            }
                            className="w-24 px-2 py-1 border rounded text-center text-base"
                          />
                        </td>
                        <td className="p-3 border">
                          <input
                            type="number"
                            min="0"
                            value={row.discount || 0}
                            onChange={(e) =>
                              handleItemFieldChange(index, "discount", e.target.value)
                            }
                            className="w-24 px-2 py-1 border rounded text-center text-base"
                          />
                        </td>
                        <td className="p-3 border">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={row.salesPrice ?? ""}
                            onChange={(e) =>
                              handleItemFieldChange(index, "salesPrice", e.target.value)
                            }
                            className="w-24 px-2 py-1 border rounded text-center"
                          />
                        </td>
                        <td className="p-3 border text-base">
                          {(Number(row.quantity) || 1) * (Number(row.purchasePrice) || 0) -
                            (Number(row.discount) || 0)}
                        </td>
                        <td className="p-3 border">
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              className="text-blue-600 hover:text-blue-800 font-medium"
                              onClick={() => handleRemoveItem(index)}
                            >
                              Remove
                            </button>
                            <button
                              type="button"
                              className={`text-sm ${
                                row.isRaw ? "text-yellow-700 font-semibold" : "text-gray-600"
                              } hover:text-yellow-800`}
                              onClick={() => setRawModal({ open: true, rowIdx: index })}
                            >
                              {row.isRaw ? "Edit Raw" : "Raw Material"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals + notes */}
            <div className="flex flex-col sm:flex-row">
              <div className="mb-2">
                <div className="flex gap-5 mt-5 mb-4">
                  <label className="block text-sm font-medium">Total Quantities</label>
                  <p className="text-green-600">
                    {formData.items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0)}
                  </p>
                </div>

                <div className="flex gap-5 mb-4">
                  <label className="block text-sm font-medium">Other Charges</label>
                  <input
                    type="number"
                    min="0"
                    name="otherCharges"
                    value={formData.otherCharges}
                    onChange={handleChange}
                    className="w-full px-3 py-2 ml-2 border rounded sm:w-64"
                    placeholder="Enter other charges"
                  />
                </div>

                <div className="flex gap-5 mb-4">
                  <label className="block text-sm font-medium">Discount on All</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      min="0"
                      name="discountOnAll"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="w-full px-2 py-2 border rounded sm:w-32"
                      placeholder="Enter discount"
                    />
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="w-32 px-2 border rounded"
                    >
                      <option value="percent">Per%</option>
                      <option value="amount">Amount</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-20 mt-2 mb-2">
                  <label className="block text-sm font-medium">Note</label>
                  <textarea
                    value={formData.note}
                    name="note"
                    onChange={handleChange}
                    className="w-full h-16 px-3 py-2 border rounded sm:w-64 ml-9"
                    rows="3"
                    placeholder="Add a note"
                  />
                </div>
              </div>

              <div className="pt-4 mt-4 ml-0 border-t sm:ml-40 sm:w-1/2">
                <div className="flex gap-16 font-bold">
                  <span>Subtotal</span>
                  <span>₹ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex gap-4 font-bold">
                  <span>Other Charges</span>
                  <span>₹ {parseFloat(formData.otherCharges || 0).toFixed(2)}</span>
                </div>
                <div className="flex gap-3 font-bold">
                  <span>Discount on All</span>
                  <span>₹ {parseFloat(discountMoney || 0).toFixed(2)}</span>
                </div>
                <div className="flex gap-5 font-bold">
                  <span>Grand Total</span>
                  <span>₹ {grandtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payments */}
            <div className="mt-6">
              <h2 className="mb-4 text-base font-semibold text-cyan-500">
                Previous Payments Information :
              </h2>
              <div className="mb-6 overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="px-2 py-2 border">#</th>
                      <th className="px-2 py-2 border">Date</th>
                      <th className="px-2 py-2 border">Payment Type</th>
                      <th className="px-2 py-2 border">Payment Note</th>
                      <th className="px-2 py-2 border">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-2 text-center border" colSpan="5">
                        Payments Pending!!
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h2 className="mb-4 text-base font-semibold text-cyan-500">Make Payment :</h2>
              <div className="p-2 mb-6 bg-white rounded shadow-md">
                <div className="flex items-center gap-4 mb-2">
                  <label className="block w-1/4 text-sm font-medium text-right">Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.payments?.[0]?.amount || 0}
                    name="amount"
                    onChange={handlePayment}
                    className="w-1/2 px-3 py-2 border rounded"
                    placeholder="Enter Amount"
                  />
                </div>

                <div className="flex items-center gap-4 mb-2">
                  <label className="block w-1/4 text-sm font-medium text-right">Payment Type</label>
                  <Select
                    options={options.paymentType}
                    className="w-1/2"
                    onChange={(o) => {
                      handlePaymentSelect("paymentType")(o);
                      setFormData((prev) => ({
                        ...prev,
                        payments: [
                          {
                            ...(prev.payments?.[0] || {}),
                            account: null,
                            terminal: null,
                          },
                        ],
                      }));
                    }}
                    value={
                      options.paymentType.find(
                        (opt) =>
                          opt.value ===
                          (formData.payments?.[0]?.paymentType?._id ||
                            formData.payments?.[0]?.paymentType)
                      ) || null
                    }
                    placeholder="Select Payment Type"
                  />
                </div>

                {isCashMode && (
                  <div className="flex items-center gap-4 mb-2">
                    <label className="block w-1/4 text-sm font-medium text-right">Account</label>
                    <Select
                      options={cashAccounts}
                      className="w-1/2"
                      onChange={handlePaymentSelect("account")}
                      value={
                        cashAccounts.find(
                          (opt) => opt.value === formData.payments?.[0]?.account
                        ) || null
                      }
                      placeholder="Select Account"
                    />
                  </div>
                )}

                {isBankMode && (
                  <div className="flex items-center gap-4 mb-2">
                    <label className="block w-1/4 text-sm font-medium text-right">Terminal</label>
                    <Select
                      options={options.terminals.filter(
                        (t) => t.warehouse === formData.warehouse
                      )}
                      className="w-1/2"
                      onChange={handlePaymentSelect("terminal")}
                      value={
                        options.terminals.find(
                          (opt) => opt.value === formData.payments?.[0]?.terminal
                        ) || null
                      }
                      placeholder="Select Terminal"
                    />
                  </div>
                )}

                <div className="flex items-center gap-4 mb-2">
                  <label className="block w-1/4 text-sm font-medium text-right">Payment Note</label>
                  <textarea
                    name="paymentNote"
                    value={formData.payments?.[0]?.paymentNote || ""}
                    onChange={handlePayment}
                    className="w-1/2 py-2 border rounded px-3 h-14"
                    rows="3"
                    placeholder="Add a payment note"
                  />
                </div>
              </div>

              <div className="flex justify-center gap-4 mt-4">
                <button
                  className="px-12 py-2 text-white transition duration-200 bg-green-600 hover:bg-green-700"
                  type="submit"
                >
                  {id ? "Update" : "Save"}
                </button>
                <button
                  className="px-12 py-2 text-white transition duration-200 bg-orange-500 hover:bg-orange-600"
                  type="button"
                  onClick={() => navigate("/purchase-list")}
                >
                  Close
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Modals */}
      <SupplierPopup
        open={showSupplierPop}
        onClose={() => setShowSupplierPop(false)}
        onCreated={(sup) => {
          const newOpt = { label: sup.supplierName, value: sup._id };
          setOptions((opts) => ({ ...opts, suppliers: [...opts.suppliers, newOpt] }));
          setFormData((fd) => ({ ...fd, supplier: sup._id }));
        }}
      />

      <RawLotModal
        open={rawModal.open}
        init={rawModal.rowIdx != null ? formData.items[rawModal.rowIdx] : null}
        onClose={() => setRawModal({ open: false, rowIdx: null })}
        onSave={saveRawData}
      />
    </div>
  );
}
