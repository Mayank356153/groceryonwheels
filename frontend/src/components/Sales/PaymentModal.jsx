import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";

/**
 * PaymentModal
 *
 * @param {Object}   props
 * @param {Function} props.onClose          – close the modal
 * @param {Function} props.onSubmit         – callback that receives { paymentRows, couponCode, adjustAdvancePayment, advance, selectedAccount }
 * @param {"cash"|"multiple"|"bank"} props.paymentMode
 * @param {Array}   props.paymentTypes      – [{ _id, paymentTypeName }]
 * @param {Array}   props.accounts          – [{ _id, accountName }]
 * @param {Array}   props.terminals         – [{ _id, tid, warehouse }]
 * @param {Number}  props.initialAdvance
 * @param {String}  props.initialAccount    – account id
 * @param {Object}  props.initialSummary    – { totalItems, totalPrice, discount, couponDiscount, totalPayable, totalPaying, balance, changeReturn }
 * @param {String}  props.selectedWarehouse – selected warehouse id
 */
const PaymentModal = ({
  onClose,
  onSubmit,
  paymentMode,
  paymentTypes = [],
  accounts = [],
  terminals = [],
  initialAdvance = 0,
  initialAccount = "",
  initialSummary = {
    totalItems: 0,
    totalPrice: 0,
    discount: 0,
    couponDiscount: 0,
    totalPayable: 0,
    totalPaying: 0,
    balance: 0,
    changeReturn: 0,
  },
  selectedWarehouse,
}) => {
  /* ------------------------------------------------------------------ */
  /* Helpers & initial state ------------------------------------------ */

  const getId = (name) =>
    paymentTypes.find(
      (pt) => pt.paymentTypeName?.toLowerCase() === name.toLowerCase()
    )?._id;

  const [couponCode, setCouponCode] = useState("");
  const [advance, setAdvance] = useState(initialAdvance);
  const [adjustAdvancePayment, setAdjustAdvancePayment] = useState(false);
  const [summary, setSummary] = useState(initialSummary);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Default row(s)
  const [paymentRows, setPaymentRows] = useState(() => {
    if (paymentMode === "cash") {
      return [
        {
          paymentType: getId("Cash") || "",
          amount: initialSummary.totalPayable,
          note: "",
          terminal: null,
          account: initialAccount || "", // Ensure account is set for cash
        },
      ];
    } else if (paymentMode === "bank") {
      return [
        {
          paymentType: getId("Bank") || "",
          amount: initialSummary.totalPayable,
          note: "",
          terminal: terminals.find((t) => t.warehouse === selectedWarehouse)?._id || "", // Default to first matching terminal
          account: null,
        },
      ];
    }
    return [
      {
        paymentType: "",
        amount: 0,
        note: "",
        terminal: null,
        account: null,
      },
    ];
  });

  /* ------------------------------------------------------------------ */
  /* Effects ----------------------------------------------------------- */

  useEffect(() => {
    // Calculate dynamic summary
    const totalPaying = paymentRows.reduce(
      (sum, row) => sum + Number(row.amount || 0),
      0
    );
    const couponDiscount = couponCode ? initialSummary.couponDiscount : 0; // Backend handles coupon calculation
    const advanceAmount = adjustAdvancePayment ? Number(advance) : 0;
    const totalPayable =
      initialSummary.totalPrice - initialSummary.discount - advanceAmount;
    const balance = totalPayable - totalPaying;
    const changeReturn =
      totalPaying > totalPayable ? totalPaying - totalPayable : 0;

    setSummary({
      totalItems: initialSummary.totalItems,
      totalPrice: initialSummary.totalPrice,
      discount: initialSummary.discount,
      couponDiscount,
      totalPayable,
      totalPaying,
      balance: balance > 0 ? balance : 0,
      changeReturn,
    });
  }, [
    paymentRows,
    couponCode,
    adjustAdvancePayment,
    advance,
    initialSummary.totalPrice,
    initialSummary.discount,
    initialSummary.couponDiscount,
    initialSummary.totalItems,
  ]);

  // Update terminal selection when selectedWarehouse changes
  useEffect(() => {
    setPaymentRows((rows) =>
      rows.map((row) => {
        if (row.paymentType === getId("Bank")) {
          const availableTerminals = terminals.filter(
            (t) => t.warehouse === selectedWarehouse
          );
          const newTerminal = availableTerminals.find(
            (t) => t._id === row.terminal
          )
            ? row.terminal
            : availableTerminals[0]?._id || "";
          return { ...row, terminal: newTerminal };
        }
        return row;
      })
    );
  }, [selectedWarehouse, terminals, paymentTypes]);

  /* ------------------------------------------------------------------ */
  /* Handlers ---------------------------------------------------------- */

  const addRow = () =>
    paymentMode === "multiple" &&
    setPaymentRows([
      ...paymentRows,
      {
        paymentType: "",
        amount: 0,
        note: "",
        terminal: null,
        account: null,
      },
    ]);

    const handleChangeRow = (idx, field, value) => {
      setPaymentRows(rows =>
        rows.map((r, i) => {
          if (i !== idx) return r;
    
          // start with the raw update of the one field
          const updated = { ...r, [field]: value };
    
          // if they just changed the paymentType, auto-fill account/terminal
          if (field === "paymentType") {
            const isCash = value === getId("Cash");
            const isBank = value === getId("Bank");
    
            // for cash: assign the warehouse’s cash account
            if (isCash) {
              updated.account = initialAccount;
              updated.terminal = null;
            }
            // for bank: pick the first terminal for that warehouse
            else if (isBank) {
              updated.terminal =
                terminals.find((t) => t.warehouse === selectedWarehouse)?._id || "";
              updated.account = null;
            } else {
              // other types clear both
              updated.account = null;
              updated.terminal = null;
            }
          }
    
          return updated;
        })
      );
    };
    

  const handleSave = () => {
    const invalid = paymentRows.some(
      (r) =>
        !r.paymentType ||
        Number(r.amount) <= 0 ||
        (r.paymentType === getId("Bank") && !r.terminal) ||
        (r.paymentType === getId("Cash") && !r.account)
    );
    if (invalid) {
      alert(
        "Select a payment type, enter a positive amount, select a terminal for bank payments, and select an account for cash payments."
      );
      return;
    }
    onSubmit({
      paymentRows: paymentRows.map((r) => ({
        paymentType: r.paymentType,
        amount: Number(r.amount),
        note: r.note,
        terminal: r.terminal || undefined,
        account: r.account || undefined, // Include account in payload
      })),
      couponCode,
      adjustAdvancePayment,
      advance: Number(advance),
      selectedAccount: undefined, // No global selectedAccount
    });
    onClose();
  };

  /* ------------------------------------------------------------------ */
  /* Render ------------------------------------------------------------ */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-4xl p-4 bg-white rounded shadow-lg">
        {/* Close button */}
        <button
          className="absolute text-gray-600 top-2 right-2 hover:text-gray-800"
          onClick={onClose}
        >
          <FaTimes size={18} />
        </button>

        <h2 className="mb-4 text-xl font-bold capitalize">
          {paymentMode === "multiple"
            ? "Multiple Payment"
            : paymentMode === "cash"
            ? "Cash Payment"
            : "Bank Payment"}
        </h2>

        <div className="flex flex-col gap-4 md:flex-row">
          {/* Left – settings */}
          <div className="flex-1 p-4 border rounded bg-gray-50">
            {/* Coupon */}
            <div className="mb-4">
              <label className="block mb-1 text-sm font-semibold">
                Discount Coupon Code
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                placeholder="Enter Coupon Code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
              />
            </div>

            {/* Advance payment */}
            <div className="mb-4">
              <label className="block mb-1 text-sm font-semibold">
                Adjust Advance Payment
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={adjustAdvancePayment}
                  onChange={(e) => setAdjustAdvancePayment(e.target.checked)}
                />
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  placeholder="Enter Advance Amount"
                  value={advance}
                  onChange={(e) => setAdvance(Number(e.target.value))}
                  disabled={!adjustAdvancePayment}
                  min="0"
                />
              </div>
            </div>

            {/* Payment rows */}
            <div className="mb-4">
              <label className="block mb-2 text-sm font-semibold">
                Payment Details
              </label>

              {paymentRows.map((row, idx) => (
                <div key={idx} className="p-2 mb-2 border rounded">
                  {/* Type */}
                  <label className="block mb-1 text-xs font-medium">
                    Payment Type
                  </label>
                  <select
                    className="w-full p-2 mb-2 border rounded"
                    value={row.paymentType}
                    onChange={(e) =>
                      handleChangeRow(idx, "paymentType", e.target.value)
                    }
                  >
                    <option value="">-- Select Payment Type --</option>
                    {paymentTypes.map((pt) => (
                      <option key={pt._id} value={pt._id}>
                        {pt.paymentTypeName}
                      </option>
                    ))}
                  </select>

                  {/* Account (for cash payments) */}
                  {row.paymentType === getId("Cash") && (
                    <div className="mb-2">
                      <label className="block mb-1 text-xs font-medium">
                        Select Account
                      </label>
                      <select
                        className="w-full p-2 border rounded"
                        value={row.account || ""}
                        onChange={(e) =>
                          handleChangeRow(idx, "account", e.target.value)
                        }
                      >
                        <option value="">-- Select an Account --</option>
                        {accounts.map((acc) => (
                          <option key={acc._id} value={acc._id}>
                            {acc.accountName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Terminal (for bank payments) */}
                  {row.paymentType === getId("Bank") && (
                    <div className="mb-2">
                      <label className="block mb-1 text-xs font-medium">
                        Terminal
                      </label>
                      <select
                        className="w-full p-2 border rounded"
                        value={row.terminal || ""}
                        onChange={(e) =>
                          handleChangeRow(idx, "terminal", e.target.value)
                        }
                      >
                        <option value="">-- Select Terminal --</option>
                        {terminals
                          .filter((t) => t.warehouse === selectedWarehouse)
                          .map((t) => (
                            <option key={t._id} value={t._id}>
                              {t.tid}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {/* Amount */}
                  <label className="block mb-1 text-xs font-medium">Amount</label>
                  <input
                    type="number"
                    className="w-full p-2 mb-2 border rounded"
                    value={row.amount}
                    onChange={(e) =>
                      handleChangeRow(idx, "amount", Number(e.target.value))
                    }
                    min="0"
                  />

                  {/* Note */}
                  <label className="block mb-1 text-xs font-medium">
                    Payment Note
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    placeholder="Enter Payment Note"
                    value={row.note}
                    onChange={(e) =>
                      handleChangeRow(idx, "note", e.target.value)
                    }
                  />
                </div>
              ))}

              {paymentMode === "multiple" && (
                <button
                  onClick={addRow}
                  className="px-2 py-1 text-sm text-white bg-blue-600 rounded"
                >
                  + Add Payment Row
                </button>
              )}
            </div>
          </div>

          {/* Right – summary */}
          <div className="flex-1 p-4 bg-white border rounded">
            <h3 className="mb-2 text-sm font-bold">Summary</h3>
            <div className="flex flex-col gap-1 text-sm">
              {[
                ["Total Items:", summary.totalItems],
                ["Total Price (₹):", summary.totalPrice],
                ["Discount (₹):", summary.discount],
                ["Coupon Discount (₹):", summary.couponDiscount],
                ["Advance Used (₹):", adjustAdvancePayment ? advance : 0],
                ["Total Payable (₹):", summary.totalPayable],
                ["Total Paying (₹):", summary.totalPaying],
                ["Balance (₹):", summary.balance],
                ["Change Return (₹):", summary.changeReturn],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span>{label}</span>
                  <span>{Number(value).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={onClose}
                className="px-3 py-1 mr-2 text-gray-700 bg-gray-300 rounded"
              >
                Close
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1 text-white bg-green-600 rounded"
              >
                Save & Print
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;