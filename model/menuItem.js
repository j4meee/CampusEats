import { DataTypes } from "sequelize";
import sequelize from "../db/database.js";

const MenuItem = sequelize.define(
  "MenuItem",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    vendorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "vendor_id",
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "category_id",
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    prepTimeMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
      field: "prep_time_minutes",
    },
    stockQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 20,
      field: "stock_quantity",
      validate: {
        min: 0,
      },
    },
    tag: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    imageLabel: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "image_label",
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "is_available",
    },
  },
  {
    tableName: "menu_items",
    timestamps: true,
    indexes: [
      {
        name: "idx_menu_items_vendor_id",
        fields: ["vendor_id"],
      },
      {
        name: "idx_menu_items_category_id",
        fields: ["category_id"],
      },
      {
        name: "idx_menu_items_is_available",
        fields: ["is_available"],
      },
      {
        name: "idx_menu_items_stock_quantity",
        fields: ["stock_quantity"],
      },
      {
        name: "idx_menu_items_vendor_name",
        fields: ["vendor_id", "name"],
      },
    ],
  },
);

export default MenuItem;
