import express from "express";
import { getAdminDashboard, getVendorDashboard } from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/admin", getAdminDashboard);
router.get("/vendor/:userId", getVendorDashboard);

export default router;
