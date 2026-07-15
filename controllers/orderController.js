import sequelize from "../db/database.js";
import { getRolePrivileges } from "../config/accessControl.js";
import { Feedback, MenuItem, Order, OrderItem, Payment, User, Vendor, WalletTransaction } from "../model/index.js";
import { findVendorForUser } from "./vendorAccess.js";

const formatOrder = (order) => ({
  id: order.id,
  orderNumber: order.orderNumber,
  status: order.status,
  subtotal: Number(order.subtotal),
  total: Number(order.total),
  specialRequest: order.specialRequest,
  rejectionReason: order.rejectionReason,
  estimatedReadyAt: order.estimatedReadyAt,
  pickedUpAt: order.pickedUpAt,
  pickupDeadlineAt: order.pickupDeadlineAt,
  pickupLocation: order.vendor?.pickupLocation,
  vendor: order.vendor
    ? {
        id: order.vendor.id,
        name: order.vendor.stallName,
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
  feedback: order.feedback
    ? {
        rating: order.feedback.rating,
        comment: order.feedback.comment,
      }
    : null,
  items:
    order.items?.map((item) => ({
      id: item.id,
      menuItemId: item.menuItemId,
      name: item.menuItem?.name || "Item",
      imageLabel: item.menuItem?.imageLabel,
      imageUrl: item.menuItem?.imageUrl,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
    })) || [],
});

const formatUserWallet = (user) => ({
  id: user.id,
  name: user.name,
  studentId: user.studentId,
  email: user.email,
  role: user.role,
  status: user.status,
  walletBalance: Number(user.walletBalance || 0),
  privileges: getRolePrivileges(user.role),
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
      { model: Vendor, as: "vendor", attributes: ["id", "stallName", "pickupLocation"] },
      { model: Payment, as: "payment", attributes: ["id", "method", "status", "amount", "paidAt"] },
      { model: Feedback, as: "feedback", attributes: ["id", "rating", "comment"] },
      {
        model: OrderItem,
        as: "items",
        include: [{ model: MenuItem, as: "menuItem", attributes: ["name", "imageLabel", "imageUrl"] }],
      },
    ],
  });

const findStudentOrders = (studentId) =>
  Order.findAll({
    where: { studentId },
    include: [
      { model: Vendor, as: "vendor", attributes: ["id", "stallName", "pickupLocation"] },
      { model: Payment, as: "payment", attributes: ["id", "method", "status", "amount", "paidAt"] },
      { model: Feedback, as: "feedback", attributes: ["id", "rating", "comment"] },
      {
        model: OrderItem,
        as: "items",
        include: [{ model: MenuItem, as: "menuItem", attributes: ["name", "imageLabel", "imageUrl"] }],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

const canAccessOrder = async (user, order) => {
  if (user.role === "admin") return true;
  if (user.role === "student") return order.studentId === user.id;

  if (user.role === "vendor") {
    const vendor = await findVendorForUser(user);
    return vendor?.id === order.vendorCounterId;
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
      include: [{ model: Vendor, as: "vendor", attributes: ["id", "pickupLocation", "stallName", "serviceStatus"] }],
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

    const closedCounterItem = menuItems.find((item) => item.vendor?.serviceStatus === "closed");

    if (closedCounterItem) {
      await transaction.rollback();
      return res.status(400).json({
        message: `${closedCounterItem.vendor?.stallName || "This counter"} is closed and not accepting orders`,
      });
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

    const outOfStockItem = orderLines.find((line) => line.quantity > line.menuItem.stockQuantity);

    if (outOfStockItem) {
      await transaction.rollback();
      return res.status(400).json({
        message: `${outOfStockItem.menuItem.name} only has ${outOfStockItem.menuItem.stockQuantity} left`,
      });
    }

    const checkoutTotal = orderLines.reduce((sum, item) => sum + item.lineTotal, 0);

    if (paymentMethod === "ewallet" && Number(student.walletBalance) < checkoutTotal) {
      await transaction.rollback();
      return res.status(400).json({
        message: `Insufficient e-wallet balance. Balance: $${Number(student.walletBalance).toFixed(2)}, total: $${checkoutTotal.toFixed(2)}`,
      });
    }

    const orderLinesByCounter = new Map();

    for (const line of orderLines) {
      const vendorCounterId = line.menuItem.vendorCounterId;
      const currentLines = orderLinesByCounter.get(vendorCounterId) || [];
      currentLines.push(line);
      orderLinesByCounter.set(vendorCounterId, currentLines);
    }

    const orders = [];
    let walletRunningTotal = 0;

    for (const [vendorCounterId, counterLines] of orderLinesByCounter.entries()) {
      const subtotal = counterLines.reduce((sum, item) => sum + item.lineTotal, 0);
      const maxPrepTime = Math.max(...counterLines.map((item) => item.menuItem.prepTimeMinutes));
      const estimatedReadyAt = new Date(Date.now() + maxPrepTime * 60 * 1000);

      const order = await Order.create(
        {
          orderNumber: buildOrderNumber(),
          studentId: student.id,
          vendorCounterId,
          status: "pending",
          specialRequest: specialRequest?.trim() || null,
          subtotal,
          total: subtotal,
          estimatedReadyAt,
          stockReserved: true,
        },
        { transaction },
      );

      await OrderItem.bulkCreate(
        counterLines.map((line) => ({
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

      if (paymentMethod === "ewallet") {
        walletRunningTotal += subtotal;
        await WalletTransaction.create(
          {
            studentId: student.id,
            orderId: order.id,
            type: "payment",
            amount: subtotal,
            balanceAfter: Number(student.walletBalance) - walletRunningTotal,
            note: `Payment for ${order.orderNumber}`,
          },
          { transaction },
        );
      }

      orders.push(order);
    }

    await Promise.all(
      orderLines.map((line) =>
        line.menuItem.decrement("stockQuantity", {
          by: line.quantity,
          transaction,
        }),
      ),
    );

    if (paymentMethod === "ewallet") {
      await student.decrement("walletBalance", {
        by: checkoutTotal,
        transaction,
      });
    }

    await transaction.commit();

    const savedOrders = await Promise.all(orders.map((order) => findOrderById(order.id)));
    const formattedOrders = savedOrders.map(formatOrder);
    const updatedStudent = await User.findByPk(student.id);

    res.status(201).json({
      order: formattedOrders[0],
      orders: formattedOrders,
      orderCount: formattedOrders.length,
      user: formatUserWallet(updatedStudent),
    });
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
          title: "Order accepted",
          message: `${vendor} accepted order ${order.orderNumber} and is preparing it.`,
          createdAt: order.updatedAt,
          orderNumber: order.orderNumber,
        });
      }

      if (order.status === "cancelled") {
        const reason = order.rejectionReason ? ` Reason: ${order.rejectionReason}` : "";
        base.push({
          id: `${order.id}-cancelled`,
          type: "cancelled",
          title: "Order rejected",
          message: `${vendor} cannot prepare order ${order.orderNumber} in time.${reason} Please choose another item or vendor.`,
          createdAt: order.updatedAt,
          orderNumber: order.orderNumber,
        });
      }

      if (["ready", "picked_up"].includes(order.status)) {
        const deadline = order.pickupDeadlineAt ? new Date(order.pickupDeadlineAt) : null;
        const minutesLeft = deadline ? Math.ceil((deadline - new Date()) / 60000) : null;

        base.push({
          id: `${order.id}-ready`,
          type: "ready",
          title: "Food ready",
          message: deadline
            ? `Order ${order.orderNumber} is ready for pickup at ${vendor}. Please collect it by ${deadline.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`
            : `Order ${order.orderNumber} is ready for pickup.`,
          createdAt: order.updatedAt,
          orderNumber: order.orderNumber,
        });

        if (order.status === "ready" && minutesLeft !== null && minutesLeft <= 3 && minutesLeft > 0) {
          base.push({
            id: `${order.id}-pickup-reminder`,
            type: "pickup_reminder",
            title: "Pickup reminder",
            message: `Only ${minutesLeft} min left to pick up order ${order.orderNumber} at ${vendor}.`,
            createdAt: new Date(),
            orderNumber: order.orderNumber,
          });
        }

        if (order.status === "ready" && minutesLeft !== null && minutesLeft <= 0) {
          base.push({
            id: `${order.id}-pickup-overdue`,
            type: "pickup_overdue",
            title: "Pickup window ended",
            message: `The pickup window for order ${order.orderNumber} has ended. Please contact ${vendor}.`,
            createdAt: new Date(),
            orderNumber: order.orderNumber,
          });
        }
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

export const submitOrderFeedback = async (req, res) => {
  try {
    const rating = Number(req.body.rating);
    const comment = req.body.comment?.trim() || null;

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (req.user.role !== "student" || order.studentId !== req.user.id) {
      return res.status(403).json({ message: "You can only submit feedback for your own order" });
    }

    if (order.status !== "picked_up") {
      return res.status(400).json({ message: "Feedback can only be submitted after pickup" });
    }

    const [feedback, created] = await Feedback.findOrCreate({
      where: { orderId: order.id },
      defaults: {
        orderId: order.id,
        rating,
        comment,
      },
    });

    if (!created) {
      await feedback.update({ rating, comment });
    }

    res.status(200).json({
      message: "Feedback saved.",
      feedback: {
        id: feedback.id,
        orderId: feedback.orderId,
        rating: feedback.rating,
        comment: feedback.comment,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to submit feedback", error: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const rejectionReason = req.body.reason?.trim() || req.body.rejectionReason?.trim() || null;
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

    if (req.user.role === "vendor") {
      if (req.user.vendorStaffType === "chef" && status !== "ready") {
        return res.status(403).json({ message: "Chef accounts can only mark accepted orders as ready" });
      }

      if (req.user.vendorStaffType !== "chef" && !["preparing", "cancelled"].includes(status)) {
        return res.status(403).json({ message: "Cashier accounts can only accept or reject pending orders" });
      }
    }

    if (status === "cancelled" && !rejectionReason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    if (status === "cancelled" && order.status !== "pending") {
      return res.status(400).json({ message: "Only pending orders can be rejected" });
    }

    if (status === "preparing" && order.status !== "pending") {
      return res.status(400).json({ message: "Only pending orders can be accepted" });
    }

    if (status === "ready" && order.status !== "preparing") {
      return res.status(400).json({ message: "Only accepted orders can be marked ready" });
    }

    if (status === "picked_up" && order.status !== "ready") {
      return res.status(400).json({ message: "Only ready orders can be marked picked up" });
    }

    if (status === "cancelled") {
      const transaction = await sequelize.transaction();

      try {
        if (order.stockReserved) {
          const orderItems = await OrderItem.findAll({
            where: { orderId: order.id },
            transaction,
          });

          await Promise.all(
            orderItems.map((item) =>
              MenuItem.increment("stockQuantity", {
                by: item.quantity,
                where: { id: item.menuItemId },
                transaction,
              }),
            ),
          );
        }

        const payment = await Payment.findOne({
          where: { orderId: order.id },
          transaction,
        });

        const updates = [
          order.update(
            {
              status,
              stockReserved: false,
              rejectionReason,
            },
            { transaction },
          ),
        ];

        if (payment) {
          updates.push(payment.update({ status: "refunded" }, { transaction }));

          if (payment.method === "ewallet") {
            const refundStudent = await User.findByPk(order.studentId, { transaction });
            const refundAmount = Number(payment.amount);
            const balanceAfter = Number(refundStudent.walletBalance || 0) + refundAmount;

            updates.push(refundStudent.update({ walletBalance: balanceAfter }, { transaction }));
            updates.push(WalletTransaction.create(
              {
                studentId: order.studentId,
                cashierId: req.user.role === "vendor" ? req.user.id : null,
                orderId: order.id,
                type: "refund",
                amount: refundAmount,
                balanceAfter,
                note: `Refund for ${order.orderNumber}`,
              },
              { transaction },
            ));
          }
        }

        await Promise.all(updates);

        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } else {
      await order.update({
        status,
        pickedUpAt: status === "picked_up" ? new Date() : order.pickedUpAt,
        pickupDeadlineAt: status === "ready" ? new Date(Date.now() + 10 * 60 * 1000) : order.pickupDeadlineAt,
      });
    }

    const updatedOrder = await findOrderById(order.id);
    res.status(200).json({ order: formatOrder(updatedOrder) });
  } catch (error) {
    res.status(500).json({ message: "Failed to update order status", error: error.message });
  }
};
