import {category, feedback, index, menuItem, order, orderItem, payment, user, vendor} from "../models/index.js";
import { Op } from "sequelize";
import sequelize from "..db/database.js";
import bcrypt from "bcrypt";

// 1. View all users
export const getAllUsers = async (req, res) => {
    try {
        const users = await user.findAll({
            attributes: {exclude: ["password_hash"]},
            order: [["createdAt", "DESC"]],
        });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve users" });
    }
};
// 2. Search users by name or email
export const searchUsers = async (req, res) => {
    const { query } = req.query;
    try {
        const users = await user.findByPk({
            attributes: {exclude: ["password_hash"]}
        });
    if(!users){
        return res.status(404).json({ error: "No users found" });
    }  else {
            res.status(200).json(users);
        }
    }
        catch (error) {
            res.status(500).json({ error: "Failed to search users" });
        }
    };
// 3.User accounts suspension and reactivation(students)
export const toggleUserStatus = async (req, res) => {
    const user = await user.findByPk(req.params.id);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    if(user.role !== "student"){
        return res.status(400).json({ error: "Only student accounts can be suspended or reactivated" });
    }
    const newStatus = user.status === "active" ? "suspended" : "active";
    try {
        await user.update({ status: newStatus }, { where: { id: req.params.id } });
        res.status(200).json({ message: `User account ${newStatus}` });
    } catch (error) {
        res.status(500).json({ error: "Failed to update user's status" });
    }
}
// 4.Delete a Student account
export const deleteUser = async (req, res) => {
    try {
        const deleteUser = await user.destroy({
            where: { id: req.params.id },
        });
        res.status(200).json({ message: "User account deleted" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete user account" });
    }
}
// 4.Create a vendor account
export const createAccount = async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await user.create({
            name,
            email,
            password_hash: hashedPassword,
            role
        });
        res.status(201).json({ message: "Account created successfully", user: newUser });
    } catch (error) {
        res.status(500).json({ error: "Failed to create account" });
    }
};
//5. View all vendors
export const getAllVendors = async (req, res) => {
    try {
        const vendors = await vendor.findAll({
            where: { role: "vendor" , status: "pending" },
            attributes: {exclude: ["password_hash"]},
            include: {model: vendor, as: "profile"}
        });
        res.status(200).json(vendors);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve vendors" });
    }
}
// 6. Update Vendor Profile
export const updateVendor = async (req, res) => {
    const { name, email, phone, address } = req.body;
    try {
        const vendor = await vendor.findByPk(req.params.id);
        
        if (!vendor) {
            return res.status(404).json({ error: "Vendor not found" });
        }
        await vendor.update({ name, email, phone, address });
        res.status(200).json({ message: "Vendor profile updated" });
    } catch (error) {
        res.status(500).json({ error: "Failed to update vendor profile" });     
    }
}
// 7. Delete a Vendor account
export const deleteVendor = async (req, res) => {
    try {
        const deleteVendor = await vendor.destroy({
        where: { id: req.params.id },
        });
        res.status(200).json({ message: "Vendor account deleted" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete vendor account" });
    }
}

