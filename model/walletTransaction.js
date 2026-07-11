import { DataTypes } from "sequelize";
import sequelize from "../db/database.js";

const WalletTransaction = sequelize.define(
  "WalletTransaction",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "student_id",
    },
    cashierId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "cashier_id",
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "order_id",
    },
    type: {
      type: DataTypes.ENUM("topup", "payment", "refund"),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    balanceAfter: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "balance_after",
    },
    note: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "wallet_transactions",
    timestamps: true,
  },
);

export default WalletTransaction;
