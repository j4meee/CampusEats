import { DataTypes } from "sequelize";
import sequelize from "../db/database.js";

const Vendor = sequelize.define(
  "Vendor",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id",
    },
    stallName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "stall_name",
    },
    pickupLocation: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "pickup_location",
    },
    status: {
      type: DataTypes.ENUM("active", "pending", "disabled"),
      allowNull: false,
      defaultValue: "pending",
    },
  },
  {
    tableName: "vendor_counters",
    timestamps: true,
  },
);

export default Vendor;
