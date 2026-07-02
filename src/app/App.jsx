import { useState } from "react";
import { LoginScreen } from "./components/LoginScreen";
import { MenuScreen } from "./components/MenuScreen";
import { OrderReviewScreen } from "./components/OrderReviewScreen";
import { PaymentScreen } from "./components/PaymentScreen";
import { OrderStatusScreen } from "./components/OrderStatusScreen";
import { PickupConfirmationScreen } from "./components/PickupConfirmationScreen";
import { AdminDashboard } from "./components/AdminDashboard";
import { VendorDashboard } from "./components/VendorDashboard";
import { clearAuthSession, getStoredUser } from "./lib/api";

const STEP_LABELS = {
  login: 0,
  menu: 1,
  review: 2,
  payment: 3,
  status: 4,
  pickup: 5,
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [screen, setScreen] = useState(() => {
    const storedUser = getStoredUser();

    if (storedUser?.role === "admin") return "admin";
    if (storedUser?.role === "vendor") return "vendor";
    if (storedUser?.role === "student") return "menu";

    return "login";
  });
  const [cart, setCart] = useState([]);
  const [specialRequest, setSpecialRequest] = useState("");
  const [currentOrder, setCurrentOrder] = useState(null);

  const total = cart.reduce((sum, c) => sum + c.qty * c.price, 0);

  const resetAll = () => {
    setCart([]);
    setSpecialRequest("");
    setCurrentOrder(null);
    setCurrentUser(null);
    clearAuthSession();
    setScreen("login");
  };

  const handleLogin = (user) => {
    setCurrentUser(user);

    if (user.role === "admin") {
      setScreen("admin");
      return;
    }

    if (user.role === "vendor") {
      setScreen("vendor");
      return;
    }

    setScreen("menu");
  };

  const handleLogout = () => {
    setCart([]);
    setSpecialRequest("");
    setCurrentOrder(null);
    setCurrentUser(null);
    clearAuthSession();
    setScreen("login");
  };

  const handleOrderCreated = (order) => {
    setCurrentOrder(order);
    setCart([]);
    setScreen("status");
  };

  const handlePickupConfirmed = (order) => {
    setCurrentOrder(order);
    setScreen("pickup");
  };

  const showStudentProgress = !["login", "pickup", "admin", "vendor"].includes(screen);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {showStudentProgress && (
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center gap-2 sm:gap-3">
              {[
                { step: 1, label: "Menu" },
                { step: 2, label: "Review" },
                { step: 3, label: "Payment" },
                { step: 4, label: "Status" },
              ].map(({ step, label }) => (
                <div key={step} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className={`w-full h-1.5 rounded-full transition-all duration-500 ${
                      STEP_LABELS[screen] >= step ? "bg-[#f97316]" : "bg-gray-200"
                    }`}
                  />
                  <span
                    className={`text-xs transition-colors hidden sm:block ${
                      STEP_LABELS[screen] >= step ? "text-[#f97316]" : "text-gray-400"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <div className="flex-1 max-w-4xl w-full mx-auto">
          {screen === "login" && (
            <LoginScreen onLogin={handleLogin} />
          )}
          {screen === "admin" && (
            <AdminDashboard user={currentUser} onLogout={handleLogout} />
          )}
          {screen === "vendor" && (
            <VendorDashboard user={currentUser} onLogout={handleLogout} />
          )}
          {screen === "menu" && (
            <MenuScreen
              cart={cart}
              onUpdateCart={setCart}
              onCheckout={() => setScreen("review")}
              onLogout={handleLogout}
            />
          )}
          {screen === "review" && (
            <OrderReviewScreen
              cart={cart}
              onUpdateCart={setCart}
              onBack={() => setScreen("menu")}
              onPay={(request) => {
                setSpecialRequest(request);
                setScreen("payment");
              }}
            />
          )}
          {screen === "payment" && (
            <PaymentScreen
              total={total}
              cart={cart}
              user={currentUser}
              specialRequest={specialRequest}
              onBack={() => setScreen("review")}
              onConfirm={handleOrderCreated}
            />
          )}
          {screen === "status" && (
            <OrderStatusScreen
              order={currentOrder}
              onPickup={handlePickupConfirmed}
            />
          )}
          {screen === "pickup" && (
            <PickupConfirmationScreen order={currentOrder} onDone={resetAll} />
          )}
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 py-3">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="text-xs text-gray-400">
            CampusEats - Student Food Pre-Order System
          </span>
        </div>
      </div>
    </div>
  );
}
