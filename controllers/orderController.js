import sequelize from "../db/database.js";
import { MenuItem, Order, OrderItem, Payment, User, Vendor } from "../model/index.js";

const formatOrder = (order) => ({
  id: order.id,
  orderNumber: order.orderNumber,
  status: order.status,
  subtotal: Number(order.subtotal),
  total: Number(order.total),
  specialRequest: order.specialRequest,
  estimatedReadyAt: order.estimatedReadyAt,
  pickedUpAt: order.pickedUpAt,
  pickupLocation: order.vendor?.pickupLocation,
  vendor: order.vendor
    ? {
        id: order.vendor.id,
        name: order.vendor.name,
        stallName: order.vendor.stallName,
        pickupLocation: order.vendor.pickupLocation,
      }
    : null,
  payment: order.payment
    ? {
        method: order.payment.method,
        status: order.payment.status,
        amount: Number(order.payment.amount),
        paidAt: order.payment.paidAt,
      }
    : null,
  items:
    order.items?.map((item) => ({
      id: item.id,
      menuItemId: item.menuItemId,
      name: item.menuItem?.name || "Item",
      imageLabel: item.menuItem?.imageLabel,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
    })) || [],
});

const buildOrderNumber = () => {
  const date = new Date();
  const datePart = date.toISOString().slice(0, 10).replaceAll("-", "");
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `CE-${datePart}-${randomPart}`;
};

const findOrderById = (id) =>
  Order.findByPk(id, {
    include: [
      { model: Vendor, as: "vendor", attributes: ["id", "name", "stallName", "pickupLocation"] },
      { model: Payment, as: "payment", attributes: ["id", "method", "status", "amount", "paidAt"] },
      {
        model: OrderItem,
        as: "items",
        include: [{ model: MenuItem, as: "menuItem", attributes: ["name", "imageLabel"] }],
      },
    ],
  });

const findStudentOrders = (studentId) =>
  Order.findAll({
    where: { studentId },
    include: [
      { model: Vendor, as: "vendor", attributes: ["id", "name", "stallName", "pickupLocation"] },
      { model: Payment, as: "payment", attributes: ["id", "method", "status", "amount", "paidAt"] },
      {
        model: OrderItem,
        as: "items",
        include: [{ model: MenuItem, as: "menuItem", attributes: ["name", "imageLabel"] }],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

const canAccessOrder = async (user, order) => {
  if (user.role === "admin") return true;
  if (user.role === "student") return order.studentId === user.id;

  if (user.role === "vendor") {
    const vendor = await Vendor.findOne({ where: { userId: user.id } });
    return vendor?.id === order.vendorId;
  }

  return false;
};

export const createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { items, paymentMethod = "qr", specialRequest } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "At least one order item is required" });
    }

    if (!["qr", "ewallet"].includes(paymentMethod)) {
      await transaction.rollback();
      return res.status(400).json({ message: "Invalid payment method" });
    }

    const student = await User.findByPk(req.user.id, { transaction });

    if (!student || student.role !== "student" || student.status !== "active") {
      await transaction.rollback();
      return res.status(403).json({ message: "Only active student accounts can place orders" });
    }

    const requestedItems = items.map((item) => ({
      menuItemId: Number(item.menuItemId),
      quantity: Number(item.quantity),
    }));

    if (requestedItems.some((item) => !item.menuItemId || !Number.isInteger(item.quantity) || item.quantity < 1)) {
      await transaction.rollback();
      return res.status(400).json({ message: "Order items must include a valid item and quantity" });
    }

    const menuItems = await MenuItem.findAll({
      where: { id: requestedItems.map((item) => item.menuItemId) },
      include: [{ model: Vendor, as: "vendor", attributes: ["id", "pickupLocation"] }],
      transaction,
    });

    if (menuItems.length !== requestedItems.length) {
      await transaction.rollback();
      return res.status(400).json({ message: "One or more menu items do not exist" });
    }

    if (menuItems.some((item) => !item.isAvailable)) {
      await transaction.rollback();
      return res.status(400).json({ message: "One or more menu items are no longer available" });
    }

    const vendorIds = new Set(menuItems.map((item) => item.vendorId));

    if (vendorIds.size !== 1) {
      await transaction.rollback();
      return res.status(400).json({ message: "Please place separate orders for different vendors" });
    }

    const menuItemById = new Map(menuItems.map((item) => [item.id, item]));
    const orderLines = requestedItems.map((requestedItem) => {
      const menuItem = menuItemById.get(requestedItem.menuItemId);
      const unitPrice = Number(menuItem.price);
      const lineTotal = unitPrice * requestedItem.quantity;

      return {
        menuItem,
        quantity: requestedItem.quantity,
        unitPrice,
        lineTotal,
      };
    });

    const subtotal = orderLines.reduce((sum, item) => sum + item.lineTotal, 0);
    const maxPrepTime = Math.max(...orderLines.map((item) => item.menuItem.prepTimeMinutes));
    const estimatedReadyAt = new Date(Date.now() + maxPrepTime * 60 * 1000);

    const order = await Order.create(
      {
        orderNumber: buildOrderNumber(),
        studentId: student.id,
        vendorId: orderLines[0].menuItem.vendorId,
        status: "pending",
        specialRequest: specialRequest?.trim() || null,
        subtotal,
        total: subtotal,
        estimatedReadyAt,
      },
      { transaction },
    );

    await OrderItem.bulkCreate(
      orderLines.map((line) => ({
        orderId: order.id,
        menuItemId: line.menuItem.id,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
      })),
      { transaction },
    );

    await Payment.create(
      {
        orderId: order.id,
        method: paymentMethod,
        status: "paid",
        amount: subtotal,
        paidAt: new Date(),
      },
      { transaction },
    );

    await transaction.commit();

    const savedOrder = await findOrderById(order.id);
    res.status(201).json({ order: formatOrder(savedOrder) });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    res.status(500).json({ message: "Failed to create order", error: error.message });
  }
};

export const getStudentOrderHistory = async (req, res) => {
  try {
    const orders = await findStudentOrders(req.user.id);

    res.status(200).json({ orders: orders.map(formatOrder) });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch order history", error: error.message });
  }
};

export const getStudentPaymentHistory = async (req, res) => {
  try {
    const orders = await findStudentOrders(req.user.id);

    res.status(200).json({
      payments: orders
        .filter((order) => order.payment)
        .map((order) => ({
          id: order.payment.id,
          orderId: order.id,
          orderNumber: order.orderNumber,
          method: order.payment.method,
          status: order.payment.status,
          amount: Number(order.payment.amount),
          paidAt: order.payment.paidAt,
          vendor: order.vendor?.stallName || "Vendor",
        })),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch payment history", error: error.message });
  }
};

export const getStudentNotifications = async (req, res) => {
  try {
    const orders = await findStudentOrders(req.user.id);
    const notifications = orders.flatMap((order) => {
      const vendor = order.vendor?.stallName || "vendor";
      const base = [
        {
          id: `${order.id}-confirmed`,
          type: "confirmation",
          title: "Order confirmed",
          message: `Order ${order.orderNumber} was received by ${vendor}.`,
          createdAt: order.createdAt,
          orderNumber: order.orderNumber,
        },
      ];

      if (["preparing", "ready", "picked_up"].includes(order.status)) {
        base.push({
          id: `${order.id}-preparing`,
          type: "preparing",
          title: "Food preparation update",
          message: `${vendor} is preparing order ${order.orderNumber}.`,
          createdAt: order.updatedAt,
          orderNumber: order.orderNumber,
        });
      }

      if (["ready", "picked_up"].includes(order.status)) {
        base.push({
          id: `${order.id}-ready`,
          type: "ready",
          title: "Food ready",
          message: `Order ${order.orderNumber} is ready for pickup.`,
          createdAt: order.updatedAt,
          orderNumber: order.orderNumber,
        });
      }

      return base;
    });

    res.status(200).json({
      notifications: notifications
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 20),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notifications", error: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await findOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (!(await canAccessOrder(req.user, order))) {
      return res.status(403).json({ message: "You do not have permission to view this order" });
    }

    res.status(200).json({ order: formatOrder(order) });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch order", error: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["pending", "preparing", "ready", "picked_up", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (!(await canAccessOrder(req.user, order))) {
      return res.status(403).json({ message: "You do not have permission to update this order" });
    }

    if (req.user.role === "student" && status !== "picked_up") {
      return res.status(403).json({ message: "Students can only confirm pickup" });
    }

    if (req.user.role === "vendor" && !["preparing", "ready", "picked_up", "cancelled"].includes(status)) {
      return res.status(403).json({ message: "Vendors cannot set that status" });
    }

    await order.update({
      status,
      pickedUpAt: status === "picked_up" ? new Date() : order.pickedUpAt,
    });

    const updatedOrder = await findOrderById(order.id);
    res.status(200).json({ order: formatOrder(updatedOrder) });
  } catch (error) {
    res.status(500).json({ message: "Failed to update order status", error: error.message });
  }
};
