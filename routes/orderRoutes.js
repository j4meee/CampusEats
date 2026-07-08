import express from "express";
import {
  createOrder,
  getOrderById,
  getStudentNotifications,
  getStudentOrderHistory,
  getStudentPaymentHistory,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", requireAuth, requireRole("student"), createOrder);
router.get("/history", requireAuth, requireRole("student"), getStudentOrderHistory);
router.get("/payments", requireAuth, requireRole("student"), getStudentPaymentHistory);
router.get("/notifications", requireAuth, requireRole("student"), getStudentNotifications);
router.get("/:id", requireAuth, getOrderById);
router.patch("/:id/status", requireAuth, updateOrderStatus);

export default router;
