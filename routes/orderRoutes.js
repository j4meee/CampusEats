import express from "express";
import { PRIVILEGES } from "../config/accessControl.js";
import {
  createOrder,
  getOrderById,
  getStudentNotifications,
  getStudentOrderHistory,
  getStudentPaymentHistory,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { requireAuth, requirePrivilege } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", requireAuth, requirePrivilege(PRIVILEGES.PLACE_ORDERS), createOrder);
router.get("/history", requireAuth, requirePrivilege(PRIVILEGES.VIEW_OWN_ORDERS), getStudentOrderHistory);
router.get("/payments", requireAuth, requirePrivilege(PRIVILEGES.VIEW_OWN_ORDERS), getStudentPaymentHistory);
router.get("/notifications", requireAuth, requirePrivilege(PRIVILEGES.VIEW_OWN_ORDERS), getStudentNotifications);
router.get("/:id", requireAuth, getOrderById);
router.patch("/:id/status", requireAuth, updateOrderStatus);

export default router;
