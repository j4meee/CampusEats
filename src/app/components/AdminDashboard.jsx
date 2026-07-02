import { useEffect, useState } from "react";
import { LogOut, Plus, Store, Users, ClipboardList, BarChart3 } from "lucide-react";
import { fetchJson } from "../lib/api";

export function AdminDashboard({ user, onLogout }) {
  const [dashboard, setDashboard] = useState({
    summary: { vendors: 0, ordersToday: 0, sales: 0 },
    vendors: [],
    orders: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    loadDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-gray-400">Admin Dashboard</p>
            <h1 className="text-gray-900">Welcome, {user?.name || "Admin"}</h1>
          </div>
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SummaryTile icon={Store} label="Vendors" value={String(dashboard.summary.vendors)} />
          <SummaryTile icon={ClipboardList} label="Orders Today" value={String(dashboard.summary.ordersToday)} />
          <SummaryTile icon={BarChart3} label="Sales" value={`$${dashboard.summary.sales.toFixed(2)}`} />
        </div>

        <section className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-gray-900">Vendor Accounts</h2>
              <p className="text-xs sm:text-sm text-gray-400">Admin creates vendor accounts. Vendors cannot self-register.</p>
            </div>
            <button type="button" className="shrink-0 bg-[#f97316] hover:bg-orange-600 text-white rounded-lg px-3 py-2 text-sm flex items-center gap-2 transition-colors">
              <Plus className="w-4 h-4" />
              Add Vendor
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {loading && <EmptyRow text="Loading vendors..." />}
            {!loading && dashboard.vendors.map((vendor) => (
              <div key={vendor.id} className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm sm:text-base text-gray-900 truncate">{vendor.name}</p>
                  <p className="text-xs sm:text-sm text-gray-400 truncate">{vendor.email} - {vendor.stall}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  vendor.status === "active" ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"
                }`}>
                  {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                </span>
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
