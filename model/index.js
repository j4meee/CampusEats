import Category from "./category.js";
import Feedback from "./feedback.js";
import MenuItem from "./menuItem.js";
import Order from "./order.js";
import OrderItem from "./orderItem.js";
import Payment from "./payment.js";
import User from "./user.js";
import Vendor from "./vendor.js";

User.hasOne(Vendor, { foreignKey: "userId", as: "vendorProfile" });
Vendor.belongsTo(User, { foreignKey: "userId", as: "user" });

Vendor.hasMany(MenuItem, { foreignKey: "vendorId", as: "menuItems" });
MenuItem.belongsTo(Vendor, { foreignKey: "vendorId", as: "vendor" });

Category.hasMany(MenuItem, { foreignKey: "categoryId", as: "menuItems" });
MenuItem.belongsTo(Category, { foreignKey: "categoryId", as: "category" });

User.hasMany(Order, { foreignKey: "studentId", as: "orders" });
Order.belongsTo(User, { foreignKey: "studentId", as: "student" });

Vendor.hasMany(Order, { foreignKey: "vendorId", as: "orders" });
Order.belongsTo(Vendor, { foreignKey: "vendorId", as: "vendor" });

Order.hasMany(OrderItem, { foreignKey: "orderId", as: "items" });
OrderItem.belongsTo(Order, { foreignKey: "orderId", as: "order" });

MenuItem.hasMany(OrderItem, { foreignKey: "menuItemId", as: "orderItems" });
OrderItem.belongsTo(MenuItem, { foreignKey: "menuItemId", as: "menuItem" });

Order.hasOne(Payment, { foreignKey: "orderId", as: "payment" });
Payment.belongsTo(Order, { foreignKey: "orderId", as: "order" });

Order.hasOne(Feedback, { foreignKey: "orderId", as: "feedback" });
Feedback.belongsTo(Order, { foreignKey: "orderId", as: "order" });

export {
  Category,
  Feedback,
  MenuItem,
  Order,
  OrderItem,
  Payment,
  User,
  Vendor,
};
