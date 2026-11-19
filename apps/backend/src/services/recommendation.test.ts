import { describe, expect, it } from "vitest";
import { rankRecommendations } from "./recommendation.js";

const now = new Date("2026-09-06T00:00:00.000Z");
const candidates = [
  { id: "pho", categoryId: "noodles", restaurantId: "r1" },
  { id: "bun", categoryId: "noodles", restaurantId: "r2" },
  { id: "rice", categoryId: "rice", restaurantId: "r3" }
];

describe("hybrid recommendation ranking", () => {
  it("prioritizes repeat and category preferences from recent orders", () => {
    const ranked = rankRecommendations(candidates, [{ ...candidates[0]!, quantity: 2, createdAt: now, status: "Completed" }], { rice: 20 }, 3, now);
    expect(ranked.map((item) => item.id)).toEqual(["pho", "bun", "rice"]);
    expect(ranked[0]?.reason).toBe("Bạn từng yêu thích món này");
  });

  it("falls back to global popularity for a new customer", () => {
    const ranked = rankRecommendations(candidates, [], { rice: 12, bun: 5 }, 2, now);
    expect(ranked.map((item) => item.id)).toEqual(["rice", "bun"]);
    expect(ranked[0]?.signals.popularity).toBe(1);
  });

  it("reduces the influence of old interactions", () => {
    const recent = { ...candidates[1]!, quantity: 1, createdAt: now, status: "Completed" };
    const old = { ...candidates[0]!, quantity: 1, createdAt: new Date("2025-09-06T00:00:00.000Z"), status: "Completed" };
    const ranked = rankRecommendations(candidates, [old, recent], {}, 3, now);
    expect(ranked[0]?.id).toBe("bun");
  });
});
