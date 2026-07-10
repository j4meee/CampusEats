import express from "express";
import { PRIVILEGES } from "../config/accessControl.js";
import { getAdminDashboard, getVendorDashboard } from "../controllers/dashboardController.js";
import { requireAuth, requirePrivilege } from "../middlewares/auth.js";

const router = express.Router();

router.get("/admin", requireAuth, requirePrivilege(PRIVILEGES.VIEW_ADMIN_DASHBOARD), getAdminDashboard);
router.get("/vendor/:userId", requireAuth, requirePrivilege(PRIVILEGES.VIEW_VENDOR_DASHBOARD), getVendorDashboard);

export default router;
