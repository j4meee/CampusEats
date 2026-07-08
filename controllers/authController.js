import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { User, Vendor } from "../model/index.js";

dotenv.config();

const jwtSecret = process.env.JWT_SECRET || "campus-eats-dev-secret-change-me";

const publicUser = (user) => {
  const { password: _password, ...safeUser } = user.toJSON();
  return safeUser;
};

const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

const createToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      role: user.role,
      email: user.email,
    },
    jwtSecret,
    { expiresIn: "7d" },
  );

const authResponse = (user) => ({
  user: publicUser(user),
  token: createToken(user),
});

const isHashedPassword = (password) => password?.startsWith("$2a$") || password?.startsWith("$2b$");

const verifyPassword = async (plainPassword, user) => {
  if (isHashedPassword(user.password)) {
    return bcrypt.compare(plainPassword, user.password);
  }

  const matchesLegacyPassword = user.password === plainPassword;

  if (matchesLegacyPassword) {
    await user.update({ password: await bcrypt.hash(plainPassword, 12) });
  }

  return matchesLegacyPassword;
};

export const login = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { password, role } = req.body;
    const where = { email };

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({
      where,
      include: [{ model: Vendor, as: "vendorProfile" }],
    });

    if (!user || user.status !== "active" || !(await verifyPassword(password, user))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (role && user.role !== role && !(role === "staff" && ["admin", "vendor"].includes(user.role))) {
      return res.status(403).json({ message: "This account cannot use that login type" });
    }

    res.status(200).json(authResponse(user));
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  res.status(200).json({ user: publicUser(req.user) });
};

export const updateProfile = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const studentId = req.body.studentId?.trim();

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    if (req.user.role === "student" && !studentId) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail && existingEmail.id !== req.user.id) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    if (req.user.role === "student" && studentId) {
      const existingStudentId = await User.findOne({ where: { studentId } });
      if (existingStudentId && existingStudentId.id !== req.user.id) {
        return res.status(409).json({ message: "Student ID is already registered" });
      }
    }

    const updateData = {
      name,
      email,
    };

    if (req.user.role === "student") {
      updateData.studentId = studentId;
    }

    await req.user.update(updateData);

    res.status(200).json({ user: publicUser(req.user) });
  } catch (error) {
    res.status(500).json({ message: "Profile update failed", error: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    if (!user || !(await verifyPassword(currentPassword, user))) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    await user.update({ password: await bcrypt.hash(newPassword, 12) });

    res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    res.status(500).json({ message: "Password change failed", error: error.message });
  }
};

export const registerStudent = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const studentId = req.body.studentId?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;

    if (!name || !studentId || !email || !password) {
      return res.status(400).json({ message: "Name, student ID, email, and password are required" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const existingStudentId = await User.findOne({ where: { studentId } });
    if (existingStudentId) {
      return res.status(409).json({ message: "Student ID is already registered" });
    }

    const user = await User.create({
      name,
      studentId,
      email,
      password: await bcrypt.hash(password, 12),
      role: "student",
      status: "active",
    });

    res.status(201).json(authResponse(user));
  } catch (error) {
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and new password are required" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ where: { email } });

    if (!user || user.status !== "active") {
      return res.status(404).json({ message: "No active account found for that email" });
    }

    if (role === "staff" && !["admin", "vendor"].includes(user.role)) {
      return res.status(403).json({ message: "This account cannot use staff password reset" });
    }

    await user.update({ password: await bcrypt.hash(password, 12) });

    res.status(200).json({ message: "Password updated. Please sign in with your new password." });
  } catch (error) {
    res.status(500).json({ message: "Password reset failed", error: error.message });
  }
};
