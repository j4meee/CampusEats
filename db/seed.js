import sequelize from "./database.js";
import { Op } from "sequelize";
import {
  Category,
  MenuItem,
  Order,
  OrderItem,
  Payment,
  User,
  Vendor,
} from "../model/index.js";

const categories = ["Mains", "Snacks", "Drinks", "Desserts"];

const menuItems = [
  { name: "Grilled Chicken Rice", category: "Mains", price: 4.5, prepTimeMinutes: 8, tag: "Popular", imageLabel: "CH" },
  { name: "Veggie Wrap", category: "Mains", price: 3.8, prepTimeMinutes: 5, tag: "Healthy", imageLabel: "WR" },
  { name: "Beef Noodles", category: "Mains", price: 5, prepTimeMinutes: 10, imageLabel: "ND" },
  { name: "Fish & Chips", category: "Mains", price: 4.2, prepTimeMinutes: 7, imageLabel: "FS" },
  { name: "Spring Rolls (3 pcs)", category: "Snacks", price: 2.5, prepTimeMinutes: 4, tag: "Popular", imageLabel: "SR" },
  { name: "Nuggets (6 pcs)", category: "Snacks", price: 2.8, prepTimeMinutes: 5, imageLabel: "NG" },
  { name: "Watermelon Juice", category: "Drinks", price: 1.8, prepTimeMinutes: 2, imageLabel: "WJ" },
  { name: "Iced Milo", category: "Drinks", price: 1.5, prepTimeMinutes: 2, tag: "Popular", imageLabel: "IM" },
  { name: "Chocolate Pudding", category: "Desserts", price: 2, prepTimeMinutes: 3, imageLabel: "CP" },
];

const findOrCreateStudent = async ({ name, studentId, email, password }) => {
  const existingStudent = await User.findOne({
    where: {
      [Op.or]: [{ email }, { studentId }],
    },
  });

  if (existingStudent) {
    await existingStudent.update({
      name,
      studentId,
      email,
      password,
      role: "student",
      status: "active",
    });
    return existingStudent;
  }

  return User.create({
    name,
    studentId,
    email,
    password,
    role: "student",
    status: "active",
  });
};

const seed = async () => {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });

  const [admin] = await User.findOrCreate({
    where: { email: "admin@campuseats.test" },
    defaults: {
      name: "Campus Admin",
      email: "admin@campuseats.test",
      password: "admin123",
      role: "admin",
      status: "active",
    },
  });

  const [vendorUser] = await User.findOrCreate({
    where: { email: "vendor@campuseats.test" },
    defaults: {
      name: "Counter B Vendor",
      email: "vendor@campuseats.test",
      password: "vendor123",
      role: "vendor",
      status: "active",
    },
  });

  await findOrCreateStudent({
    name: "Demo Student",
    studentId: "STU001",
    email: "student@campuseats.test",
    password: "student123",
  });

  const campusStudent = await findOrCreateStudent({
    name: "Campus Student",
    studentId: "CADT001",
    email: "campus.student@campuseats.test",
    password: "campus123",
  });

  const [vendor] = await Vendor.findOrCreate({
    where: { userId: vendorUser.id },
    defaults: {
      userId: vendorUser.id,
      name: "Counter B Vendor",
      stallName: "Counter B",
      pickupLocation: "Block A Canteen - Counter B",
      status: "active",
    },
  });

  const categoryMap = new Map();
  for (const name of categories) {
    const [category] = await Category.findOrCreate({ where: { name } });
    categoryMap.set(name, category);
  }

  const itemMap = new Map();
  for (const item of menuItems) {
    const [menuItem] = await MenuItem.findOrCreate({
      where: { vendorId: vendor.id, name: item.name },
      defaults: {
        vendorId: vendor.id,
        categoryId: categoryMap.get(item.category).id,
        name: item.name,
        price: item.price,
        prepTimeMinutes: item.prepTimeMinutes,
        tag: item.tag ?? null,
        imageLabel: item.imageLabel,
        isAvailable: true,
      },
    });
    itemMap.set(item.name, menuItem);
  }

  const [order] = await Order.findOrCreate({
    where: { orderNumber: "A-042" },
    defaults: {
      orderNumber: "A-042",
      studentId: campusStudent.id,
      vendorId: vendor.id,
      status: "preparing",
      subtotal: 7,
      total: 7,
      estimatedReadyAt: new Date(Date.now() + 8 * 60 * 1000),
    },
  });

  const chickenRice = itemMap.get("Grilled Chicken Rice");
  const springRolls = itemMap.get("Spring Rolls (3 pcs)");

  await OrderItem.findOrCreate({
    where: { orderId: order.id, menuItemId: chickenRice.id },
    defaults: {
      orderId: order.id,
      menuItemId: chickenRice.id,
      quantity: 1,
      unitPrice: 4.5,
      lineTotal: 4.5,
    },
  });

  await OrderItem.findOrCreate({
    where: { orderId: order.id, menuItemId: springRolls.id },
    defaults: {
      orderId: order.id,
      menuItemId: springRolls.id,
      quantity: 1,
      unitPrice: 2.5,
      lineTotal: 2.5,
    },
  });

  await Payment.findOrCreate({
    where: { orderId: order.id },
    defaults: {
      orderId: order.id,
      method: "qr",
      status: "paid",
      amount: 7,
      paidAt: new Date(),
    },
  });

  console.log("Database seeded successfully.");
  console.log(`Admin: ${admin.email} / admin123`);
  console.log("Vendor: vendor@campuseats.test / vendor123");
  console.log("Student: student@campuseats.test / student123");
};

seed()
  .catch((error) => {
    console.error("Failed to seed database:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
