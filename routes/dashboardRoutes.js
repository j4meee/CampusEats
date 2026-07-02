import express from "express";
import { getAdminDashboard, getVendorDashboard } from "../controllers/dashboardController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = express.Router();

router.get("/admin", requireAuth, requireRole("admin"), getAdminDashboard);
router.get("/vendor/:userId", requireAuth, requireRole("admin", "vendor"), getVendorDashboard);

export default router;
