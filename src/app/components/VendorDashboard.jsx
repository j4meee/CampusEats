import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock, LayoutDashboard, LogOut, Minus, Plus, Search, Settings, Store, Wallet, XCircle, UtensilsCrossed } from "lucide-react";
import { fetchJson } from "../lib/api";
import { WeeklyMenuManager } from "./WeeklyMenuManager";

const DASHBOARD_REFRESH_MS = 5000;

export function VendorDashboard({ user, onLogout }) {
  const [dashboard, setDashboard] = useState({
    summary: { pendingOrders: 0, readyOrders: 0, menuItems: 0, weeklyMenuItems: 0 },
    staffType: user?.vendorStaffType || "cashier",
    serviceStatus: "open",
    vendor: null,
    menu: [],
    orders: [],
  });
  const [loading, setLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentResults, setStudentResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpNote, setTopUpNote] = useState("");
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpMessage, setTopUpMessage] = useState("");
  const [topUpError, setTopUpError] = useState("");
  const [activeSection, setActiveSection] = useState("dashboard");
  const refreshInFlight = useRef(false);

  const loadDashboard = useCallback(async ({ showLoading = false, force = false } = {}) => {
    if (!user?.id || (!force && refreshInFlight.current)) return;

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
    const body = { status };

    if (status === "cancelled") {
      const reason = window.prompt("Why are you rejecting this order?", "Too busy to prepare in time");

      if (!reason?.trim()) return;
      body.reason = reason.trim();
    }

    try {
      const data = await fetchJson(`/api/orders/${order.dbId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

  const updateItemStock = async (item, nextStockQuantity) => {
    const stockQuantity = Math.max(0, nextStockQuantity);

    try {
      const data = await fetchJson(`/api/menu/${item.id}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockQuantity }),
      });

      setDashboard((current) => ({
        ...current,
        menu: current.menu.map((menuItem) =>
          menuItem.id === item.id
            ? { ...menuItem, stockQuantity: data.item.stockQuantity }
            : menuItem,
        ),
      }));
    } catch (error) {
      console.error(error);
      window.alert(error.message || "Failed to update stock.");
    }
  };

  const updateServiceStatus = async (serviceStatus) => {
    try {
      const vendorId = dashboard.vendor?.id || user?.vendorCounterId || 0;
      const data = await fetchJson(`/api/dashboard/vendor/${vendorId}/service-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceStatus }),
      });

      setDashboard((current) => ({
        ...current,
        serviceStatus: data.vendor.serviceStatus,
        vendor: current.vendor
          ? { ...current.vendor, serviceStatus: data.vendor.serviceStatus }
          : data.vendor,
      }));
    } catch (error) {
      console.error(error);
      window.alert(error.message || "Failed to update counter status.");
    }
  };

  const searchStudents = async () => {
    setTopUpError("");
    setTopUpMessage("");
    setTopUpLoading(true);

    try {
      const data = await fetchJson(`/api/users/students/search?q=${encodeURIComponent(studentSearch)}`);

      setStudentResults(data.students || []);
    } catch (error) {
      setTopUpError(error.message || "Failed to search students.");
    } finally {
      setTopUpLoading(false);
    }
  };

  const topUpStudent = async () => {
    setTopUpError("");
    setTopUpMessage("");

    if (!selectedStudent) {
      setTopUpError("Please select a student first.");
      return;
    }

    setTopUpLoading(true);

    try {
      const data = await fetchJson("/api/users/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          amount: Number(topUpAmount),
          note: topUpNote,
        }),
      });

      setSelectedStudent(data.student);
      setStudentResults((current) =>
        current.map((student) => student.id === data.student.id ? data.student : student),
      );
      setTopUpAmount("");
      setTopUpNote("");
      setTopUpMessage(`${data.student.name} balance is now $${data.student.walletBalance.toFixed(2)}.`);
    } catch (error) {
      setTopUpError(error.message || "Failed to top up wallet.");
    } finally {
      setTopUpLoading(false);
    }
  };

  const nextOrderAction = (order) => {
    if ((dashboard.staffType || user?.vendorStaffType) === "chef" && order.status === "preparing") {
      return { label: "Ready", status: "ready" };
    }

    return null;
  };

  const weeklyMenuItems = dashboard.menu.filter((item) => item.isAvailable);
  const staffType = dashboard.staffType || user?.vendorStaffType || "cashier";
  const serviceStatus = dashboard.serviceStatus || dashboard.vendor?.serviceStatus || "open";
  const serviceStatusMeta = getServiceStatusMeta(serviceStatus);
  const visibleOrders = dashboard.orders.filter((order) =>
    staffType === "chef"
      ? ["preparing", "ready"].includes(order.status)
      : ["pending", "cancelled"].includes(order.status),
  );

  return (
    <div className="min-h-screen bg-[#fafaf8] lg:grid lg:grid-cols-[260px_1fr]">
      <VendorSidebar
        title="CampusEats"
        subtitle={staffType === "chef" ? "Chef Dashboard" : "Cashier Dashboard"}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        items={[
          { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
          ...(staffType !== "chef" ? [{ id: "wallet", label: "Wallet Top Up", icon: Wallet }] : []),
          { id: "menu", label: "Current Menu", icon: UtensilsCrossed },
          { id: "orders", label: staffType === "chef" ? "Kitchen Orders" : "Incoming Orders", icon: Clock },
          ...(staffType !== "chef" ? [{ id: "weekly", label: "Weekly Menu", icon: Store }] : []),
        ]}
        onLogout={onLogout}
      />

      <main className="min-w-0">
      <div className="bg-[#f97316] text-white">
        <div className="px-4 sm:px-6 py-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-orange-100 text-xs sm:text-sm">Vendor Dashboard</p>
            <h1 className="text-white">{user?.name || "Counter B Vendor"}</h1>
            <p className="text-orange-100 text-sm">
              {staffType === "chef" ? "Prepare accepted orders and mark them ready." : "Monitor incoming orders and accept or reject them."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`hidden sm:inline-flex rounded-full border px-3 py-1 text-xs font-medium ${serviceStatusMeta.className}`}>
              {serviceStatusMeta.label}
            </span>
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
      </div>

      <div className="px-4 sm:px-6 py-5 sm:py-7 space-y-5">
        {activeSection === "dashboard" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <SummaryTile icon={Clock} label="Pending Orders" value={String(dashboard.summary.pendingOrders)} />
              <SummaryTile icon={CheckCircle2} label="Ready Orders" value={String(dashboard.summary.readyOrders)} />
              <SummaryTile icon={UtensilsCrossed} label="Weekly Items" value={String(dashboard.summary.weeklyMenuItems || 0)} />
            </div>

            <section className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-gray-900">Counter Status</h2>
                  <p className="text-xs sm:text-sm text-gray-400">
                    Students see this before ordering from your counter.
                  </p>
                </div>
                <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium ${serviceStatusMeta.className}`}>
                  {serviceStatusMeta.label}
                </span>
              </div>
              <div className="px-4 sm:px-5 py-4">
                {staffType === "chef" ? (
                  <p className="text-sm text-gray-400">Cashier manages counter status.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {SERVICE_STATUS_OPTIONS.map((option) => {
                      const active = serviceStatus === option.id;

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => updateServiceStatus(option.id)}
                          className={`rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${
                            active
                              ? option.className
                              : "border-gray-100 bg-white text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {staffType !== "chef" && activeSection === "wallet" && (
          <section className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#f97316]" />
              <div>
                <h2 className="text-gray-900">Student Wallet Top Up</h2>
                <p className="text-xs sm:text-sm text-gray-400">Add balance after receiving cash from a student.</p>
              </div>
            </div>
            <div className="px-4 sm:px-5 py-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                <input
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") searchStudents();
                  }}
                  placeholder="Search student by name, email, or student ID"
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100 transition-all"
                />
                <button
                  type="button"
                  onClick={searchStudents}
                  disabled={topUpLoading}
                  className="bg-[#f97316] hover:bg-orange-600 text-white rounded-lg px-4 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:bg-[#f97316] transition-colors"
                >
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </div>

              {studentResults.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {studentResults.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => {
                        setSelectedStudent(student);
                        setTopUpError("");
                        setTopUpMessage("");
                      }}
                      className={`text-left border rounded-lg px-3 py-2.5 transition-colors ${
                        selectedStudent?.id === student.id
                          ? "border-[#f97316] bg-orange-50"
                          : "border-gray-100 hover:bg-gray-50"
                      }`}
                    >
                      <p className="text-sm text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-400">{student.studentId || student.email}</p>
                      <p className="text-xs text-[#f97316]">Balance ${student.walletBalance.toFixed(2)}</p>
                    </button>
                  ))}
                </div>
              )}

              {selectedStudent && (
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
                  <label className="block">
                    <span className="text-xs sm:text-sm text-gray-500 mb-1.5 block">Selected Student</span>
                    <input
                      value={`${selectedStudent.name} - $${selectedStudent.walletBalance.toFixed(2)}`}
                      readOnly
                      className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-500 outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs sm:text-sm text-gray-500 mb-1.5 block">Top-up Amount</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={topUpAmount}
                      onChange={(event) => setTopUpAmount(event.target.value)}
                      placeholder="10.00"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100 transition-all"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={topUpStudent}
                    disabled={topUpLoading}
                    className="bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2.5 text-sm disabled:opacity-70 disabled:hover:bg-green-500 transition-colors"
                  >
                    {topUpLoading ? "Saving..." : "Top Up"}
                  </button>
                  <label className="block sm:col-span-3">
                    <span className="text-xs sm:text-sm text-gray-500 mb-1.5 block">Note</span>
                    <input
                      value={topUpNote}
                      onChange={(event) => setTopUpNote(event.target.value)}
                      placeholder="Cash received at counter"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100 transition-all"
                    />
                  </label>
                </div>
              )}

              {topUpError && (
                <p className="text-xs sm:text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {topUpError}
                </p>
              )}
              {topUpMessage && (
                <p className="text-xs sm:text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                  {topUpMessage}
                </p>
              )}
            </div>
          </section>
        )}

        {activeSection === "menu" && (
          <section className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-gray-100">
            <h2 className="text-gray-900">Current Weekly Menu</h2>
            <p className="text-xs sm:text-sm text-gray-400">Adjust stock here after direct canteen sales or restocking.</p>
          </div>
          <div className="divide-y divide-gray-50">
            {loading && <EmptyRow text="Loading weekly menu..." />}
            {!loading && weeklyMenuItems.length === 0 && <EmptyRow text="No weekly menu items selected yet." />}
            {!loading && weeklyMenuItems.map((item) => (
              <div key={item.id} className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0 flex items-center gap-3">
                  <MenuThumb item={item} />
                  <div className="min-w-0">
                    <p className="text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs sm:text-sm text-gray-400 truncate">
                      {item.category || "Menu item"} - {item.stockQuantity} left
                    </p>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="hidden sm:inline text-[#f97316]">${item.price.toFixed(2)}</span>
                  <div className="flex items-center rounded-lg border border-gray-100 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateItemStock(item, item.stockQuantity - 1)}
                      disabled={item.stockQuantity <= 0}
                      className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                      title="Decrease stock"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className={`min-w-10 px-2 text-center ${item.stockQuantity <= 3 ? "text-red-500" : "text-gray-700"}`}>
                      {item.stockQuantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateItemStock(item, item.stockQuantity + 1)}
                      className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                      title="Increase stock"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </section>
        )}

        {activeSection === "orders" && (
          <section className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-gray-100">
            <h2 className="text-gray-900">Incoming Orders</h2>
            <p className="text-xs sm:text-sm text-gray-400">Accept orders you can prepare in time, or reject during rush hours.</p>
          </div>
          <div className="divide-y divide-gray-50">
            {loading && <EmptyRow text="Loading orders..." />}
            {!loading && visibleOrders.length === 0 && (
              <EmptyRow text={staffType === "chef" ? "No accepted orders to prepare." : "No pending orders to review."} />
            )}
            {!loading && visibleOrders.map((order) => {
              const action = nextOrderAction(order);

              return (
                <div key={order.id} className="px-4 sm:px-5 py-3 grid grid-cols-1 sm:grid-cols-[90px_1fr_80px_110px_minmax(120px,auto)] gap-2 sm:items-center text-sm">
                  <span className="text-gray-900">{order.id}</span>
                  <span className="text-gray-500">{order.items}</span>
                  <span className="text-[#f97316]">${order.total.toFixed(2)}</span>
                  <span className="text-gray-500">{order.status.replace("_", " ")}</span>
                  {staffType !== "chef" && order.status === "pending" ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order, "preparing")}
                        className="rounded-lg bg-green-500 px-3 py-2 text-xs text-white hover:bg-green-600 transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order, "cancelled")}
                        className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 hover:bg-red-100 transition-colors flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  ) : action ? (
                    <button
                      type="button"
                      onClick={() => updateOrderStatus(order, action.status)}
                      className="rounded-lg bg-[#f97316] px-3 py-2 text-xs text-white hover:bg-orange-600 transition-colors"
                    >
                      {action.label}
                    </button>
                  ) : order.status === "cancelled" ? (
                    <span className="text-xs text-red-500">Rejected</span>
                  ) : (
                    <span className="text-xs text-gray-300">Done</span>
                  )}
                </div>
              );
            })}
          </div>
          </section>
        )}

        {staffType !== "chef" && activeSection === "weekly" && (
          <WeeklyMenuManager
            title="My Weekly Menu"
            subtitle="Choose up to 10 of your items to show to students this week."
            onMenuSaved={() => loadDashboard({ force: true })}
          />
        )}
      </div>
      </main>
    </div>
  );
}

function VendorSidebar({ title, subtitle, activeSection, onSectionChange, items, onLogout }) {
  return (
    <aside className="bg-white border-r border-gray-100 lg:min-h-screen lg:sticky lg:top-0">
      <div className="px-5 py-5 border-b border-gray-100">
        <p className="text-xs text-gray-400 mb-3">{subtitle}</p>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center">
            <Store className="w-5 h-5 text-[#f97316]" />
          </div>
          <h2 className="text-gray-900">{title}</h2>
        </div>
      </div>
      <nav className="px-3 py-4 flex gap-2 overflow-x-auto lg:block lg:space-y-1">
        <p className="hidden lg:block px-3 py-2 text-[11px] tracking-[0.18em] uppercase text-gray-300">Main Menu</p>
        {items.map(({ id, label, icon: Icon }) => {
          const active = activeSection === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onSectionChange(id)}
              className={`shrink-0 lg:w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active ? "bg-orange-50 text-[#f97316]" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
              {active && <span className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full bg-[#f97316]" />}
            </button>
          );
        })}
      </nav>
      <div className="hidden lg:block px-3 py-4 border-t border-gray-100">
        <p className="px-3 py-2 text-[11px] tracking-[0.18em] uppercase text-gray-300">System</p>
        <button type="button" className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900">
          <Settings className="w-4 h-4" />
          Settings
        </button>
        <button type="button" onClick={onLogout} className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900">
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}

function EmptyRow({ text }) {
  return <div className="px-4 sm:px-5 py-4 text-sm text-gray-400">{text}</div>;
}

const SERVICE_STATUS_OPTIONS = [
  { id: "open", label: "Open", className: "border-green-100 bg-green-50 text-green-600" },
  { id: "busy", label: "Busy", className: "border-yellow-100 bg-yellow-50 text-yellow-700" },
  { id: "very_busy", label: "Very Busy", className: "border-yellow-300 bg-yellow-200 text-yellow-900" },
  { id: "closed", label: "Closed", className: "border-red-100 bg-red-50 text-red-600" },
];

function getServiceStatusMeta(status) {
  return SERVICE_STATUS_OPTIONS.find((option) => option.id === status) || SERVICE_STATUS_OPTIONS[0];
}

function MenuThumb({ item }) {
  const fallback = (item.emoji || item.name || "Menu")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center overflow-hidden shrink-0">
      {item.imageUrl ? (
        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs font-semibold text-[#f97316] px-1 text-center leading-tight">
          {fallback || "ME"}
        </span>
      )}
    </div>
  );
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
