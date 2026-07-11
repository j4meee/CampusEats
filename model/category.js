import { DataTypes } from "sequelize";
import sequelize from "../db/database.js";

const Category = sequelize.define(
  "Category",
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
  },
  {
    tableName: "categories",
    timestamps: true,
    indexes: [
      { name: "name", unique: true, fields: ["name"] },
    ],
  },
);

export default Category;
