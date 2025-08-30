import React, { useEffect, useState, useRef } from 'react';
import { BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt, FaBarcode } from "react-icons/fa";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera } from '@fortawesome/free-solid-svg-icons';
import Navbar from '../Navbar.jsx';
import Sidebar from '../Sidebar.jsx';
import LoadingScreen from '../../Loading.jsx';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Select from 'react-select';
import { BrowserMultiFormatReader } from '@zxing/library';
import dayjs from 'dayjs';

// Axios instance
const api = axios.create({ baseURL: "vps/api" });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

// Generate return code
const generateReturnCode = (lastReturnCode) => {
  if (!lastReturnCode) return `PR/${new Date().getFullYear()}/01`;
  const parts = lastReturnCode.split("/");
  const lastNumber = parseInt(parts[2], 10);
  return `PR/${parts[1]}/${String(lastNumber + 1).padStart(2, "0")}`;
};

// Escape regex
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Handle item field changes
const handleItemFieldChange = (index, field, value, items, setItems) => {
  setItems((prev) => {
    const updatedItems = [...prev];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'reason' || field === 'expiryDate' ? value : Number(value) || 0,
      totalAmount:
        field === 'quantity' || field === 'price'
          ? (Number(field === 'quantity' ? value : updatedItems[index].quantity) || 1) *
            (Number(field === 'price' ? value : updatedItems[index].price) || 0)
          : updatedItems[index].totalAmount,
    };
    if (field === 'quantity' && updatedItems[index].quantity > updatedItems[index].maxQuantity) {
      updatedItems[index].quantity = updatedItems[index].maxQuantity;
      updatedItems[index].totalAmount = updatedItems[index].maxQuantity * updatedItems[index].price;
    }
    return updatedItems;
  });
};

const PurchaseReturn = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  // Permissions
  const [localPermissions, setLocalPermissions] = useState([]);
  useEffect(() => {
    const stored = localStorage.getItem("permissions");
    if (stored) setLocalPermissions(JSON.parse(stored));
  }, []);
  const hasPermissionFor = (module, action) => {
    const role = (localStorage.getItem("role") || "guest").toLowerCase();
    if (role === "admin") return true;
    return localPermissions.some(p =>
      p.module.toLowerCase() === module.toLowerCase() &&
      p.actions.map(a => a.toLowerCase()).includes(action.toLowerCase())
    );
  };

  // State
  const [originalPurchaseRef, setOriginalPurchaseRef] = useState("");
  const [purchaseSuggestions, setPurchaseSuggestions] = useState([]);
  const [originalPurchase, setOriginalPurchase] = useState(null);
  const [returnCode, setReturnCode] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState("Return");
  const [errorMessage, setErrorMessage] = useState("");
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedPaymentType, setSelectedPaymentType] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [allItems, setAllItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searchError, setSearchError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [otherCharges, setOtherCharges] = useState(0);
  const [discountOnAll, setDiscountOnAll] = useState(0);
  const [note, setNote] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentNote, setPaymentNote] = useState("");
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponType, setCouponType] = useState("");
  const [couponValue, setCouponValue] = useState(0);
  const [discountOnAllType, setDiscountOnAllType] = useState("Per%");

  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [whRes, supRes, ptRes, acRes, retRes] = await Promise.all([
          api.get("/warehouses", { params: { scope: "mine" } }),
          api.get("/suppliers"),
          api.get("/payment-types"),
          api.get("/accounts"),
          api.get("/purchases?isReturn=true"),
        ]);

        const warehouseData = (whRes.data.data || []).map(w => ({
          label: w.warehouseName,
          value: w._id,
          cashAccount: w.cashAccount?._id || w.cashAccount || null,
        }));
        setWarehouses(warehouseData);
        console.log("Warehouses:", warehouseData);

        setSuppliers((supRes.data.data || []).filter(s => s.supplierName).map(s => ({
          label: s.supplierName,
          value: s._id,
        })));

        setPaymentTypes((ptRes.data.data || []).map(x => ({
          label: x.paymentTypeName,
          value: x._id,
          name: x.paymentTypeName.toLowerCase(),
        })));

        const accountData = (acRes.data.data || []).map(x => ({
          label: x.accountNumber,
          value: x._id,
        }));
        setAccounts(accountData);
        console.log("Accounts:", accountData);

        const allReturns = retRes.data.data || [];
        setReturnCode(allReturns.length ? generateReturnCode(allReturns[allReturns.length - 1].purchaseCode) : `PR/${new Date().getFullYear()}/01`);
      } catch (err) {
        console.error("Fetch error:", err);
        setErrorMessage("Failed to load data: " + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch items for selected warehouse
  useEffect(() => {
    const fetchItems = async () => {
      if (!selectedWarehouse) {
        setAllItems([]);
        return;
      }
      try {
        setLoading(true);
        const resp = await api.get("/items", {
          params: { warehouse: selectedWarehouse.value }
        });
        const raw = resp.data.data || [];
        const flat = raw.map(it => {
          const isVar = Boolean(it.parentItemId);
          return {
            _id: it._id,
            parentId: isVar ? it.parentItemId : it._id,
            variantId: isVar ? it._id : null,
            itemName: isVar ? `${it.parentItemName || it.itemName} / ${it.itemName}` : it.itemName,
            itemCode: it.itemCode || "",
            barcodes: it.barcodes || [],
            warehouseId: it.warehouse?._id || it.warehouse || null,
            mrp: it.mrp || 0,
            isVariant: isVar,
          };
        });
        setAllItems(flat);
        console.log("Fetched items for warehouse", selectedWarehouse.value, ":", flat);
        console.log("Checking for item 68134eff43481c8592016e2f:", flat.find(it => it._id === "68134eff43481c8592016e2f"));
      } catch (err) {
        console.error("Fetch items error:", err);
        setErrorMessage("Failed to load items: " + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [selectedWarehouse]);

  // Load existing return
  useEffect(() => {
    if (!id) return;
    const fetchPurchase = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/purchases/${id}`);
        const purchaseData = response.data.data;
        console.log("Fetched purchase return:", purchaseData);

        setOriginalPurchase(purchaseData);
        setOriginalPurchaseRef(purchaseData.referenceNo || "");
        setPurchaseDate(purchaseData.purchaseDate ? dayjs(purchaseData.purchaseDate).format("YYYY-MM-DD") : new Date().toISOString().split("T")[0]);
        setReferenceNo(purchaseData.referenceNo || "");
        setSelectedWarehouse(warehouses.find(w => w.value === (purchaseData.warehouse?._id || purchaseData.warehouse)) || null);
        setSelectedSupplier(suppliers.find(s => s.value === (purchaseData.supplier?._id || purchaseData.supplier)) || null);
        setStatus(purchaseData.status || "Return");

        const purchaseItems = purchaseData.items || [];
        console.log("Purchase return items:", purchaseItems);
        const warehouseId = purchaseData.warehouse?._id || purchaseData.warehouse;
        const newItems = purchaseItems.map(pi => {
          const itemId = typeof pi.item === 'object' ? pi.item?._id : pi.item;
          const variantId = pi.variant || null;
          const item = allItems.find(it => it._id === itemId || it.variantId === variantId || it.parentId === itemId) || null;

          if (!item) {
            console.warn(`No matching item for ID ${itemId} or variant ${variantId} in allItems`, { purchaseItem: pi, warehouseId });
            return null;
          }

          const expiryDate = pi.expiryDate ? dayjs(pi.expiryDate).format("YYYY-MM-DD") : "";

          return {
            item: item.parentId,
            variant: item.variantId,
            itemName: item.itemName,
            itemCode: item.itemCode,
            barcode: item.barcodes[0] || "",
            quantity: pi.quantity || 1,
            price: pi.purchasePrice || item.mrp || 0,
            maxQuantity: pi.quantity || 1,
            reason: pi.reason || "",
            totalAmount: (pi.quantity || 1) * (pi.purchasePrice || item.mrp || 0),
            expiryDate,
            purchasePrice: pi.purchasePrice || 0,
            salesPrice: pi.salesPrice || 0,
            unitCost: pi.unitCost || 0,
            discount: pi.discount || 0,
            parentId: item.parentId,
            isVariant: item.isVariant,
          };
        }).filter(Boolean);

        console.log("Mapped return items:", newItems);
        if (newItems.length === 0 && purchaseItems.length > 0) {
          const itemsInWarehouse = allItems.filter(it => it.warehouseId === warehouseId);
          
        }
        setItems(newItems);

        setOtherCharges(purchaseData.otherCharges || 0);
        setDiscountOnAll(purchaseData.discountOnAll || 0);
        setNote(purchaseData.note || "");
        setGrandTotal(purchaseData.grandTotal || 0);
        setCouponCode(purchaseData.couponCode || "");
        setCouponType(purchaseData.couponType || "");
        setCouponValue(purchaseData.couponValue || 0);
        setDiscountOnAllType(purchaseData.discountOnAllType || "Per%");

        if (purchaseData.payments?.length > 0) {
          setPaymentAmount(purchaseData.payments[0].amount || 0);
          setPaymentNote(purchaseData.payments[0].paymentNote || "");
          setSelectedPaymentType(paymentTypes.find(pt => pt.value === (purchaseData.payments[0].paymentType?._id || purchaseData.payments[0].paymentType)) || null);
          setSelectedAccount(accounts.find(a => a.value === (purchaseData.payments[0].account?._id || purchaseData.payments[0].account)) || null);
        }
      } catch (err) {
        console.error("Fetch purchase return error:", err);
        setErrorMessage("Failed to load purchase return: " + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchPurchase();
  }, [id, warehouses, suppliers, paymentTypes, accounts, allItems]);

  // Derive cash accounts
  const selectedWh = warehouses.find(w => w.value === selectedWarehouse?.value);
  const cashAccounts = selectedWh?.cashAccount ? accounts.filter(a => a.value === selectedWh.cashAccount) : [];
  const mode = paymentTypes.find(p => p.value === selectedPaymentType?.value)?.name;
  const isCash = mode === "cash";

  useEffect(() => {
    if (isCash && cashAccounts.length > 0) {
      setSelectedAccount(cashAccounts[0]);
    } else if (isCash && cashAccounts.length === 0) {
      console.warn("No cash accounts available for warehouse:", selectedWh);
      setErrorMessage("No cash account available for this warehouse. Please select an account manually or check warehouse data.");
      setSelectedAccount(null);
    } else {
      setSelectedAccount(null);
    }
  }, [isCash, cashAccounts, selectedWh]);

  // Search purchases
  useEffect(() => {
    const searchPurchases = async () => {
      if (!originalPurchaseRef.trim() || id) {
        setPurchaseSuggestions([]);
        return;
      }
      try {
        const response = await api.get("/purchases?isReturn=false");
        const purchases = (response.data.data || []).filter(p =>
          p.referenceNo?.toLowerCase().includes(originalPurchaseRef.toLowerCase())
        );
        setPurchaseSuggestions(purchases.map(p => ({
          label: `Purchase: ${p.referenceNo}`,
          value: p.referenceNo,
          data: p,
        })).slice(0, 10));
      } catch (err) {
        console.error("Search purchases error:", err);
        setErrorMessage("Error searching purchases: " + (err.response?.data?.message || err.message));
      }
    };
    searchPurchases();
  }, [originalPurchaseRef, id]);

  // Select purchase
  const selectPurchase = async (suggestion) => {
    try {
      const { value, data } = suggestion;
      console.log("Selected purchase:", data);
      setOriginalPurchaseRef(value);
      setOriginalPurchase(data);
      const warehouse = warehouses.find(w => w.value === (data.warehouse?._id || data.warehouse)) || null;
      setSelectedWarehouse(warehouse);
      setSelectedSupplier(suppliers.find(s => s.value === (data.supplier?._id || data.supplier)) || null);
      setPurchaseDate(data.purchaseDate ? dayjs(data.purchaseDate).format("YYYY-MM-DD") : new Date().toISOString().split("T")[0]);
      setReferenceNo(data.referenceNo || "");
      setItems([]);
      setFilteredItems([]);
      setPurchaseSuggestions([]);

      const purchaseItems = data.items || [];
      console.log("Purchase items:", purchaseItems);
      const warehouseId = data.warehouse?._id || data.warehouse;
      const newItems = purchaseItems.map(pi => {
        const itemId = typeof pi.item === 'object' ? pi.item?._id : pi.item;
        const variantId = pi.variant || null;
        const item = allItems.find(it => it._id === itemId || it.variantId === variantId || it.parentId === itemId) || null;

        if (!item) {
          console.warn(`No matching item for ID ${itemId} or variant ${variantId} in allItems`, { purchaseItem: pi, warehouseId });
          return null;
        }

        const expiryDate = pi.expiryDate ? dayjs(pi.expiryDate).format("YYYY-MM-DD") : "";

        return {
          item: item.parentId,
          variant: item.variantId,
          itemName: item.itemName,
          itemCode: item.itemCode,
          barcode: item.barcodes[0] || "",
          quantity: 1,
          price: pi.purchasePrice || item.mrp || 0,
          maxQuantity: pi.quantity || 1,
          reason: "",
          totalAmount: 1 * (pi.purchasePrice || item.mrp || 0),
          expiryDate,
          purchasePrice: pi.purchasePrice || 0,
          salesPrice: pi.salesPrice || 0,
          unitCost: pi.unitCost || 0,
          discount: pi.discount || 0,
          parentId: item.parentId,
          isVariant: item.isVariant,
        };
      }).filter(Boolean);

      console.log("Mapped purchase items:", newItems);
      if (newItems.length === 0 && purchaseItems.length > 0) {
        const itemsInWarehouse = allItems.filter(it => it.warehouseId === warehouseId);
       
      }
      setItems(newItems);
    } catch (err) {
      console.error("Load purchase error:", err);
      setErrorMessage("Failed to load purchase: " + (err.response?.data?.message || err.message));
    }
  };

  // Filter items
  useEffect(() => {
    if (!selectedWarehouse) {
      setFilteredItems([]);
      setSearchError("Select a warehouse");
      return;
    }
    if (originalPurchase) {
      const warehouseId = originalPurchase.warehouse?._id || originalPurchase.warehouse;
      const allowedItems = originalPurchase.items.flatMap(pi => {
        const itemId = typeof pi.item === 'object' ? pi.item?._id : pi.item;
        const variantId = pi.variant || null;
        return allItems.filter(it => it._id === itemId || it.variantId === variantId || it.parentId === itemId);
      });
      setFilteredItems([...new Set(allowedItems)]);
      console.log("Filtered items for warehouse", warehouseId, ":", allowedItems);
    } else {
      setFilteredItems(allItems);
    }
    setSearchError("");
  }, [selectedWarehouse, allItems, originalPurchase]);

  // Item suggestions
  useEffect(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q || !selectedWarehouse) {
      setSuggestions([]);
      return;
    }
    const rx = new RegExp(esc(q), "i");
    setSuggestions(filteredItems.filter(it =>
      rx.test(it.itemName) ||
      rx.test(it.itemCode) ||
      it.barcodes.some(b => rx.test(b))
    ).slice(0, 20));
  }, [searchTerm, filteredItems]);

  // Barcode scanner
  const startScanner = async () => {
    if (!selectedWarehouse) {
      setErrorMessage("Select warehouse first");
      return;
    }
    setSearchTerm("");
    setScanning(true);
    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;

    try {
      const videoInputDevices = await codeReader.listVideoInputDevices();
      await codeReader.decodeFromVideoDevice(videoInputDevices[0]?.deviceId, videoRef.current, (result) => {
        if (result) {
          const hit = filteredItems.find(it =>
            it.barcodes.includes(result.getText()) ||
            it.itemCode === result.getText()
          );
          if (hit) pushItem(hit);
          codeReader.stopStreams();
          setScanning(false);
        }
      });
    } catch (err) {
      console.error("Scanner error:", err);
      setErrorMessage("Scanner error: " + err.message);
      setScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      if (codeReaderRef.current) codeReaderRef.current.reset();
    };
  }, []);

  // Push item
  const pushItem = (item) => {
    if (!item) return;
    if (items.some(i => i.item === item.parentId && i.variant === item.variantId)) {
      setErrorMessage("Item already added");
      return;
    }
    if (originalPurchase) {
      const purchaseItem = originalPurchase.items.find(pi => {
        const itemId = typeof pi.item === 'object' ? pi.item?._id : pi.item;
        const variantId = pi.variant || null;
        return item._id === itemId || item.variantId === variantId || item.parentId === itemId;
      });
      if (!purchaseItem) {
        setErrorMessage("Item not in original purchase");
        return;
      }
      setItems(prev => [
        ...prev,
        {
          item: item.parentId,
          variant: item.variantId,
          itemName: item.itemName,
          itemCode: item.itemCode,
          barcode: item.barcodes[0] || "",
          quantity: 1,
          price: purchaseItem.purchasePrice || item.mrp || 0,
          maxQuantity: purchaseItem.quantity || 1,
          reason: "",
          totalAmount: 1 * (purchaseItem.purchasePrice || item.mrp || 0),
          expiryDate: purchaseItem.expiryDate ? dayjs(purchaseItem.expiryDate).format("YYYY-MM-DD") : "",
          purchasePrice: purchaseItem.purchasePrice || 0,
          salesPrice: purchaseItem.salesPrice || 0,
          unitCost: purchaseItem.unitCost || 0,
          discount: purchaseItem.discount || 0,
          parentId: item.parentId,
          isVariant: item.isVariant,
        },
      ]);
    } else {
      setItems(prev => [
        ...prev,
        {
          item: item.parentId,
          variant: item.variantId,
          itemName: item.itemName,
          itemCode: item.itemCode,
          barcode: item.barcodes[0] || "",
          quantity: 1,
          price: item.mrp || 0,
          maxQuantity: 9999,
          reason: "",
          totalAmount: 1 * (item.mrp || 0),
          expiryDate: "",
          purchasePrice: item.mrp || 0,
          salesPrice: item.salesPrice || 0,
          unitCost: item.priceWithoutTax || 0,
          discount: 0,
          parentId: item.parentId,
          isVariant: item.isVariant,
        },
      ]);
    }
    setSearchTerm("");
  };

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && suggestions.length > 0) pushItem(suggestions[0]);
  };

  // Remove item
  const handleRemoveItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  // Calculate totals
  useEffect(() => {
    let discount = Number(discountOnAll) || 0;
    if (discountOnAllType === "Per%") {
      const subtotal = items.reduce((sum, it) => sum + it.totalAmount, 0);
      discount = (subtotal * discount) / 100;
    }
    let couponDiscount = Number(couponValue) || 0;
    if (couponType === "percentage") {
      const subtotal = items.reduce((sum, it) => sum + it.totalAmount, 0);
      couponDiscount = (subtotal * couponDiscount) / 100;
    }
    const grand = items.reduce((sum, it) => sum + it.totalAmount, 0) +
      Number(otherCharges || 0) - discount - couponDiscount;
    setGrandTotal(Math.max(grand, 0));
  }, [items, otherCharges, discountOnAll, discountOnAllType, couponValue, couponType]);

  useEffect(() => {
    if (!id) {
      setPaymentAmount(grandTotal);
    }
  }, [grandTotal, id]);

  // Save
  const handleSave = async () => {
    if (!selectedWarehouse || !selectedSupplier || !items.length) {
      setErrorMessage("Warehouse, supplier, and at least one item are required");
      return;
    }
    if (paymentAmount > 0 && isCash && !selectedAccount) {
      setErrorMessage("Please select a cash account for the payment");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        originalPurchaseRef: originalPurchaseRef || undefined,
        referenceNo: referenceNo || originalPurchaseRef,
        purchaseDate,
        warehouse: selectedWarehouse.value,
        supplier: selectedSupplier.value,
        isReturn: true,
        status,
        createdBy: localStorage.getItem("userId"),
        createdByModel: "User",
        items: items.map(it => ({
          item: it.item,
          variant: it.variant || undefined,
          quantity: it.quantity,
          purchasePrice: it.price,
          salesPrice: it.salesPrice,
          unitCost: it.unitCost,
          totalAmount: it.totalAmount,
          discount: it.discount || 0,
          reason: it.reason || undefined,
          expiryDate: it.expiryDate || undefined,
        })),
        otherCharges: Number(otherCharges) || 0,
        discountOnAll: Number(discountOnAll) || 0,
        discountOnAllType,
        couponCode: couponCode || undefined,
        couponType: couponType || undefined,
        couponValue: Number(couponValue) || 0,
        note,
        grandTotal,
        payments: paymentAmount > 0 ? [{
          paymentType: selectedPaymentType?.value,
          account: selectedAccount?.value || undefined,
          amount: Number(paymentAmount),
          paymentNote,
          date: new Date().toISOString(),
        }] : [],
      };

      console.log("Saving return payload:", JSON.stringify(payload, null, 2));

      if (id) {
        const response = await api.put(`/purchases/purchase-returns/${id}`, payload);
        console.log("Update response:", response.data);
      } else {
        const response = await api.post("/purchases/purchase-returns", payload);
        console.log("Create response:", response.data);
      }

      navigate("/purchasereturn-list");
    } catch (err) {
      console.error("Save error:", err.response?.data || err);
      setErrorMessage(
        "Save failed: " + (err.response?.data?.message || err.message) +
        ". Check console for payload and response details."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <div className="flex-grow p-4 overflow-y-auto">
          <header className="flex flex-col md:flex-row items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Purchase Return</h1>
            <nav className="flex items-center space-x-2 text-gray-600">
              <Link to="/dashboard" className="hover:text-cyan-600"><FaTachometerAlt className="mr-1" /> Home</Link>
              <BiChevronRight />
              <Link to="/purchasereturn-list" className="hover:text-cyan-600">Return List</Link>
            </nav>
          </header>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{errorMessage}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="relative">
              <label className="font-semibold">Original Purchase Ref</label>
              <input
                type="text"
                value={originalPurchaseRef}
                onChange={e => setOriginalPurchaseRef(e.target.value)}
                className="w-full p-2 border rounded"
                disabled={!!id}
                placeholder="Enter purchase reference or leave blank"
              />
              {purchaseSuggestions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border rounded shadow max-h-60 overflow-y-auto mt-1">
                  {purchaseSuggestions.map((s, i) => (
                    <li
                      key={i}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => selectPurchase(s)}
                    >
                      {s.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <label className="font-semibold">Return Code *</label>
              <input type="text" value={returnCode} readOnly className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="font-semibold">Reference No</label>
              <input
                type="text"
                value={referenceNo}
                onChange={e => setReferenceNo(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="font-semibold">Purchase Date *</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={e => setPurchaseDate(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="font-semibold">Warehouse *</label>
              <Select options={warehouses} value={selectedWarehouse} onChange={setSelectedWarehouse} />
            </div>
            <div>
              <label className="font-semibold">Supplier *</label>
              <Select options={suppliers} value={selectedSupplier} onChange={setSelectedSupplier} />
            </div>
            <div>
              <label className="font-semibold">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="w-full p-2 border rounded">
                <option value="Return">Return</option>
                <option value="Cancel">Cancel</option>
              </select>
            </div>
          </div>

          <div className="relative mb-6">
            <div className="flex items-center">
              <FaBarcode className="mr-2 text-gray-600" />
              <input
  type="text"
  disabled={!selectedWarehouse}
  placeholder="Search item by name, code, or barcode"
  className="flex-grow p-2 border rounded disabled:bg-gray-100"
  value={searchTerm}
  onChange={e => {
    const v = e.target.value.trim();
    setSearchTerm(v);
    const hit = filteredItems.find(it =>
      it.barcodes.includes(v) ||
      it.itemCode === v ||
      it.itemName.toLowerCase() === v.toLowerCase()
    );
    if (hit) {
      pushItem(hit);
      setSearchTerm("");
    }
  }}
  onKeyDown={handleKeyDown}
/>

              <button
                onClick={() => pushItem(suggestions[0])}
                disabled={!suggestions.length}
                className="ml-2 px-4 py-2 bg-green-600 text-white rounded disabled:bg-gray-400"
              >
                Add
              </button>
              <button
                onClick={startScanner}
                disabled={!selectedWarehouse}
                className="ml-2 p-2 bg-gray-100 rounded disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faCamera} />
              </button>
            </div>
            {searchError && <p className="text-red-500 text-sm mt-1">{searchError}</p>}
            {scanning && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <video ref={videoRef} className="w-64 h-64" />
                <button
                  onClick={() => { codeReaderRef.current?.reset(); setScanning(false); }}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
                >
                  Cancel
                </button>
              </div>
            )}
            {suggestions.length > 0 && (
              <ul className="absolute z-50 w-full bg-white border rounded shadow max-h-60 overflow-y-auto mt-1">
                {suggestions.map(it => (
   <li key={it._id} className="p-2 hover:bg-gray-100 cursor-pointer">
     <div>
       <strong>{it.itemName}</strong>
       <span className="ml-2 text-xs text-gray-500">
         Code: {it.itemCode}
       </span>
     </div>
     {it.barcodes.length > 0 && (
       <div className="text-xs text-gray-600">
         Barcode: {it.barcodes.join(", ")}
       </div>
     )}
   </li>
 ))}
              </ul>
            )}
          </div>

          <table className="w-full border-collapse mb-6">
            <thead className="bg-sky-600 text-white">
              <tr>
                <th className="border p-2">Item</th>
                <th className="border p-2">Code</th>
                <th className="border p-2">Qty</th>
                <th className="border p-2">Price</th>
                <th className="border p-2">Expiry Date</th>
                <th className="border p-2">Reason</th>
                <th className="border p-2">Total</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-4 text-center text-red-600">No items to return</td>
                </tr>
              ) : (
                items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="border p-2">{it.itemName}</td>
                    <td className="border p-2">{it.itemCode}</td>
                    <td className="border p-2">
                      <input
                        type="number"
                        min="1"
                        max={it.maxQuantity}
                        value={it.quantity}
                        onChange={e => handleItemFieldChange(idx, "quantity", e.target.value, items, setItems)}
                        className="w-16 p-1 border rounded"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="number"
                        min="0"
                        value={it.price}
                        onChange={e => handleItemFieldChange(idx, "price", e.target.value, items, setItems)}
                        className="w-16 p-1 border rounded"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="date"
                        value={it.expiryDate}
                        onChange={e => handleItemFieldChange(idx, "expiryDate", e.target.value, items, setItems)}
                        className="w-32 p-1 border rounded"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="text"
                        value={it.reason}
                        onChange={e => handleItemFieldChange(idx, "reason", e.target.value, items, setItems)}
                        className="w-full p-1 border rounded"
                      />
                    </td>
                    <td className="border p-2">{it.totalAmount.toFixed(2)}</td>
                    <td className="border p-2">
                      <button onClick={() => handleRemoveItem(idx)} className="text-red-600">Remove</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="font-semibold">Other Charges</label>
              <input
                type="number"
                min="0"
                value={otherCharges}
                onChange={e => setOtherCharges(Number(e.target.value))}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="font-semibold">Coupon Code</label>
              <input
                type="text"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value)}
                className="w-full p-2 border rounded"
              />
              <div className="flex space-x-2 mt-2">
                <select
                  value={couponType}
                  onChange={e => setCouponType(e.target.value)}
                  className="flex-1 p-2 border rounded"
                >
                  <option value="">Type…</option>
                  <option value="percentage">Percentage</option>
                  <option value="value">Fixed</option>
                </select>
                <input
                  type="number"
                  min="0"
                  value={couponValue}
                  onChange={e => setCouponValue(Number(e.target.value))}
                  className="w-24 p-2 border rounded"
                  placeholder="Value"
                />
              </div>
            </div>
            <div>
              <label className="font-semibold">Discount on All</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  min="0"
                  value={discountOnAll}
                  onChange={e => setDiscountOnAll(Number(e.target.value))}
                  className="flex-1 p-2 border rounded"
                  placeholder="Amount"
                />
                <select
                  value={discountOnAllType}
                  onChange={e => setDiscountOnAllType(e.target.value)}
                  className="w-24 p-2 border rounded"
                >
                  <option value="Per%">Per%</option>
                  <option value="Fixed">Fixed</option>
                </select>
              </div>
            </div>
            <div className="col-span-2">
              <label className="font-semibold">Note</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full p-2 border rounded"
                rows={3}
              />
            </div>
          </div>

          <div className="mb-6 p-4 bg-gray-100 rounded">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold">Payment Amount</label>
                <input
                  type="number"
                  min="0"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="font-semibold">Payment Type</label>
                <Select options={paymentTypes} value={selectedPaymentType} onChange={setSelectedPaymentType} />
              </div>
              {isCash && (
                <div>
                  <label className="font-semibold">Account</label>
                  <Select
                    options={cashAccounts.length > 0 ? cashAccounts : accounts}
                    value={selectedAccount}
                    onChange={setSelectedAccount}
                    isClearable
                  />
                </div>
              )}
              <div className="col-span-2">
                <label className="font-semibold">Payment Note</label>
                <textarea
                  value={paymentNote}
                  onChange={e => setPaymentNote(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={handleSave}
              disabled={!hasPermissionFor("PurchasesReturn", "Add")}
              className="px-4 py-2 bg-green-600 text-white rounded disabled:bg-gray-400"
            >
              {id ? "Update" : "Save"}
            </button>
            <button
              onClick={() => navigate("/purchasereturn-list")}
              className="px-4 py-2 bg-gray-600 text-white rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseReturn;