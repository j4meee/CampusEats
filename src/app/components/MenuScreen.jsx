import { useEffect, useState } from "react";
import { Search, Clock, ChevronRight, Plus, Minus, LogOut, User, History, X, Info } from "lucide-react";
import { fetchJson } from "../lib/api";

export function MenuScreen({ cart, onUpdateCart, onCheckout, onLogout, onProfile, onActivity }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState(["All"]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const data = await fetchJson("/api/menu");

        setCategories(data.categories);
        setMenuItems(data.items);
      } catch (err) {
        setError(err.message || "Failed to load menu");
      } finally {
        setLoading(false);
      }
    };

    loadMenu();
  }, []);

  const filtered = menuItems.filter(
    (item) =>
      (activeCategory === "All" || item.category === activeCategory) &&
      item.name.toLowerCase().includes(search.toLowerCase())
  );

  const getQty = (id) => cart.find((c) => c.id === id)?.qty ?? 0;

  const updateItem = (item, delta) => {
    if (item.vendorServiceStatus === "closed") return;

    const existing = cart.find((c) => c.id === item.id);
    const stockQuantity = item.stockQuantity ?? Number.MAX_SAFE_INTEGER;
    let updated;
    if (!existing) {
      if (stockQuantity <= 0) return;

      updated = [
        ...cart,
        {
          id: item.id,
          name: item.name,
          price: item.price,
          qty: 1,
          emoji: item.emoji,
          imageUrl: item.imageUrl,
          vendorCounterId: item.vendorCounterId,
          stockQuantity,
          vendorServiceStatus: item.vendorServiceStatus,
        },
      ];
    } else {
      const newQty = Math.min(existing.qty + delta, stockQuantity);
      updated = newQty <= 0
        ? cart.filter((c) => c.id !== item.id)
        : cart.map((c) => c.id === item.id ? { ...c, qty: newQty, stockQuantity, vendorServiceStatus: item.vendorServiceStatus } : c);
    }
    onUpdateCart(updated);
  };

  const handleLogout = () => {
    onUpdateCart([]);
    if (onLogout) onLogout();
  };

  const totalItems = cart.reduce((sum, c) => sum + c.qty, 0);
  const totalPrice = cart.reduce((sum, c) => sum + c.qty * c.price, 0);
  const getAvailability = (stockQuantity) => {
    if (stockQuantity <= 0) return { label: "Sold out", className: "bg-red-50 text-red-500" };
    if (stockQuantity <= 5) return { label: "Low stock", className: "bg-orange-50 text-[#f97316]" };
    return { label: "Available", className: "bg-green-50 text-green-600" };
  };
  const getServiceStatus = (status) =>
    SERVICE_STATUS_OPTIONS.find((option) => option.id === status) || SERVICE_STATUS_OPTIONS[0];

  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf8]">
      <div className="bg-[#f97316] px-4 sm:px-6 pt-6 sm:pt-8 pb-5 sm:pb-6 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="text-orange-100 text-sm sm:text-base">Good afternoon</p>
              <h1 className="text-white">What are you having today?</h1>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onActivity}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Order history"
                type="button"
              >
                <History className="w-5 h-5 text-orange-100" />
              </button>
              <button
                onClick={onProfile}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Profile"
                type="button"
              >
                <User className="w-5 h-5 text-orange-100" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Logout"
                type="button"
              >
                <LogOut className="w-5 h-5 text-orange-100" />
              </button>
            </div>
          </div>

          <div className="mt-3 sm:mt-4 flex items-center bg-white/20 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 gap-2">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-white/70 shrink-0" />
            <input
              className="bg-transparent text-white placeholder-white/60 text-sm sm:text-base flex-1 outline-none"
              placeholder="Search meals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="mt-3 flex items-center gap-2 bg-white/15 rounded-lg px-3 py-2">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-200 shrink-0" />
            <p className="text-xs sm:text-sm text-orange-100">
              Order now - ready in as fast as <span className="text-white font-medium">5-10 min</span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-sm sm:text-base transition-colors ${
                activeCategory === cat
                  ? "bg-[#f97316] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              type="button"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-6 pb-32">
        <div className="max-w-4xl mx-auto py-4 sm:py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((item) => {
            const qty = getQty(item.id);
            const stockQuantity = item.stockQuantity ?? 0;
            const stockLimitReached = qty >= stockQuantity;
            const availability = getAvailability(stockQuantity);
            const serviceStatus = getServiceStatus(item.vendorServiceStatus);
            const counterClosed = item.vendorServiceStatus === "closed";
            return (
              <div key={item.id} className="bg-white rounded-2xl p-3.5 flex flex-col gap-3 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all">
                <button
                  type="button"
                  onClick={() => setSelectedItem(item)}
                  className="w-full aspect-[4/3] rounded-xl bg-orange-50 text-[#f97316] font-semibold flex items-center justify-center text-xl sm:text-2xl shrink-0 overflow-hidden"
                >
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    item.emoji
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <button
                      type="button"
                      onClick={() => setSelectedItem(item)}
                      className="text-left text-sm sm:text-base text-gray-900 line-clamp-1 hover:text-[#f97316] transition-colors"
                    >
                      {item.name}
                    </button>
                    {item.tag && (
                      <span className="shrink-0 text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">
                        {item.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 min-h-8">
                    {item.description || "Freshly prepared for campus pickup."}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-2">
                    {item.category || "Menu"} - {item.vendor || "Campus vendor"}
                  </p>
                  <span className={`inline-flex mt-2 rounded-full border px-2 py-0.5 text-xs ${serviceStatus.className}`}>
                    {serviceStatus.label}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#f97316] text-sm sm:text-base">${item.price.toFixed(2)}</span>
                    <span className="text-gray-300">.</span>
                    <span className="text-gray-400 text-xs sm:text-sm flex items-center gap-0.5">
                      <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {item.time}
                    </span>
                  </div>
                  <span className={`inline-flex mt-1 rounded-full px-2 py-0.5 text-xs ${availability.className}`}>
                    {availability.label}
                  </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedItem(item)}
                      className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-400 flex items-center justify-center shrink-0 transition-colors"
                      title="Food details"
                    >
                      <Info className="w-4 h-4" />
                    </button>

                    {qty === 0 ? (
                      <button
                        onClick={() => updateItem(item, 1)}
                        disabled={counterClosed || stockQuantity <= 0}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#f97316] hover:bg-orange-600 text-white flex items-center justify-center shrink-0 transition-colors disabled:opacity-40 disabled:hover:bg-[#f97316]"
                        type="button"
                        title={counterClosed ? "Counter closed" : "Add to order"}
                      >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => updateItem(item, -1)}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50 flex items-center justify-center transition-colors"
                          type="button"
                        >
                          <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <span className="w-4 sm:w-5 text-center text-sm sm:text-base text-gray-900">{qty}</span>
                        <button
                          onClick={() => updateItem(item, 1)}
                          disabled={counterClosed || stockLimitReached}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#f97316] hover:bg-orange-600 text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:hover:bg-[#f97316]"
                          type="button"
                          title={counterClosed ? "Counter closed" : stockLimitReached ? "No more stock available" : "Add one more"}
                        >
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="col-span-full text-center py-12 text-gray-400">
              <p className="text-sm sm:text-base">Loading menu...</p>
            </div>
          )}
          {error && (
            <div className="col-span-full text-center py-12 text-red-400">
              <p className="text-sm sm:text-base">{error}</p>
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              <p className="text-sm sm:text-base">No meals found</p>
            </div>
          )}
        </div>
      </div>

      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 sm:p-6 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={onCheckout}
              className="w-full bg-[#f97316] hover:bg-orange-600 text-white rounded-2xl px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between shadow-lg transition-colors"
              type="button"
            >
              <div className="flex items-center gap-2">
                <span className="bg-white/25 rounded-lg px-2 py-0.5 text-sm sm:text-base">{totalItems}</span>
                <span className="text-sm sm:text-base">View Order</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base">${totalPrice.toFixed(2)}</span>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </button>
          </div>
        </div>
      )}

      {selectedItem && (
        <FoodDetailModal
          item={selectedItem}
          qty={getQty(selectedItem.id)}
          onClose={() => setSelectedItem(null)}
          onUpdate={(delta) => updateItem(selectedItem, delta)}
        />
      )}
    </div>
  );
}

function FoodDetailModal({ item, qty, onClose, onUpdate }) {
  const stockQuantity = item.stockQuantity ?? 0;
  const stockLimitReached = qty >= stockQuantity;
  const availability = stockQuantity <= 5 ? "Low stock" : "Available";
  const serviceStatus = SERVICE_STATUS_OPTIONS.find((option) => option.id === item.vendorServiceStatus) || SERVICE_STATUS_OPTIONS[0];
  const counterClosed = item.vendorServiceStatus === "closed";

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-end sm:items-center justify-center px-4 py-4">
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-orange-50 px-5 py-5 flex items-start gap-4">
          <div className="w-20 h-20 rounded-xl bg-white text-[#f97316] font-semibold flex items-center justify-center text-lg shrink-0 overflow-hidden">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm">{item.emoji}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg text-gray-900">{item.name}</p>
            <p className="text-sm text-gray-500">{item.category} - {item.vendor || "Campus vendor"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <p className="text-sm text-gray-600">
            {item.description || "Freshly prepared by the vendor and ready for campus pickup."}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <DetailTile label="Price" value={`$${item.price.toFixed(2)}`} />
            <DetailTile label="Ready In" value={item.time} />
            <DetailTile label="Availability" value={availability} />
            <DetailTile label="Counter Status" value={serviceStatus.label} />
            <DetailTile label="Pickup" value={item.pickupLocation || "Pickup counter"} wide />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-gray-500">Quantity to add</span>
            {qty === 0 ? (
              <button
                type="button"
                onClick={() => onUpdate(1)}
                disabled={counterClosed || stockQuantity <= 0}
                className="bg-[#f97316] hover:bg-orange-600 text-white rounded-lg px-4 py-2 text-sm flex items-center gap-2 transition-colors disabled:opacity-40 disabled:hover:bg-[#f97316]"
              >
                <Plus className="w-4 h-4" />
                Add to Cart
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onUpdate(-1)}
                  className="w-9 h-9 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
                >
                  <Minus className="w-4 h-4 text-gray-500" />
                </button>
                <span className="w-6 text-center text-gray-900">{qty}</span>
                <button
                  type="button"
                  onClick={() => onUpdate(1)}
                  disabled={counterClosed || stockLimitReached}
                  className="w-9 h-9 rounded-full bg-[#f97316] hover:bg-orange-600 flex items-center justify-center transition-colors disabled:opacity-40 disabled:hover:bg-[#f97316]"
                >
                  <Plus className="w-4 h-4 text-white" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const SERVICE_STATUS_OPTIONS = [
  { id: "open", label: "Open", className: "border-green-100 bg-green-50 text-green-600" },
  { id: "busy", label: "Busy", className: "border-yellow-100 bg-yellow-50 text-yellow-700" },
  { id: "very_busy", label: "Very Busy", className: "border-yellow-300 bg-yellow-200 text-yellow-900" },
  { id: "closed", label: "Closed", className: "border-red-100 bg-red-50 text-red-600" },
];

function DetailTile({ label, value, wide = false }) {
  return (
    <div className={`bg-gray-50 rounded-xl px-3 py-3 ${wide ? "col-span-2" : ""}`}>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}
