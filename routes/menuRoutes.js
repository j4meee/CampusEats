import express from "express";
import { PRIVILEGES } from "../config/accessControl.js";
import { getManageableMenu, getMenu, updateMenuItemStock, updateWeeklyMenu } from "../controllers/menuController.js";
import { requireAuth, requirePrivilege } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", getMenu);
router.get("/manage", requireAuth, requirePrivilege(PRIVILEGES.MANAGE_MENU), getManageableMenu);
router.patch("/weekly", requireAuth, requirePrivilege(PRIVILEGES.MANAGE_MENU), updateWeeklyMenu);
router.patch("/:id/stock", requireAuth, requirePrivilege(PRIVILEGES.MANAGE_MENU), updateMenuItemStock);

export default router;
