import express from "express";
import {
  changePassword,
  forgotPassword,
  getCurrentUser,
  login,
  registerStudent,
  updateProfile,
} from "../controllers/authController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", registerStudent);
router.post("/forgot-password", forgotPassword);
router.get("/me", requireAuth, getCurrentUser);
router.put("/me", requireAuth, updateProfile);
router.patch("/change-password", requireAuth, changePassword);

export default router;
