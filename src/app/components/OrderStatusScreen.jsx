import { useEffect, useState } from "react";
import { CheckCircle2, ChefHat, Bell, MapPin } from "lucide-react";

const steps = [
  { id: 1, label: "Order Confirmed", sub: "We've received your order", icon: CheckCircle2 },
  { id: 2, label: "Preparing", sub: "The kitchen is cooking your meal", icon: ChefHat },
  { id: 3, label: "Ready for Pickup!", sub: "Head to Counter B now", icon: Bell },
];

export function OrderStatusScreen({ cart, onPickup }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCurrentStep(3);
          return 0;
        }
        if (prev === 5) setCurrentStep(2);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isReady = currentStep === 3;
  const orderNum = "A-042";

  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf8]">
      {/* Header status */}
      <div className={`px-4 sm:px-6 pt-8 sm:pt-12 pb-6 sm:pb-8 text-center transition-all duration-500 ${
        isReady ? "bg-green-500" : "bg-[#f97316]"
      }`}>
        <div className="max-w-4xl mx-auto">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
            {isReady
              ? <Bell className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              : <ChefHat className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            }
          </div>
          <h2 className="text-white">{isReady ? "Your order is ready! 🎉" : "Preparing your order…"}</h2>
          <p className="text-white/80 text-sm sm:text-base mt-1">
            {isReady ? "Please pick up at Counter B" : `Ready in about ${countdown}s`}
          </p>
          <div className="mt-3 sm:mt-4 inline-block bg-white/20 rounded-xl px-4 sm:px-5 py-1.5 sm:py-2">
            <p className="text-white text-sm sm:text-base">
              Order <span className="font-medium">{orderNum}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-6 py-4 sm:py-6 pb-32">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5">
          {/* Progress steps */}
          <div className="bg-white rounded-2xl border border-gray-100 px-5 sm:px-6 py-4 sm:py-5">
            {steps.map((step, i) => {
              const done = currentStep > step.id;
              const active = currentStep === step.id;
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex gap-3 sm:gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500 ${
                      done ? "bg-green-100" : 
                      active ? (isReady && step.id === 3 ? "bg-green-100" : "bg-orange-100") : 
                      "bg-gray-100"
                    }`}>
                      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${
                        done ? "text-green-500" : 
                        active ? (isReady && step.id === 3 ? "text-green-500" : "text-[#f97316]") : 
                        "text-gray-300"
                      }`} />
                    </div>
                    {i < steps.length - 1 && (
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

          {/* Order items summary */}
          <div className="bg-white rounded-2xl border border-gray-100 px-4 sm:px-5 py-4 sm:py-5">
            <p className="text-xs sm:text-sm text-gray-400 mb-3">Your Items</p>
            <div className="space-y-2 sm:space-y-2.5">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-2.5 sm:gap-3">
                  <span className="text-xl sm:text-2xl">{item.emoji}</span>
                  <span className="text-sm sm:text-base text-gray-700 flex-1">{item.name}</span>
                  <span className="text-xs sm:text-sm text-gray-400">x{item.qty}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pickup location */}
          <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 sm:px-5 py-3 sm:py-4 flex items-start gap-2.5 sm:gap-3">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#f97316] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm sm:text-base text-gray-800">Pickup Location</p>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                Block A Canteen — <span className="font-medium">Counter B</span>
              </p>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                Near the main entrance, ground floor
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm pickup button */}
      {isReady && (
        <div className="fixed bottom-0 left-0 right-0 px-4 sm:px-6 pb-6 sm:pb-8 pt-3 bg-white border-t border-gray-100 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={onPickup}
              className="w-full bg-green-500 hover:bg-green-600 text-white rounded-2xl py-3.5 sm:py-4 text-sm sm:text-base transition-colors"
            >
              I'm at the counter — Confirm Pickup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
