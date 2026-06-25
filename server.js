import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import sequelize from "./db/database.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "CampusEats API is running" });
});

app.use("/api/users", userRoutes);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Unable to start server:", error);
    process.exit(1);
  }
};

startServer();
