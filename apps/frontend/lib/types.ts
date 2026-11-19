export type Topping = { name: string; price: number };
export type Food = {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  toppings: Topping[];
  categoryId: { _id: string; name: string };
  restaurantId: { _id: string; name: string; location: string };
};
export type RecommendedFood = Food & {
  recommendation: {
    score: number;
    reason: string;
    signals: { repeat: number; category: number; restaurant: number; popularity: number };
  };
};
export type CartItem = Food & { quantity: number; selectedToppings: Topping[] };
export type Order = { _id: string; restaurantId: string; items: Array<{ name: string; price: number; quantity: number }>; totalAmount: number; shippingAddress: string; phone: string; status: string; createdAt: string };
