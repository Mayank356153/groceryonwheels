import { useEffect, useState } from "react";
import Select from "react-select";
import axios from "axios";

const toOpt = (label) => (o) => ({
  label: o[label],
  value: o._id ?? o[label],
});

export default function CustomerPopup({ open, onClose, onCreated }) {
  const empty = {
    customerName: "",
    email: "",
    mobile: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postcode: "",
    gstNumber: "",
    taxNumber: "",
    openingBalance: 0,
    previousBalance: 0,
    purchaseDue: 0,
    purchaseReturnDue: 0,
    status: "Active",
    type: "Online",
    shippingCity: "",
    shippingArea: "",
    shippingState: "",
    shippingPostcode: "",
    shippingLocationLink: "",
    shippingCountry: "",
    panNumber: "",
    priceLevel: 0,
    priceLevelType: "",
    salesReturnDue: 0,
    customerId: "",
    attachmentPath: "",
    customerImage: "",
    openingBalancePayments: [],
  };

  const [form, setForm] = useState(empty);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(empty);
    setErrorMsg("");

    const token = localStorage.getItem("token");
    const hdr = { headers: { Authorization: `Bearer ${token}` } };

    Promise.all([
      axios.get("/api/countries", hdr),
      axios.get("/api/states", hdr),
    ])
      .then(([cRes, sRes]) => {
        setCountries(
          (cRes.data.data || []).filter((c) => c.status === "active").map(toOpt("countryName"))
        );
        setStates(
          (sRes.data.data || []).filter((s) => s.status === "active").map(toOpt("stateName"))
        );
      })
      .catch((e) => setErrorMsg("Failed to load country/state lists"));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;

  const change = (e) =>
    setForm({
      ...form,
      [e.target.name]: e.target.type === "number" ? Number(e.target.value) : e.target.value,
    });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    try {
      const { data } = await axios.post(
        "api/customer-data/create",
        form,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      onCreated?.(data.data || data);
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={save}
        className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg"
      >
        <h2 className="mb-4 text-xl font-semibold text-center">Add Customer</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Customer Name *</label>
            <input
              required
              name="customerName"
              value={form.customerName}
              onChange={change}
              className="w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={change}
              className="w-full rounded border px-3 py-2"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Mobile</label>
            <input
              name="mobile"
              value={form.mobile}
              onChange={change}
              className="w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={change}
              className="w-full rounded border px-3 py-2"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm">Address</label>
          <textarea
            name="address"
            rows="2"
            value={form.address}
            onChange={change}
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">City</label>
            <input
              name="city"
              value={form.city}
              onChange={change}
              className="w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Postcode</label>
            <input
              name="postcode"
              value={form.postcode}
              onChange={change}
              className="w-full rounded border px-3 py-2"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Country</label>
            <Select
              options={countries}
              value={countries.find((o) => o.value === form.country) || null}
              onChange={(o) => setForm({ ...form, country: o?.value || "" })}
              placeholder="Select country"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">State</label>
            <Select
              options={states}
              value={states.find((o) => o.value === form.state) || null}
              onChange={(o) => setForm({ ...form, state: o?.value || "" })}
              placeholder="Select state"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">GST Number</label>
            <input
              name="gstNumber"
              value={form.gstNumber}
              onChange={change}
              className="w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Tax Number</label>
            <input
              name="taxNumber"
              value={form.taxNumber}
              onChange={change}
              className="w-full rounded border px-3 py-2"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Opening Balance</label>
            <input
              type="number"
              min="0"
              name="openingBalance"
              value={form.openingBalance}
              onChange={change}
              className="w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Previous Balance</label>
            <input
              type="number"
              min="0"
              name="previousBalance"
              value={form.previousBalance}
              onChange={change}
              className="w-full rounded border px-3 py-2"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Purchase Due</label>
            <input
              type="number"
              min="0"
              name="purchaseDue"
              value={form.purchaseDue}
              onChange={change}
              className="w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Purchase Return Due</label>
            <input
              type="number"
              min="0"
              name="purchaseReturnDue"
              value={form.purchaseReturnDue}
              onChange={change}
              className="w-full rounded border px-3 py-2"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Customer Type</label>
            <select
              name="type"
              value={form.type}
              onChange={change}
              className="w-full rounded border px-3 py-2"
            >
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={change}
              className="w-full rounded border px-3 py-2"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Shipping City</label>
            <input
              name="shippingCity"
              value={form.shippingCity}
              onChange={change}
              className="w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Shipping Area</label>
            <input
              name="shippingArea"
              value={form.shippingArea}
              onChange={change}
              className="w-full rounded border px-3 py-2"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Shipping State</label>
            <Select
              options={states}
              value={states.find((o) => o.value === form.shippingState) || null}
              onChange={(o) => setForm({ ...form, shippingState: o?.value || "" })}
              placeholder="Select shipping state"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Shipping Postcode</label>
            <input
              name="shippingPostcode"
              value={form.shippingPostcode}
              onChange={change}
              className="w-full rounded border px-3 py-2"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Shipping Country</label>
            <Select
              options={countries}
              value={countries.find((o) => o.value === form.shippingCountry) || null}
              onChange={(o) => setForm({ ...form, shippingCountry: o?.value || "" })}
              placeholder="Select shipping country"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Shipping Location Link</label>
            <input
              name="shippingLocationLink"
              value={form.shippingLocationLink}
              onChange={change}
              className="w-full rounded border px-3 py-2"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">PAN Number</label>
            <input
              name="panNumber"
              value={form.panNumber}
              onChange={change}
              className="w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Price Level</label>
            <input
              type="number"
              min="0"
              name="priceLevel"
              value={form.priceLevel}
              onChange={change}
              className="w-full rounded border px-3 py-2"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Price Level Type</label>
            <input
              name="priceLevelType"
              value={form.priceLevelType}
              onChange={change}
              className="w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Sales Return Due</label>
            <input
              type="number"
              min="0"
              name="salesReturnDue"
              value={form.salesReturnDue}
              onChange={change}
              className="w-full rounded border px-3 py-2"
            />
          </div>
        </div>

        {errorMsg && (
          <p className="mt-4 rounded border border-red-300 bg-red-100 px-3 py-2 text-sm text-red-700">
            {errorMsg}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            disabled={saving}
            className="rounded bg-emerald-600 px-6 py-2 text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}