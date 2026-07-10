import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock, LogOut, UtensilsCrossed } from "lucide-react";
import { fetchJson } from "../lib/api";
import { WeeklyMenuManager } from "./WeeklyMenuManager";

const DASHBOARD_REFRESH_MS = 5000;

export function VendorDashboard({ user, onLogout }) {
  const [dashboard, setDashboard] = useState({
    summary: { pendingOrders: 0, readyOrders: 0, menuItems: 0 },
    menu: [],
    orders: [],
  });
  const [loading, setLoading] = useState(true);
  const refreshInFlight = useRef(false);

  const loadDashboard = useCallback(async ({ showLoading = false } = {}) => {
    if (!user?.id || refreshInFlight.current) return;

    refreshInFlight.current = true;
    if (showLoading) setLoading(true);

    try {
      const data = await fetchJson(`/api/dashboard/vendor/${user.id}`);

      setDashboard(data);
    } catch (error) {
      console.error(error);
    } finally {
      refreshInFlight.current = false;
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return undefined;

    loadDashboard({ showLoading: true });
    const refreshTimer = window.setInterval(() => {
      loadDashboard();
    }, DASHBOARD_REFRESH_MS);

    return () => window.clearInterval(refreshTimer);
  }, [loadDashboard, user?.id]);

  const updateOrderStatus = async (order, status) => {
    try {
      const data = await fetchJson(`/api/orders/${order.dbId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      setDashboard((current) => ({
        ...current,
        summary: {
          ...current.summary,
          pendingOrders: current.orders.filter((item) =>
            item.id === order.id ? data.order.status === "pending" : item.status === "pending",
          ).length,
          readyOrders: current.orders.filter((item) =>
            item.id === order.id ? data.order.status === "ready" : item.status === "ready",
          ).length,
        },
        orders: current.orders.map((item) =>
          item.id === order.id ? { ...item, status: data.order.status } : item,
        ),
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const nextOrderAction = (order) => {
    if (order.status === "pending") return { label: "Start", status: "preparing" };
    if (order.status === "preparing") return { label: "Ready", status: "ready" };
    if (order.status === "ready") return { label: "Picked Up", status: "picked_up" };
    return null;
  };

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <div className="bg-[#f97316] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-orange-100 text-xs sm:text-sm">Vendor Dashboard</p>
            <h1 className="text-white">{user?.name || "Counter B Vendor"}</h1>
            <p className="text-orange-100 text-sm">Manage menu availability and incoming orders.</p>
          </div>
          <button
            onClick={onLogout}
            type="button"
            className="w-10 h-10 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SummaryTile icon={Clock} label="Pending Orders" value={String(dashboard.summary.pendingOrders)} />
          <SummaryTile icon={CheckCircle2} label="Ready Orders" value={String(dashboard.summary.readyOrders)} />
          <SummaryTile icon={UtensilsCrossed} label="Menu Items" value={String(dashboard.summary.menuItems)} />
        </div>

        <section className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-gray-100">
            <h2 className="text-gray-900">Incoming Orders</h2>
            <p className="text-xs sm:text-sm text-gray-400">Vendor changes order status from pending to ready.</p>
          </div>
          <div className="divide-y divide-gray-50">
            {loading && <EmptyRow text="Loading orders..." />}
            {!loading && dashboard.orders.map((order) => {
              const action = nextOrderAction(order);

              return (
                <div key={order.id} className="px-4 sm:px-5 py-3 grid grid-cols-1 sm:grid-cols-[90px_1fr_80px_110px_100px] gap-2 sm:items-center text-sm">
                  <span className="text-gray-900">{order.id}</span>
                  <span className="text-gray-500">{order.items}</span>
                  <span className="text-[#f97316]">${order.total.toFixed(2)}</span>
                  <span className="text-gray-500">{order.status.replace("_", " ")}</span>
                  {action ? (
                    <button
                      type="button"
                      onClick={() => updateOrderStatus(order, action.status)}
                      className="rounded-lg bg-[#f97316] px-3 py-2 text-xs text-white hover:bg-orange-600 transition-colors"
                    >
                      {action.label}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-300">Done</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <WeeklyMenuManager
          title="My Weekly Menu"
          subtitle="Choose up to 10 of your items to show to students this week."
        />
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
