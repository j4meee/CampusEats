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
  },
);

export default MenuItem;
