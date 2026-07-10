import express from "express";
import {
  createUser,
  createVendorUser,
  deleteVendorUser,
  deleteUser,
  getAccessControl,
  getUserById,
  getUsers,
  updateUser,
} from "../controllers/userController.js";
import { PRIVILEGES } from "../config/accessControl.js";
import { requireAuth, requirePrivilege } from "../middlewares/auth.js";

const router = express.Router();

router.use(requireAuth);

router.get("/access-control", requirePrivilege(PRIVILEGES.MANAGE_ACCESS_CONTROL), getAccessControl);
router.get("/", requirePrivilege(PRIVILEGES.MANAGE_USERS), getUsers);
router.post("/", requirePrivilege(PRIVILEGES.MANAGE_USERS), createUser);
router.post("/vendors", requirePrivilege(PRIVILEGES.MANAGE_USERS), createVendorUser);
router.delete("/vendors/:id", requirePrivilege(PRIVILEGES.MANAGE_USERS), deleteVendorUser);
router.get("/:id", requirePrivilege(PRIVILEGES.MANAGE_USERS), getUserById);
router.put("/:id", requirePrivilege(PRIVILEGES.MANAGE_USERS), updateUser);
router.delete("/:id", requirePrivilege(PRIVILEGES.MANAGE_USERS), deleteUser);

export default router;
