import Category from "./category.js";
import Feedback from "./feedback.js";
import MenuItem from "./menuItem.js";
import Order from "./order.js";
import OrderItem from "./orderItem.js";
import Payment from "./payment.js";
import User from "./user.js";
import Vendor from "./vendor.js";
import WalletTransaction from "./walletTransaction.js";

User.hasOne(Vendor, { foreignKey: "userId", as: "vendorProfile" });
Vendor.belongsTo(User, { foreignKey: "userId", as: "user" });

Vendor.hasMany(User, { foreignKey: "vendorCounterId", as: "staff" });
User.belongsTo(Vendor, { foreignKey: "vendorCounterId", as: "assignedVendor" });

Vendor.hasMany(MenuItem, { foreignKey: "vendorCounterId", as: "menuItems" });
MenuItem.belongsTo(Vendor, { foreignKey: "vendorCounterId", as: "vendor" });

Category.hasMany(MenuItem, { foreignKey: "categoryId", as: "menuItems" });
MenuItem.belongsTo(Category, { foreignKey: "categoryId", as: "category" });

User.hasMany(Order, { foreignKey: "studentId", as: "orders" });
Order.belongsTo(User, { foreignKey: "studentId", as: "student" });

Vendor.hasMany(Order, { foreignKey: "vendorCounterId", as: "orders" });
Order.belongsTo(Vendor, { foreignKey: "vendorCounterId", as: "vendor" });

Order.hasMany(OrderItem, { foreignKey: "orderId", as: "items" });
OrderItem.belongsTo(Order, { foreignKey: "orderId", as: "order" });

MenuItem.hasMany(OrderItem, { foreignKey: "menuItemId", as: "orderItems" });
OrderItem.belongsTo(MenuItem, { foreignKey: "menuItemId", as: "menuItem" });

Order.hasOne(Payment, { foreignKey: "orderId", as: "payment" });
Payment.belongsTo(Order, { foreignKey: "orderId", as: "order" });

Order.hasOne(Feedback, { foreignKey: "orderId", as: "feedback" });
Feedback.belongsTo(Order, { foreignKey: "orderId", as: "order" });

User.hasMany(WalletTransaction, { foreignKey: "studentId", as: "walletTransactions" });
WalletTransaction.belongsTo(User, { foreignKey: "studentId", as: "student" });
User.hasMany(WalletTransaction, { foreignKey: "cashierId", as: "processedWalletTransactions" });
WalletTransaction.belongsTo(User, { foreignKey: "cashierId", as: "cashier" });
Order.hasMany(WalletTransaction, { foreignKey: "orderId", as: "walletTransactions" });
WalletTransaction.belongsTo(Order, { foreignKey: "orderId", as: "order" });

export {
  Category,
  Feedback,
  MenuItem,
  Order,
  OrderItem,
  Payment,
  User,
  Vendor,
  WalletTransaction,
};
