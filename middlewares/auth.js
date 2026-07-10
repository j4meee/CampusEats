import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { getRolePrivileges, hasPrivilege } from "../config/accessControl.js";
import { User } from "../model/index.js";

dotenv.config();

const jwtSecret = process.env.JWT_SECRET || "campus-eats-dev-secret-change-me";

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ message: "Authentication token is required" });
    }

    const payload = jwt.verify(token, jwtSecret);
    const user = await User.findByPk(payload.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user || user.status !== "active") {
      return res.status(401).json({ message: "Invalid or inactive account" });
    }

    req.userPrivileges = getRolePrivileges(user.role);
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requirePrivilege = (...privileges) => (req, res, next) => {
  if (!req.user || privileges.some((privilege) => !hasPrivilege(req.user.role, privilege))) {
    return res.status(403).json({ message: "You do not have permission to access this resource" });
  }

  next();
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "You do not have permission to access this resource" });
  }

  next();
};
