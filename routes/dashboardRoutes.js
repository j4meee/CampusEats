import express from "express";
import { PRIVILEGES } from "../config/accessControl.js";
import { getAdminDashboard, getVendorDashboard, updateVendorServiceStatus } from "../controllers/dashboardController.js";
import { requireAuth, requirePrivilege } from "../middlewares/auth.js";

const router = express.Router();

router.get("/admin", requireAuth, requirePrivilege(PRIVILEGES.VIEW_ADMIN_DASHBOARD), getAdminDashboard);
router.get("/vendor/:userId", requireAuth, requirePrivilege(PRIVILEGES.VIEW_VENDOR_DASHBOARD), getVendorDashboard);
router.patch("/vendor/:vendorId/service-status", requireAuth, requirePrivilege(PRIVILEGES.MANAGE_ORDERS), updateVendorServiceStatus);

export default router;
