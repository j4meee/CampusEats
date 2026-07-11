import { DataTypes } from "sequelize";
import sequelize from "../db/database.js";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    studentId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "student_id",
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("student", "vendor", "admin"),
      allowNull: false,
      defaultValue: "student",
    },
    vendorCounterId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "vendor_counter_id",
    },
    vendorStaffType: {
      type: DataTypes.ENUM("cashier", "chef"),
      allowNull: true,
      field: "vendor_staff_type",
    },
    walletBalance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 12.4,
      field: "wallet_balance",
    },
    status: {
      type: DataTypes.ENUM("active", "pending", "disabled"),
      allowNull: false,
      defaultValue: "active",
    },
  },
  {
    tableName: "users",
    timestamps: true,
    indexes: [
      { name: "student_id", unique: true, fields: ["student_id"] },
      { name: "email", unique: true, fields: ["email"] },
    ],
  },
);

export default User;
