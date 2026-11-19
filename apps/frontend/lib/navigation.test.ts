import { describe, expect, it } from "vitest";
import { homePathForRole, roleRouteRedirect, safeReturnPath } from "./navigation";

describe("safeReturnPath", () => {
  it("accepts an internal application path", () => {
    expect(safeReturnPath("/cart", "/")).toBe("/cart");
  });

  it("rejects absolute and protocol-relative redirects", () => {
    expect(safeReturnPath("https://example.com", "/")).toBe("/");
    expect(safeReturnPath("//example.com", "/")).toBe("/");
  });

  it("sends staff roles to the operations dashboard", () => {
    expect(homePathForRole("staff")).toBe("/staff");
    expect(homePathForRole("admin")).toBe("/staff");
    expect(homePathForRole("customer")).toBe("/");
    expect(homePathForRole(null)).toBe("/");
  });

  it("redirects role-incompatible root and staff routes", () => {
    expect(roleRouteRedirect("/", "staff")).toBe("/staff");
    expect(roleRouteRedirect("/", "admin")).toBe("/staff");
    expect(roleRouteRedirect("/staff", null)).toBe("/");
    expect(roleRouteRedirect("/staff/menu", "customer")).toBe("/");
    expect(roleRouteRedirect("/staff/menu", "staff")).toBeNull();
    expect(roleRouteRedirect("/cart", null)).toBeNull();
  });
});
