export type OrderStatus = "Pending" | "Confirmed" | "Preparing" | "Delivering" | "Completed" | "Cancelled";

const transitions: Record<OrderStatus, OrderStatus[]> = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Preparing", "Cancelled"],
  Preparing: ["Delivering", "Cancelled"],
  Delivering: ["Completed"],
  Completed: [],
  Cancelled: []
};

export function canTransition(from: OrderStatus, to: OrderStatus) {
  return transitions[from].includes(to);
}

export function calculateTotal(items: Array<{ price: number; quantity: number; selectedToppings?: Array<{ price: number }> }>) {
  return items.reduce((sum, item) => sum + (item.price + (item.selectedToppings ?? []).reduce((s, topping) => s + topping.price, 0)) * item.quantity, 0);
}

