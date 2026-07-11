import { DataTypes } from "sequelize";
import sequelize from "../db/database.js";

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    orderNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: "order_number",
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "student_id",
    },
    vendorCounterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "vendor_counter_id",
    },
    status: {
      type: DataTypes.ENUM("pending", "preparing", "ready", "picked_up", "cancelled"),
      allowNull: false,
      defaultValue: "pending",
    },
    specialRequest: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "special_request",
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "rejection_reason",
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    estimatedReadyAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "estimated_ready_at",
    },
    pickedUpAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "picked_up_at",
    },
    stockReserved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "stock_reserved",
    },
  },
  {
    tableName: "orders",
    timestamps: true,
  },
);

export default Order;
