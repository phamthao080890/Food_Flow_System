import { Router } from "express";
import { z } from "zod";
import { auth, staff } from "../middleware.js";
import { Category, Food, Restaurant } from "../models.js";

const router = Router();

router.get("/restaurants", async (_req, res) => res.json(await Restaurant.find({ isActive: true }).sort("name")));
router.get("/categories", async (_req, res) => res.json(await Category.find({ isActive: true }).sort("name")));
router.get("/foods", async (req, res) => {
  const query: Record<string, unknown> = { isAvailable: true };
  if (req.query.category) query.categoryId = req.query.category;
  if (req.query.restaurant) query.restaurantId = req.query.restaurant;
  if (req.query.search) query.$text = { $search: String(req.query.search) };
  if (req.query.location) {
    const restaurants = await Restaurant.find({ location: new RegExp(String(req.query.location), "i") }).select("_id");
    query.restaurantId = { $in: restaurants.map((item) => item._id) };
  }
  res.json(await Food.find(query).populate("categoryId", "name").populate("restaurantId", "name location").sort("name"));
});

const restaurantInput = z.object({ name: z.string().min(2), address: z.string().min(3), location: z.string().min(2), phone: z.string().min(6), openingHours: z.string().optional(), image: z.string().optional() });
const categoryInput = z.object({ name: z.string().min(2), description: z.string().optional(), image: z.string().optional(), isActive: z.boolean().optional() });
const foodInput = z.object({ name: z.string().min(2), description: z.string().optional(), price: z.number().nonnegative(), image: z.string().optional(), categoryId: z.string(), restaurantId: z.string(), isAvailable: z.boolean().optional(), toppings: z.array(z.object({ name: z.string().min(1), price: z.number().nonnegative() })).optional() });

router.post("/restaurants", auth, staff, async (req, res) => res.status(201).json(await Restaurant.create(restaurantInput.parse(req.body))));
router.patch("/restaurants/:id", auth, staff, async (req, res) => res.json(await Restaurant.findByIdAndUpdate(req.params.id, restaurantInput.partial().parse(req.body), { new: true, runValidators: true })));
router.post("/categories", auth, staff, async (req, res) => res.status(201).json(await Category.create(categoryInput.parse(req.body))));
router.patch("/categories/:id", auth, staff, async (req, res) => res.json(await Category.findByIdAndUpdate(req.params.id, categoryInput.partial().parse(req.body), { new: true, runValidators: true })));
router.post("/foods", auth, staff, async (req, res) => res.status(201).json(await Food.create(foodInput.parse(req.body))));
router.patch("/foods/:id", auth, staff, async (req, res) => res.json(await Food.findByIdAndUpdate(req.params.id, foodInput.partial().parse(req.body), { new: true, runValidators: true })));
router.delete("/foods/:id", auth, staff, async (req, res) => { await Food.findByIdAndDelete(req.params.id); res.status(204).end(); });

export default router;

