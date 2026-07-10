import bcrypt from "bcryptjs";
import sequelize from "./database.js";
import {
  Category,
  MenuItem,
  User,
  Vendor,
} from "../model/index.js";

const categories = ["Mains", "Snacks", "Drinks", "Desserts"];
const menuItems = [
  {
    category: "Mains",
    name: "Chicken Rice Bowl",
    description: "Steamed rice with tender chicken, cucumber, and soy garlic sauce.",
    price: 3.50,
    prepTimeMinutes: 8,
    tag: "Popular",
    imageLabel: "🍗",
  },
  {
    category: "Mains",
    name: "Beef Lok Lak",
    description: "Peppery beef cubes with rice, lettuce, tomato, and lime pepper dip.",
    price: 4.25,
    prepTimeMinutes: 10,
    tag: "Chef Pick",
    imageLabel: "🥩",
  },
  {
    category: "Mains",
    name: "Pork Basil Rice",
    description: "Stir-fried pork with basil, chili, garlic, and jasmine rice.",
    price: 3.75,
    prepTimeMinutes: 9,
    tag: "Spicy",
    imageLabel: "🍛",
  },
  {
    category: "Mains",
    name: "Vegetable Fried Rice",
    description: "Fried rice with mixed vegetables, egg, and spring onion.",
    price: 3.00,
    prepTimeMinutes: 7,
    tag: "Veggie",
    imageLabel: "🍚",
  },
  {
    category: "Mains",
    name: "Fish Amok Rice",
    description: "Creamy coconut fish curry served with steamed rice.",
    price: 4.50,
    prepTimeMinutes: 12,
    tag: "Khmer",
    imageLabel: "🐟",
  },
  {
    category: "Mains",
    name: "Teriyaki Chicken Bento",
    description: "Chicken teriyaki with rice, vegetables, and egg roll.",
    price: 4.75,
    prepTimeMinutes: 11,
    tag: "New",
    imageLabel: "🍱",
  },
  {
    category: "Snacks",
    name: "Spring Rolls",
    description: "Crispy vegetable rolls with sweet chili dipping sauce.",
    price: 1.75,
    prepTimeMinutes: 5,
    tag: "Crispy",
    imageLabel: "🥟",
  },
  {
    category: "Snacks",
    name: "Fried Wontons",
    description: "Golden wontons filled with seasoned pork and herbs.",
    price: 2.00,
    prepTimeMinutes: 6,
    tag: "Crunchy",
    imageLabel: "🥠",
  },
  {
    category: "Snacks",
    name: "French Fries",
    description: "Hot crispy fries with ketchup.",
    price: 1.50,
    prepTimeMinutes: 5,
    tag: "Classic",
    imageLabel: "🍟",
  },
  {
    category: "Snacks",
    name: "Chicken Nuggets",
    description: "Bite-sized chicken nuggets with dipping sauce.",
    price: 2.25,
    prepTimeMinutes: 6,
    tag: "Quick",
    imageLabel: "🍖",
  },
  {
    category: "Snacks",
    name: "Grilled Corn",
    description: "Sweet corn brushed with butter and a pinch of salt.",
    price: 1.25,
    prepTimeMinutes: 4,
    tag: "Light",
    imageLabel: "🌽",
  },
  {
    category: "Drinks",
    name: "Iced Lemon Tea",
    description: "Chilled black tea with lemon and a light sweetness.",
    price: 1.25,
    prepTimeMinutes: 2,
    tag: "Cold",
    imageLabel: "🍋",
  },
  {
    category: "Drinks",
    name: "Milk Tea",
    description: "Creamy iced milk tea with optional pearls.",
    price: 1.75,
    prepTimeMinutes: 3,
    tag: "Favorite",
    imageLabel: "🧋",
  },
  {
    category: "Drinks",
    name: "Iced Coffee",
    description: "Strong iced coffee with condensed milk.",
    price: 1.50,
    prepTimeMinutes: 3,
    tag: "Energy",
    imageLabel: "☕",
  },
  {
    category: "Drinks",
    name: "Passion Soda",
    description: "Sparkling passion fruit soda with ice.",
    price: 1.60,
    prepTimeMinutes: 2,
    tag: "Fresh",
    imageLabel: "🥤",
  },
  {
    category: "Drinks",
    name: "Mineral Water",
    description: "Cold bottled mineral water.",
    price: 0.75,
    prepTimeMinutes: 1,
    tag: "Simple",
    imageLabel: "💧",
  },
  {
    category: "Desserts",
    name: "Mango Sticky Rice",
    description: "Sweet sticky rice with mango and coconut cream.",
    price: 2.50,
    prepTimeMinutes: 4,
    tag: "Sweet",
    imageLabel: "🥭",
  },
  {
    category: "Desserts",
    name: "Chocolate Brownie",
    description: "Soft chocolate brownie with a rich cocoa flavor.",
    price: 1.75,
    prepTimeMinutes: 2,
    tag: "Chocolate",
    imageLabel: "🍫",
  },
  {
    category: "Desserts",
    name: "Coconut Jelly",
    description: "Cool coconut jelly dessert with palm sugar syrup.",
    price: 1.50,
    prepTimeMinutes: 2,
    tag: "Cool",
    imageLabel: "🥥",
  },
  {
    category: "Desserts",
    name: "Banana Fritters",
    description: "Crispy fried banana served warm.",
    price: 1.50,
    prepTimeMinutes: 5,
    tag: "Warm",
    imageLabel: "🍌",
  },
];

const getRequiredEnv = (name) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for seeding`);
  }

  return value;
};

const seed = async () => {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });

  const adminEmail = getRequiredEnv("SEED_ADMIN_EMAIL").trim().toLowerCase();
  const adminPassword = getRequiredEnv("SEED_ADMIN_PASSWORD");
  const [admin] = await User.findOrCreate({
    where: { email: adminEmail },
    defaults: {
      name: "Campus Admin",
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, 12),
      role: "admin",
      status: "active",
    },
  });

  await admin.update({
    email: adminEmail,
    password: await bcrypt.hash(adminPassword, 12),
    role: "admin",
    status: "active",
  });

  for (const name of categories) {
    await Category.findOrCreate({ where: { name } });
  }

  const seededCategories = await Category.findAll();
  const categoryByName = new Map(seededCategories.map((category) => [category.name, category]));

  const [seedVendorUser] = await User.findOrCreate({
    where: { email: "vendor@campuseats.test" },
    defaults: {
      name: "Counter B Vendor",
      email: "vendor@campuseats.test",
      password: await bcrypt.hash("vendor123", 12),
      role: "vendor",
      status: "active",
    },
  });

  await seedVendorUser.update({
    name: "Counter B Vendor",
    role: "vendor",
    status: "active",
  });

  const [seedVendor] = await Vendor.findOrCreate({
    where: { userId: seedVendorUser.id },
    defaults: {
      userId: seedVendorUser.id,
      name: "Counter B Vendor",
      stallName: "Counter B",
      pickupLocation: "Block A Canteen - Counter B",
      status: "active",
    },
  });

  await seedVendor.update({
    name: "Counter B Vendor",
    stallName: "Counter B",
    pickupLocation: "Block A Canteen - Counter B",
    status: "active",
  });

  for (const [index, item] of menuItems.entries()) {
    const category = categoryByName.get(item.category);
    const isAvailable = index < 10;

    if (!category) {
      throw new Error(`Missing category for menu item: ${item.name}`);
    }

    const [menuItem] = await MenuItem.findOrCreate({
      where: {
        vendorId: seedVendor.id,
        name: item.name,
      },
      defaults: {
        vendorId: seedVendor.id,
        categoryId: category.id,
        name: item.name,
        description: item.description,
        price: item.price,
        prepTimeMinutes: item.prepTimeMinutes,
        tag: item.tag,
        imageLabel: item.imageLabel,
        isAvailable,
      },
    });

    await menuItem.update({
      categoryId: category.id,
      description: item.description,
      price: item.price,
      prepTimeMinutes: item.prepTimeMinutes,
      tag: item.tag,
      imageLabel: item.imageLabel,
      isAvailable,
    });
  }

  console.log("Database seeded successfully.");
  console.log(`Admin account ready: ${admin.email}`);
  console.log(`Menu items ready: ${menuItems.length}`);
};

seed()
  .catch((error) => {
    console.error("Failed to seed database:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
