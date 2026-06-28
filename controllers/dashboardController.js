import { Category, MenuItem, Order, OrderItem, User, Vendor } from "../model/index.js";

const formatOrder = (order) => ({
  id: order.orderNumber,
  student: order.student?.studentId || order.student?.name || "Student",
  vendor: order.vendor?.stallName || "Vendor",
  total: Number(order.total),
  status: order.status,
  items: order.items
    ?.map((item) => `${item.menuItem?.name || "Item"} x${item.quantity}`)
    .join(", "),
});

export const getAdminDashboard = async (_req, res) => {
  try {
    const [vendors, orders] = await Promise.all([
      Vendor.findAll({
        include: [{ model: User, as: "user", attributes: ["email"] }],
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
        name: vendor.name,
        email: vendor.user?.email,
        stall: vendor.stallName,
        status: vendor.status,
      })),
      orders: orders.map(formatOrder),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch admin dashboard", error: error.message });
  }
};

export const getVendorDashboard = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ where: { userId: req.params.userId } });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor profile not found" });
    }

    const [menuItems, orders] = await Promise.all([
      MenuItem.findAll({
        where: { vendorId: vendor.id },
        include: [{ model: Category, as: "category", attributes: ["name"] }],
        order: [["name", "ASC"]],
      }),
      Order.findAll({
        where: { vendorId: vendor.id },
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
      summary: {
        pendingOrders: orders.filter((order) => order.status === "pending").length,
        readyOrders: orders.filter((order) => order.status === "ready").length,
        menuItems: menuItems.length,
      },
      menu: menuItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        status: item.isAvailable ? "Available" : "Sold Out",
        sold: 0,
      })),
      orders: orders.map(formatOrder),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch vendor dashboard", error: error.message });
  }
};
