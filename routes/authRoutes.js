import express from "express";
import { forgotPassword, login, registerStudent } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", registerStudent);
router.post("/forgot-password", forgotPassword);

export default router;
