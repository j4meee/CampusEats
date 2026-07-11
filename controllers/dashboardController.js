import { Category, MenuItem, Order, OrderItem, User, Vendor } from "../model/index.js";
import { findVendorForUser } from "./vendorAccess.js";

const formatOrder = (order) => ({
  id: order.orderNumber,
  dbId: order.id,
  student: order.student?.studentId || order.student?.name || "Student",
  vendor: order.vendor?.stallName || "Vendor",
  total: Number(order.total),
  status: order.status,
  pickupDeadlineAt: order.pickupDeadlineAt,
  items: order.items
    ?.map((item) => `${item.menuItem?.name || "Item"} x${item.quantity}`)
    .join(", "),
});

export const getAdminDashboard = async (_req, res) => {
  try {
    const [vendors, orders] = await Promise.all([
      Vendor.findAll({
        where: { status: ["active", "pending"] },
        include: [
          { model: User, as: "user", attributes: ["email"] },
          { model: User, as: "staff", attributes: ["id", "name", "email", "vendorStaffType", "status"] },
        ],
        order: [["createdAt", "DESC"]],
      }),
      Order.findAll({
        include: [
          { model: User, as: "student", attributes: ["name", "studentId"] },
          { model: Vendor, as: "vendor", attributes: ["stallName"] },
          {
            model: OrderItem,
            as: "items",
            include: [{ model: MenuItem, as: "menuItem", attributes: ["name"] }],
          },
        ],
        order: [["createdAt", "DESC"]],
      }),
    ]);

    const sales = orders.reduce((sum, order) => sum + Number(order.total), 0);

    res.status(200).json({
      summary: {
        vendors: vendors.length,
        ordersToday: orders.length,
        sales,
      },
      vendors: vendors.map((vendor) => ({
        id: vendor.id,
        name: vendor.stallName,
        email: vendor.user?.email,
        stall: vendor.stallName,
        pickupLocation: vendor.pickupLocation,
        status: vendor.status,
        serviceStatus: vendor.serviceStatus,
        staff: vendor.staff || [],
      })),
      orders: orders.map(formatOrder),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch admin dashboard", error: error.message });
  }
};

export const getVendorDashboard = async (req, res) => {
  try {
    if (req.user.role === "vendor" && Number(req.params.userId) !== req.user.id) {
      return res.status(403).json({ message: "You do not have permission to view this vendor dashboard" });
    }

    const targetUser = req.user.role === "vendor"
      ? req.user
      : await User.findByPk(req.params.userId);

    const vendor = await findVendorForUser(targetUser);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor profile not found" });
    }

    const [menuItems, orders] = await Promise.all([
      MenuItem.findAll({
        where: { vendorCounterId: vendor.id },
        include: [{ model: Category, as: "category", attributes: ["name"] }],
        order: [["name", "ASC"]],
      }),
      Order.findAll({
        where: { vendorCounterId: vendor.id },
        include: [
          { model: User, as: "student", attributes: ["name", "studentId"] },
          {
            model: OrderItem,
            as: "items",
            include: [{ model: MenuItem, as: "menuItem", attributes: ["name"] }],
          },
        ],
        order: [["createdAt", "DESC"]],
      }),
    ]);

    res.status(200).json({
      vendor,
      serviceStatus: vendor.serviceStatus,
      staffType: targetUser?.vendorStaffType || "cashier",
      summary: {
        pendingOrders: orders.filter((order) => order.status === "pending").length,
        readyOrders: orders.filter((order) => order.status === "ready").length,
        menuItems: menuItems.length,
        weeklyMenuItems: menuItems.filter((item) => item.isAvailable).length,
      },
      menu: menuItems.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category?.name,
        price: Number(item.price),
        stockQuantity: item.stockQuantity,
        imageUrl: item.imageUrl,
        emoji: item.imageLabel,
        isAvailable: item.isAvailable,
        status: item.isAvailable ? "Available" : "Sold Out",
        sold: 0,
      })),
      orders: orders.map(formatOrder),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch vendor dashboard", error: error.message });
  }
};

export const updateVendorServiceStatus = async (req, res) => {
  try {
    const allowedStatuses = ["open", "busy", "very_busy", "closed"];
    const { serviceStatus } = req.body;

    if (!allowedStatuses.includes(serviceStatus)) {
      return res.status(400).json({ message: "Invalid service status" });
    }

    if (req.user.role === "vendor" && req.user.vendorStaffType === "chef") {
      return res.status(403).json({ message: "Chef accounts cannot update counter service status" });
    }

    const vendor = req.user.role === "vendor"
      ? await findVendorForUser(req.user)
      : await Vendor.findByPk(req.params.vendorId);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor counter not found" });
    }

    await vendor.update({ serviceStatus });

    res.status(200).json({
      message: "Counter service status updated.",
      vendor: {
        id: vendor.id,
        stallName: vendor.stallName,
        serviceStatus: vendor.serviceStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update service status", error: error.message });
  }
};
