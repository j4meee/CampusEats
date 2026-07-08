import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const dialectOptions = process.env.DB_SSL === "true"
  ? {
      ssl: {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
      },
    }
  : undefined;

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    dialect: "mysql",
    dialectOptions,
    logging: process.env.DB_LOGGING === "true" ? console.log : false,
  },
);

export default sequelize;
