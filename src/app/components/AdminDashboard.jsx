import { useEffect, useState } from "react";
import { LogOut, Plus, Store, Users, ClipboardList, BarChart3, Trash2, UserRound } from "lucide-react";
import { fetchJson } from "../lib/api";
import { WeeklyMenuManager } from "./WeeklyMenuManager";

export function AdminDashboard({ user, onLogout, onProfile }) {
  const [dashboard, setDashboard] = useState({
    summary: { vendors: 0, ordersToday: 0, sales: 0 },
    vendors: [],
    orders: [],
  });
  const [loading, setLoading] = useState(true);
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    name: "",
    email: "",
    password: "",
    vendorCounterId: "",
    vendorStaffType: "cashier",
    stallName: "",
    pickupLocation: "",
  });
  const [vendorError, setVendorError] = useState("");
  const [vendorMessage, setVendorMessage] = useState("");
  const [savingVendor, setSavingVendor] = useState(false);
  const [deletingVendorId, setDeletingVendorId] = useState(null);

  const loadDashboard = async () => {
    try {
      const data = await fetchJson("/api/dashboard/admin");

      setDashboard(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!vendorMessage) return undefined;

    const timer = window.setTimeout(() => {
      setVendorMessage("");
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [vendorMessage]);

  useEffect(() => {
    if (!vendorError) return undefined;

    const timer = window.setTimeout(() => {
      setVendorError("");
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [vendorError]);

  const updateVendorForm = (field, value) => {
    setVendorForm((current) => {
      if (field === "vendorCounterId") {
        const selectedVendor = dashboard.vendors.find((vendor) => String(vendor.id) === value);

        return {
          ...current,
          vendorCounterId: value,
          stallName: selectedVendor?.stall || "",
          pickupLocation: selectedVendor?.pickupLocation || "",
        };
      }

      return { ...current, [field]: value };
    });
    setVendorError("");
    setVendorMessage("");
  };

  const handleCreateVendor = async () => {
    setVendorError("");
    setVendorMessage("");
    setSavingVendor(true);

    try {
      await fetchJson("/api/users/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vendorForm),
      });

      setVendorForm({
        name: "",
        email: "",
        password: "",
        vendorCounterId: "",
        vendorStaffType: "cashier",
        stallName: "",
        pickupLocation: "",
      });
      setShowVendorForm(false);
      setVendorMessage("Vendor account created.");
      await loadDashboard();
    } catch (error) {
      setVendorError(error.message || "Failed to create vendor.");
    } finally {
      setSavingVendor(false);
    }
  };

  const handleDeleteVendor = async (vendor) => {
    const confirmed = window.confirm(`Delete ${vendor.name} counter and its staff accounts?`);

    if (!confirmed) return;

    setVendorError("");
    setVendorMessage("");
    setDeletingVendorId(vendor.id);

    try {
      const data = await fetchJson(`/api/users/vendors/${vendor.id}`, {
        method: "DELETE",
      });

      setVendorMessage(data?.message || "Vendor deleted successfully.");
      await loadDashboard();
    } catch (error) {
      setVendorError(error.message || "Failed to delete vendor.");
    } finally {
      setDeletingVendorId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-gray-400">Admin Dashboard</p>
            <h1 className="text-gray-900">Welcome, {user?.name || "Admin"}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onProfile}
              type="button"
              className="w-10 h-10 rounded-lg bg-orange-50 hover:bg-orange-100 flex items-center justify-center transition-colors"
              title="Profile"
            >
              <UserRound className="w-5 h-5 text-[#f97316]" />
            </button>
            <button
              onClick={onLogout}
              type="button"
              className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SummaryTile icon={Store} label="Vendors" value={String(dashboard.summary.vendors)} />
          <SummaryTile icon={ClipboardList} label="Orders Today" value={String(dashboard.summary.ordersToday)} />
          <SummaryTile icon={BarChart3} label="Sales" value={`$${dashboard.summary.sales.toFixed(2)}`} />
        </div>

        <WeeklyMenuManager
          title="Weekly Menu"
          subtitle="Choose up to 10 active menu items for students. Admin can manage all vendors."
          onMenuSaved={loadDashboard}
        />

        <section className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-gray-900">Vendor Counters & Staff</h2>
              <p className="text-xs sm:text-sm text-gray-400">Admin creates counters and assigns cashier or chef accounts.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowVendorForm((value) => !value)}
              className="shrink-0 bg-[#f97316] hover:bg-orange-600 text-white rounded-lg px-3 py-2 text-sm flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Staff
            </button>
          </div>
          {showVendorForm && (
            <div className="px-4 sm:px-5 py-4 border-b border-gray-100 bg-gray-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Staff Name"
                  value={vendorForm.name}
                  onChange={(value) => updateVendorForm("name", value)}
                  placeholder="Staff member name"
                />
                <Input
                  label="Email"
                  type="email"
                  value={vendorForm.email}
                  onChange={(value) => updateVendorForm("email", value)}
                  placeholder="staff@example.com"
                />
                <Input
                  label="Temporary Password"
                  type="password"
                  value={vendorForm.password}
                  onChange={(value) => updateVendorForm("password", value)}
                  placeholder="Create a password"
                />
                <label className="block">
                  <span className="text-xs sm:text-sm text-gray-500 mb-1.5 block">Counter Assignment</span>
                  <select
                    value={vendorForm.vendorCounterId}
                    onChange={(event) => updateVendorForm("vendorCounterId", event.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100 transition-all"
                  >
                    <option value="">Create new counter</option>
                    {dashboard.vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.stall}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs sm:text-sm text-gray-500 mb-1.5 block">Vendor Staff Type</span>
                  <select
                    value={vendorForm.vendorStaffType}
                    onChange={(event) => updateVendorForm("vendorStaffType", event.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100 transition-all"
                  >
                    <option value="cashier">Cashier</option>
                    <option value="chef">Chef</option>
                  </select>
                </label>
                <Input
                  label="Stall Name"
                  value={vendorForm.stallName}
                  onChange={(value) => updateVendorForm("stallName", value)}
                  placeholder="Counter A"
                  disabled={Boolean(vendorForm.vendorCounterId)}
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Pickup Location"
                    value={vendorForm.pickupLocation}
                    onChange={(value) => updateVendorForm("pickupLocation", value)}
                    placeholder="Block A Canteen - Counter A"
                    disabled={Boolean(vendorForm.vendorCounterId)}
                  />
                </div>
              </div>
              {vendorError && (
                <p className="mt-3 text-xs sm:text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {vendorError}
                </p>
              )}
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowVendorForm(false);
                    setVendorError("");
                    setVendorMessage("");
                  }}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateVendor}
                  disabled={savingVendor}
                  className="bg-[#f97316] hover:bg-orange-600 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-70 disabled:hover:bg-[#f97316] transition-colors"
                >
                  {savingVendor ? "Creating..." : "Create Vendor"}
                </button>
              </div>
            </div>
          )}
          {!showVendorForm && vendorError && (
            <p className="mx-4 sm:mx-5 mt-4 text-xs sm:text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {vendorError}
            </p>
          )}
          {vendorMessage && (
            <p className="mx-4 sm:mx-5 mt-4 text-xs sm:text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              {vendorMessage}
            </p>
          )}
          <div className="divide-y divide-gray-50">
            {loading && <EmptyRow text="Loading vendors..." />}
            {!loading && dashboard.vendors.length === 0 && <EmptyRow text="No active vendors." />}
            {!loading && dashboard.vendors.map((vendor) => (
              <div key={vendor.id} className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm sm:text-base text-gray-900 truncate">{vendor.name}</p>
                  <p className="text-xs sm:text-sm text-gray-400 truncate">
                    {vendor.pickupLocation || "Pickup location not set"}
                  </p>
                  {vendor.staff?.length > 0 && (
                    <p className="text-xs text-gray-400 truncate">
                      Staff: {vendor.staff.map((staff) => `${staff.name} (${staff.vendorStaffType || "cashier"})`).join(", ")}
                    </p>
                  )}
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    vendor.status === "active" ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"
                  }`}>
                    {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteVendor(vendor)}
                    disabled={deletingVendorId === vendor.id}
                    className="w-9 h-9 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center disabled:opacity-60 disabled:hover:bg-red-50 transition-colors"
                    title="Delete vendor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#f97316]" />
            <h2 className="text-gray-900">All Orders</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {loading && <EmptyRow text="Loading orders..." />}
            {!loading && dashboard.orders.map((order) => (
              <div key={order.id} className="px-4 sm:px-5 py-3 grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
                <span className="text-gray-900">{order.id}</span>
                <span className="text-gray-500">{order.student}</span>
                <span className="text-gray-500">{order.vendor}</span>
                <span className="text-[#f97316]">${order.total.toFixed(2)}</span>
                <span className="text-gray-500">{order.status.replace("_", " ")}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Input({ label, type = "text", value, onChange, placeholder, disabled = false }) {
  return (
    <label className="block">
      <span className="text-xs sm:text-sm text-gray-500 mb-1.5 block">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100 transition-all disabled:bg-gray-100 disabled:text-gray-400"
      />
    </label>
  );
}

function EmptyRow({ text }) {
  return <div className="px-4 sm:px-5 py-4 text-sm text-gray-400">{text}</div>;
}

function SummaryTile({ icon: Icon, label, value }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-4 py-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
        <Icon className="w-5 h-5 text-[#f97316]" />
      </div>
      <div>
        <p className="text-xs sm:text-sm text-gray-400">{label}</p>
        <p className="text-lg text-gray-900">{value}</p>
      </div>
    </div>
  );
}
