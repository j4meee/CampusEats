import { useEffect, useState } from "react";
import { ArrowLeft, Bell, CreditCard, History, ReceiptText } from "lucide-react";
import { fetchJson } from "../lib/api";

const tabs = [
  { id: "orders", label: "Orders", icon: History },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "notifications", label: "Alerts", icon: Bell },
];

export function StudentActivityScreen({ onBack }) {
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadActivity = async () => {
      setLoading(true);
      setError("");

      try {
        const [orderData, paymentData, notificationData] = await Promise.all([
          fetchJson("/api/orders/history"),
          fetchJson("/api/orders/payments"),
          fetchJson("/api/orders/notifications"),
        ]);

        setOrders(orderData.orders || []);
        setPayments(paymentData.payments || []);
        setNotifications(notificationData.notifications || []);
      } catch (err) {
        setError(err.message || "Failed to load activity.");
      } finally {
        setLoading(false);
      }
    };

    loadActivity();
  }, []);

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 pt-6 sm:pt-8 pb-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <p className="text-xs sm:text-sm text-gray-400">Student Activity</p>
            <h1 className="text-gray-900">Orders & Payments</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-white border border-gray-200 p-1 mb-5">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`rounded-lg py-2.5 text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors ${
                activeTab === id ? "bg-[#f97316] text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {loading && <EmptyState text="Loading activity..." />}
        {error && <EmptyState text={error} tone="error" />}
        {!loading && !error && activeTab === "orders" && <OrderList orders={orders} />}
        {!loading && !error && activeTab === "payments" && <PaymentList payments={payments} />}
        {!loading && !error && activeTab === "notifications" && <NotificationList notifications={notifications} />}
      </div>
    </div>
  );
}

function OrderList({ orders }) {
  if (orders.length === 0) return <EmptyState text="No order history yet." />;

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div key={order.id} className="bg-white border border-gray-100 rounded-xl px-4 sm:px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm sm:text-base text-gray-900">{order.orderNumber}</p>
              <p className="text-xs sm:text-sm text-gray-400">{order.vendor?.stallName || "Vendor"} - {order.items.length} item(s)</p>
            </div>
            <StatusPill status={order.status} />
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-gray-500">{formatDate(order.payment?.paidAt || order.estimatedReadyAt)}</span>
            <span className="text-[#f97316]">${order.total.toFixed(2)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function PaymentList({ payments }) {
  if (payments.length === 0) return <EmptyState text="No payment history yet." />;

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <div key={payment.id} className="bg-white border border-gray-100 rounded-xl px-4 sm:px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
            <ReceiptText className="w-5 h-5 text-[#f97316]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base text-gray-900 truncate">{payment.orderNumber}</p>
            <p className="text-xs sm:text-sm text-gray-400">{payment.vendor} - {payment.method === "qr" ? "QR Code" : "Student E-Wallet"}</p>
          </div>
          <div className="text-right">
            <p className="text-sm sm:text-base text-[#f97316]">${payment.amount.toFixed(2)}</p>
            <p className="text-xs text-gray-400">{payment.status}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function NotificationList({ notifications }) {
  if (notifications.length === 0) return <EmptyState text="No notifications yet." />;

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <div key={notification.id} className="bg-white border border-gray-100 rounded-xl px-4 sm:px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-[#f97316]" />
            </div>
            <div>
              <p className="text-sm sm:text-base text-gray-900">{notification.title}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{notification.message}</p>
              <p className="text-xs text-gray-300 mt-1">{formatDate(notification.createdAt)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusPill({ status }) {
  const ready = status === "ready" || status === "picked_up";
  const cancelled = status === "cancelled";

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${
      cancelled ? "bg-red-50 text-red-600" : ready ? "bg-green-50 text-green-600" : "bg-orange-50 text-[#f97316]"
    }`}>
      {status.replace("_", " ")}
    </span>
  );
}

function EmptyState({ text, tone = "muted" }) {
  return (
    <div className={`bg-white border rounded-xl px-4 py-8 text-center text-sm ${
      tone === "error" ? "border-red-100 text-red-500" : "border-gray-100 text-gray-400"
    }`}>
      {text}
    </div>
  );
}

function formatDate(value) {
  if (!value) return "Recently";
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
