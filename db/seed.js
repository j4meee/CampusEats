import bcrypt from "bcryptjs";
import sequelize from "./database.js";
import {
  Category,
  User,
} from "../model/index.js";

const categories = ["Mains", "Snacks", "Drinks", "Desserts"];

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

  console.log("Database seeded successfully.");
  console.log(`Admin account ready: ${admin.email}`);
};

seed()
  .catch((error) => {
    console.error("Failed to seed database:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
