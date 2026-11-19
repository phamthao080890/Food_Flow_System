export function safeReturnPath(value: string | null, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

export type AppRole = "customer" | "staff" | "admin" | null;

export function homePathForRole(role: AppRole) {
  return role === "staff" || role === "admin" ? "/staff" : "/";
}

export function roleRouteRedirect(pathname: string, role: AppRole) {
  const isStaff = role === "staff" || role === "admin";
  const isStaffPage = pathname === "/staff" || pathname.startsWith("/staff/");
  if (isStaff && pathname === "/") return "/staff";
  if (!isStaff && isStaffPage) return "/";
  return null;
}
