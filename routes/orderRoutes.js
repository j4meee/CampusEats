import express from "express";
import { createOrder, getOrderById, updateOrderStatus } from "../controllers/orderController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", requireAuth, requireRole("student"), createOrder);
router.get("/:id", requireAuth, getOrderById);
router.patch("/:id/status", requireAuth, updateOrderStatus);

export default router;
