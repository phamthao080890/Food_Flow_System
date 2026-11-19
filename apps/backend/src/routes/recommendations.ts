import { Router } from "express";
import { auth } from "../middleware.js";
import { Food, Order } from "../models.js";
import { rankRecommendations, type OrderInteraction, type RecommendationCandidate } from "../services/recommendation.js";

type FoodReference = { _id: unknown; categoryId: unknown; restaurantId: unknown };
type HistoryOrder = {
  restaurantId: unknown;
  status: string;
  createdAt: Date;
  items: Array<{ foodId: unknown; quantity: number }>;
};

const router = Router();
router.use(auth);

router.get("/", async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 6, 1), 12);
  const [candidateRows, historyRows, popularityRows] = await Promise.all([
    Food.find({ isAvailable: true }).select("_id categoryId restaurantId").lean(),
    Order.find({ customerId: req.user!.id, status: { $ne: "Cancelled" } }).sort("-createdAt").limit(100).select("restaurantId status createdAt items.foodId items.quantity").lean(),
    Order.aggregate<{ _id: unknown; quantity: number }>([
      { $match: { status: { $ne: "Cancelled" } } },
      { $unwind: "$items" },
      { $group: { _id: "$items.foodId", quantity: { $sum: "$items.quantity" } } },
      { $sort: { quantity: -1 } },
      { $limit: 200 }
    ])
  ]);

  const foodIds = [...new Set((historyRows as unknown as HistoryOrder[]).flatMap((order) => order.items.map((item) => String(item.foodId))))];
  const preferenceFoods = await Food.find({ _id: { $in: foodIds } }).select("_id categoryId restaurantId").lean();
  const preferenceIndex = new Map((preferenceFoods as unknown as FoodReference[]).map((food) => [String(food._id), food]));

  const interactions: OrderInteraction[] = (historyRows as unknown as HistoryOrder[]).flatMap((order) => order.items.flatMap((item) => {
    const food = preferenceIndex.get(String(item.foodId));
    if (!food) return [];
    return [{ id: String(item.foodId), categoryId: String(food.categoryId), restaurantId: String(order.restaurantId), quantity: item.quantity, createdAt: new Date(order.createdAt), status: order.status }];
  }));
  const candidates: RecommendationCandidate[] = (candidateRows as unknown as FoodReference[]).map((food) => ({ id: String(food._id), categoryId: String(food.categoryId), restaurantId: String(food.restaurantId) }));
  const popularity = Object.fromEntries(popularityRows.map((row) => [String(row._id), row.quantity]));
  const ranked = rankRecommendations(candidates, interactions, popularity, limit);

  const foods = await Food.find({ _id: { $in: ranked.map((item) => item.id) } })
    .populate("categoryId", "name")
    .populate("restaurantId", "name location")
    .lean();
  const foodIndex = new Map(foods.map((food) => [String(food._id), food]));
  res.json(ranked.flatMap((item) => {
    const food = foodIndex.get(item.id);
    return food ? [{ ...food, recommendation: { score: item.score, reason: item.reason, signals: item.signals } }] : [];
  }));
});

export default router;
