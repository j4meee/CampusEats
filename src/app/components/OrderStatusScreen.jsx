import { useEffect, useState } from "react";
import { CheckCircle2, ChefHat, Bell, MapPin, XCircle } from "lucide-react";
import { fetchJson } from "../lib/api";

const steps = [
  { id: 1, label: "Order Confirmed", sub: "The vendor received your order", icon: CheckCircle2 },
  { id: 2, label: "Preparing", sub: "The kitchen is cooking your meal", icon: ChefHat },
  { id: 3, label: "Ready for Pickup", sub: "Head to the pickup counter", icon: Bell },
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
  const isMultiOrder = Array.isArray(currentOrder);
  const currentOrders = Array.isArray(currentOrder) ? currentOrder : currentOrder ? [currentOrder] : [];

  useEffect(() => {
    setCurrentOrder(order);
  }, [order]);

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
                ? "Please pick up at each assigned counter."
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
                    <p className={`text-xs sm:text-sm ${
                      done || active ? "text-gray-500" : "text-gray-300"
                    }`}>{step.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>

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
                        <span className="text-xl sm:text-2xl">{item.imageLabel || "IT"}</span>
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
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Please choose another item or vendor.</p>
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
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Show the matching order number at each counter.</p>
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
              className="w-full bg-green-500 hover:bg-green-600 text-white rounded-2xl py-3.5 sm:py-4 text-sm sm:text-base transition-colors"
            >
              I'm at the counter - Confirm Pickup
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
