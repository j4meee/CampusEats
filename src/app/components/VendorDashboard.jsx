import { useState } from "react";
import { CheckCircle2, Clock, EyeOff, LogOut, Plus, UtensilsCrossed } from "lucide-react";

const initialMenu = [
  { id: 1, name: "Grilled Chicken Rice", price: 4.50, status: "Available", sold: 18 },
  { id: 3, name: "Beef Noodles", price: 5.00, status: "Available", sold: 11 },
  { id: 5, name: "Spring Rolls (3 pcs)", price: 2.50, status: "Sold Out", sold: 26 },
];

const orders = [
  { id: "A-042", student: "STU001", items: "Grilled Chicken Rice x1, Spring Rolls x1", total: 7.00, status: "Preparing" },
  { id: "A-044", student: "STU001", items: "Beef Noodles x1", total: 5.00, status: "Pending" },
  { id: "A-045", student: "CADT001", items: "Grilled Chicken Rice x2", total: 9.00, status: "Ready" },
];

export function VendorDashboard({ user, onLogout }) {
  const [menu, setMenu] = useState(initialMenu);

  const toggleAvailability = (id) => {
    setMenu((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "Available" ? "Sold Out" : "Available" }
          : item,
      ),
    );
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
          <SummaryTile icon={Clock} label="Pending Orders" value="1" />
          <SummaryTile icon={CheckCircle2} label="Ready Orders" value="1" />
          <SummaryTile icon={UtensilsCrossed} label="Menu Items" value={String(menu.length)} />
        </div>

        <section className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-gray-900">My Menu</h2>
              <p className="text-xs sm:text-sm text-gray-400">Update food availability for students.</p>
            </div>
            <button type="button" className="shrink-0 bg-[#f97316] hover:bg-orange-600 text-white rounded-lg px-3 py-2 text-sm flex items-center gap-2 transition-colors">
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {menu.map((item) => (
              <div key={item.id} className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm sm:text-base text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs sm:text-sm text-gray-400">${item.price.toFixed(2)} - Sold today: {item.sold}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleAvailability(item.id)}
                  className={`shrink-0 rounded-lg px-3 py-2 text-xs sm:text-sm flex items-center gap-2 transition-colors ${
                    item.status === "Available"
                      ? "bg-green-50 text-green-600 hover:bg-green-100"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {item.status === "Available" ? <CheckCircle2 className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {item.status}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-gray-100">
            <h2 className="text-gray-900">Incoming Orders</h2>
            <p className="text-xs sm:text-sm text-gray-400">Vendor changes order status from pending to ready.</p>
          </div>
          <div className="divide-y divide-gray-50">
            {orders.map((order) => (
              <div key={order.id} className="px-4 sm:px-5 py-3 grid grid-cols-1 sm:grid-cols-[80px_1fr_80px_110px] gap-2 sm:items-center text-sm">
                <span className="text-gray-900">{order.id}</span>
                <span className="text-gray-500">{order.items}</span>
                <span className="text-[#f97316]">${order.total.toFixed(2)}</span>
                <span className="text-gray-500">{order.status}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
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
