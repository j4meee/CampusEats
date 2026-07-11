import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import sequelize from "./database.js";
import {
  Category,
  MenuItem,
  OrderItem,
  User,
  Vendor,
} from "../model/index.js";

const categories = ["Mains", "Snacks", "Drinks", "Desserts"];

const counterByCategory = {
  Mains: {
    stallName: "Main Food Counter",
    previousStallName: "Counter B",
    pickupLocation: "Block A Canteen - Main Food Counter",
    cashier: { name: "Main Food Cashier", email: "vendor@campuseats.test", password: "vendor123" },
    chef: { name: "Main Food Chef", email: "chef@campuseats.test", password: "chef123" },
  },
  Snacks: {
    stallName: "Snack Counter",
    pickupLocation: "Block A Canteen - Snack Counter",
    cashier: { name: "Snack Cashier", email: "snack.cashier@campuseats.test", password: "snack123" },
    chef: { name: "Snack Chef", email: "snack.chef@campuseats.test", password: "snackchef123" },
  },
  Drinks: {
    stallName: "Drinks Counter",
    pickupLocation: "Block A Canteen - Drinks Counter",
    cashier: { name: "Drinks Cashier", email: "drinks.cashier@campuseats.test", password: "drinks123" },
    chef: { name: "Drinks Chef", email: "drinks.chef@campuseats.test", password: "drinkschef123" },
  },
  Desserts: {
    stallName: "Dessert Counter",
    pickupLocation: "Block A Canteen - Dessert Counter",
    cashier: { name: "Dessert Cashier", email: "dessert.cashier@campuseats.test", password: "dessert123" },
    chef: { name: "Dessert Chef", email: "dessert.chef@campuseats.test", password: "dessertchef123" },
  },
};

const menuItems = [
  { category: "Mains", name: "Chicken Rice Bowl", description: "Steamed rice with chicken, cucumber, and soy garlic sauce.", price: 3.5, prepTimeMinutes: 8, stockQuantity: 30, tag: "Popular", imageLabel: "Rice" },
  { category: "Mains", name: "Beef Lok Lak", description: "Peppery beef cubes with rice, lettuce, tomato, and lime pepper dip.", price: 4.25, prepTimeMinutes: 10, stockQuantity: 25, tag: "Chef Pick", imageLabel: "Beef" },
  { category: "Mains", name: "Pork Basil Rice", description: "Stir-fried pork with basil, chili, garlic, and jasmine rice.", price: 3.75, prepTimeMinutes: 9, stockQuantity: 28, tag: "Spicy", imageLabel: "Rice" },
  { category: "Mains", name: "Vegetable Fried Rice", description: "Fried rice with mixed vegetables, egg, and spring onion.", price: 3.0, prepTimeMinutes: 7, stockQuantity: 32, tag: "Veggie", imageLabel: "Rice" },
  { category: "Mains", name: "Fish Amok Rice", description: "Creamy coconut fish curry served with steamed rice.", price: 4.5, prepTimeMinutes: 12, stockQuantity: 20, tag: "Khmer", imageLabel: "Fish" },
  { category: "Mains", name: "Teriyaki Chicken Bento", description: "Chicken teriyaki with rice, vegetables, and egg roll.", price: 4.75, prepTimeMinutes: 11, stockQuantity: 18, tag: "New", imageLabel: "Bento" },
  { category: "Mains", name: "Khmer Noodle Soup", description: "Warm rice noodle soup with herbs, pork, and crispy garlic.", price: 3.25, prepTimeMinutes: 9, stockQuantity: 24, tag: "Soup", imageLabel: "Soup" },
  { category: "Mains", name: "Chicken Curry Rice", description: "Mild chicken curry with potato, carrot, and rice.", price: 4.0, prepTimeMinutes: 10, stockQuantity: 22, tag: "Comfort", imageLabel: "Curry" },
  { category: "Mains", name: "Tuna Mayo Onigiri Set", description: "Rice balls filled with tuna mayo and served with pickles.", price: 3.25, prepTimeMinutes: 6, stockQuantity: 26, tag: "Quick", imageLabel: "Rice" },
  { category: "Mains", name: "Grilled Pork Rice", description: "Char-grilled pork slices with rice and pickled vegetables.", price: 3.85, prepTimeMinutes: 9, stockQuantity: 27, tag: "Grilled", imageLabel: "Pork" },
  { category: "Mains", name: "Spicy Seafood Noodles", description: "Stir-fried noodles with shrimp, squid, vegetables, and chili sauce.", price: 4.6, prepTimeMinutes: 11, stockQuantity: 18, tag: "Spicy", imageLabel: "Noodles" },
  { category: "Mains", name: "Tofu Rice Bowl", description: "Crispy tofu with vegetables, rice, and sesame sauce.", price: 3.35, prepTimeMinutes: 8, stockQuantity: 30, tag: "Veggie", imageLabel: "Tofu" },
  { category: "Mains", name: "Egg Fried Noodles", description: "Wok-fried noodles with egg, cabbage, carrot, and soy sauce.", price: 2.9, prepTimeMinutes: 7, stockQuantity: 35, tag: "Budget", imageLabel: "Noodles" },
  { category: "Mains", name: "Chicken Katsu Curry", description: "Crispy chicken cutlet with curry sauce and steamed rice.", price: 4.8, prepTimeMinutes: 12, stockQuantity: 16, tag: "Crispy", imageLabel: "Katsu" },
  { category: "Mains", name: "Garlic Shrimp Rice", description: "Garlic butter shrimp with rice, corn, and cucumber.", price: 4.9, prepTimeMinutes: 10, stockQuantity: 18, tag: "Seafood", imageLabel: "Shrimp" },

  { category: "Snacks", name: "Spring Rolls", description: "Crispy vegetable rolls with sweet chili dipping sauce.", price: 1.75, prepTimeMinutes: 5, stockQuantity: 40, tag: "Crispy", imageLabel: "Roll" },
  { category: "Snacks", name: "Fried Wontons", description: "Golden wontons filled with seasoned pork and herbs.", price: 2.0, prepTimeMinutes: 6, stockQuantity: 35, tag: "Crunchy", imageLabel: "Wonton" },
  { category: "Snacks", name: "French Fries", description: "Hot crispy fries with ketchup.", price: 1.5, prepTimeMinutes: 5, stockQuantity: 45, tag: "Classic", imageLabel: "Fries" },
  { category: "Snacks", name: "Chicken Nuggets", description: "Bite-sized chicken nuggets with dipping sauce.", price: 2.25, prepTimeMinutes: 6, stockQuantity: 38, tag: "Quick", imageLabel: "Nuggets" },
  { category: "Snacks", name: "Grilled Corn", description: "Sweet corn brushed with butter and a pinch of salt.", price: 1.25, prepTimeMinutes: 4, stockQuantity: 30, tag: "Light", imageLabel: "Corn" },
  { category: "Snacks", name: "Cheese Toast", description: "Toasted bread with melted cheese and herbs.", price: 1.8, prepTimeMinutes: 5, stockQuantity: 28, tag: "Warm", imageLabel: "Toast" },
  { category: "Snacks", name: "Takoyaki Bites", description: "Soft octopus-style bites topped with sauce and bonito flakes.", price: 2.5, prepTimeMinutes: 7, stockQuantity: 25, tag: "Street", imageLabel: "Bites" },
  { category: "Snacks", name: "Fried Fish Balls", description: "Skewered fish balls with chili sauce.", price: 1.5, prepTimeMinutes: 4, stockQuantity: 50, tag: "Snack", imageLabel: "Skewer" },
  { category: "Snacks", name: "Garlic Bread", description: "Toasted bread with garlic butter.", price: 1.35, prepTimeMinutes: 4, stockQuantity: 34, tag: "Simple", imageLabel: "Bread" },
  { category: "Snacks", name: "Mini Dumplings", description: "Steamed dumplings with soy dipping sauce.", price: 2.2, prepTimeMinutes: 6, stockQuantity: 32, tag: "Steamed", imageLabel: "Dumpling" },
  { category: "Snacks", name: "Crispy Tofu Bites", description: "Fried tofu cubes with spicy mayo.", price: 1.9, prepTimeMinutes: 5, stockQuantity: 30, tag: "Veggie", imageLabel: "Tofu" },
  { category: "Snacks", name: "Potato Croquettes", description: "Golden potato croquettes with a soft center.", price: 2.1, prepTimeMinutes: 6, stockQuantity: 26, tag: "Crispy", imageLabel: "Potato" },

  { category: "Drinks", name: "Iced Lemon Tea", description: "Chilled black tea with lemon and light sweetness.", price: 1.25, prepTimeMinutes: 2, stockQuantity: 60, tag: "Cold", imageLabel: "Tea" },
  { category: "Drinks", name: "Milk Tea", description: "Creamy iced milk tea with optional pearls.", price: 1.75, prepTimeMinutes: 3, stockQuantity: 55, tag: "Favorite", imageLabel: "Tea" },
  { category: "Drinks", name: "Iced Coffee", description: "Strong iced coffee with condensed milk.", price: 1.5, prepTimeMinutes: 3, stockQuantity: 50, tag: "Energy", imageLabel: "Coffee" },
  { category: "Drinks", name: "Passion Soda", description: "Sparkling passion fruit soda with ice.", price: 1.6, prepTimeMinutes: 2, stockQuantity: 48, tag: "Fresh", imageLabel: "Soda" },
  { category: "Drinks", name: "Mineral Water", description: "Cold bottled mineral water.", price: 0.75, prepTimeMinutes: 1, stockQuantity: 100, tag: "Simple", imageLabel: "Water" },
  { category: "Drinks", name: "Matcha Latte", description: "Iced matcha with milk and a smooth finish.", price: 2.0, prepTimeMinutes: 3, stockQuantity: 36, tag: "New", imageLabel: "Matcha" },
  { category: "Drinks", name: "Chocolate Frappe", description: "Blended chocolate drink with ice and cream.", price: 2.25, prepTimeMinutes: 4, stockQuantity: 30, tag: "Sweet", imageLabel: "Frappe" },
  { category: "Drinks", name: "Lychee Iced Tea", description: "Iced tea with lychee syrup and fruit pieces.", price: 1.8, prepTimeMinutes: 3, stockQuantity: 42, tag: "Fruit", imageLabel: "Tea" },
  { category: "Drinks", name: "Mango Smoothie", description: "Blended mango smoothie with milk and ice.", price: 2.35, prepTimeMinutes: 4, stockQuantity: 35, tag: "Smoothie", imageLabel: "Mango" },
  { category: "Drinks", name: "Lime Soda", description: "Sparkling lime soda with ice.", price: 1.45, prepTimeMinutes: 2, stockQuantity: 46, tag: "Fresh", imageLabel: "Soda" },
  { category: "Drinks", name: "Thai Tea", description: "Sweet iced Thai tea with milk.", price: 1.85, prepTimeMinutes: 3, stockQuantity: 44, tag: "Classic", imageLabel: "Tea" },
  { category: "Drinks", name: "Watermelon Juice", description: "Fresh watermelon juice served cold.", price: 1.9, prepTimeMinutes: 3, stockQuantity: 38, tag: "Fresh", imageLabel: "Juice" },

  { category: "Desserts", name: "Mango Sticky Rice", description: "Sweet sticky rice with mango and coconut cream.", price: 2.5, prepTimeMinutes: 4, stockQuantity: 28, tag: "Sweet", imageLabel: "Mango" },
  { category: "Desserts", name: "Chocolate Brownie", description: "Soft chocolate brownie with a rich cocoa flavor.", price: 1.75, prepTimeMinutes: 2, stockQuantity: 36, tag: "Chocolate", imageLabel: "Brownie" },
  { category: "Desserts", name: "Coconut Jelly", description: "Cool coconut jelly dessert with palm sugar syrup.", price: 1.5, prepTimeMinutes: 2, stockQuantity: 32, tag: "Cool", imageLabel: "Jelly" },
  { category: "Desserts", name: "Banana Fritters", description: "Crispy fried banana served warm.", price: 1.5, prepTimeMinutes: 5, stockQuantity: 30, tag: "Warm", imageLabel: "Banana" },
  { category: "Desserts", name: "Pandan Cake", description: "Soft pandan sponge cake with a light sweetness.", price: 1.65, prepTimeMinutes: 2, stockQuantity: 26, tag: "Cake", imageLabel: "Cake" },
  { category: "Desserts", name: "Fruit Cup", description: "Mixed seasonal fruit in a chilled cup.", price: 1.8, prepTimeMinutes: 2, stockQuantity: 34, tag: "Fresh", imageLabel: "Fruit" },
  { category: "Desserts", name: "Caramel Pudding", description: "Smooth pudding topped with caramel sauce.", price: 1.7, prepTimeMinutes: 2, stockQuantity: 30, tag: "Soft", imageLabel: "Pudding" },
  { category: "Desserts", name: "Ice Cream Cup", description: "Single cup of vanilla, chocolate, or strawberry ice cream.", price: 1.25, prepTimeMinutes: 1, stockQuantity: 50, tag: "Cold", imageLabel: "Ice Cream" },
  { category: "Desserts", name: "Red Bean Bun", description: "Soft bun filled with sweet red bean paste.", price: 1.35, prepTimeMinutes: 3, stockQuantity: 30, tag: "Bakery", imageLabel: "Bun" },
  { category: "Desserts", name: "Cheesecake Slice", description: "Creamy cheesecake slice with biscuit base.", price: 2.4, prepTimeMinutes: 2, stockQuantity: 20, tag: "Creamy", imageLabel: "Cake" },
  { category: "Desserts", name: "Sweet Corn Pudding", description: "Creamy corn dessert with coconut milk.", price: 1.55, prepTimeMinutes: 3, stockQuantity: 24, tag: "Khmer", imageLabel: "Corn" },
];

const menuItemNames = new Set(menuItems.map((item) => item.name));

const getRequiredEnv = (name) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for seeding`);
  }

  return value;
};

const upsertVendorStaffUser = async ({
  name,
  email,
  password,
  vendorCounterId = null,
  vendorStaffType,
}) => {
  const normalizedEmail = email.trim().toLowerCase();
  const [user] = await User.findOrCreate({
    where: { email: normalizedEmail },
    defaults: {
      name,
      email: normalizedEmail,
      password: await bcrypt.hash(password, 12),
      role: "vendor",
      vendorCounterId,
      vendorStaffType,
      walletBalance: 0,
      status: "active",
    },
  });

  await user.update({
    name,
    email: normalizedEmail,
    password: await bcrypt.hash(password, 12),
    role: "vendor",
    vendorCounterId,
    vendorStaffType,
    walletBalance: 0,
    status: "active",
  });

  return user;
};

const upsertCounter = async (config) => {
  const cashier = await upsertVendorStaffUser({
    ...config.cashier,
    vendorStaffType: "cashier",
  });

  const existingCounter = await Vendor.findOne({ where: { stallName: config.stallName } });
  const previousCounter = config.previousStallName
    ? await Vendor.findOne({ where: { stallName: config.previousStallName } })
    : null;
  const counter = existingCounter || previousCounter || await Vendor.create({
    userId: cashier.id,
    stallName: config.stallName,
    pickupLocation: config.pickupLocation,
    status: "active",
    serviceStatus: "open",
  });

  await counter.update({
    userId: cashier.id,
    stallName: config.stallName,
    pickupLocation: config.pickupLocation,
    status: "active",
    serviceStatus: "open",
  });

  await cashier.update({ vendorCounterId: counter.id });

  await upsertVendorStaffUser({
    ...config.chef,
    vendorCounterId: counter.id,
    vendorStaffType: "chef",
  });

  return counter;
};

const seed = async () => {
  await sequelize.authenticate();
  await sequelize.sync();

  const adminEmail = getRequiredEnv("SEED_ADMIN_EMAIL").trim().toLowerCase();
  const adminPassword = getRequiredEnv("SEED_ADMIN_PASSWORD");
  const [admin] = await User.findOrCreate({
    where: { email: adminEmail },
    defaults: {
      name: "Campus Admin",
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, 12),
      role: "admin",
      walletBalance: 0,
      status: "active",
    },
  });

  await admin.update({
    name: "Campus Admin",
    email: adminEmail,
    password: await bcrypt.hash(adminPassword, 12),
    role: "admin",
    vendorCounterId: null,
    vendorStaffType: null,
    walletBalance: 0,
    status: "active",
  });

  for (const name of categories) {
    await Category.findOrCreate({ where: { name } });
  }

  const seededCategories = await Category.findAll();
  const categoryByName = new Map(seededCategories.map((category) => [category.name, category]));

  const counterByCategoryName = new Map();
  for (const categoryName of categories) {
    const counter = await upsertCounter(counterByCategory[categoryName]);
    counterByCategoryName.set(categoryName, counter);
  }

  await MenuItem.update({ isAvailable: false }, { where: {} });

  for (const item of menuItems) {
    const category = categoryByName.get(item.category);
    const counter = counterByCategoryName.get(item.category);

    if (!category) {
      throw new Error(`Missing category for menu item: ${item.name}`);
    }

    if (!counter) {
      throw new Error(`Missing counter for menu item: ${item.name}`);
    }

    const existingItem = await MenuItem.findOne({ where: { name: item.name } });
    const values = {
      vendorCounterId: counter.id,
      categoryId: category.id,
      name: item.name,
      description: item.description,
      price: item.price,
      prepTimeMinutes: item.prepTimeMinutes,
      stockQuantity: item.stockQuantity,
      tag: item.tag,
      imageLabel: item.imageLabel,
      isAvailable: false,
    };

    if (existingItem) {
      await existingItem.update(values);
    } else {
      await MenuItem.create(values);
    }
  }

  const referencedOrderItems = await OrderItem.findAll({
    attributes: ["menuItemId"],
    group: ["menuItemId"],
  });
  const referencedMenuItemIds = referencedOrderItems.map((item) => item.menuItemId);
  const nonCatalogWhere = {
    name: { [Op.notIn]: [...menuItemNames] },
  };

  await MenuItem.update(
    { isAvailable: false },
    { where: nonCatalogWhere },
  );

  await MenuItem.destroy({
    where: {
      ...nonCatalogWhere,
      id: { [Op.notIn]: referencedMenuItemIds.length > 0 ? referencedMenuItemIds : [0] },
    },
  });

  const catalogCount = await MenuItem.count({
    where: { name: { [Op.in]: [...menuItemNames] } },
  });

  console.log("Database seeded successfully.");
  console.log(`Admin account ready: ${admin.email}`);
  console.log(`Vendor counters ready: ${categories.length}`);
  console.log(`Menu catalog items ready: ${catalogCount}`);
};

seed()
  .catch((error) => {
    console.error("Failed to seed database:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
