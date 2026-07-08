import bcrypt from "bcryptjs";
import sequelize from "../db/database.js";
import { MenuItem, Order, User, Vendor } from "../model/index.js";

export const getUsers = async (_req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user", error: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const user = await User.create({ name, email, password: await bcrypt.hash(password, 12) });
    const { password: _password, ...safeUser } = user.toJSON();

    res.status(201).json(safeUser);
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

    if (!["active", "pending", "disabled"].includes(status)) {
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

    await transaction.commit();

    const { password: _password, ...safeUser } = user.toJSON();

    res.status(201).json({
      user: safeUser,
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

    const updateData = { ...req.body };

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    await user.update(updateData);
    const { password: _password, ...safeUser } = user.toJSON();

    res.status(200).json(safeUser);
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
