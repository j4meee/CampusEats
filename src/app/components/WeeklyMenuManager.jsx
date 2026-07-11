import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Save, UtensilsCrossed } from "lucide-react";
import { fetchJson } from "../lib/api";

export function WeeklyMenuManager({
  title = "Weekly Menu",
  subtitle = "Choose up to 10 items to show to students this week.",
  onMenuSaved,
}) {
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [maxSelected, setMaxSelected] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedCount = selectedIds.length;
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const loadMenu = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchJson("/api/menu/manage");

      setItems(data.items || []);
      setMaxSelected(data.maxSelected || 10);
      setSelectedIds((data.items || []).filter((item) => item.isAvailable).map((item) => item.id));
    } catch (err) {
      setError(err.message || "Failed to load menu items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  useEffect(() => {
    if (!message) return undefined;

    const timer = window.setTimeout(() => setMessage(""), 3500);

    return () => window.clearTimeout(timer);
  }, [message]);

  const toggleItem = (id) => {
    setMessage("");
    setError("");

    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((itemId) => itemId !== id);
      }

      if (current.length >= maxSelected) {
        setError(`You can choose up to ${maxSelected} menu items.`);
        return current;
      }

      return [...current, id];
    });
  };

  const saveWeeklyMenu = async () => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const data = await fetchJson("/api/menu/weekly", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: selectedIds }),
      });

      setMessage(data.message || "Weekly menu updated.");
      await loadMenu();
      if (onMenuSaved) {
        await onMenuSaved();
      }
    } catch (err) {
      setError(err.message || "Failed to update weekly menu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-gray-900">{title}</h2>
          <p className="text-xs sm:text-sm text-gray-400">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={saveWeeklyMenu}
          disabled={saving || loading}
          className="shrink-0 bg-[#f97316] hover:bg-orange-600 text-white rounded-lg px-3 py-2 text-sm flex items-center gap-2 disabled:opacity-70 disabled:hover:bg-[#f97316] transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="px-4 sm:px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2 text-sm text-gray-500">
        <UtensilsCrossed className="w-4 h-4 text-[#f97316]" />
        {selectedCount} / {maxSelected} selected
      </div>

      {error && (
        <p className="mx-4 sm:mx-5 mt-4 text-xs sm:text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {message && (
        <p className="mx-4 sm:mx-5 mt-4 text-xs sm:text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          {message}
        </p>
      )}

      <div className="divide-y divide-gray-50">
        {loading && <div className="px-4 sm:px-5 py-4 text-sm text-gray-400">Loading menu items...</div>}
        {!loading && items.length === 0 && <div className="px-4 sm:px-5 py-4 text-sm text-gray-400">No menu items found.</div>}
        {!loading && items.map((item) => {
          const selected = selectedIdSet.has(item.id);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleItem(item.id)}
              className="w-full px-4 sm:px-5 py-3 flex items-center justify-between gap-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="min-w-0 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-lg">
                  {item.emoji || "🍽️"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm sm:text-base text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs sm:text-sm text-gray-400 truncate">
                    ${item.price.toFixed(2)} - {item.category || "Menu"} - {item.vendor || "Vendor"}
                  </p>
                  {Number.isInteger(item.stockQuantity) && (
                    <p className={`text-xs ${item.stockQuantity <= 3 ? "text-red-400" : "text-gray-400"}`}>
                      {item.stockQuantity} left
                    </p>
                  )}
                </div>
              </div>
              <span className={`shrink-0 rounded-lg px-3 py-2 text-xs sm:text-sm flex items-center gap-2 ${
                selected ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
              }`}>
                {selected && <CheckCircle2 className="w-4 h-4" />}
                {selected ? "Selected" : "Hidden"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
