import { Router } from "express";
import type { Server } from "socket.io";
import { z } from "zod";
import { auth, customer, staff } from "../middleware.js";
import { Food, Order } from "../models.js";
import { calculateTotal, canTransition, type OrderStatus } from "../services/order.js";

const itemInput = z.object({ foodId: z.string(), quantity: z.number().int().min(1).max(99), selectedToppings: z.array(z.object({ name: z.string(), price: z.number().nonnegative() })).default([]) });
const createInput = z.object({ restaurantId: z.string(), items: z.array(itemInput).min(1), shippingAddress: z.string().min(5), phone: z.string().min(6), note: z.string().max(500).optional() });

export function orderRoutes(io: Server) {
  const router = Router();
  router.use(auth);

  router.post("/", customer, async (req, res) => {
    const input = createInput.parse(req.body);
    const foods = await Food.find({ _id: { $in: input.items.map((item) => item.foodId) }, restaurantId: input.restaurantId, isAvailable: true });
    if (foods.length !== new Set(input.items.map((item) => item.foodId)).size) return res.status(400).json({ message: "One or more menu items are unavailable" });
    const items = input.items.map((requested) => {
      const food = foods.find((candidate) => candidate.id === requested.foodId)!;
      const selectedToppings = requested.selectedToppings.filter((selected) => food.toppings.some((available) => available.name === selected.name && available.price === selected.price));
      return { foodId: food._id, name: food.name, price: food.price, quantity: requested.quantity, selectedToppings };
    });
    const order = await Order.create({ ...input, customerId: req.user!.id, items, totalAmount: calculateTotal(items) });
    io.to(`restaurant:${input.restaurantId}`).emit("NEW_ORDER_NOTIFY", order);
    res.status(201).json(order);
  });

  router.get("/mine", customer, async (req, res) => res.json(await Order.find({ customerId: req.user!.id }).sort("-createdAt")));
  router.get("/", staff, async (req, res) => {
    const query = req.query.restaurant ? { restaurantId: req.query.restaurant } : {};
    res.json(await Order.find(query).populate("customerId", "name phone").sort("-createdAt"));
  });
  router.patch("/:id/status", staff, async (req, res) => {
    const { status } = z.object({ status: z.enum(["Pending", "Confirmed", "Preparing", "Delivering", "Completed", "Cancelled"]) }).parse(req.body);
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!canTransition(order.status as OrderStatus, status)) return res.status(409).json({ message: `Cannot change ${order.status} to ${status}` });
    order.status = status;
    await order.save();
    io.to(`order:${order.id}`).emit("ORDER_STATUS_UPDATED", order);
    io.to(`user:${order.customerId}`).emit("ORDER_STATUS_UPDATED", order);
    res.json(order);
  });
  return router;
}
