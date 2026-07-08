import express from "express";
import { getManageableMenu, getMenu, updateWeeklyMenu } from "../controllers/menuController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", getMenu);
router.get("/manage", requireAuth, requireRole("admin", "vendor"), getManageableMenu);
router.patch("/weekly", requireAuth, requireRole("admin", "vendor"), updateWeeklyMenu);

export default router;
