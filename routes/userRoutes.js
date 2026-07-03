import express from "express";
import {
  createUser,
  createVendorUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
} from "../controllers/userController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

router.get("/", getUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.post("/vendors", createVendorUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
