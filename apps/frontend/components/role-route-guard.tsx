"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { roleRouteRedirect, type AppRole } from "@/lib/navigation";

export function RoleRouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checkedPath, setCheckedPath] = useState<string | null>(null);
  const requiresRoleCheck = pathname === "/" || pathname.startsWith("/staff");

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      const token = localStorage.getItem("token");
      let role: AppRole = null;

      if (token) {
        try {
          const user = await api<{ role: Exclude<AppRole, null> }>("/auth/me");
          if (!active || localStorage.getItem("token") !== token) return;
          role = user.role;
          localStorage.setItem("role", role);
        } catch {
          if (!active || localStorage.getItem("token") !== token) return;
          localStorage.removeItem("token");
          localStorage.removeItem("role");
        }
      }

      if (!active) return;
      const destination = roleRouteRedirect(pathname, role);
      if (destination) {
        router.replace(destination);
        return;
      }
      setCheckedPath(pathname);
    }

    void checkAccess();
    return () => { active = false; };
  }, [pathname, router]);

  if (requiresRoleCheck && checkedPath !== pathname) return <main><div className="container route-loading" role="status">Đang kiểm tra quyền truy cập…</div></main>;
  return <>{children}</>;
}
