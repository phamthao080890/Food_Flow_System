import { describe, expect, it } from "vitest";
import { calculateTotal, canTransition } from "./order.js";

describe("order rules", () => {
  it("calculates quantities and toppings", () => {
    expect(calculateTotal([{ price: 50000, quantity: 2, selectedToppings: [{ price: 10000 }] }])).toBe(120000);
  });

  it("allows only the defined workflow", () => {
    expect(canTransition("Pending", "Confirmed")).toBe(true);
    expect(canTransition("Pending", "Completed")).toBe(false);
    expect(canTransition("Completed", "Cancelled")).toBe(false);
  });
});

