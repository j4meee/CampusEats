import { DataTypes } from "sequelize";
import sequelize from "../db/database.js";

const Payment = sequelize.define(
  "Payment",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: "order_id",
    },
    method: {
      type: DataTypes.ENUM("qr", "ewallet"),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "paid", "failed", "refunded"),
      allowNull: false,
      defaultValue: "pending",
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "paid_at",
    },
  },
  {
    tableName: "payments",
    timestamps: true,
  },
);

export default Payment;
