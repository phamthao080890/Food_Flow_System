import { describe, expect, it } from "vitest";
import { cartItemCount, itemTotal } from "./cart";

describe("cart", () => {
  it("calculates a line total", () => {
    expect(itemTotal({ price: 40000, quantity: 2, selectedToppings: [{ name: "Trứng", price: 10000 }] } as never)).toBe(100000);
  });

  it("counts all portions in the cart", () => {
    expect(cartItemCount([{ quantity: 2 }, { quantity: 3 }] as never)).toBe(5);
  });
});
