import React, { useEffect, useState, useRef } from "react";
import {
  FaHandPaper,
  FaLayerGroup,
  FaMoneyBill,
  FaCreditCard,
  FaBarcode,
  FaList,
  FaUsers,
  FaBox,
  FaFileInvoice,
  FaBars,
  FaWindowMaximize,
} from "react-icons/fa";
import { BrowserMultiFormatReader } from "@zxing/browser";
import Swal from "sweetalert2";
import { MdOutlineDashboard } from "react-icons/md";
import { CameraIcon } from "@heroicons/react/outline";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import PaymentModal from "./PaymentModal";
import LoadingScreen from "../../Loading";
import CustomerPopup from "./CustomerPopup";
const beep = new Audio("/sounds/beep-new.mp3");   // point to your file
const sndRemove = new Audio("/sounds/remove.mp3");
function playBeep() {
  try {
    beep.pause();
    beep.currentTime = 0;
    beep.play();
  } catch {}       // autoplay blocked → ignore
}

function playRemove() { try { sndRemove.pause(); sndRemove.currentTime = 0; sndRemove.play(); } catch {} }
/** Returns a full printable HTML page as a string */
/** Returns a printable A4/80-mm receipt that matches the WhatsApp mock-up  */
function buildInvoiceHTML(order, payments = [], store, cust, rows, sellerName = "–") {
  const {
    logo, storeName, tagline, address, gst, phone, email
  } = store;

  const today  = new Date(order.createdAt || Date.now());
  const fmt    = (n) => (+n).toLocaleString("en-IN", {minimumFractionDigits:2});
  const totalQuantity = rows.reduce((sum, r) => sum + r.quantity, 0);

  // 2️⃣ “Before Tax” is pure quantity × rate, no discounts
  const rawTotal      = rows.reduce((sum, r) => sum + (r.quantity * r.salesPrice), 0);

  // 3️⃣ Your existing order.totalDiscount and taxAmount
  const disc          = order.totalDiscount || 0;
  const taxAmt        = order.taxAmount     || 0;

  // 4️⃣ Net total after discount, before adding tax
  const netBeforeTax  = rawTotal - disc;

  // 5️⃣ Paid & previous due
  const paid          = payments.reduce((s, p) => s + p.amount, 0);
  const prevDue       = order.previousBalance || 0;

  // 6️⃣ Final due
  const totalDue      = prevDue + netBeforeTax + taxAmt - paid;

  // build your rows as before…
  const body = rows.map((r,i) => `
    <tr>
      <td>${i+1}</td>
      <td>${r.itemName}</td>
      <td class="r">${r.quantity}</td>
      <td class="r">${r.mrp.toFixed(2)}</td>
      <td class="r">${r.salesPrice.toFixed(2)}</td>
      <td class="r">${(r.quantity * r.salesPrice).toFixed(2)}</td>
    </tr>`
  ).join("");

  const payRows = payments.map((p,i)=>`
    <tr><td>${i+1}</td><td>${p.paymentNote||"-"}</td><td class="r">${fmt(p.amount)}</td></tr>`
  ).join("");

  return `<!doctype html><html><head><meta charset="utf-8">
  <title>${order.saleCode}</title>
  <style>
    *{font-family:Arial,Helvetica,sans-serif;font-size:11px;margin:0;padding:0;box-sizing:border-box}
    body{padding:8px}
    h2{font-size:18px;margin:4px 0}
    .center{text-align:center}
    .r{text-align:right}
    table{width:100%;border-collapse:collapse;margin-top:4px}
    th,td{border:1px solid #ddd;padding:4px}
    th{background:#f7f7f7;}
    .no-border td{border:none}
    .sep{margin:6px 0;border-top:1px dashed #555}
    @media print{@page{size:auto;margin:6mm}button{display:none}}
    @media print {
.noprint, .noprint * { display:none !important }}
  </style></head><body>

  <!-- Header -->
  <div class="center">
    <img src="${logo}" alt="logo" style="height:45px"><br>
    <h2>${storeName}</h2>
    <strong>${tagline}</strong><br>
    <div style="white-space:pre-line">${address}</div>
    GST Number: ${gst}<br>
    Phone: ${phone}<br>
    ${email}
  </div>

  <div class="sep"></div>

  <!-- Invoice meta (two-column) -->
  <table class="no-border">
    <tr><td><strong>Invoice</strong></td><td class="r">#${order.saleCode}</td></tr>
    <tr><td><strong>Name</strong></td><td class="r">${cust.customerName||"–"}</td></tr>
    <tr><td><strong>Seller</strong></td><td class="r">${sellerName}</td></tr>
    <tr><td><strong>Date</strong></td><td class="r">${today.toLocaleDateString()}</td></tr>
    <tr><td><strong>Time</strong></td><td class="r">${today.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</td></tr>
  </table>

  <!-- Items -->
  <table>
    <thead><tr>
      <th>#</th><th>Description</th><th>Quantity</th>
      <th>MRP</th><th>Rate</th><th>Total</th>
    </tr></thead>
    <tbody>${body}</tbody>
  </table>

  <!-- Totals -->
  <table class="no-border">
   <tr><td>Total Quantity</td><td class="r">${totalQuantity}</td></tr>
      <tr><td>Before Tax</td>       <td class="r">${rawTotal.toFixed(2)}</td></tr>
      <tr><td>Total Discount</td>   <td class="r">−${disc.toFixed(2)}</td></tr>
      <tr><td>Net Before Tax</td>   <td class="r">${netBeforeTax.toFixed(2)}</td></tr>
      <tr><td>Tax Amount</td>       <td class="r">${taxAmt.toFixed(2)}</td></tr>
      <tr><td><strong>Total</strong></td>
          <td class="r"><strong>${(netBeforeTax + taxAmt).toFixed(2)}</strong></td></tr>
      <tr><td>Paid Payment</td>     <td class="r">${paid.toFixed(2)}</td></tr>
      <tr><td>Previous Due</td>     <td class="r">${prevDue.toFixed(2)}</td></tr>
      <tr><td><strong>Total Due Amount</strong></td>
          <td class="r"><strong>${totalDue.toFixed(2)}</strong></td></tr>

  </table>

  <!-- Payments -->
  <p style="margin-top:6px"><strong>Note:</strong></p>
  <table><thead><tr><th>#</th><th>Payment Type</th><th>Amount</th></tr></thead>
    <tbody>${payRows || `<tr><td colspan="3" class="center">–</td></tr>`}</tbody>
  </table>

  <p style="margin-top:8px"><strong>Invoice T&amp;C:</strong></p>
  <div class="sep"></div>
  <p class="center" style="margin-top:4px">----------Thanks You. Visit Again!----------</p>

  <button class="noprint" onclick="window.print()" style="margin:12px auto;display:block;padding:6px 18px">Print</button>
  <script>window.onload=()=>setTimeout(()=>window.print(),200)</script>
  </body></html>`;
}


export default function POS() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("id");
  const bookingId  = params.get("bookingId");
  const preCust    = params.get("customer");
  const preCustModel   = params.get("customerModel") || "CustomerData";

  // ─── STATE ─────────────────────────────────────────────────────────
  const [user, setUser] = useState({ name: "Guest", role: "Guest" });
  const [loadingUser, setLoadingUser] = useState(false);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");

  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [linkedBooking, setLinkedBooking]       = useState("");

  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [terminals, setTerminals] = useState([]);

  const [paymentTypes, setPaymentTypes] = useState([]);

  const [allItems, setAllItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchItemCode, setSearchItemCode] = useState("");
  const [scanning, setScanning] = useState(false);

  const [items, setItems] = useState([]);

  const [quantity, setQuantity] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);

  const [invoiceCode, setInvoiceCode] = useState(
    `SL/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}/`
  );
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [previousBalance, setPreviousBalance] = useState(0);

  const [couponCode, setCouponCode] = useState("");
  const [adjustAdvancePayment, setAdjustAdvancePayment] = useState(false);
  const [advancePaymentAmount, setAdvancePaymentAmount] = useState(0);

  const [heldInvoices, setHeldInvoices] = useState([]);
  const [showHoldList, setShowHoldList] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState("");

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState(""); // "cash" | "bank" | "multiple" | "hold"
  const [orderPaymentMode, setOrderPaymentMode] = useState(""); // Tracks payment mode of loaded order

  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const [storeName, setStoreName] = useState("");
  const [orderToEdit, setOrderToEdit] = useState(null);
  const [defaultWarehouse, setDefaultWarehouse]   = useState("");
  const prevWarehouseRef = useRef();    
  const [showCustomerPopup, setShowCustomerPopup] = useState(false);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [customerModel, setCustomerModel] = useState("CustomerData");
  const lastScanRef = useRef({ text: null, ts: 0 }); 
  const lastCodeRef = useRef({ code: "", time: 0 });


  // ─── HELPERS ────────────────────────────────────────────────────────
  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const getPaymentTypeId = (name) =>
    paymentTypes.find((pt) => pt.paymentTypeName?.toLowerCase() === name.toLowerCase())?._id;

  const esc = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

  // ───────────────────── Live-stock helper ─────────────────────────
async function fetchLiveQty (warehouseId, invId) {
  if (!warehouseId || !invId) return 0;
  const { data } = await axios.get(
    `/api/stock/${invId}?warehouse=${warehouseId}`,
    authHeaders()
  );
  /* fall back to openingStock if qty hasn’t moved yet */
  return (data.currentStock ?? data.openingStock ?? 0);
}

async function fetchPackQty (lotId) {
  if (!lotId) return 0;
  const { data } = await axios.get(
    `/api/raw-lots/pack-stocks/${lotId}`,
    authHeaders()
  );
  /* use packsLeft from the API response */
  return (data.data.packsLeft ?? 0);
}


  useEffect(() => {
  // skip the very first render (prevWarehouseRef === undefined)
  if (
    prevWarehouseRef.current &&                     // we already had one before
    prevWarehouseRef.current !== selectedWarehouse  // AND it actually changed
  ) {
    if (items.length > 0) {
      // 👉 optional safety prompt; remove if you don’t want it
      const ok = window.confirm(
        "Changing the warehouse will clear the current cart. Continue?"
      );
      if (!ok) {
        // user aborted → roll back the <select>
        setSelectedWarehouse(prevWarehouseRef.current);
        return;
      }
    }

    // 🚿 flush everything that belongs to the old warehouse
    setItems([]);
    setSearchItemCode("");
  }

  // finally, remember this value for the next tick
  prevWarehouseRef.current = selectedWarehouse;
}, [selectedWarehouse, items.length]);

  useEffect(() => {
    // if we came in via Start-Sale…
    if (preCust) {
      setSelectedCustomer(preCust);
    }
    if (bookingId) {
      setLinkedBooking(bookingId);
    }
  }, [preCust, bookingId]);
useEffect(() => {
    if (preCustModel) setCustomerModel(preCustModel);
  }, [preCustModel]);

  // ─── FETCHERS ───────────────────────────────────────────────────────
  useEffect(() => {
    fetchProfile();
    fetchLookups();
    fetchHeld();
    if (editId) {
      setIsLoadingEdit(true);
      fetchPosById(editId)
  .then(async (inv) => {
    if (!inv) return;
    //1️⃣ set the warehouse so that fetchItems kicks off for that warehouse
    setSelectedWarehouse(inv.warehouse._id);

    // 2️⃣ wait for the items to come back
    await fetchItems(inv.warehouse._id);

    // 3️⃣ only then remember the order to edit
    setOrderToEdit(inv);
  })

        .catch(console.error)
        .finally(() => setIsLoadingEdit(false));
    } else {
      loadNextInvoiceCode();
    }
  }, [editId]);


  
  useEffect(() => {
  fetchItems(selectedWarehouse, !!editId); // Pass editId as isEditMode
}, [selectedWarehouse, editId]);


  async function fetchProfile() {
    setLoadingUser(true);
    try {
      const role = localStorage.getItem("role");
      const url =
        role === "admin"
          ? "auth/profile"
          : "admiaddinguser/profile";
      const { data } = await axios.get(url, authHeaders());
      setUser(data);
      setStoreName(data.storeName || "Grocery on Wheels");
      setDefaultWarehouse(data.defaultWarehouse || "");
    } catch {
      setUser({ name: "Guest", role: "Guest" });
    } finally {
      setLoadingUser(false);
    }
  }
async function fetchLookups() {
    // ── 1) Warehouses ─────────────────────────────────────
    try {
      const { data } = await axios.get(
   "/api/warehouses?scope=mine",
   authHeaders()
 );
      const list = data.data || data.warehouses || [];
      if (Array.isArray(list)) {
  setWarehouses(list);
} else {
  setWarehouses([]);
}

    } catch (err) {
      console.error("❌ failed to load warehouses", err);
      setWarehouses([]);
    }

  // ── 2) Customers ──────────────────────────────────────
  try {
    const { data } = await axios.get(
      "api/customer-data/all",
      authHeaders()
    );
    const cust = data.data || data || [];
    if (Array.isArray(cust)) {
      setCustomers(cust);
      // AFTER (only default if no ?customer=… param)
if (!editId && !preCust && cust.length) {
  const walkIn = cust.find(c => c.customerName.toLowerCase() === "walk-in customer");
  setSelectedCustomer((walkIn?._id) || cust[0]._id);
}

    } else {
      setCustomers([]);
    }
  } catch (err) {
    console.error("❌ failed to load customers", err);
    setCustomers([]);
  }

  // ── 3) Accounts ───────────────────────────────────────
  try {
    const { data } = await axios.get(
      "api/accounts",
      authHeaders()
    );
    const accts = data.data || data || [];
    if (Array.isArray(accts)) {
      setAccounts(accts);
      if (!editId && accts.length) {
        setSelectedAccount(accts[0]._id);
      }
    } else {
      setAccounts([]);
    }
  } catch (err) {
    console.error("❌ failed to load accounts", err);
    setAccounts([]);
  }

  // ── 4) Payment Types ───────────────────────────────────
  try {
    const { data } = await axios.get(
      "api/payment-types",
      authHeaders()
    );
    setPaymentTypes(data.data || data || []);
  } catch (err) {
    console.error("❌ failed to load payment types", err);
    setPaymentTypes([]);
  }

  // ── 5) Terminals ──────────────────────────────────────
  try {
    const { data } = await axios.get(
      "api/terminals",
      authHeaders()
    );
    setTerminals(data.data || data || []);
  } catch (err) {
    console.error("❌ failed to load terminals", err);
    setTerminals([]);
  }
}


 async function loadNextInvoiceCode() {
  try {
    const { data } = await axios.get(`/api/pos/invoice-code`, authHeaders());
    console.log("API Response for invoice-code:", data);
    const latestCode = data;
    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
    let nextCode = `SL/${currentYear}/${currentMonth}/0000001`; // Default code

    if (latestCode) {
      const parts = latestCode.split("/");
      if (parts.length === 3) {
        // Handle SL/YYYY/SEQUENCE format
        const invoiceYear = parts[1];
        const sequence = parseInt(parts[2], 10);

        if (invoiceYear === currentYear.toString()) {
          const nextSequence = sequence + 1;
          const paddedSequence = String(nextSequence).padStart(7, "0");
          nextCode = `SL/${invoiceYear}/${currentMonth}/${paddedSequence}`;
        } else {
          console.log(`New year detected. Latest: ${latestCode}, Current: ${currentYear}/${currentMonth}`);
        }
      } else if (parts.length === 4) {
        // Handle SL/YYYY/MM/SEQUENCE format (for future compatibility)
        const invoiceYear = parts[1];
        const invoiceMonth = parts[2];
        const sequence = parseInt(parts[3], 10);

        if (invoiceYear === currentYear.toString() && invoiceMonth === currentMonth) {
          const nextSequence = sequence + 1;
          const paddedSequence = String(nextSequence).padStart(7, "0");
          nextCode = `SL/${invoiceYear}/${invoiceMonth}/${paddedSequence}`;
        } else {
          console.log(`New year/month detected. Latest: ${latestCode}, Current: ${currentYear}/${currentMonth}`);
        }
      } else {
        console.warn("Invalid invoice code format:", latestCode);
      }
    } else {
      console.log("No latest invoice code received from API");
    }

    setInvoiceCode(nextCode);
  } catch (err) {
    console.error("Could not fetch invoice code:", err);
    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
    setInvoiceCode(`SL/${currentYear}/${currentMonth}/0000001`);
  }
}
  async function fetchHeld() {
  try {
    const { data } = await axios.get("api/pos?status=OnHold", authHeaders());
    setHeldInvoices(data.data || data || []);
  } catch (err) {
    console.error("Fetch held invoices error:", err.message);
    setHeldInvoices([]);
  }
}
  async function fetchPosById(id) {
    try {
      const { data } = await axios.get(`api/pos/${id}`, authHeaders());
      console.log("Fetched POS order:", data);
      return data.order || data;
    } catch (err) {
      console.error("Fetch POS by ID error:", err.message);
      alert(`Failed to load POS order: ${err.message}`);
      return null;
    }
  }

  async function deletePosTransaction(id) {
    try {
      await axios.delete(`api/pos/${id}`, authHeaders());
      setHeldInvoices((prev) => prev.filter((inv) => inv._id !== id));
      navigate("/sale-list");
    } catch (err) {
      console.error("Delete POS transaction error:", err.message);
      alert(`Failed to delete POS order: ${err.message}`);
    }
  }

  {/*async function fetchItems(warehouseId = selectedWarehouse, isEditMode = !!editId) {
  if (!warehouseId) {
    setAllItems([]);
    return;
  }

  try {
    const params = {
      warehouse: warehouseId,
    };
    if (!isEditMode) {
      params.inStock = true;
    }

   const { data } = await axios.get(
      "api/items",
      { headers: authHeaders().headers, params }
    );
    const rawItems = data.data || [];

    const flatItems = rawItems
      .filter(it => it._id && it.warehouse?._id)
      .map(it => {
        const isVariant = Boolean(it.parentItemId);
        return {
          ...it,
          parentId:   isVariant ? it.parentItemId : it._id,
          variantId:  isVariant ? it._id          : null,
          itemName:   isVariant ? `${it.itemName} / ${it.variantName || "Variant"}` : it.itemName,
          barcode:    it.barcode  || "",
          barcodes:   it.barcodes || [],
          itemCode:   it.itemCode || "",
          currentStock: it.openingStock || 0,
          isPackLot: false                     // <— normal items
        };
      });

    const packRes = await axios.get("/api/raw-lots/pack-stocks", {
      params : { warehouse: warehouseId },
      headers: authHeaders().headers
    });

    const packedLots = packRes.data.data || [];

    const packsAsItems = packedLots.map(p => ({
      _id          : p.lotId,                // Raw-Lot id is our key
                   // product the raw lot belongs to
      variantId    : null,
      itemName     : p.itemName,             // “Sugar / Pack 0.096 kg”
      itemCode     : p.itemCode,
      barcodes     : [],                     // add in Admin if you want
      salesPrice   : p.salesPrice,
      currentStock : p.packsLeft,            // live qty = packs left
      packSize     : p.packSize,
      isPackLot    : true,  
      warehouse    : { _id: warehouseId }                  //  ❶ flag
    }));

   
    setAllItems([...flatItems, ...packsAsItems]);
  } catch (err) {
    console.error("Fetch items error:", err.message);
  }
}*/}
async function fetchItems(warehouseId = selectedWarehouse, isEditMode = !!editId) {
  if (!warehouseId) {
    setAllItems([]);
    return;
  }
  try {
    const params = {
      warehouse: warehouseId,
    };
    if (!isEditMode) {
      params.inStock = true;
    }
    const { data } = await axios.get(
      "api/items",
      { headers: authHeaders().headers, params }
    );
    const rawItems = data.data || [];
    const flatItems = rawItems
      .filter(it => it._id && it.warehouse?._id)
      .map(it => {
        const isVariant = Boolean(it.parentItemId);
        return {
          ...it,
          parentId: isVariant ? it.parentItemId : it._id,
          variantId: isVariant ? it._id : null,
          itemName: isVariant ? `${it.itemName} / ${it.variantName || "Variant"}` : it.itemName,
          barcode: it.barcode || "",
          barcodes: it.barcodes || [],
          itemCode: it.itemCode || "",
          currentStock: it.openingStock || 0,
        };
      });
    setAllItems(flatItems);
  } catch (err) {
    console.error("Fetch items error:", err.message);
    setAllItems([]);
  }
}

  

  // ─── EDIT HYDRATION ─────────────────────────────────────────────────
 {/*} async function hydrateForEdit(inv) {
    console.log("Hydrating POS order:", inv);

    let detectedPaymentMode = inv.paymentMode || "";
    if (!detectedPaymentMode) {
      if (inv.status === "OnHold") {
        detectedPaymentMode = "hold";
      } else if (inv.status === "Completed") {
        if (inv.payments?.length > 1) {
          detectedPaymentMode = "multiple";
        } else if (inv.payments?.length === 1) {
          const payment = inv.payments[0];
          const paymentType = paymentTypes.find((pt) => pt._id === payment.paymentType);
          if (paymentType?.paymentTypeName?.toLowerCase() === "cash") {
            detectedPaymentMode = "cash";
          } else if (paymentType?.paymentTypeName?.toLowerCase() === "bank" || payment.terminal) {
            detectedPaymentMode = "bank";
          } else {
            detectedPaymentMode = "multiple";
          }
        }
      }
    }

    const itemsWithLiveStock = await Promise.all(
      inv.items
        .map(async (i) => {
          const isPackLot = Boolean(i.rawLot);
          const itemDoc = allItems.find(
            (ai) =>
              isPackLot
                ? ai.isPackLot && ai._id === i.rawLot
                : ai.parentId === i.item._id &&
                  (!i.variant || ai._id === i.variant || ai.variantId === i.variant) &&
                  ai.warehouse?._id === inv.warehouse?._id
          );
          if (!itemDoc) {
            console.warn("Invalid item in POS order:", {
              rawLot: i.rawLot,
              itemId: i.item?._id,
              variantId: i.variant,
              itemName: i.item?.itemName,
              warehouseId: inv.warehouse?._id,
            });
            return null;
          }

          const liveQty = isPackLot
            ? await fetchPackQty(i.rawLot)
            : await fetchLiveQty(inv.warehouse._id, i.variant || i.item._id);

          return {
            ...(isPackLot
              ? { rawLot: i.rawLot }
              : { item: i.item._id, variant: i.variant || null }),
            itemName: itemDoc.itemName,
            itemCode: itemDoc.itemCode || "",
            openingStock: itemDoc.openingStock || 0,
            currentStock: liveQty,
            salesPrice: i.price || itemDoc.salesPrice || 0,
            quantity: i.quantity || 1,
            origQty:  i.quantity || 1,
            discount: i.discount || 0,
            tax: i.tax?._id || itemDoc.tax?._id || null,
            taxRate: i.tax?.taxPercentage || itemDoc.tax?.taxPercentage || 0,
            unit: i.unit || itemDoc.unit || null,
            mrp: itemDoc.mrp || 0,
            expiryDate: itemDoc.expiryDate || null,
            subtotal:
              i.subtotal || (i.price || itemDoc.salesPrice || 0) * (i.quantity || 1) - (i.discount || 0),
            isPackLot,
          };
        })
    );

    setItems(itemsWithLiveStock.filter((i) => i !== null));
    setInvoiceCode(inv.saleCode || "");
    setInvoiceCount(inv.invoiceCount || 0);
    setPreviousBalance(inv.previousBalance || 0);
    setCouponCode(inv.couponCode || "");
    setAdjustAdvancePayment(inv.advanceUsed > 0);
    setAdvancePaymentAmount(inv.advanceUsed || 0);

    // Validate and set customer
    const customerId = inv.customer?._id;
    if (!customerId || !customers.find((c) => c._id === customerId)) {
      console.warn("Invalid or missing customer ID:", customerId);
      const walkIn = customers.find((c) => c.customerName.toLowerCase() === "walk-in customer");
      setSelectedCustomer(walkIn?._id || "");
    } else {
      setSelectedCustomer(customerId);
    }

    // Validate and set warehouse
    const warehouseId = inv.warehouse?._id;
    if (!warehouseId || !warehouses.find((w) => w._id === warehouseId)) {
      console.warn("Invalid or missing warehouse ID:", warehouseId);
      setSelectedWarehouse(warehouses[0]?._id || "");
    } else {
      setSelectedWarehouse(warehouseId);
    }

    // Validate and set account
    const accountId = inv.account?._id;
    if (!accountId || !accounts.find((a) => a._id === accountId)) {
      console.warn("Invalid or missing account ID:", accountId);
      const warehouse = warehouses.find((w) => w._id === warehouseId);
      setSelectedAccount(warehouse?.cashAccount?._id || accounts[0]?._id || "");
    } else {
      setSelectedAccount(accountId);
    }

    setCurrentOrderId(inv._id);
    setOrderPaymentMode(detectedPaymentMode);
  }*/}

  async function hydrateForEdit(inv) {
  console.log("Hydrating POS order:", inv);
  let detectedPaymentMode = inv.paymentMode || "";
  if (!detectedPaymentMode) {
    if (inv.status === "OnHold") {
      detectedPaymentMode = "hold";
    } else if (inv.status === "Completed") {
      if (inv.payments?.length > 1) {
        detectedPaymentMode = "multiple";
      } else if (inv.payments?.length === 1) {
        const payment = inv.payments[0];
        const paymentType = paymentTypes.find((pt) => pt._id === payment.paymentType);
        if (paymentType?.paymentTypeName?.toLowerCase() === "cash") {
          detectedPaymentMode = "cash";
        } else if (paymentType?.paymentTypeName?.toLowerCase() === "bank" || payment.terminal) {
          detectedPaymentMode = "bank";
        } else {
          detectedPaymentMode = "multiple";
        }
      }
    }
  }
  const itemsWithLiveStock = await Promise.all(
    inv.items
      .map(async (i) => {
        const itemDoc = allItems.find(
          (ai) =>
            ai.parentId === i.item._id &&
            (!i.variant || ai._id === i.variant || ai.variantId === i.variant) &&
            ai.warehouse?._id === inv.warehouse?._id
        );
        if (!itemDoc) {
          console.warn("Invalid item in POS order:", {
            itemId: i.item?._id,
            variantId: i.variant,
            itemName: i.item?.itemName,
            warehouseId: inv.warehouse?._id,
          });
          return null;
        }
        const liveQty = await fetchLiveQty(inv.warehouse._id, i.variant || i.item._id);
        return {
          item: i.item._id,
          variant: i.variant || null,
          itemName: itemDoc.itemName,
          itemCode: itemDoc.itemCode || "",
          openingStock: itemDoc.openingStock || 0,
          currentStock: liveQty,
          salesPrice: i.price || itemDoc.salesPrice || 0,
          quantity: i.quantity || 1,
          origQty: i.quantity || 1,
          discount: i.discount || 0,
          tax: i.tax?._id || itemDoc.tax?._id || null,
          taxRate: i.tax?.taxPercentage || itemDoc.tax?.taxPercentage || 0,
          unit: i.unit || itemDoc.unit || null,
          mrp: i.mrp || itemDoc.mrp || 0,
          expiryDate: itemDoc.expiryDate || null,
          subtotal:
            i.subtotal || (i.price || itemDoc.salesPrice || 0) * (i.quantity || 1) - (i.discount || 0),
        };
      })
  );
  setItems(itemsWithLiveStock.filter((i) => i !== null));
  setInvoiceCode(inv.saleCode || "");
  setInvoiceCount(inv.invoiceCount || 0);
  setPreviousBalance(inv.previousBalance || 0);
  setCouponCode(inv.couponCode || "");
  setAdjustAdvancePayment(inv.advanceUsed > 0);
  setAdvancePaymentAmount(inv.advanceUsed || 0);
  const customerId = inv.customer?._id;
  if (!customerId || !customers.find((c) => c._id === customerId)) {
    console.warn("Invalid or missing customer ID:", customerId);
    const walkIn = customers.find((c) => c.customerName.toLowerCase() === "walk-in customer");
    setSelectedCustomer(walkIn?._id || "");
  } else {
    setSelectedCustomer(customerId);
  }
  const warehouseId = inv.warehouse?._id;
  if (!warehouseId || !warehouses.find((w) => w._id === warehouseId)) {
    console.warn("Invalid or missing warehouse ID:", warehouseId);
    setSelectedWarehouse(warehouses[0]?._id || "");
  } else {
    setSelectedWarehouse(warehouseId);
  }
  const accountId = inv.account?._id;
  if (!accountId || !accounts.find((a) => a._id === accountId)) {
    console.warn("Invalid or missing account ID:", accountId);
    const warehouse = warehouses.find((w) => w._id === warehouseId);
    setSelectedAccount(warehouse?.cashAccount?._id || accounts[0]?._id || "");
  } else {
    setSelectedAccount(accountId);
  }
  setCurrentOrderId(inv._id);
  setOrderPaymentMode(detectedPaymentMode);
}

  // ─── EFFECTS ────────────────────────────────────────────────────────
  useEffect(() => {
    let qty = 0,
      amt = 0,
      disc = 0;
    items.forEach((i) => {
      qty += i.quantity;
      amt += i.quantity * i.salesPrice;
      disc += i.discount || 0;
    });
    setQuantity(qty);
    setTotalAmount(amt);
    setTotalDiscount(disc);
  }, [items]);

  useEffect(() => {
    const q = searchItemCode.trim();
    if (!q || !selectedWarehouse) return setFilteredItems([]);
    const rx = new RegExp(esc(q), "i");
    const filtered = allItems
      .filter(
        (it) =>
          it.warehouse?._id === selectedWarehouse &&
          (rx.test(it.itemName) || rx.test(it.itemCode) || rx.test(it.barcodes?.join(" ") || ""))
      )
      .slice(0, 15);
    setFilteredItems(filtered);
    console.log("Filtered items:", filtered);
  }, [searchItemCode, selectedWarehouse, allItems]);

  useEffect(() => {
    return () => {
      const reader = codeReaderRef.current;
      if (reader) {
        try {
          if (typeof reader.reset === "function") {
            reader.reset();
          } else if (typeof reader.stopStreams === "function") {
            reader.stopStreams();
          }
        } catch (e) {
          console.error("Error during scanner cleanup:", e);
        }
      }
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const c = customers.find((c) => c._id === selectedCustomer);
    setPreviousBalance(c?.previousDue || 0);
  }, [selectedCustomer, customers]);

  useEffect(() => {
    const w = warehouses.find((w) => w._id === selectedWarehouse);
    if (w?.cashAccount?._id) setSelectedAccount(w.cashAccount._id);
    else if (accounts.length) setSelectedAccount(accounts[0]?._id);
  }, [selectedWarehouse, warehouses, accounts]);

 useEffect(() => {
  const ready = 
    orderToEdit &&
    customers.length > 0 &&
    warehouses.length > 0 &&
    accounts.length > 0 &&
    paymentTypes.length > 0 &&
    allItems.length > 0;

  console.log("🔍 hydrate ready?", {
    order: !!orderToEdit,
    cust: customers.length,
    wh: warehouses.length,
    accts: accounts.length,
    ptypes: paymentTypes.length,
    items: allItems.length
  });

  if (!ready) return;

  (async () => {
    await hydrateForEdit(orderToEdit);
    setOrderToEdit(null);
  })();
}, [orderToEdit, customers, warehouses, accounts, paymentTypes, allItems]);

useEffect(() => {
  if (editId) return;                  // skip if we’re editing an existing order
  if (!warehouses.length) return;      // need the list loaded
  if (defaultWarehouse) {
    // user has a default → honor it
    setSelectedWarehouse(defaultWarehouse);
  } else {
    // fallback to restricted / first active
    const restricted = warehouses.find(
      (w) => w.isRestricted && w.status === "Active"
    );
    setSelectedWarehouse(
      restricted?._id ||
        warehouses.find((w) => w.status === "Active")?._id ||
        ""
    );
  }
}, [warehouses, defaultWarehouse, editId]);


  // ─── SCANNER LOGIC ─────────────────────────────────────────────────
  const startScanner = () => {
  if (!selectedWarehouse) { alert("Select a warehouse first"); return; }
  setScanning(true);
  const codeReader = new BrowserMultiFormatReader();
  codeReaderRef.current = codeReader;

  let lastText = null;
  let lastTime = 0;

  codeReader.decodeFromConstraints(
    { video: { facingMode: { exact: "environment" } } },
    videoRef.current,
    (result, err) => {
  if (result) {
    const text = result.getText();
    const now  = Date.now();

    // ─── ignore if search-box just handled the same code ─────
    if (
      text === lastScanRef.current.text &&
      now - lastScanRef.current.ts < 300      // 0.3 s window
    ) {
      lastScanRef.current = { text: null, ts: 0 }; // optional reset
      return;                                   // ← SKIP duplicate
    }

    // existing lookup + addItem logic
    const hit = allItems.find(i =>
      i.itemCode === text ||
      i.barcodes?.includes(text) ||
      i.itemName.toLowerCase() === text.toLowerCase()
    );
    if (hit) addItem(hit);
    setSearchItemCode("");
    playBeep();

    // remember this successful ZXing scan
    lastScanRef.current = { text, ts: now };
  }

      if (err && err.name !== "NotFoundException") {
        console.error(err);
        alert("Scanning failed: " + err.message);
        codeReader.reset();
        setScanning(false);
      }
    }
  );
};


  // ─── ITEM HANDLERS ─────────────────────────────────────────────────
{/*async function addItem(it) {
  const now = Date.now();
  const scannedCode = it.itemCode || it._id;

  // Prevent double add if same code scanned within 300 ms
  if (lastCodeRef.current.code === scannedCode && now - lastCodeRef.current.time < 300) {
    return; 
  }
  lastCodeRef.current = { code: scannedCode, time: now };

  const isPackLot = it.isPackLot;
  const liveQty = isPackLot
    ? await fetchPackQty(it._id)
    : await fetchLiveQty(selectedWarehouse, it.variantId || it._id);

  it.currentStock = liveQty;

  if (liveQty <= 0) {
    Swal.fire("Out of stock", `"${it.itemName}" is out of stock in this warehouse.`, "warning");
    return;
  }
  if (!it) {
    console.error("Invalid item:", it);
    return;
  }
  // Skip parentId/variant checks for packed lots
  if (!isPackLot) {
    if (!it.parentId) {
      console.error("Invalid item, missing parentId:", it);
      return;
    }
    const parentExists = allItems.some((ai) => ai._id === it.parentId && !ai.variantId);
    if (!parentExists && !it.variantId) {
      console.error(`Parent item not found for parentId: ${it.parentId}`, it);
      return;
    }
    if (it.variantId) {
      const variantValid = allItems.some((ai) => ai._id === it.variantId && ai.parentId === it.parentId);
      if (!variantValid) {
        console.error(`Invalid variantId: ${it.variantId} for parentId: ${it.parentId}`, it);
        return;
      }
    }
  }

  setItems((prev) => {
    const existingIdx = prev.findIndex(
      (r) => isPackLot
        ? r.isPackLot && r.rawLot === it._id
        : r.item === it.parentId && r.variant === (it.variantId || null)
    );

    if (existingIdx !== -1) {
      // Increment quantity
      const existing = prev[existingIdx];
      if (existing.quantity + 1 > it.currentStock) {
        Swal.fire({
          icon: "warning",
          title: "Insufficient stock",
          text: `Only ${it.currentStock} unit${it.currentStock > 1 ? "s" : ""} left for "${it.itemName}".`,
        });
        return prev;
      }

      const updated = [...prev];
      updated[existingIdx] = {
        ...existing,
        quantity: existing.quantity + 1,
        subtotal:
          (existing.quantity + 1) * existing.salesPrice - (existing.discount || 0),
      };
      return updated;
    } else {
      // New item
      const newItem = {
        ...(isPackLot
          ? { rawLot: it._id }
          : { item: it.parentId, variant: it.variantId || null }),
        itemName: it.itemName,
        itemCode: it.itemCode || "",
        openingStock: it.openingStock || 0,
        currentStock: it.currentStock != null ? it.currentStock : (it.openingStock || 0),
        salesPrice: it.salesPrice || 0,
        quantity: 1,
        discount: it.discount || 0,
        tax: it.tax?._id || null,
        taxRate: it.tax?.taxPercentage || 0,
        unit: it.unit || null,
        mrp: it.mrp || 0,
        expiryDate: it.expiryDate || null,
        subtotal: (it.salesPrice || 0) - (it.discount || 0),
        isPackLot,
      };

      if (newItem.salesPrice <= 0) {
        alert("Item sales price must be greater than zero.");
        return prev;
      }

      return [...prev, newItem];
    }
  });

  setSearchItemCode("");
  playBeep();
}*/}

async function addItem(it) {
  const now = Date.now();
  const scannedCode = it.itemCode || it._id;
  if (lastCodeRef.current.code === scannedCode && now - lastCodeRef.current.time < 300) {
    return;
  }
  lastCodeRef.current = { code: scannedCode, time: now };
  const liveQty = await fetchLiveQty(selectedWarehouse, it.variantId || it._id);
  it.currentStock = liveQty;
  if (liveQty <= 0) {
    Swal.fire("Out of stock", `"${it.itemName}" is out of stock in this warehouse.`, "warning");
    return;
  }
  if (!it || !it.parentId) {
    console.error("Invalid item, missing parentId:", it);
    return;
  }
  const parentExists = allItems.some((ai) => ai._id === it.parentId && !ai.variantId);
  if (!parentExists && !it.variantId) {
    console.error(`Parent item not found for parentId: ${it.parentId}`, it);
    return;
  }
  if (it.variantId) {
    const variantValid = allItems.some((ai) => ai._id === it.variantId && ai.parentId === it.parentId);
    if (!variantValid) {
      console.error(`Invalid variantId: ${it.variantId} for parentId: ${it.parentId}`, it);
      return;
    }
  }
  setItems((prev) => {
    const existingIdx = prev.findIndex(
      (r) => r.item === it.parentId && r.variant === (it.variantId || null)
    );
    if (existingIdx !== -1) {
      const existing = prev[existingIdx];
      if (existing.quantity + 1 > it.currentStock) {
        Swal.fire({
          icon: "warning",
          title: "Insufficient stock",
          text: `Only ${it.currentStock} unit${it.currentStock > 1 ? "s" : ""} left for "${it.itemName}".`,
        });
        return prev;
      }
      const updated = [...prev];
      updated[existingIdx] = {
        ...existing,
        quantity: existing.quantity + 1,
        subtotal: (existing.quantity + 1) * existing.salesPrice - (existing.discount || 0),
      };
      return updated;
    } else {
      const newItem = {
        item: it.parentId,
        variant: it.variantId || null,
        itemName: it.itemName,
        itemCode: it.itemCode || "",
        openingStock: it.openingStock || 0,
        currentStock: it.currentStock != null ? it.currentStock : (it.openingStock || 0),
        salesPrice: it.salesPrice || 0,
        quantity: 1,
        discount: it.discount || 0,
        tax: it.tax?._id || null,
        taxRate: it.tax?.taxPercentage || 0,
        unit: it.unit || null,
        mrp: it.mrp || 0,
        expiryDate: it.expiryDate || null,
        subtotal: (it.salesPrice || 0) - (it.discount || 0),
      };
      if (newItem.salesPrice <= 0) {
        alert("Item sales price must be greater than zero.");
        return prev;
      }
      return [...prev, newItem];
    }
  });
  setSearchItemCode("");
  playBeep();
}

{/*async function updateItem(idx, field, rawVal) {

  
  if (rawVal === "") {
    setItems(prev =>
      prev.map((r, i) =>
        i === idx
          ? { ...r, [field]: "" }   // store a blank string for now
          : r
      )
    );
    return;                         // skip the rest of the checks
  }

  
  const numericVal = Number(rawVal);
  if (isNaN(numericVal)) return;    // guard against weird input

  const row = items[idx];
  const delta = field === "quantity" ? numericVal - row.quantity : 0;


if (field === "quantity") {
  const row = items[idx];
  const isPackLot = row.isPackLot;

  let liveQty;
  if (isPackLot) {
    liveQty = await fetchPackQty(row.rawLot);
  } else {
    liveQty = await fetchLiveQty(selectedWarehouse, row.variant || row.item);
  }

  // max you can go back up to = original sold + whatever remains
  const available = (row.origQty || 0) + liveQty;

  if (numericVal > available) {
    Swal.fire({
      icon: "warning",
      title: "Insufficient stock",
      text: `Only ${available} unit${available > 1 ? "s" : ""} available for "${row.itemName}".`,
    });
    return;
  }
}




 if (field === "salesPrice" && numericVal > row.mrp) {
   Swal.fire({
     icon: "warning",
     title: "Price exceeds MRP",
     text: `Sales price ₹${numericVal} is above MRP ₹${row.mrp}.`,
   });
   return;
 }

 if (
   (field === "quantity" || field === "salesPrice") &&
   numericVal <= 0 &&
   !editId
 ) {
   Swal.fire({
     icon: "warning",
     title: "Invalid value",
     text: `${field.charAt(0).toUpperCase() + field.slice(1)} must be greater than zero.`,
   });
   return;
 }

  setItems(prev =>
    prev.map((r, i) =>
      i === idx
        ? {
            ...r,
            [field]: numericVal,
            subtotal:
              (field === "salesPrice" ? numericVal : r.salesPrice) *
                (field === "quantity" ? numericVal : r.quantity) -
              (field === "discount" ? numericVal : r.discount || 0),
          }
        : r
    )
  );
  if (field === "quantity") {
    if (delta > 0)   playBeep();   
    if (delta < 0)   playRemove(); 
  }
}*/}

async function updateItem(idx, field, rawVal) {
  if (rawVal === "") {
    setItems(prev =>
      prev.map((r, i) =>
        i === idx ? { ...r, [field]: "" } : r
      )
    );
    return;
  }
  const numericVal = Number(rawVal);
  if (isNaN(numericVal)) return;
  const row = items[idx];
  const delta = field === "quantity" ? numericVal - row.quantity : 0;
  if (field === "quantity") {
    const liveQty = await fetchLiveQty(selectedWarehouse, row.variant || row.item);
    const available = (row.origQty || 0) + liveQty;
    if (numericVal > available) {
      Swal.fire({
        icon: "warning",
        title: "Insufficient stock",
        text: `Only ${available} unit${available > 1 ? "s" : ""} available for "${row.itemName}".`,
      });
      return;
    }
  }
  if (field === "salesPrice" && numericVal > row.mrp) {
    Swal.fire({
      icon: "warning",
      title: "Price exceeds MRP",
      text: `Sales price ₹${numericVal} is above MRP ₹${row.mrp}.`,
    });
    return;
  }
  if ((field === "quantity" || field === "salesPrice") && numericVal <= 0 && !editId) {
    Swal.fire({
      icon: "warning",
      title: "Invalid value",
      text: `${field.charAt(0).toUpperCase() + field.slice(1)} must be greater than zero.`,
    });
    return;
  }
  setItems(prev =>
    prev.map((r, i) =>
      i === idx
        ? {
            ...r,
            [field]: numericVal,
            subtotal:
              (field === "salesPrice" ? numericVal : r.salesPrice) *
              (field === "quantity" ? numericVal : r.quantity) -
              (field === "discount" ? numericVal : r.discount || 0),
          }
        : r
    )
  );
  if (field === "quantity") {
    if (delta > 0) playBeep();
    if (delta < 0) playRemove();
  }
}


  function removeItem(idx) {
    playRemove();
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  // ─── PDF GENERATION ────────────────────────────────────────────────
  const generateInvoicePDF = (order, payments) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text("Invoice", 14, 20);
    doc.setFontSize(12);
    doc.text(`Invoice #: ${order.saleCode || "N/A"}`, 14, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 38);
    doc.text(`Source: POS`, 14, 46);

    // Customer Information
    const customer = customers.find((c) => c._id === selectedCustomer);
    doc.setFontSize(14);
    doc.text("Customer Information", 14, 60);
    doc.setFontSize(12);
    doc.text(`Name: ${customer?.customerName || "N/A"}`, 14, 70);
    doc.text(`Mobile: ${customer?.mobile || "N/A"}`, 14, 78);
    const addrObj = customer?.address || {};
    const addrStr = [
      addrObj.street,
      addrObj.city,
      addrObj.state,
      addrObj.zip,
      addrObj.country,
    ]
      .filter((part) => typeof part === "string" && part.trim() !== "")
      .join(", ");
    doc.text(`Address: ${addrStr || "N/A"}`, 14, 86);

    // Items Table
    doc.setFontSize(14);
    doc.text("Items", 14, 100);
    const itemRows = items.map((item) => [
      item.itemName || "N/A",
      item.quantity || 0,
      `Rs. ${(item.salesPrice || 0).toFixed(2)}`,
      `Rs. ${(item.discount || 0).toFixed(2)}`,
      `Rs. ${(item.subtotal || 0).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 106,
      head: [["Item Name", "Quantity", "Unit Price", "Discount", "Subtotal"]],
      body: itemRows,
      theme: "striped",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 123, 255] },
    });

    // Totals
    let finalY = doc.lastAutoTable.finalY || 106;
    doc.setFontSize(12);
    doc.text(`Subtotal: Rs. ${(totalAmount || 0).toFixed(2)}`, 14, finalY + 10);
    doc.text(`Discount: Rs. ${(totalDiscount || 0).toFixed(2)}`, 14, finalY + 18);
    doc.text(`Grand Total: Rs. ${(totalAmount - totalDiscount).toFixed(2)}`, 14, finalY + 26);

    // Payments (if any)
    if (payments && payments.length > 0) {
      finalY = finalY + 34;
      doc.setFontSize(14);
      doc.text("Payments", 14, finalY);
      const paymentRows = payments.map((payment) => {
        const paymentType = paymentTypes.find((pt) => pt._id === payment.paymentType);
        return [
          new Date().toLocaleDateString(),
          paymentType?.paymentTypeName || "N/A",
          `Rs. ${(payment.amount || 0).toFixed(2)}`,
          payment.paymentNote || "-",
        ];
      });

      autoTable(doc, {
        startY: finalY + 6,
        head: [["Date", "Payment Type", "Amount", "Note"]],
        body: paymentRows,
        theme: "striped",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [0, 123, 255] },
      });

      finalY = doc.lastAutoTable.finalY;
      const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      doc.setFontSize(12);
      doc.text(`Total Paid: Rs. ${totalPaid.toFixed(2)}`, 14, finalY + 10);
      const dueAmount = totalAmount - totalDiscount - totalPaid;
      doc.text(`Due Amount: Rs. ${dueAmount.toFixed(2)}`, 14, finalY + 18);
    }

    // Footer
    finalY = payments && payments.length > 0 ? finalY + 26 : finalY + 34;
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Thank you for your business!", 14, finalY + 10);
    doc.text(`Generated by ${storeName || "Grocery on Wheels"}`, 14, finalY + 16);

    // Open PDF in a new tab
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, "_blank");
  };

  // ─── PAYMENT / ORDER LOGIC ──────────────────────────────────────────
  {/*async function buildPayload({ status, payments, paymentMode }) {
    console.log("Building payload with:", {
      selectedWarehouse,
      selectedCustomer,
      selectedAccount,
      items,
      status,
      paymentMode,
    });

    if (!selectedWarehouse) {
      throw new Error("Warehouse is required");
    }
    if (!selectedCustomer) {
      throw new Error("Customer is required");
    }
    if (!selectedAccount) {
      throw new Error("Account is required");
    }

    const validItems = items
  .map((it) => {
    if (it.isPackLot) {
      // Packed lot: validate by rawLot (_id in allItems)
      const isValid = allItems.some(
        (ai) => ai.isPackLot && ai._id === it.rawLot && ai.warehouse?._id === selectedWarehouse
      );
      if (!isValid) {
        console.error("Invalid packed lot in payload:", {
          rawLot: it.rawLot,
          itemName: it.itemName,
          itemCode: it.itemCode,
        });
        return null;
      }
      return {
        rawLot: it.rawLot,
        quantity: it.quantity,
        origQty: it.origQty,
        price: it.salesPrice,
        discount: it.discount || 0,
        unit: it.unit,
        tax: it.tax,
        subtotal: it.subtotal,
      };
    } else {
      // Regular item: validate by parentId and variant
      const isValid = allItems.some(
        (ai) =>
          ai.parentId === it.item &&
          (!it.variant || ai._id === it.variant || ai.variantId === it.variant) &&
          ai.warehouse?._id === selectedWarehouse
      );
      if (!isValid) {
        console.error("Invalid item in payload:", {
          itemId: it.item,
          variantId: it.variant,
          itemName: it.itemName,
          itemCode: it.itemCode,
        });
        return null;
      }
      return {
        item: it.item,
        variant: it.variant || null,
        quantity: it.quantity,
        origQty: it.origQty,
        price: it.salesPrice,
        discount: it.discount || 0,
        unit: it.unit,
        tax: it.tax,
        subtotal: it.subtotal,
      };
    }
  })
  .filter((it) => it !== null);

const stockErrors = [];
for (const it of validItems) {
  const isPackLot = !!it.rawLot;
  const liveQty = isPackLot
    ? await fetchPackQty(it.rawLot)
    : await fetchLiveQty(selectedWarehouse, it.variant || it.item);

  const previousQty = it.origQty || 0;
  const liveAvailable = liveQty + previousQty;

  if (it.quantity > liveAvailable) {
    const name = items.find(r => isPackLot ? r.rawLot === it.rawLot : r.item === it.item && r.variant === it.variant)?.itemName || "Item";
    stockErrors.push(
      `"${name}" – requested ${it.quantity}, available ${liveAvailable}`
    );
  }
}

if (stockErrors.length) {
  Swal.fire({
    icon: "warning",
    title: "Insufficient stock",
    html: stockErrors.join("<br/>"),
  });
  throw new Error("Stock validation failed");
}

    if (validItems.length === 0) {
      throw new Error("No valid items to save. Please add valid items to the order.");
    }

    const payload = {
      warehouse: selectedWarehouse,
      customer: selectedCustomer,
      customerModel,
      account: selectedAccount,
      items: validItems,
      totalAmount: totalAmount - totalDiscount,
      totalDiscount,
      couponCode: couponCode || undefined,
      payments,
      ...(linkedBooking ? { booking: linkedBooking } : {}),
      status,
      paymentMode,
      invoiceCount,
      previousBalance,
      adjustAdvancePayment,
      advancePaymentAmount,
    };
    console.log("Generated payload:", payload);
    return payload;
  }*/}

  async function buildPayload({ status, payments, paymentMode }) {
  console.log("Building payload with:", {
    selectedWarehouse,
    selectedCustomer,
    selectedAccount,
    items,
    status,
    paymentMode,
  });
  if (!selectedWarehouse) {
    throw new Error("Warehouse is required");
  }
  if (!selectedCustomer) {
    throw new Error("Customer is required");
  }
  if (!selectedAccount) {
    throw new Error("Account is required");
  }
  const validItems = items
    .map((it) => {
      const isValid = allItems.some(
        (ai) =>
          ai.parentId === it.item &&
          (!it.variant || ai._id === it.variant || ai.variantId === it.variant) &&
          ai.warehouse?._id === selectedWarehouse
      );
      if (!isValid) {
        console.error("Invalid item in payload:", {
          itemId: it.item,
          variantId: it.variant,
          itemName: it.itemName,
          itemCode: it.itemCode,
        });
        return null;
      }
      return {
        item: it.item,
        variant: it.variant || null,
        quantity: it.quantity,
        origQty: it.origQty,
        price: it.salesPrice,
        discount: it.discount || 0,
        unit: it.unit,
        tax: it.tax,
        subtotal: it.subtotal,
      };
    })
    .filter((it) => it !== null);
  const stockErrors = [];
  for (const it of validItems) {
    const liveQty = await fetchLiveQty(selectedWarehouse, it.variant || it.item);
    const previousQty = it.origQty || 0;
    const liveAvailable = liveQty + previousQty;
    if (it.quantity > liveAvailable) {
      const name = items.find(r => r.item === it.item && r.variant === it.variant)?.itemName || "Item";
      stockErrors.push(
        `"${name}" – requested ${it.quantity}, available ${liveAvailable}`
      );
    }
  }
  if (stockErrors.length) {
    Swal.fire({
      icon: "warning",
      title: "Insufficient stock",
      html: stockErrors.join("<br/>"),
    });
    throw new Error("Stock validation failed");
  }
  if (validItems.length === 0) {
    throw new Error("No valid items to save. Please add valid items to the order.");
  }
  const payload = {
    warehouse: selectedWarehouse,
    customer: selectedCustomer,         
    customerModel,
    account: selectedAccount,
    items: validItems,
    totalAmount: totalAmount - totalDiscount,
    totalDiscount,
    couponCode: couponCode || undefined,
    payments,
    ...(linkedBooking ? { booking: linkedBooking } : {}),
    status,
    paymentMode,
    invoiceCount,
    previousBalance,
    adjustAdvancePayment,
    advancePaymentAmount,
  };
  console.log("Generated payload:", payload);
  return payload;
}

{/*} async function sendOrder(payloadParams, method = "post", id) {
  
  const previewWin = window.open("", "_blank");
  if (previewWin) {
    previewWin.document.write(
      "<p style='font-family:Arial;padding:24px'>Generating invoice…</p>"
    );
    previewWin.document.close();
  }

  try {
    
    const payload = await buildPayload(payloadParams);

    const url  = id ? `api/pos/${id}` : "api/pos";
    const { data } = await axios[method](url, payload, authHeaders());
    
try {
  await Promise.all(
    items
      .filter(r => r.isPackLot)
      .map(r =>
        axios.patch(
          `/api/raw-lots/pack-stocks/${r.rawLot}/deduct`,
          { packs: r.quantity },
          authHeaders()
        ).catch(err => {
          console.error(`Failed to deduct stock for lot ${r.rawLot}:`, err.message);
          throw err;
        })
      )
  );
} catch (err) {
  console.error("Packed lot stock deduction failed:", err);
  throw new Error("Failed to update packed lot stock");
}


    
    const custObj = customers.find(c => c._id === selectedCustomer) || {};
    const html = buildInvoiceHTML(
      data.order,
      payload.payments,
      storeInfo,
      custObj,
      items,
      sellerDisplayName(user)          
    );

    
    if (previewWin) {
      previewWin.document.open();
      previewWin.document.write(html);
      previewWin.document.close();
    }

    
    setInvoiceCode(data.order.saleCode);
    resetForm();
    fetchHeld();
    Swal.fire("Saved!", "", "success");
  } catch (err) {
    if (previewWin) previewWin.close();   // don’t leave a blank tab
    console.error("Send order error details:", err);
    Swal.fire("Error", err.response?.data?.message || err.message, "error");
  }
}*/}
async function sendOrder(payloadParams, method = "post", id) {
  const previewWin = window.open("", "_blank");
  if (previewWin) {
    previewWin.document.write(
      "<p style='font-family:Arial;padding:24px'>Generating invoice…</p>"
    );
    previewWin.document.close();
  }
  try {
    const payload = await buildPayload(payloadParams);
    const url = id ? `api/pos/${id}` : "api/pos";
    const { data } = await axios[method](url, payload, authHeaders());
    const custObj = customers.find(c => c._id === selectedCustomer) || {};
    const html = buildInvoiceHTML(
      data.order,
      payload.payments,
      storeInfo,
      custObj,
      items,
      sellerDisplayName(user)
    );
    if (previewWin) {
      previewWin.document.open();
      previewWin.document.write(html);
      previewWin.document.close();
    }
    setInvoiceCode(data.order.saleCode);
    resetForm();
    fetchHeld();
    Swal.fire("Saved!", "", "success");
  } catch (err) {
    if (previewWin) previewWin.close();
    console.error("Send order error details:", err);
    Swal.fire("Error", err.response?.data?.message || err.message, "error");
  }
}

  function resetForm() {
    setItems([]);
    setQuantity(0);
    setTotalAmount(0);
    setTotalDiscount(0);
    loadNextInvoiceCode();
    setInvoiceCount(0);
    setPreviousBalance(0);
    setCouponCode("");
    setAdjustAdvancePayment(false);
    setAdvancePaymentAmount(0);
    setCurrentOrderId("");
    setSelectedCustomer(customers[0]?._id || "");
    setSelectedWarehouse(warehouses[0]?._id || "");
    setSelectedAccount(accounts[0]?._id || "");
    setOrderPaymentMode("");
  }

{/*} async function onHold() {
  // 0️⃣  Fancy confirm dialog -----------------------
  const { isConfirmed } = await Swal.fire({
    title: "Put order on hold?",
    text: "Are you sure you want to add this order to held invoices?",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#d33",       // red – matches your Hold button
    cancelButtonColor: "#3085d6",     // blue
    confirmButtonText: "Yes, Hold",
  });
  if (!isConfirmed) return;           // user aborted
  setIsSubmitting(true)
  // 1️⃣  Basic validation (unchanged) --------------
  if (!selectedWarehouse || !selectedCustomer || !selectedAccount) {
    Swal.fire("Missing data", "Warehouse, customer and account are required.", "warning");
    return;
  }

  // 2️⃣  Find Hold payment type --------------------
  const pt = getPaymentTypeId("Hold");
  if (!pt) {
    Swal.fire("Config error", "Payment type 'Hold' is missing.", "error");
    return;
  }

  // 3️⃣  Build payload (your code) -----------------
  const payload = {
    warehouse: selectedWarehouse,
    customer: selectedCustomer,
    account: selectedAccount,
    items: items.map((it) => ({
      ...(it.isPackLot ? { rawLot: it.rawLot } : { item: it.item, variant: it.variant || null }),
      quantity: it.quantity,
      price: it.salesPrice,
      discount: it.discount || 0,
      unit: it.unit,
      tax: it.tax,
      subtotal: it.subtotal,
    })),
    totalAmount: totalAmount - totalDiscount,
    totalDiscount,
    payments: [
      {
        paymentType: pt,
        amount: totalAmount - totalDiscount,
        paymentNote: "Hold payment",
      },
    ],
    status: "OnHold",
    paymentMode: "hold",
    invoiceCount,
    previousBalance,
    adjustAdvancePayment,
    advancePaymentAmount,
    couponCode: couponCode || undefined,
  };

  // 4️⃣  POST / PUT exactly as before --------------
  try {
    const token = localStorage.getItem("token");
    if (currentOrderId) {
      await axios.put(`api/pos/${currentOrderId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
    } else {
      await axios.post("api/pos", payload, { headers: { Authorization: `Bearer ${token}` } });
    }
    await fetchHeld();
    Swal.fire("Held!", "Order has been moved to held invoices.", "success");
  } catch (err) {
    console.error("Hold error:", err);
    Swal.fire("Error", err.response?.data?.message || err.message, "error");
  }
  finally{
    setIsSubmitting(false);
  }
}*/}

async function onHold() {
  const { isConfirmed } = await Swal.fire({
    title: "Put order on hold?",
    text: "Are you sure you want to add this order to held invoices?",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, Hold",
  });
  if (!isConfirmed) return;
  setIsSubmitting(true);
  if (!selectedWarehouse || !selectedCustomer || !selectedAccount) {
    Swal.fire("Missing data", "Warehouse, customer and account are required.", "warning");
    setIsSubmitting(false);
    return;
  }
  const pt = getPaymentTypeId("Hold");
  if (!pt) {
    Swal.fire("Config error", "Payment type 'Hold' is missing.", "error");
    setIsSubmitting(false);
    return;
  }
  const payload = {
    warehouse: selectedWarehouse,
    customer: selectedCustomer,
    account: selectedAccount,
    items: items.map((it) => ({
      item: it.item,
      variant: it.variant || null,
      quantity: it.quantity,
      price: it.salesPrice,
      discount: it.discount || 0,
      unit: it.unit,
      tax: it.tax,
      subtotal: it.subtotal,
    })),
    totalAmount: totalAmount - totalDiscount,
    totalDiscount,
    payments: [
      {
        paymentType: pt,
        amount: totalAmount - totalDiscount,
        paymentNote: "Hold payment",
      },
    ],
    status: "OnHold",
    paymentMode: "hold",
    invoiceCount,
    previousBalance,
    adjustAdvancePayment,
    advancePaymentAmount,
    couponCode: couponCode || undefined,
  };
  try {
    const token = localStorage.getItem("token");
    if (currentOrderId) {
      await axios.put(`api/pos/${currentOrderId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
    } else {
      await axios.post("api/pos", payload, { headers: { Authorization: `Bearer ${token}` } });
    }
    await fetchHeld();
    Swal.fire("Held!", "Order has been moved to held invoices.", "success");
  } catch (err) {
    console.error("Hold error:", err);
    Swal.fire("Error", err.response?.data?.message || err.message, "error");
  } finally {
    setIsSubmitting(false);
  }
}
function getAllowedAccounts(mode) {
  const wh = warehouses.find(w => w._id === selectedWarehouse);
  if (!wh) return [];

  const cashId = wh.cashAccount?._id;                 // <- warehouse’s cash A/C
  const bankAccounts = accounts.filter(a => a.accountType === "Bank");

  if (mode === "cash") {
    // Pure cash payment → only warehouse cash + (optionally) the one
    // already stored on an edited bill so we don’t break existing data.
    const legacy = accounts.find(a => a._id === selectedAccount);
    return [ ...accounts.filter(a => a._id === cashId),
             ...(legacy && legacy._id !== cashId ? [legacy] : []) ];
  }

  if (mode === "multiple") {
    // Multiple: warehouse cash + every bank account
    return [
      ...accounts.filter(a => a._id === cashId),
      ...bankAccounts,
    ];
  }

  // Bank-only mode → only bank accounts
  return bankAccounts;
}

{/*} async function onOpenModal(mode) {
  setIsSubmitting(true);
  if (!editId) {
    // only enforce stock guard on new sales, not on edits
    for (const r of items) {
      const isPackLot = r.isPackLot;
      const liveQty = isPackLot
        ? await fetchPackQty(r.rawLot)
        : await fetchLiveQty(selectedWarehouse, r.variant || r.item);
      if (r.quantity > liveQty) {
    Swal.fire("Stock changed",
      `"${r.itemName}" now has only ${liveQty} left. Please adjust your cart.`,
      "warning");
      setIsSubmitting(false);
    return;               // stop – don’t open the payment modal
  }
}
  }

    if (!editId || mode === "multiple") {
      if (!selectedWarehouse || !selectedCustomer || !selectedAccount) {
        alert("Please select a warehouse, customer, and account before proceeding with payment.");
        setIsSubmitting(false);
        return;
      }
    }
    if (!items.length) {
      alert("Please add at least one item to the order.");
            setIsSubmitting(false);
      return;
    }

    if (mode === "cash" || mode === "bank") {
      const paymentTypeId = getPaymentTypeId(mode);
      if (!paymentTypeId) {
        alert(
          `Missing payment type: ${mode.charAt(0).toUpperCase() + mode.slice(1)}. Please ensure it is configured.`
        );
              setIsSubmitting(false);
        return;
      }

      const payment = {
        paymentType: paymentTypeId,
        amount: totalAmount - totalDiscount,
        paymentNote: `${mode.charAt(0).toUpperCase() + mode.slice(1)} payment`,
      };

      if (mode === "bank") {
        if (terminals.length > 0) {
          payment.terminal = terminals[0]._id;
        }
      }

      try {
        sendOrder(
          { status: "Completed", payments: [payment], paymentMode: mode },
          currentOrderId ? "put" : "post",
          currentOrderId
        );
      } catch (err) {
        alert(err.message);
      }
      finally{
        setIsSubmitting(false);
      }
    } else {
      setPaymentMode(mode);
      setFilteredAccounts(getAllowedAccounts(mode));
      setIsPaymentModalOpen(true);
      setIsSubmitting(false);
    }
  }*/}

  async function onOpenModal(mode) {
  setIsSubmitting(true);
  if (!editId) {
    for (const r of items) {
      const liveQty = await fetchLiveQty(selectedWarehouse, r.variant || r.item);
      if (r.quantity > liveQty) {
        Swal.fire("Stock changed",
          `"${r.itemName}" now has only ${liveQty} left. Please adjust your cart.`,
          "warning");
        setIsSubmitting(false);
        return;
      }
    }
  }
  if (!editId || mode === "multiple") {
    if (!selectedWarehouse || !selectedCustomer || !selectedAccount) {
      alert("Please select a warehouse, customer, and account before proceeding with payment.");
      setIsSubmitting(false);
      return;
    }
  }
  if (!items.length) {
    alert("Please add at least one item to the order.");
    setIsSubmitting(false);
    return;
  }
  if (mode === "cash" || mode === "bank") {
    const paymentTypeId = getPaymentTypeId(mode);
    if (!paymentTypeId) {
      alert(
        `Missing payment type: ${mode.charAt(0).toUpperCase() + mode.slice(1)}. Please ensure it is configured.`
      );
      setIsSubmitting(false);
      return;
    }
    const payment = {
      paymentType: paymentTypeId,
      amount: totalAmount - totalDiscount,
      paymentNote: `${mode.charAt(0).toUpperCase() + mode.slice(1)} payment`,
    };
    if (mode === "bank") {
      if (terminals.length > 0) {
        payment.terminal = terminals[0]._id;
      }
    }
    try {
      sendOrder(
        { status: "Completed", payments: [payment], paymentMode: mode },
        currentOrderId ? "put" : "post",
        currentOrderId
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  } else {
    setPaymentMode(mode);
    setFilteredAccounts(getAllowedAccounts(mode));
    setIsPaymentModalOpen(true);
    setIsSubmitting(false);
  }
}
  const sellerDisplayName = (u = {}) =>
  // ① show what’s in the navbar
  u.name?.trim() ||
  // ② otherwise try first + last
  [u.FirstName, u.LastName].filter(Boolean).join(" ").trim() ||
  // ③ fall back to email or phone
  u.userName || u.Mobile || "–";
  const storeInfo = {
  logo:        "/logo/inspiredgrow.jpg",                       //  40-50 px square looks right
  storeName:   storeName,                                //  already in state
  tagline:     "GROCERY ON WHEELS",
  address:     "Basement 210-211 new Rishi Nagar near\nShree Shyam Baba Mandir Gali No. 9, Hisar – 125001",
  gst:         "06AAGCI0630K1ZR",
  phone:       "9050092092",
  email:       "INSPIREDGROW@GMAIL.COM",
};


  

  // ─── HELPER: Edit / Delete held invoices ─────────────────────────────
  async function handleEditInvoice(id) {
    const inv = await fetchPosById(id);
    if (!inv) return;
    hydrateForEdit(inv);
    setShowHoldList(false);
  }

  async function handleDeleteInvoice(id) {
    if (!window.confirm("Delete this held invoice?")) return;
    await deletePosTransaction(id);
  }

  function handleLogout() {
    localStorage.clear();
    navigate("/");
    window.location.reload();
  }

  function toggleFullScreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen();
    }
  }
 

  // ─── RENDER ─────────────────────────────────────────────────────────
  const paymentSummary = {
    totalItems: quantity,
    totalPrice: totalAmount,
    discount: totalDiscount,
    couponDiscount: 0,
    totalPayable: totalAmount - totalDiscount,
    totalPaying: 0,
    balance: totalAmount - totalDiscount,
    changeReturn: 0,
  };

  const buttonStyles = {
    hold: orderPaymentMode === "hold" ? "border-4 border-yellow-400 shadow-lg" : "border border-gray-300",
    multiple: orderPaymentMode === "multiple" ? "border-4 border-yellow-400 shadow-lg" : "border border-gray-300",
    cash: orderPaymentMode === "cash" ? "border-4 border-yellow-400 shadow-lg" : "border border-gray-300",
    bank: orderPaymentMode === "bank" ? "border-4 border-yellow-400 shadow-lg" : "border border-gray-300",
  };

  if (isLoadingEdit) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <h1
            className="text-xl font-bold cursor-pointer hover:text-yellow-400 transition-colors"
            onClick={() => navigate("/dashboard")}
          >
            {storeName || "Grocery on Wheels"}
          </h1>
          <button
            className="md:hidden text-2xl hover:text-yellow-400 transition-colors"
            onClick={() => setShowHoldList((v) => !v)}
          >
            <FaBars />
          </button>
          <div className="hidden md:flex gap-4">
            <div
              className="flex items-center gap-1 cursor-pointer hover:text-yellow-400 transition-colors"
              onClick={() => navigate("/sale-list")}
            >
              <FaList className="text-yellow-500" /> Sales List
            </div>
            <div
              className="flex items-center gap-1 cursor-pointer hover:text-yellow-400 transition-colors"
              onClick={() => navigate("/customer/view")}
            >
              <FaUsers className="text-yellow-500" /> Customers
            </div>
            <div
              className="flex items-center gap-1 cursor-pointer hover:text-yellow-400 transition-colors"
              onClick={() => navigate("/item-list")}
            >
              <FaBox className="text-yellow-500" /> Items
            </div>
            <div
              className="flex items-center gap-1 cursor-pointer hover:text-yellow-400 transition-colors"
              onClick={resetForm}
            >
              <FaFileInvoice className="text-yellow-500" /> New Invoice
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <div
            className="relative cursor-pointer text-sm hover:text-yellow-400 transition-colors"
            onClick={() => setShowHoldList((v) => !v)}
          >
            Hold List{" "}
            <span className="absolute -top-2 -right-3 bg-red-600 px-2 py-1 text-xs rounded-full">
              {heldInvoices.length}
            </span>
          </div>
          <FaWindowMaximize
            className="cursor-pointer text-xl hover:text-yellow-400 transition-colors"
            onClick={toggleFullScreen}
          />
          <div
            className="relative flex items-center gap-2 cursor-pointer"
            onClick={() => setShowProfileDropdown((v) => !v)}
          >
            <img
              src="/userlogoprof.png"
              alt="Profile"
              className="w-10 h-10 rounded-full border-2 border-gray-300 shadow-sm"
            />
            <span className="hover:text-yellow-400 transition-colors">
              {loadingUser ? "Loading..." : user.name}
            </span>
            {showProfileDropdown && (
              <div className="absolute top-full right-0 w-64 p-4 bg-white text-black rounded-lg shadow-xl border border-gray-200 z-20">
                <div className="flex flex-col items-center">
                  <img
                    src="/userlogoprof.png"
                    alt="Profile"
                    className="w-16 h-16 rounded-full border-2 border-gray-400 shadow-sm"
                  />
                  <h3 className="mt-2 font-bold text-gray-800">{user.name}</h3>
                  <p className="text-sm text-blue-600">Role: {user.role}</p>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors">
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
          <div
            className="flex items-center gap-1 cursor-pointer hover:text-yellow-400 transition-colors"
            onClick={() => navigate("/dashboard")}
          >
            <MdOutlineDashboard className="text-yellow-500" /> Dashboard
          </div>
        </div>
      </nav>

      {/* Held invoices */}
      {showHoldList && (
  <div className="absolute top-16 right-4 w-80 p-4 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
    <h3 className="mb-3 font-bold text-gray-800 text-lg">Held Invoices</h3>
    {heldInvoices.length ? (
      heldInvoices.map((inv) => (
        <div
          key={inv._id}
          className="flex justify-between items-center p-3 mb-2 bg-white rounded-lg border-l-4 border-cyan-500 hover:bg-gray-50 transition"
        >
          {/* Show saleCode if available, otherwise first item name */}
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800">
              {inv.saleCode || inv.items?.[0]?.itemName || inv._id.slice(0, 6)}
            </span>
            {inv.items?.length > 1 && (
              <span className="text-xs text-gray-500">
                +{inv.items.length - 1} more item{inv.items.length - 1 > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleEditInvoice(inv._id)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Edit
            </button>
            <button
              onClick={() => handleDeleteInvoice(inv._id)}
              className="text-red-600 hover:text-red-800 font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      ))
    ) : (
      <p className="text-gray-500 text-sm">No held invoices</p>
    )}
  </div>
)}

      {/* Main content */}
      <div className="flex flex-col lg:flex-row flex-grow gap-6 p-6">
        <div className="lg:w-2/3 w-full p-6 bg-white rounded-xl shadow-lg border-t-4 border-cyan-500">
          {/* Invoice form */}
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <select
                className="border border-gray-300 p-3 rounded-lg bg-gray-50 text-gray-700 focus:ring-2 focus:ring-cyan-400 focus:outline-none transition-all"
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
              >
                <option value="">Select Warehouse</option>
                 {warehouses
    // only show Active ones
    .filter(w => w.status === "Active")
    .map((w) => (
      <option key={w._id} value={w._id}>
        {w.warehouseName}
      </option>
    ))
  }
</select>
              <input
                className="border border-gray-300 p-3 rounded-lg bg-gray-100 text-gray-700 focus:ring-2 focus:ring-cyan-400 focus:outline-none transition-all"
                readOnly
                value={invoiceCode}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center border border-gray-300 rounded-lg bg-gray-50">
  <select
    className="flex-grow border-none p-3 bg-transparent text-gray-700 focus:ring-2 focus:ring-cyan-400 focus:outline-none transition-all"
    value={selectedCustomer}
    onChange={(e) => setSelectedCustomer(e.target.value)}
  >
    <option value="">Select Customer</option>
    {customers.map((c) => (
      <option key={c._id} value={c._id}>
        {c.customerName}
      </option>
    ))}
  </select>
  <button
    type="button"
    onClick={() => {
  console.log("Plus button clicked!");
  setShowCustomerPopup(true);
}}
    title="Add new customer"
    className="px-3 py-2 text-lg font-bold text-blue-600 border-l hover:bg-gray-100"
  >
    +
  </button>
</div>
              <div className="relative flex items-center border border-gray-300 rounded-lg p-3 bg-gray-50">
                <FaBarcode className="text-gray-500 mr-3" />
               <input
  className="flex-grow text-gray-700 focus:outline-none bg-transparent"
  placeholder="Item name / Barcode / Item code"
  value={searchItemCode}
  onChange={(e) => {
    const val = e.target.value;
    setSearchItemCode(val); // Only update input value, no matching
  }}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = searchItemCode.trim();
      console.log("Bargun input (Enter):", trimmed); // Debug log

      // Skip if scanner is active or recent duplicate
      if (scanning || (trimmed === lastScanRef.current.code && Date.now() - lastScanRef.current.time < 500)) {
        console.log("Skipped duplicate or scanner active:", trimmed);
        return;
      }

      const hit = allItems.find(i => i.barcodes?.includes(trimmed));
      if (hit) {
        console.log("Matched item:", hit.itemName, hit._id); // Debug log
        addItem(hit);
        lastScanRef.current = { code: trimmed, time: Date.now() };
        setSearchItemCode("");
      } else {
        console.log("No item found for barcode:", trimmed); // Debug log
        Swal.fire("Error", `No item found for barcode: ${trimmed}`, "warning");
      }
    }
  }}
/>


                <button
                  disabled={!selectedWarehouse}
                  onClick={startScanner}
                  className={`ml-2 rounded-full p-2 transition-all ${
                    selectedWarehouse
                      ? "hover:bg-blue-600 text-white bg-blue-500"
                      : "text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <CameraIcon className="w-5 h-5" />
                </button>
                {searchItemCode && filteredItems.length > 0 && (
                  <ul className="absolute top-full left-0 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {filteredItems.map((it) => (
                      <li
                        key={it._id}
                        className="p-3 hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() => addItem(it)}
                      >
                        <strong className="text-gray-800">{it.itemCode}</strong> - {it.itemName}
                        {it.barcodes?.length > 0 && (
                          <span className="text-gray-500"> ({it.barcodes[0]})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {scanning && (
                  <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-50">
                    <div className="w-72 h-72 border-4 border-white rounded-lg overflow-hidden">
                      <video
                        ref={videoRef}
                        className="object-cover w-full h-full"
                        autoPlay
                        muted
                        playsInline
                      />
                    </div>
                    <button
                      onClick={() => {
                        const reader = codeReaderRef.current;
                        if (reader?.reset) {
                          reader.reset();
                        } else if (reader?.stopStreams) {
                          reader.stopStreams();
                        }
                        if (videoRef.current?.srcObject) {
                          videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
                        }
                        setScanning(false);
                      }}
                      className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
              <input
                className="border border-gray-300 p-3 rounded-lg bg-gray-100 text-gray-700 focus:ring-2 focus:ring-cyan-400 focus:outline-none transition-all"
                readOnly
                value={
                  orderPaymentMode
                    ? `Payment Method: ${orderPaymentMode.charAt(0).toUpperCase() + orderPaymentMode.slice(1)}`
                    : ""
                }
                placeholder="Payment Method: None"
              />
            </div>
          </div>

          {showCustomerPopup && (
  <CustomerPopup
    open={showCustomerPopup}
    onClose={() => setShowCustomerPopup(false)}
    onCreated={(newCustomer) => {
      setCustomers((prev) => [...prev, newCustomer]);
      setSelectedCustomer(newCustomer._id);
      setShowCustomerPopup(false);
    }}
  />
)}


          {/* Previous due */}
          <div className="mt-4 text-red-600 font-medium">
            Previous Due: ₹{previousBalance.toFixed(2)}
          </div>

          {/* Items table */}
          <div className="mt-6 overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-200 text-gray-700 text-sm">
                <tr>
                  {["Item Name", "Stock", "Quantity", "Sales Price", "MRP", "Total ₹", "Remove"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold border-b">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm">
                {items.length ? (
                  items.map((it, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">{it.itemName}</td>
                      {/*<td className="px-4 py-3">{it.itemCode}</td>*/}
                      <td className="px-4 py-3">{it.currentStock}</td>
                      <td className="px-4 py-3">
                        <input
    type="number"
    min="1"
    className="w-16 text-center border rounded"
    value={it.quantity}
    onChange={e => updateItem(i, "quantity", e.target.value)}
  />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          className="w-20 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                          value={it.salesPrice}
                          onChange={(e) => updateItem(i, "salesPrice", e.target.value)}
                        />
                      </td>
                      {/*<td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          className="w-20 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                          value={it.discount}
                          onChange={(e) => updateItem(i, "discount", e.target.value)}
                        />
                      </td>*/}
                      {/*<td className="px-4 py-3">{it.taxRate}</td>*/}
                      {/*<td className="px-4 py-3">{it.unit?.unitName || "N/A"}</td>*/}
                      <td className="px-4 py-3">{it.mrp}</td>
                      {/*<td className="px-4 py-3">
                        {it.expiryDate ? new Date(it.expiryDate).toLocaleDateString() : "N/A"}
                      </td>*/}
                      <td className="px-4 py-3 text-center font-semibold">
  {(it.quantity * it.salesPrice).toFixed(2)}
</td>
                      <td className="px-4 py-3">
                        <button
                          className="text-red-500 hover:text-red-700 font-medium transition-colors"
                          onClick={() => removeItem(i)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11" className="py-6 text-center text-red-500 font-medium">
                      No Items Added
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer action buttons */}
          <div className="mt-6 p-4 bg-gray-100 border-t rounded-b-lg flex flex-wrap justify-center gap-4">
            <button disabled={isSubmitting}
              onClick={onHold}
              className={`flex items-center justify-center gap-2 px-6 py-3 text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md transition-all duration-200 ${buttonStyles.hold}`}
            >
              <FaHandPaper /> Hold
            </button>
            <button
              onClick={() => onOpenModal("multiple")}
              className={`flex items-center justify-center gap-2 px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition-all duration-200 ${buttonStyles.multiple}`}
            >
              <FaLayerGroup /> Multiple
            </button>
            <button
              onClick={() => onOpenModal("cash")}
              className={`flex items-center justify-center gap-2 px-6 py-3 text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-md transition-all duration-200 ${buttonStyles.cash}`}
            >
              <FaMoneyBill /> Cash
            </button>
            <button
              onClick={() => onOpenModal("bank")}
              className={`flex items-center justify-center gap-2 px-6 py-3 text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-md transition-all duration-200 ${buttonStyles.bank}`}
            >
              <FaCreditCard /> Bank
            </button>
          </div>
        </div>

        {/* Side summary */}
        <div className="lg:w-1/3 w-full p-6 bg-white rounded-xl shadow-lg border-l-4 border-cyan-500">
          {[
            ["Quantity:", quantity],
            ["Total Amount (₹):", totalAmount.toFixed(2)],
            ["Total Discount (₹):", totalDiscount.toFixed(2)],
            ["Grand Total (₹):", (totalAmount - totalDiscount).toFixed(2)],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between mb-4 text-gray-700 text-lg">
              <span className="font-semibold">{label}</span>
              <span>{val}</span>
            </div>
          ))}
          <div className="mt-6">
            <label className="block mb-2 text-lg font-semibold text-gray-800">Coupon Code</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 focus:ring-2 focus:ring-cyan-400 focus:outline-none transition-all"
              placeholder="Enter Coupon Code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Payment modal */}
      {isPaymentModalOpen && (
        <PaymentModal
          onClose={() => setIsPaymentModalOpen(false)}
          paymentMode={paymentMode}
          paymentTypes={paymentTypes}
          accounts={filteredAccounts}
          terminals={terminals}
          initialAdvance={advancePaymentAmount}
          initialAccount={selectedAccount}
          initialSummary={paymentSummary}
          selectedWarehouse={selectedWarehouse}
          onSubmit={({
            paymentRows,
            couponCode,
            adjustAdvancePayment,
            advance,
            selectedAccount,
          }) => {
            sendOrder(
              { status: "Completed", payments: paymentRows, paymentMode: paymentMode },
              currentOrderId ? "put" : "post",
              currentOrderId
            );
            setCouponCode(couponCode || "");
            setAdjustAdvancePayment(adjustAdvancePayment);
            setAdvancePaymentAmount(advance);
            setSelectedAccount(selectedAccount);
          }}
        />
      )}
    </div>
  );
}