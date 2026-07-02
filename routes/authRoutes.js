import express from "express";
import { login, registerStudent } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", registerStudent);

export default router;
