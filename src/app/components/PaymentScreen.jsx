import { useState, useEffect } from "react";
import { ArrowLeft, Wallet, ChevronRight, Lock, QrCode, CheckCircle2, RefreshCw } from "lucide-react";

const paymentMethods = [
  { id: "qr", label: "Scan QR Code", sub: "PayNow, WeChat Pay, GrabPay", icon: QrCode },
  { id: "ewallet", label: "Student E-Wallet", sub: "Linked to your student ID", icon: Wallet },
];

export function PaymentScreen({ total, onBack, onConfirm }) {
  const [selected, setSelected] = useState("qr");
  const [loading, setLoading] = useState(false);
  const [qrScanned, setQrScanned] = useState(false);
  const [qrCountdown, setQrCountdown] = useState(120);

  useEffect(() => {
    if (selected !== "qr" || qrScanned) return;
    setQrCountdown(120);
    const interval = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [selected, qrScanned]);

  const handlePay = () => {
    if (selected === "qr") {
      setQrScanned(true);
      setTimeout(onConfirm, 1200);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onConfirm();
    }, 1500);
  };

  const refreshQr = () => {
    setQrCountdown(120);
    setQrScanned(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf8]">
      {/* Header */}
      <div className="bg-white px-4 sm:px-6 pt-6 sm:pt-8 pb-4 border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={onBack} 
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>
              <h2 className="text-gray-900">Payment</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-6 py-4 sm:py-6 pb-32">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5">
          {/* Amount due */}
          <div className="bg-[#f97316] rounded-2xl px-5 sm:px-6 py-6 sm:py-8 text-center text-white">
            <p className="text-orange-100 text-xs sm:text-sm mb-1">Amount Due</p>
            <p className="text-4xl sm:text-5xl text-white" style={{ fontWeight: 600 }}>
              ${total.toFixed(2)}
            </p>
            <p className="text-orange-200 text-xs sm:text-sm mt-2 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3 sm:w-4 sm:h-4" /> Secure payment
            </p>
          </div>

          {/* Payment methods */}
          <div>
            <p className="text-xs sm:text-sm text-gray-400 mb-2 px-1">Select Payment Method</p>
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
              {paymentMethods.map(({ id, label, sub, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setSelected(id)}
                  className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 sm:py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    selected === id ? "bg-orange-100" : "bg-gray-50"
                  }`}>
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${
                      selected === id ? "text-[#f97316]" : "text-gray-400"
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm sm:text-base text-gray-900">{label}</p>
                    <p className="text-xs sm:text-sm text-gray-400">{sub}</p>
                  </div>
                  <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selected === id ? "border-[#f97316]" : "border-gray-200"
                  }`}>
                    {selected === id && <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#f97316]" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* QR Code display */}
          {selected === "qr" && !qrScanned && (
            <div className="bg-white rounded-2xl border border-gray-100 px-4 sm:px-6 py-5 sm:py-6 flex flex-col items-center">
              <p className="text-sm sm:text-base text-gray-700 mb-4">Scan with your payment app</p>
              {/* QR code graphic */}
              <div className="relative mb-3">
                <div className={`w-44 h-44 sm:w-56 sm:h-56 bg-white border-2 rounded-xl flex items-center justify-center transition-opacity ${
                  qrCountdown === 0 ? "opacity-30" : ""
                }`}>
                  <svg viewBox="0 0 100 100" className="w-40 h-40 sm:w-52 sm:h-52" fill="none">
                    {/* Corner markers */}
                    <rect x="5" y="5" width="28" height="28" rx="3" stroke="#1a1a1a" strokeWidth="4" />
                    <rect x="11" y="11" width="16" height="16" rx="1" fill="#1a1a1a" />
                    <rect x="67" y="5" width="28" height="28" rx="3" stroke="#1a1a1a" strokeWidth="4" />
                    <rect x="73" y="11" width="16" height="16" rx="1" fill="#1a1a1a" />
                    <rect x="5" y="67" width="28" height="28" rx="3" stroke="#1a1a1a" strokeWidth="4" />
                    <rect x="11" y="73" width="16" height="16" rx="1" fill="#1a1a1a" />
                    {/* Data pixels */}
                    {[
                      [40,5],[46,5],[52,5],[40,11],[52,11],[40,17],[46,17],[52,17],
                      [40,23],[52,23],[40,29],[46,29],[52,29],
                      [5,40],[11,40],[17,40],[23,40],[5,46],[23,46],[5,52],[11,52],
                      [17,52],[23,52],[5,58],[11,58],[17,58],[23,58],
                      [67,40],[73,40],[79,40],[85,40],[91,40],[67,52],[73,52],[85,52],
                      [91,52],[67,58],[79,58],[91,58],
                      [40,67],[46,67],[40,73],[52,73],[58,73],[40,79],[46,79],[52,79],
                      [40,85],[52,85],[58,85],[40,91],[46,91],[58,91],
                      [58,5],[64,11],[58,17],[64,23],[58,29],[64,29],
                      [67,67],[73,67],[79,67],[85,67],[91,67],[67,73],[79,73],[91,73],
                      [67,79],[73,79],[85,79],[67,85],[73,85],[79,85],[91,85],[67,91],[85,91],
                    ].map(([x, y], i) => (
                      <rect key={i} x={x} y={y} width="5" height="5" fill="#1a1a1a" />
                    ))}
                    {/* Orange center logo */}
                    <rect x="43" y="43" width="14" height="14" rx="3" fill="#f97316" />
                  </svg>
                </div>
                {/* Scanning animation line */}
                {qrCountdown > 0 && (
                  <div className="absolute inset-2 overflow-hidden rounded-lg pointer-events-none">
                    <div className="absolute left-0 right-0 h-0.5 bg-[#f97316]/60 animate-[scan_2s_ease-in-out_infinite]" />
                  </div>
                )}
                {qrCountdown === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button onClick={refreshQr} className="flex flex-col items-center gap-1 text-gray-500">
                      <RefreshCw className="w-6 h-6" />
                      <span className="text-xs">Refresh QR</span>
                    </button>
                  </div>
                )}
              </div>
              {/* Accepted apps */}
              <div className="flex gap-3 mb-3">
                {["PayNow", "GrabPay", "WeChat"].map((app) => (
                  <span key={app} className="text-xs sm:text-sm bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                    {app}
                  </span>
                ))}
              </div>
              {/* Countdown */}
              {qrCountdown > 0 ? (
                <p className="text-xs sm:text-sm text-gray-400">
                  QR expires in <span className="text-[#f97316]">{qrCountdown}s</span>
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-red-400">
                  QR expired — tap refresh to generate a new one
                </p>
              )}
            </div>
          )}

          {/* QR scanned success state */}
          {selected === "qr" && qrScanned && (
            <div className="bg-green-50 border border-green-100 rounded-2xl px-4 sm:px-6 py-5 sm:py-6 flex flex-col items-center gap-2">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-green-500" />
              <p className="text-sm sm:text-base text-green-700">Payment received!</p>
              <p className="text-xs sm:text-sm text-gray-400">Redirecting to your order…</p>
            </div>
          )}

          {/* E-Wallet balance */}
          {selected === "ewallet" && (
            <div className="bg-green-50 border border-green-100 rounded-2xl px-4 sm:px-5 py-3 sm:py-4 flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 text-sm sm:text-base">✓</span>
              </div>
              <div>
                <p className="text-sm sm:text-base text-gray-800">
                  Balance: <span className="text-green-600">$12.40</span>
                </p>
                <p className="text-xs sm:text-sm text-gray-500">Sufficient for this order</p>
              </div>
            </div>
          )}

          {/* Order summary row */}
          <div className="bg-white rounded-2xl border border-gray-100 px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer">
            <p className="text-sm sm:text-base text-gray-600">Order Summary</p>
            <div className="flex items-center gap-1 text-[#f97316] text-sm sm:text-base">
              <span>View</span>
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Pay now button */}
      <div className="fixed bottom-0 left-0 right-0 px-4 sm:px-6 pb-6 sm:pb-8 pt-3 bg-white border-t border-gray-100 shadow-lg">
        <div className="max-w-4xl mx-auto">
          {selected === "ewallet" && (
            <button
              onClick={handlePay}
              disabled={loading}
              className="w-full bg-[#f97316] hover:bg-orange-600 text-white rounded-2xl py-3.5 sm:py-4 text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:bg-[#f97316] transition-colors"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                  Processing…
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Pay ${total.toFixed(2)}
                </>
              )}
            </button>
          )}
          {selected === "qr" && !qrScanned && qrCountdown > 0 && (
            <button
              onClick={handlePay}
              className="w-full bg-[#f97316] hover:bg-orange-600 text-white rounded-2xl py-3.5 sm:py-4 text-sm sm:text-base flex items-center justify-center gap-2 transition-colors"
            >
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
              I've scanned the QR code
            </button>
          )}
          <p className="text-center text-xs sm:text-sm text-gray-400 mt-2">
            Your payment is encrypted and secure
          </p>
        </div>
      </div>
    </div>
  );
}
