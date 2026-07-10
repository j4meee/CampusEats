import { ArrowLeft, Trash2, Plus, Minus, Clock, Tag } from "lucide-react";
import { useState } from "react";

export function OrderReviewScreen({ cart, onUpdateCart, onBack, onPay }) {
  const [specialRequest, setSpecialRequest] = useState("");
  const total = cart.reduce((sum, c) => sum + c.qty * c.price, 0);

  const updateQty = (id, delta) => {
    const item = cart.find((c) => c.id === id);
    const stockQuantity = item.stockQuantity ?? Number.MAX_SAFE_INTEGER;
    const newQty = Math.min(item.qty + delta, stockQuantity);
    if (newQty <= 0) {
      onUpdateCart(cart.filter((c) => c.id !== id));
    } else {
      onUpdateCart(cart.map((c) => c.id === id ? { ...c, qty: newQty } : c));
    }
  };

  const estimatedTime = Math.max(...[5, 8, 10].slice(0, cart.length)) + " min";

  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf8]">
      {/* Header */}
      <div className="bg-white px-4 sm:px-6 pt-6 sm:pt-8 pb-4 border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <button 
              onClick={onBack} 
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
            <h2 className="text-gray-900">Your Order</h2>
          </div>
          <div className="flex items-center justify-between ml-12 sm:ml-[52px]">
            <div className="flex items-center gap-1.5 text-gray-500">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#f97316]" />
              <p className="text-xs sm:text-sm">
                Estimated ready in <span className="text-[#f97316]">{estimatedTime}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-6 py-4 sm:py-6 pb-32">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5">
          {/* Pickup info banner */}
          <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 sm:px-5 py-3 sm:py-4 flex items-start gap-2.5">
            <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-[#f97316] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm sm:text-base text-gray-800">
                Pickup at <span className="font-medium">Canteen Counter B</span>
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                You'll be notified when your order is ready
              </p>
            </div>
          </div>

          {/* Order items */}
          <div className="bg-white rounded-2xl divide-y divide-gray-50 border border-gray-100 overflow-hidden">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-orange-50 flex items-center justify-center text-2xl sm:text-3xl shrink-0">
                  {item.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs sm:text-sm text-[#f97316]">${(item.price * item.qty).toFixed(2)}</p>
                  {Number.isInteger(item.stockQuantity) && (
                    <p className="text-xs text-gray-400">{item.stockQuantity} left</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => updateQty(item.id, -1)}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 flex items-center justify-center transition-colors"
                  >
                    {item.qty === 1 ? 
                      <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400" /> : 
                      <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500" />
                    }
                  </button>
                  <span className="w-5 text-center text-sm sm:text-base text-gray-900">{item.qty}</span>
                  <button
                    onClick={() => updateQty(item.id, 1)}
                    disabled={Number.isInteger(item.stockQuantity) && item.qty >= item.stockQuantity}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#f97316] hover:bg-orange-600 text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:hover:bg-[#f97316]"
                  >
                    <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Special request */}
          <div className="bg-white rounded-2xl border border-gray-100 px-4 sm:px-5 py-3 sm:py-4">
            <p className="text-sm sm:text-base text-gray-700 mb-2">Special Request (optional)</p>
            <textarea
              value={specialRequest}
              onChange={(event) => setSpecialRequest(event.target.value)}
              className="w-full text-sm sm:text-base text-gray-600 placeholder-gray-300 bg-gray-50 rounded-xl px-3 py-2.5 outline-none resize-none border border-gray-100 focus:border-[#f97316] focus:ring-2 focus:ring-orange-100 transition-all"
              placeholder="e.g. No onion, extra sauce…"
              rows={2}
            />
          </div>

          {/* Price breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 px-4 sm:px-5 py-4 sm:py-5">
            <div className="flex justify-between">
              <span className="text-gray-900 text-base sm:text-lg">Total</span>
              <span className="text-[#f97316] text-base sm:text-lg">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pay button */}
      <div className="fixed bottom-0 left-0 right-0 px-4 sm:px-6 pb-6 sm:pb-8 pt-3 bg-white border-t border-gray-100 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => onPay(specialRequest)}
            disabled={cart.length === 0}
            className="w-full bg-[#f97316] hover:bg-orange-600 text-white rounded-2xl py-3.5 sm:py-4 text-sm sm:text-base disabled:opacity-50 disabled:hover:bg-[#f97316] transition-colors"
          >
            Proceed to Payment — ${total.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}
