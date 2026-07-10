import bcrypt from "bcryptjs";
import { getRolePrivileges, ROLE_PRIVILEGES, USER_ROLES, USER_STATUSES } from "../config/accessControl.js";
import sequelize from "../db/database.js";
import { Category, MenuItem, Order, User, Vendor } from "../model/index.js";

const starterCategories = ["Mains", "Snacks", "Drinks", "Desserts"];

const publicUser = (user) => {
  const { password: _password, ...safeUser } = user.toJSON();
  return {
    ...safeUser,
    privileges: getRolePrivileges(safeUser.role),
  };
};

const buildStarterMenuItems = (stallName) => [
  {
    category: "Mains",
    name: `${stallName} Rice Bowl`,
    description: `A fresh rice bowl prepared by ${stallName}.`,
    price: 3.5,
    prepTimeMinutes: 8,
    stockQuantity: 20,
    tag: "New",
    imageLabel: "Rice",
  },
  {
    category: "Snacks",
    name: `${stallName} Spring Rolls`,
    description: `Crispy spring rolls from ${stallName}.`,
    price: 1.75,
    prepTimeMinutes: 5,
    stockQuantity: 20,
    tag: "Crispy",
    imageLabel: "Roll",
  },
  {
    category: "Drinks",
    name: `${stallName} Iced Tea`,
    description: `Cold tea served by ${stallName}.`,
    price: 1.25,
    prepTimeMinutes: 2,
    stockQuantity: 20,
    tag: "Cold",
    imageLabel: "Tea",
  },
  {
    category: "Desserts",
    name: `${stallName} Sweet Treat`,
    description: `A quick dessert from ${stallName}.`,
    price: 1.5,
    prepTimeMinutes: 3,
    stockQuantity: 20,
    tag: "Sweet",
    imageLabel: "Cake",
  },
];

const createStarterMenuForVendor = async (vendor, transaction) => {
  for (const name of starterCategories) {
    await Category.findOrCreate({ where: { name }, transaction });
  }

  const categories = await Category.findAll({ transaction });
  const categoryByName = new Map(categories.map((category) => [category.name, category.id]));

  await MenuItem.bulkCreate(
    buildStarterMenuItems(vendor.stallName).map((item) => ({
      vendorId: vendor.id,
      categoryId: categoryByName.get(item.category),
      name: item.name,
      description: item.description,
      price: item.price,
      prepTimeMinutes: item.prepTimeMinutes,
      stockQuantity: item.stockQuantity,
      tag: item.tag,
      imageLabel: item.imageLabel,
      isAvailable: false,
    })),
    { transaction },
  );
};

export const getUsers = async (_req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json(users.map(publicUser));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
};

export const getAccessControl = (_req, res) => {
  res.status(200).json({
    roles: USER_ROLES,
    statuses: USER_STATUSES,
    rolePrivileges: ROLE_PRIVILEGES,
  });
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(publicUser(user));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user", error: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = "student",
      status = "active",
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (!USER_ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid user role" });
    }

    if (!USER_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid user status" });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: await bcrypt.hash(password, 12),
      role,
      status,
    });

    res.status(201).json(publicUser(user));
  } catch (error) {
    res.status(500).json({ message: "Failed to create user", error: error.message });
  }
};

export const createVendorUser = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      name,
      email,
      password,
      stallName,
      pickupLocation,
      status = "active",
    } = req.body;

    if (!name?.trim() || !email?.trim() || !password || !stallName?.trim() || !pickupLocation?.trim()) {
      await transaction.rollback();
      return res.status(400).json({ message: "Name, email, password, stall name, and pickup location are required" });
    }

    if (!USER_STATUSES.includes(status)) {
      await transaction.rollback();
      return res.status(400).json({ message: "Invalid vendor status" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ where: { email: normalizedEmail }, transaction });

    if (existingUser) {
      await transaction.rollback();
      return res.status(409).json({ message: "Email is already registered" });
    }

    const user = await User.create(
      {
        name: name.trim(),
        email: normalizedEmail,
        password: await bcrypt.hash(password, 12),
        role: "vendor",
        status,
      },
      { transaction },
    );

    const vendor = await Vendor.create(
      {
        userId: user.id,
        name: name.trim(),
        stallName: stallName.trim(),
        pickupLocation: pickupLocation.trim(),
        status,
      },
      { transaction },
    );

    await createStarterMenuForVendor(vendor, transaction);

    await transaction.commit();

    res.status(201).json({
      user: publicUser(user),
      vendor,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    res.status(500).json({ message: "Failed to create vendor", error: error.message });
  }
};

export const deleteVendorUser = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const vendor = await Vendor.findByPk(req.params.id, {
      include: [{ model: User, as: "user" }],
      transaction,
    });

    if (!vendor) {
      await transaction.rollback();
      return res.status(404).json({ message: "Vendor not found" });
    }

    const orderCount = await Order.count({
      where: { vendorId: vendor.id },
      transaction,
    });

    if (orderCount > 0) {
      await Promise.all([
        vendor.update({ status: "disabled" }, { transaction }),
        vendor.user?.update({ status: "disabled" }, { transaction }),
        MenuItem.update(
          { isAvailable: false },
          { where: { vendorId: vendor.id }, transaction },
        ),
      ]);

      await transaction.commit();
      return res.status(200).json({
        message: "Vendor has order history, so the account was disabled instead of permanently deleted.",
      });
    }

    await MenuItem.destroy({ where: { vendorId: vendor.id }, transaction });
    await vendor.destroy({ transaction });

    if (vendor.user) {
      await vendor.user.destroy({ transaction });
    }

    await transaction.commit();
    return res.status(200).json({ message: "Vendor deleted successfully." });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    return res.status(500).json({ message: "Failed to delete vendor", error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const allowedFields = ["name", "email", "studentId", "role", "status", "password"];
    const updateData = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedFields.includes(key)),
    );

    if (updateData.role && !USER_ROLES.includes(updateData.role)) {
      return res.status(400).json({ message: "Invalid user role" });
    }

    if (updateData.status && !USER_STATUSES.includes(updateData.status)) {
      return res.status(400).json({ message: "Invalid user status" });
    }

    if (updateData.email) {
      updateData.email = updateData.email.trim().toLowerCase();
    }

    if (updateData.name) {
      updateData.name = updateData.name.trim();
    }

    if (updateData.studentId) {
      updateData.studentId = updateData.studentId.trim();
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    await user.update(updateData);

    res.status(200).json(publicUser(user));
  } catch (error) {
    res.status(500).json({ message: "Failed to update user", error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Failed to delete user", error: error.message });
  }
};
