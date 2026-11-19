export type RecommendationCandidate = {
  id: string;
  categoryId: string;
  restaurantId: string;
};

export type OrderInteraction = RecommendationCandidate & {
  quantity: number;
  createdAt: Date;
  status: string;
};

export type RankedRecommendation = {
  id: string;
  score: number;
  reason: string;
  signals: { repeat: number; category: number; restaurant: number; popularity: number };
};

const statusWeight: Record<string, number> = {
  Pending: 0.6,
  Confirmed: 0.75,
  Preparing: 0.85,
  Delivering: 0.95,
  Completed: 1
};

function normalize(value: number, maximum: number) {
  return maximum > 0 ? value / maximum : 0;
}

export function rankRecommendations(
  candidates: RecommendationCandidate[],
  interactions: OrderInteraction[],
  popularity: Record<string, number>,
  limit = 6,
  now = new Date()
): RankedRecommendation[] {
  const foodPreference = new Map<string, number>();
  const categoryPreference = new Map<string, number>();
  const restaurantPreference = new Map<string, number>();

  for (const interaction of interactions) {
    const daysAgo = Math.max(0, (now.getTime() - interaction.createdAt.getTime()) / 86_400_000);
    const recency = Math.exp(-daysAgo / 90);
    const weight = interaction.quantity * recency * (statusWeight[interaction.status] ?? 0.5);
    foodPreference.set(interaction.id, (foodPreference.get(interaction.id) ?? 0) + weight);
    categoryPreference.set(interaction.categoryId, (categoryPreference.get(interaction.categoryId) ?? 0) + weight);
    restaurantPreference.set(interaction.restaurantId, (restaurantPreference.get(interaction.restaurantId) ?? 0) + weight);
  }

  const maxFood = Math.max(0, ...foodPreference.values());
  const maxCategory = Math.max(0, ...categoryPreference.values());
  const maxRestaurant = Math.max(0, ...restaurantPreference.values());
  const maxPopularity = Math.max(0, ...Object.values(popularity));

  return candidates.map((candidate) => {
    const repeat = normalize(foodPreference.get(candidate.id) ?? 0, maxFood);
    const category = normalize(categoryPreference.get(candidate.categoryId) ?? 0, maxCategory);
    const restaurant = normalize(restaurantPreference.get(candidate.restaurantId) ?? 0, maxRestaurant);
    const popular = normalize(popularity[candidate.id] ?? 0, maxPopularity);
    const score = repeat * 5 + category * 3 + restaurant * 2 + popular * 1.5;

    let reason = "Món được nhiều khách lựa chọn";
    if (repeat >= 0.35) reason = "Bạn từng yêu thích món này";
    else if (category >= restaurant && category > 0) reason = "Hợp với danh mục bạn thường đặt";
    else if (restaurant > 0) reason = "Từ nhà hàng bạn thường lựa chọn";
    else if (popular === 0) reason = "Khám phá món mới trong thực đơn";

    return {
      id: candidate.id,
      score: Number(score.toFixed(4)),
      reason,
      signals: {
        repeat: Number(repeat.toFixed(3)),
        category: Number(category.toFixed(3)),
        restaurant: Number(restaurant.toFixed(3)),
        popularity: Number(popular.toFixed(3))
      }
    };
  }).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, limit);
}
