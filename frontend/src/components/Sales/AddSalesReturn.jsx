import React, { useEffect, useState } from "react";
import { BiChevronRight } from "react-icons/bi";
import { FaBarcode } from "react-icons/fa";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import axios from "axios";
import Select from "react-select";
import { useNavigate, NavLink, useParams } from "react-router-dom";
import { CameraIcon } from "@heroicons/react/outline";

function generateReturnCode(lastReturnCode) {
  if (!lastReturnCode) return `SR/${new Date().getFullYear()}/01`;
  const parts = lastReturnCode.split("/");
  const lastNumber = parseInt(parts[2], 10);
  return `SR/${parts[1]}/${String(lastNumber + 1).padStart(2, "0")}`;
}

export default function AddSalesReturn() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  // Permissions
  const [localPermissions, setLocalPermissions] = useState([]);
  useEffect(() => {
    const stored = localStorage.getItem("permissions");
    if (stored) setLocalPermissions(JSON.parse(stored));
  }, []);
  function hasPermissionFor(module, action) {
    const role = (localStorage.getItem("role") || "guest").toLowerCase();
    if (role === "admin") return true;
    return localPermissions.some(p =>
      p.module.toLowerCase() === module.toLowerCase() &&
      p.actions.map(a => a.toLowerCase()).includes(action.toLowerCase())
    );
  }

  // Form fields
  const [originalSaleRef, setOriginalSaleRef] = useState("");
  const [saleSuggestions, setSaleSuggestions] = useState([]);
  const [originalSale, setOriginalSale] = useState(null);
  const [returnCode, setReturnCode] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState("Return");
  const [saleError, setSaleError] = useState("");

  // Dropdown lists
  const [warehouses, setWarehouses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [terminals, setTerminals] = useState([]);

  // Selected
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedPaymentType, setSelectedPaymentType] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedTerminal, setSelectedTerminal] = useState(null);

  // Items + search
  const [allItems, setAllItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searchError, setSearchError] = useState("");

  // Charges & discounts
  const [otherCharges, setOtherCharges] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [couponType, setCouponType] = useState("");
  const [couponValue, setCouponValue] = useState(0);
  const [discountOnAll, setDiscountOnAll] = useState(0);
  const [discountOnAllType, setDiscountOnAllType] = useState("Per%");
  const [note, setNote] = useState("");

  // Payment
  const [adjustAdvance, setAdjustAdvance] = useState(false);
  const [sendMessage, setSendMessage] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentNote, setPaymentNote] = useState("");
const auth = {
  headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
};

  // Sidebar
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  // Auth headers
  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  // returns { liveBalance } from your cash-summary endpoint
async function getLiveBalance(accountId) {
  // first you need to know which warehouse this account belongs to
  const { data: { warehouseId } } = await axios.get(
    `api/by-cash-account/${accountId}`,
    authHeaders()
  );

  // then fetch the summary for that warehouse
  const { data } = await axios.get(
    "api/cash-summary",
    {
      ...authHeaders(),
      params: { warehouseId }
    }
  );
  return data.liveBalance;
}


  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [whRes, cuRes, ptRes, acRes, termRes, retRes] = await Promise.all([
   axios.get("api/warehouses", {                      // ⬅️ new
     ...auth,
     params: { scope: "mine" }                        //   filter to “mine”
   }),
          axios.get("api/customer-data/all", authHeaders()),
          axios.get("api/payment-types", authHeaders()),
          axios.get("api/accounts", authHeaders()),
          axios.get("api/terminals", authHeaders()),
          axios.get("api/sales-return", authHeaders()),
        ]);

        setWarehouses((whRes.data.data || []).map(w => ({
          label: w.warehouseName,
          value: w._id,
          cashAccount: w.cashAccount && w.cashAccount._id ? w.cashAccount._id : w.cashAccount,
        })));

        const raw = Array.isArray(cuRes.data) ? cuRes.data : cuRes.data.data || [];
        setCustomers(raw.map(c => ({ label: c.customerName, value: c._id })));

        setPaymentTypes((ptRes.data.data || ptRes.data).map(x => ({
          label: x.paymentTypeName,
          value: x._id,
          name: x.paymentTypeName.toLowerCase(),
        })));

        setAccounts((acRes.data.data || acRes.data).map(x => ({
          label: x.accountName || "Unnamed",
          value: x._id,
        })));

        setTerminals((termRes.data.data || termRes.data).map(t => ({
          label: t.tid,
          value: t._id,
          warehouse: t.warehouse,
        })));

        if (!isEdit) {
          const allR = retRes.data.returns || [];
          setReturnCode(allR.length ? generateReturnCode(allR[allR.length - 1].returnCode) : `SR/${new Date().getFullYear()}/01`);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        alert("Failed to load data: " + err.message);
      }
    };
    fetchData();
  }, [isEdit]);

  // Fetch items based on selected warehouse
  useEffect(() => {
    const fetchItems = async () => {
      if (!selectedWarehouse) {
        setAllItems([]);
        setFilteredItems([]);
        setSearchError("Please select a warehouse to search for items.");
        return;
      }
      try {
        const resp = await axios.get(
          "api/items",
          {
            ...authHeaders(),
            params: { warehouse: selectedWarehouse.value }
          }
        );
        const raw = resp.data.data || [];
        const flat = raw.map((it) => {
          const isVar = Boolean(it.parentItemId);
          return {
            ...it,
            parentId: isVar ? it.parentItemId : it._id,
            variantId: isVar ? it._id : null,
            itemName: isVar
              ? `${it.itemName} / ${it.variantName || 'Variant'}`
              : it.itemName,
          };
        });
        setAllItems(flat);
      } catch (err) {
        console.error("Fetch items error:", err);
        setAllItems([]);
        setFilteredItems([]);
        setSearchError("Failed to fetch items: " + err.message);
      }
    };
    fetchItems();
  }, [selectedWarehouse]);

  // Filter items by warehouse and original sale
  useEffect(() => {
    if (!selectedWarehouse) {
      setFilteredItems([]);
      setSearchError("Please select a warehouse to search for items.");
      return;
    }
    setSearchError("");

    const list = [];
    if (originalSale) {
      const saleItemIds = (originalSale.items || []).map(oi => {
        return (
          (oi.variant?._id || oi.variant) ||
          (oi.item?._id || oi.item) ||
          (oi.product?._id || oi.product)
        )?.toString();
      }).filter(id => id);

      allItems.forEach(it => {
        const isInWarehouse = it.warehouse?._id === selectedWarehouse.value;
        const isDirectMatch = saleItemIds.includes(it._id.toString());
        if (isInWarehouse && isDirectMatch) {
          list.push({
            ...it,
            itemName: it.itemName,
            itemCode: it.itemCode,
            salesPrice: it.salesPrice || 0,
            barcode: it.barcodes?.[0] || '',
          });
        }
        if (it.variants && Array.isArray(it.variants)) {
          it.variants.forEach(v => {
            const isVariantMatch = saleItemIds.includes(v._id.toString());
            if (isInWarehouse && isVariantMatch) {
              list.push({
                ...it,
                _id: v._id,
                itemName: `${it.itemName} / ${v.name || 'Variant'}`,
                itemCode: v.itemCode || it.itemCode,
                salesPrice: v.salesPrice || it.salesPrice || 0,
                barcode: v.barcodes?.[0] || it.barcodes?.[0] || '',
                parentId: it._id,
                variantId: v._id,
              });
            }
          });
        }
      });
    } else {
      allItems.forEach(it => {
        const isInWarehouse = it.warehouse?._id === selectedWarehouse.value;
        if (isInWarehouse) {
          list.push({
            ...it,
            itemName: it.itemName,
            itemCode: it.itemCode,
            salesPrice: it.salesPrice || 0,
            barcode: it.barcodes?.[0] || '',
          });
          if (it.variants && Array.isArray(it.variants)) {
            it.variants.forEach(v => {
              list.push({
                ...it,
                _id: v._id,
                itemName: `${it.itemName} / ${v.name || 'Variant'}`,
                itemCode: v.itemCode || it.itemCode,
                salesPrice: v.salesPrice || it.salesPrice || 0,
                barcode: v.barcodes?.[0] || it.barcodes?.[0] || '',
                parentId: it._id,
                variantId: v._id,
              });
            });
          }
        }
      });
    }
    setFilteredItems(list);
  }, [selectedWarehouse, allItems, originalSale]);

  // Fetch existing sales return data when in edit mode
  useEffect(() => {
    if (!id) return;

    axios.get(`api/sales-return/${id}`, authHeaders())
      .then(({ data }) => {
        const ret = data.return || data;

        setOriginalSaleRef(ret.originalSaleRef || "");
        setReturnCode(ret.returnCode || "");
        setReferenceNo(ret.referenceNo || "");
        setReturnDate(ret.returnDate ? ret.returnDate.split('T')[0] : "");
        setSelectedWarehouse(warehouses.find(w => w.value === ret.warehouse) || null);
        setSelectedCustomer(customers.find(c => c.value === ret.customer) || null);
        setStatus(ret.status || "Return");

        setItems((ret.items || []).map(it => ({
          item: it.item,
          itemName: it.itemName || "Unknown Item",
          itemCode: it.itemCode || "",
          quantity: it.quantity || 1,
          reason: it.reason || "",
          price: it.price || 0,
          maxQuantity: it.maxQuantity || it.quantity,
          isVariant: !!it.isVariant,
        })));

        setOtherCharges(ret.otherCharges || 0);
        setCouponCode(ret.discountCouponCode || '');
        setCouponType(ret.couponType || "");
        setCouponValue(ret.couponValue || 0);
        setDiscountOnAll(ret.discountOnAll || 0);
        setDiscountOnAllType(ret.discountOnAllType || "Per%");
        setNote(ret.note || "");

        if (ret.payments?.length) {
          const pay = ret.payments[0];
          setSelectedPaymentType(paymentTypes.find(p => p.value === pay.paymentType) || null);
          setPaymentAmount(pay.amount || 0);
          setPaymentNote(pay.paymentNote || "");
          if (pay.account) {
            setSelectedAccount(accounts.find(a => a.value === pay.account) || null);
          }
          if (pay.terminal) {
            setSelectedTerminal(terminals.find(t => t.value === pay.terminal) || null);
          }
        }

        if (ret.originalSaleRef) {
          const fetchOriginalSale = async () => {
            try {
              const [salesRes, posRes] = await Promise.all([
                axios.get("api/sales", authHeaders()),
                axios.get("api/pos", authHeaders()),
              ]);
              const sales = salesRes.data.sales || salesRes.data || [];
              const posOrders = posRes.data.data || posRes.data || [];
              const sale = sales.find(s => s.referenceNo === ret.originalSaleRef) ||
                          posOrders.find(p => p.saleCode === ret.originalSaleRef);
              if (sale) {
                setOriginalSale(sale);
              }
            } catch (err) {
              console.error("Fetch original sale error:", err);
            }
          };
          fetchOriginalSale();
        }
      })
      .catch(err => {
        console.error(err);
        alert("Failed to load return: " + err.message);
      });
  }, [id, warehouses, customers, paymentTypes, accounts, terminals]);

  // Derive cash accounts from selected warehouse
  const selectedWh = warehouses.find(w => w.value === selectedWarehouse?.value);
  const cashAccounts = selectedWh && selectedWh.cashAccount
    ? accounts.filter(a => a.value === selectedWh.cashAccount)
    : [];

  // Payment mode based on payment type
  const mode = paymentTypes.find(p => p.value === selectedPaymentType?.value)?.name;
  const isCash = mode === "cash";
  const isBank = mode === "bank";

  // Auto-select account or terminal when payment type changes
  useEffect(() => {
    if (isCash && cashAccounts.length > 0) {
      setSelectedAccount(cashAccounts[0]);
    } else if (isBank && selectedWarehouse) {
      const warehouseTerminals = terminals.filter(t => t.warehouse === selectedWarehouse.value);
      if (warehouseTerminals.length > 0) {
        setSelectedTerminal(warehouseTerminals[0]);
      } else {
        setSelectedTerminal(null);
      }
    } else {
      setSelectedAccount(null);
      setSelectedTerminal(null);
    }
  }, [isCash, isBank, cashAccounts, selectedWarehouse, terminals]);

  // Search for sales/POS orders
  useEffect(() => {
    const searchSales = async () => {
      if (!originalSaleRef.trim() || isEdit) {
        setSaleSuggestions([]);
        setSaleError("");
        return;
      }
      try {
        const [salesRes, posRes] = await Promise.all([
          axios.get("api/sales", authHeaders()),
          axios.get("api/pos", authHeaders()),
        ]);
        const sales = (salesRes.data.sales || salesRes.data || []).filter(s =>
          s.referenceNo?.toLowerCase().includes(originalSaleRef.toLowerCase())
        );
        const posOrders = (posRes.data.data || posRes.data || []).filter(p =>
          p.saleCode?.toLowerCase().includes(originalSaleRef.toLowerCase())
        );
        const suggestions = [
          ...sales.map(s => ({ label: `Sale: ${s.referenceNo}`, value: s.referenceNo, type: "Sales", data: s })),
          ...posOrders.map(p => ({ label: `POS: ${p.saleCode}`, value: p.saleCode, type: "PosOrder", data: p })),
        ].slice(0, 10);
        setSaleSuggestions(suggestions);
        if (suggestions.length === 0) {
          setSaleError(`No matching sale or POS order found for "${originalSaleRef}".`);
        } else {
          setSaleError("");
        }
      } catch (err) {
        console.error("Search sales error:", err);
        setSaleError("Error searching for sales: " + err.message);
      }
    };
    searchSales();
  }, [originalSaleRef, isEdit]);

  // Fetch original sale/POS order details and auto-populate items
  const selectSale = async (suggestion) => {
    try {
      const { type, value, data } = suggestion;
      setOriginalSaleRef(value);
      setOriginalSale(data);
      const warehouseMatch = warehouses.find(w => w.value === (data.warehouse?._id || data.warehouse));
      setSelectedWarehouse(warehouseMatch || null);
      setSelectedCustomer(customers.find(c => c.value === (data.customer?._id || data.customer)) || null);

      // Reset existing items and suggestions
      setItems([]);
      setFilteredItems([]);
      setSaleSuggestions([]);
      setSaleError("");

      // Auto-populate items
      const saleItems = data.items || [];
      const newItems = [];
      for (const oi of saleItems) {
        const rawId = (
          (oi.variant?._id || oi.variant) ||
          (oi.item?._id || oi.item) ||
          (oi.product?._id || oi.product)
        )?.toString();
        if (!rawId) continue;

        let parent = allItems.find(it => it._id.toString() === rawId);
        let variantSub = null;
        if (!parent) {
          parent = allItems.find(it => {
            const v = (it.variants || []).find(v => v._id.toString() === rawId);
            if (v) { variantSub = v; return true; }
            return false;
          });
        }
        if (!parent) continue;

        const isVar = !!variantSub;
        newItems.push({
          item: isVar ? variantSub._id : parent._id,
          itemName: isVar
            ? `${parent.itemName} / ${variantSub.name || "Variant"}`
            : parent.itemName,
          itemCode: variantSub?.itemCode || parent.itemCode,
          quantity: 1,
          reason: "",
          price: oi.price || variantSub?.salesPrice || parent.salesPrice || 0,
          maxQuantity: oi.quantity || 1,
          isVariant: isVar,
        });
      }
      setItems(newItems);
    } catch (err) {
      console.error("Load sale error:", err);
      alert("Failed to load sale details: " + err.message);
    }
  };

  // Item suggestions for search
  useEffect(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q || !selectedWarehouse) {
      setSuggestions([]);
      return;
    }
    const list = filteredItems.filter(it =>
      it.itemName.toLowerCase().includes(q) ||
      it.itemCode.toLowerCase().includes(q) ||
      (it.barcode && it.barcode.toLowerCase().includes(q))
    );
    setSuggestions(list.slice(0, 20));
  }, [searchTerm, filteredItems, selectedWarehouse]);

  // Push item
const pushItem = (it) => {
  setItems(prev => {
    // 1) See if this item is already in your list
    const existing = prev.find(x => x.item === it._id);
    if (existing) {
      // 2a) if yes, bump its quantity
      return prev.map(x =>
        x.item === it._id
          ? { ...x, quantity: x.quantity + 1 }
          : x
      );
    } else {
      // 2b) otherwise add it as a new line with quantity = 1
      return [
        ...prev,
        {
          item:        it._id,
          itemName:    it.itemName,
          itemCode:    it.itemCode,
          quantity:    1,
          reason:      "",
          price:       it.salesPrice || 0,
          maxQuantity: it.maxQuantity || 9999,
          isVariant:   !!it.variantId,
        },
      ];
    }
  });

  // clear your search box if you like:
  setSearchTerm("");
  setSuggestions([]);
};


  // Handle Enter key for search
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && suggestions.length > 0) {
      pushItem(suggestions[0]);
    }
  };

  // Remove & edit item
  const handleRemoveItem = idx => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };
  const handleItemChange = (idx, field, val) => {
    setItems(prev => {
      const a = [...prev];
      if (field === "quantity" && +val > a[idx].maxQuantity) {
        val = a[idx].maxQuantity;
      }
      a[idx] = { ...a[idx], [field]: field === "quantity" ? +val : val };
      return a;
    });
  };

  // Compute totals
  const { subtotal, oc, cDisc, doAllVal, grand } = (() => {
    let sub = 0;
    items.forEach(it => {
      sub += it.quantity * it.price;
    });
    const oc_ = +otherCharges || 0;
    const cD = couponType === "percentage" ? (sub * couponValue) / 100 : +couponValue || 0;
    let dA = +discountOnAll || 0;
    if (discountOnAllType === "Per%") dA = (sub * dA) / 100;
    const gr = sub + oc_ - cD - dA;
    return {
      subtotal: sub,
      oc: oc_,
      cDisc: cD,
      doAllVal: dA,
      grand: gr < 0 ? 0 : gr,
    };
  })();
  useEffect(() => {
  setPaymentAmount(grand);
}, [grand]);


  // Save handler
  const handleSave = async () => {
    try {
      if (paymentAmount > 0 && selectedAccount) {
       const balance = await getLiveBalance(selectedAccount.value);
       if (paymentAmount > balance) {
         alert(`Insufficient funds. You only have ₹${balance.toFixed(2)} available.`);
         return;
       }
     }
      const mappedItems = items.map(it => ({
        item: it.item,
        quantity: it.quantity,
        reason: it.reason,
        itemName: it.itemName,
        itemCode: it.itemCode,
        price: it.price,
        maxQuantity: it.maxQuantity,
        isVariant: it.isVariant,
      }));
      const payments = paymentAmount > 0 ? [{
        paymentType: selectedPaymentType?.value || null,
        account: selectedAccount?.value || null,
        terminal: selectedTerminal?.value || null,
        amount: +paymentAmount || 0,
        paymentNote,
        paymentDate: new Date(),
      }] : [];
      const payload = {
        originalSaleRef: originalSaleRef || undefined, // Send undefined if empty
        returnCode,
        referenceNo,
        returnDate: returnDate || new Date().toISOString(),
        warehouse: selectedWarehouse?.value,
        customer: selectedCustomer?.value,
        status,
        items: mappedItems,
        totalRefund: grand,
        otherCharges: +otherCharges || 0,
        discountCouponCode: couponCode,
        couponType,
        couponValue: +couponValue || 0,
        discountOnAll: +discountOnAll || 0,
        discountOnAllType,
        note,
        payments,
        adjustAdvance,
        sendMessage,
      };

      if (isEdit) {
        await axios.put(
          `api/sales-return/${id}`,
          payload,
          authHeaders()
        );
      } else {
        await axios.post(
          "api/sales-return",
          payload,
          authHeaders()
        );
      }
      alert(isEdit ? "Sales Return updated!" : "Sales Return created!");
      navigate("/sales-payment-list");
    } catch (err) {
      console.error("Save error:", err);
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <div className="flex-grow p-4 overflow-y-auto">
          <header className="flex flex-col md:flex-row items-center justify-between mb-4">
            <div className="text-xl font-bold">{isEdit ? "Edit Sales Return" : "Add Sales Return"}</div>
            <nav className="flex items-center space-x-2 text-gray-600">
              <NavLink to="/dashboard" className="hover:underline">Home</NavLink>
              <BiChevronRight />
              <NavLink to="/sales-payment-list" className="hover:underline">Return List</NavLink>
            </nav>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex flex-col relative">
              <label className="font-semibold text-gray-700">Original Sale Ref</label>
              <input
                type="text"
                className="p-2 border rounded"
                value={originalSaleRef}
                onChange={e => setOriginalSaleRef(e.target.value)}
                placeholder="Enter Sale Reference or POS Sale Code (optional)"
                disabled={isEdit}
              />
              {saleSuggestions.length > 0 && (
                <ul className="absolute z-50 w-full max-h-60 overflow-y-auto bg-white border rounded shadow mt-1 top-full">
                  {saleSuggestions.map((s, i) => (
                    <li
                      key={i}
                      className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => selectSale(s)}
                    >
                      {s.label}
                    </li>
                  ))}
                </ul>
              )}
              {saleError && (
                <p className="text-red-500 text-sm mt-1">{saleError}</p>
              )}
            </div>
            <div className="flex flex-col">
              <label className="font-semibold text-gray-700">Return Code *</label>
              <input
                type="text"
                className="p-2 border rounded"
                value={returnCode}
                readOnly
              />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold text-gray-700">Reference No.</label>
              <input
                type="text"
                className="p-2 border rounded"
                value={referenceNo}
                onChange={e => setReferenceNo(e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold text-gray-700">Return Date *</label>
              <input
                type="date"
                className="p-2 border rounded"
                value={returnDate}
                onChange={e => setReturnDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold text-gray-700">Warehouse *</label>
              <Select
                options={warehouses}
                value={selectedWarehouse}
                onChange={setSelectedWarehouse}
              />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold text-gray-700">Customer *</label>
              <Select
                options={customers}
                value={selectedCustomer}
                onChange={setSelectedCustomer}
              />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold text-gray-700">Status</label>
              <select
                className="p-2 border rounded"
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
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
    const v = e.target.value.trim()
    setSearchTerm(v)

    // auto-add on exact match
    const hit = filteredItems.find(it =>
      it.barcode === v ||
      it.itemCode === v ||
      it.itemName.toLowerCase() === v.toLowerCase()
    )
    if (hit) {
      pushItem(hit)
      setSearchTerm("")
    }
  }}
  onKeyDown={handleKeyDown}
/>

            </div>
            {searchError && (
              <p className="text-red-500 text-sm mt-1">{searchError}</p>
            )}
            {suggestions.length > 0 && (
              <ul className="absolute z-50 w-full max-h-60 overflow-y-auto bg-white border rounded shadow mt-1">
                {suggestions.map(it => (
                  <li
                    key={it._id}
                    className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => pushItem(it)}
                  >
                    <strong>{it.itemCode}</strong> — {it.itemName} {it.variantId ? "(Variant)" : ""}
                    <span className="text-gray-500"> ({it.barcode || 'No barcode'})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="overflow-x-auto mb-6">
            <table className="w-full table-auto border">
              <thead className="bg-sky-600 text-white">
                <tr>
                  <th className="px-2 py-1">Item</th>
                  <th className="px-2 py-1">Code</th>
                  <th className="px-2 py-1">Qty</th>
                  <th className="px-2 py-1">Price</th>
                  <th className="px-2 py-1">Reason</th>
                  <th className="px-2 py-1">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-red-600">
                      No items to return
                    </td>
                  </tr>
                ) : (
                  items.map((it, idx) => (
                    <tr key={idx} className="text-center">
                      <td className="border px-2 py-1">
                        {it.itemName} {it.isVariant ? "(Variant)" : ""}
                      </td>
                      <td className="border px-2 py-1">{it.itemCode}</td>
                      <td className="border px-2 py-1">
                        <input
                          type="number"
                          min="1"
                          max={it.maxQuantity}
                          className="w-16 border rounded"
                          value={it.quantity}
                          onChange={e => handleItemChange(idx, "quantity", e.target.value)}
                        />
                      </td>
                      <td className="border px-2 py-1">{it.price.toFixed(2)}</td>
                      <td className="border px-2 py-1">
                        <input
                          type="text"
                          className="w-full border rounded"
                          value={it.reason}
                          onChange={e => handleItemChange(idx, "reason", e.target.value)}
                        />
                      </td>
                      <td className="border px-2 py-1">
                        <button
                          className="text-red-600"
                          onClick={() => handleRemoveItem(idx)}
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

          <div className="mb-6 p-4 bg-white rounded shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="font-semibold">Other Charges</label>
                <input
                  type="number"
                  min="0"
                  className="p-2 border rounded"
                  value={otherCharges}
                  onChange={e => setOtherCharges(e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label className="font-semibold">Coupon Code</label>
                <input
                  type="text"
                  className="p-2 border rounded"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label className="font-semibold">Coupon Type & Value</label>
                <div className="flex space-x-2">
                  <select
                    className="p-2 border rounded"
                    value={couponType}
                    onChange={e => setCouponType(e.target.value)}
                  >
                    <option value="">Select…</option>
                    <option value="percentage">Percentage</option>
                    <option value="value">Fixed</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    className="p-2 border rounded w-24"
                    value={couponValue}
                    onChange={e => setCouponValue(+e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <label className="font-semibold">Discount on All</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    min="0"
                    className="p-2 border rounded w-24"
                    value={discountOnAll}
                    onChange={e => setDiscountOnAll(e.target.value)}
                  />
                  <select
                    className="p-2 border rounded"
                    value={discountOnAllType}
                    onChange={e => setDiscountOnAllType(e.target.value)}
                  >
                    <option value="Per%">Per%</option>
                    <option value="Fixed">Fixed</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col">
                <label className="font-semibold">Note</label>
                <textarea
                  className="p-2 border rounded"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4 border-t pt-4 text-right space-y-2">
              <div><strong>Subtotal:</strong> ₹{subtotal.toFixed(2)}</div>
              <div><strong>Other Charges:</strong> ₹{oc.toFixed(2)}</div>
              <div><strong>Coupon Disc:</strong> ₹{cDisc.toFixed(2)}</div>
              <div><strong>Discount on All:</strong> ₹{doAllVal.toFixed(2)}</div>
              <div className="text-xl font-bold"><strong>Grand Total:</strong> ₹{grand.toFixed(2)}</div>
            </div>
          </div>

          <div className="mb-6 p-4 bg-white rounded shadow">
            <h2 className="font-semibold mb-2">Payment</h2>
            <div className="mb-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={adjustAdvance}
                  onChange={() => setAdjustAdvance(!adjustAdvance)}
                  className="mr-2"
                />
                Adjust Advance
              </label>
              <label className="inline-flex items-center ml-4">
                <input
                  type="checkbox"
                  checked={sendMessage}
                  onChange={() => setSendMessage(!sendMessage)}
                  className="mr-2"
                />
                Send Message
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label>Amount</label>
                <input
                  type="number"
                  min="0"
                  className="p-2 border rounded"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label>Payment Type</label>
                <Select
                  options={paymentTypes}
                  value={selectedPaymentType}
                  onChange={setSelectedPaymentType}
                />
              </div>
              {isCash && (
                <div className="flex flex-col">
                  <label>Account</label>
                  <Select
                    options={cashAccounts}
                    value={selectedAccount}
                    onChange={setSelectedAccount}
                  />
                </div>
              )}
              {isBank && (
                <div className="flex flex-col">
                  <label>Terminal</label>
                  <Select
                    options={terminals.filter(t => t.warehouse === selectedWarehouse?.value)}
                    value={selectedTerminal}
                    onChange={setSelectedTerminal}
                    placeholder="Select TID"
                  />
                </div>
              )}
            </div>
            <div className="mt-4">
              <label>Payment Note</label>
              <textarea
                className="w-full p-2 border rounded"
                value={paymentNote}
                onChange={e => setPaymentNote(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              className="px-6 py-2 bg-green-600 text-white rounded"
              onClick={handleSave}
              disabled={!hasPermissionFor("SalesReturn", isEdit ? "Edit" : "Add") || (!selectedWarehouse || !selectedCustomer)}
            >
              {isEdit ? "Update" : "Save"}
            </button>
            <button
              className="px-6 py-2 bg-gray-600 text-white rounded"
              onClick={() => navigate("/sales-payment-list")}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}