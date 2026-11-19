import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Food, Topping } from "./types";

type CartState = {
  items: CartItem[];
  add: (food: Food, selectedToppings?: Topping[]) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const itemTotal = (item: CartItem) => (item.price + item.selectedToppings.reduce((sum, topping) => sum + topping.price, 0)) * item.quantity;
export const cartItemCount = (items: CartItem[]) => items.reduce((sum, item) => sum + item.quantity, 0);

export const useCart = create<CartState>()(persist((set) => ({
  items: [],
  add: (food, selectedToppings = []) => set((state) => {
    if (state.items.length && state.items[0].restaurantId._id !== food.restaurantId._id) throw new Error("Giỏ hàng chỉ nhận món từ một nhà hàng");
    const key = `${food._id}:${selectedToppings.map((item) => item.name).sort().join(",")}`;
    const existing = state.items.find((item) => `${item._id}:${item.selectedToppings.map((topping) => topping.name).sort().join(",")}` === key);
    return existing ? { items: state.items.map((item) => item === existing ? { ...item, quantity: item.quantity + 1 } : item) } : { items: [...state.items, { ...food, quantity: 1, selectedToppings }] };
  }),
  setQuantity: (id, quantity) => set((state) => ({ items: state.items.map((item) => item._id === id ? { ...item, quantity: Math.max(1, quantity) } : item) })),
  remove: (id) => set((state) => ({ items: state.items.filter((item) => item._id !== id) })),
  clear: () => set({ items: [] })
}), { name: "foodflow-cart" }));
