import { useEffect, useState } from "react";
import { CheckCircle2, ChefHat, Bell, MapPin, XCircle, Clock } from "lucide-react";
import { fetchJson } from "../lib/api";

const steps = [
  { id: 1, label: "Order Confirmed", icon: CheckCircle2 },
  { id: 2, label: "Preparing", icon: ChefHat },
  { id: 3, label: "Ready for Pickup", icon: Bell },
];

const statusStep = {
  pending: 1,
  preparing: 2,
  ready: 3,
  picked_up: 3,
};

const statusText = {
  pending: "Waiting for vendor confirmation",
  preparing: "Preparing your order",
  ready: "Your order is ready!",
  picked_up: "Order picked up",
  cancelled: "Order rejected",
};

export function OrderStatusScreen({ order, onPickup, onBackToMenu }) {
  const [currentOrder, setCurrentOrder] = useState(order);
  const [pickupError, setPickupError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const isMultiOrder = Array.isArray(currentOrder);
  const currentOrders = Array.isArray(currentOrder) ? currentOrder : currentOrder ? [currentOrder] : [];

  useEffect(() => {
    setCurrentOrder(order);
  }, [order]);

  useEffect(() => {
    const hasPickupDeadline = currentOrders.some((item) => item.status === "ready" && item.pickupDeadlineAt);

    if (!hasPickupDeadline) return undefined;

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [currentOrder]);

  useEffect(() => {
    const ordersToPoll = Array.isArray(currentOrder) ? currentOrder : currentOrder ? [currentOrder] : [];

    if (ordersToPoll.length === 0 || ordersToPoll.every((item) => ["picked_up", "cancelled"].includes(item.status))) return;

    const interval = setInterval(async () => {
      try {
        const orders = await Promise.all(
          ordersToPoll.map(async (item) => {
            if (["picked_up", "cancelled"].includes(item.status)) return item;
            const data = await fetchJson(`/api/orders/${item.id}`);
            return data.order;
          }),
        );

        setCurrentOrder(isMultiOrder ? orders : orders[0]);
      } catch (error) {
        console.error(error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentOrder, isMultiOrder]);

  if (currentOrders.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafaf8] px-4 text-center text-gray-500">
        No active order found.
      </div>
    );
  }

  const allReady = currentOrders.every((item) => item.status === "ready" || item.status === "picked_up");
  const allCancelled = currentOrders.every((item) => item.status === "cancelled");
  const activeOrder = currentOrders.find((item) => !["picked_up", "cancelled"].includes(item.status)) || currentOrders[0];
  const headerStatus = allCancelled ? "cancelled" : allReady ? "ready" : activeOrder.status;
  const isReady = headerStatus === "ready";
  const isCancelled = headerStatus === "cancelled";
  const orderNumbers = currentOrders.map((item) => item.orderNumber).join(", ");
  const currentStep = statusStep[headerStatus] || 1;
  const estimatedTime = activeOrder.estimatedReadyAt
    ? new Date(activeOrder.estimatedReadyAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "soon";
  const readyDeadlines = currentOrders
    .filter((item) => item.status === "ready" && item.pickupDeadlineAt)
    .map((item) => new Date(item.pickupDeadlineAt).getTime())
    .filter((time) => Number.isFinite(time));
  const pickupDeadline = readyDeadlines.length > 0 ? Math.min(...readyDeadlines) : null;
  const pickupMsLeft = pickupDeadline ? pickupDeadline - now : null;
  const pickupMinutesLeft = pickupMsLeft !== null ? Math.max(0, Math.ceil(pickupMsLeft / 60000)) : null;
  const pickupReminderActive = isReady && pickupMsLeft !== null && pickupMsLeft > 0 && pickupMsLeft <= 3 * 60 * 1000;
  const pickupOverdue = isReady && pickupMsLeft !== null && pickupMsLeft <= 0;
  const pickupDeadlineText = pickupDeadline
    ? new Date(pickupDeadline).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  const confirmPickup = async () => {
    setPickupError("");

    try {
      const readyOrders = currentOrders.filter((item) => item.status === "ready");
      const updatedOrders = await Promise.all(
        readyOrders.map(async (item) => {
          const data = await fetchJson(`/api/orders/${item.id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "picked_up" }),
          });

          return data.order;
        }),
      );
      const updatedById = new Map(updatedOrders.map((item) => [item.id, item]));
      const nextOrders = currentOrders.map((item) => updatedById.get(item.id) || item);

      setCurrentOrder(isMultiOrder ? nextOrders : nextOrders[0]);
      onPickup(isMultiOrder ? nextOrders : nextOrders[0]);
    } catch (error) {
      setPickupError(error.message || "Failed to confirm pickup");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf8]">
      <div className={`px-4 sm:px-6 pt-8 sm:pt-12 pb-6 sm:pb-8 text-center transition-all duration-500 ${
        isCancelled ? "bg-red-500" : isReady ? "bg-green-500" : "bg-[#f97316]"
      }`}>
        <div className="max-w-4xl mx-auto">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
            {isCancelled
              ? <XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              : isReady
              ? <Bell className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              : <ChefHat className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            }
          </div>
          <h2 className="text-white">{statusText[headerStatus] || "Order in progress"}</h2>
          <p className="text-white/80 text-sm sm:text-base mt-1">
            {isCancelled
              ? "The vendor counters cannot prepare these orders in time."
              : isReady
                ? pickupDeadlineText
                  ? `Pickup by ${pickupDeadlineText}`
                  : "Ready at assigned counter"
                : `Estimated ready at ${estimatedTime}`}
          </p>
          <div className="mt-3 sm:mt-4 inline-block bg-white/20 rounded-xl px-4 sm:px-5 py-1.5 sm:py-2">
            <p className="text-white text-sm sm:text-base">
              Order <span className="font-medium">{orderNumbers}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-6 py-4 sm:py-6 pb-32">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 px-5 sm:px-6 py-4 sm:py-5">
            {steps.map((step, index) => {
              const done = currentStep > step.id;
              const active = currentStep === step.id;
              const Icon = step.icon;

              return (
                <div key={step.id} className="flex gap-3 sm:gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500 ${
                      isCancelled && step.id === 1 ? "bg-red-100" :
                      done ? "bg-green-100" :
                      active ? (isReady && step.id === 3 ? "bg-green-100" : "bg-orange-100") :
                      "bg-gray-100"
                    }`}>
                      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${
                        isCancelled && step.id === 1 ? "text-red-500" :
                        done ? "text-green-500" :
                        active ? (isReady && step.id === 3 ? "text-green-500" : "text-[#f97316]") :
                        "text-gray-300"
                      }`} />
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-0.5 h-6 sm:h-8 my-1 transition-colors duration-500 ${
                        done ? "bg-green-200" : "bg-gray-100"
                      }`} />
                    )}
                  </div>
                  <div className="pb-2 pt-1">
                    <p className={`text-sm sm:text-base transition-colors duration-300 ${
                      done || active ? "text-gray-900" : "text-gray-400"
                    }`}>{step.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {isReady && pickupDeadlineText && (
            <div className={`border rounded-2xl px-4 sm:px-5 py-3 sm:py-4 flex items-start gap-2.5 sm:gap-3 ${
              pickupOverdue
                ? "bg-red-50 border-red-100"
                : pickupReminderActive
                  ? "bg-orange-50 border-orange-100"
                  : "bg-green-50 border-green-100"
            }`}>
              <Clock className={`w-4 h-4 sm:w-5 sm:h-5 mt-0.5 shrink-0 ${
                pickupOverdue ? "text-red-500" : pickupReminderActive ? "text-[#f97316]" : "text-green-600"
              }`} />
              <div>
                <p className="text-sm sm:text-base text-gray-800">
                  {pickupOverdue
                    ? "Pickup window ended"
                    : pickupReminderActive
                      ? "Pickup reminder"
                      : "Pickup window"}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                  {pickupOverdue
                    ? "The 10-minute pickup window has ended."
                    : `${pickupMinutesLeft} min left to pick up your food before ${pickupDeadlineText}.`}
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 px-4 sm:px-5 py-4 sm:py-5">
            <p className="text-xs sm:text-sm text-gray-400 mb-3">Your Counter Orders</p>
            <div className="space-y-4">
              {currentOrders.map((counterOrder) => (
                <div key={counterOrder.id} className="border-b border-gray-50 last:border-b-0 pb-3 last:pb-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="text-sm sm:text-base text-gray-900">{counterOrder.vendor?.stallName || "Vendor Counter"}</p>
                      <p className="text-xs sm:text-sm text-gray-400">{counterOrder.orderNumber}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      counterOrder.status === "cancelled"
                        ? "bg-red-50 text-red-600"
                        : ["ready", "picked_up"].includes(counterOrder.status)
                          ? "bg-green-50 text-green-600"
                          : "bg-orange-50 text-[#f97316]"
                    }`}>
                      {counterOrder.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="space-y-2 sm:space-y-2.5">
                    {counterOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-2.5 sm:gap-3">
                        <MenuThumb item={item} />
                        <span className="text-sm sm:text-base text-gray-700 flex-1">{item.name}</span>
                        <span className="text-xs sm:text-sm text-gray-400">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  {counterOrder.rejectionReason && (
                    <p className="mt-2 text-xs sm:text-sm text-red-500">Reason: {counterOrder.rejectionReason}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {isCancelled ? (
            <div className="bg-red-50 border border-red-100 rounded-2xl px-4 sm:px-5 py-3 sm:py-4 flex items-start gap-2.5 sm:gap-3">
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm sm:text-base text-gray-800">Order Rejected</p>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Your payment has been marked as refunded.</p>
              </div>
            </div>
          ) : (
            <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 sm:px-5 py-3 sm:py-4 flex items-start gap-2.5 sm:gap-3">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#f97316] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm sm:text-base text-gray-800">Pickup Location</p>
                <div className="mt-0.5 space-y-1">
                  {currentOrders.map((counterOrder) => (
                    <p key={counterOrder.id} className="text-xs sm:text-sm text-gray-600">
                      {counterOrder.vendor?.stallName || "Vendor Counter"}: {counterOrder.pickupLocation || counterOrder.vendor?.pickupLocation || "Pickup counter"}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {pickupError && (
            <div className="bg-red-50 border border-red-100 rounded-2xl px-4 sm:px-5 py-3 text-sm sm:text-base text-red-600">
              {pickupError}
            </div>
          )}
        </div>
      </div>

      {isReady && (
        <div className="fixed bottom-0 left-0 right-0 px-4 sm:px-6 pb-6 sm:pb-8 pt-3 bg-white border-t border-gray-100 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={confirmPickup}
              disabled={pickupOverdue}
              className="w-full bg-green-500 hover:bg-green-600 text-white rounded-2xl py-3.5 sm:py-4 text-sm sm:text-base transition-colors disabled:opacity-50 disabled:hover:bg-green-500"
            >
              {pickupOverdue ? "Pickup window ended" : "I'm at the counter - Confirm Pickup"}
            </button>
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="fixed bottom-0 left-0 right-0 px-4 sm:px-6 pb-6 sm:pb-8 pt-3 bg-white border-t border-gray-100 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={onBackToMenu}
              className="w-full bg-[#f97316] hover:bg-orange-600 text-white rounded-2xl py-3.5 sm:py-4 text-sm sm:text-base transition-colors"
            >
              Back to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuThumb({ item }) {
  const fallback = (item.imageLabel || item.name || "Item")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center overflow-hidden shrink-0">
      {item.imageUrl ? (
        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs font-semibold text-[#f97316] px-1 text-center leading-tight">
          {fallback || "IT"}
        </span>
      )}
    </div>
  );
}
