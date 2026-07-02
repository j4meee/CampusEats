import { DataTypes } from "sequelize";
import sequelize from "../db/database.js";

const OrderItem = sequelize.define(
  "OrderItem",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "order_id",
    },
    menuItemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "menu_item_id",
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "unit_price",
    },
    lineTotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "line_total",
    },
  },
  {
    tableName: "order_items",
    timestamps: true,
  },
);

export default OrderItem;
