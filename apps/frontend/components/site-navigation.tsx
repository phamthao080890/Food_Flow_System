"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CartLink } from "@/components/cart-link";
import { api } from "@/lib/api";
import { homePathForRole, type AppRole } from "@/lib/navigation";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<AppRole>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");
    if (!token) {
      setRole(null);
      return;
    }
    setRole(["customer", "staff", "admin"].includes(storedRole ?? "") ? storedRole as AppRole : null);
    api<{ role: "customer" | "staff" | "admin" }>("/auth/me")
      .then((user) => {
        if (localStorage.getItem("token") !== token) return;
        localStorage.setItem("role", user.role);
        setRole(user.role);
      })
      .catch(() => {
        if (localStorage.getItem("token") !== token) return;
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        setRole(null);
      });
  }, [pathname]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setRole(null);
    router.push("/");
  };

  const openRoleHome = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const storedRole = localStorage.getItem("token") ? localStorage.getItem("role") as AppRole : null;
    const destination = homePathForRole(storedRole);
    if (destination !== homePathForRole(role)) {
      event.preventDefault();
      router.push(destination);
    }
  };

  const brand = <Link href={homePathForRole(role)} className="brand" onClick={openRoleHome}>Food<span>Flow</span></Link>;

  if (role === "staff" || role === "admin") {
    return <header className="site-header">{brand}<nav aria-label="Điều hướng nhân viên">
        <Link href="/staff">Đơn nhà hàng</Link>
        <Link href="/staff/menu">Quản lý thực đơn</Link>
        <button className="nav-button" type="button" onClick={logout}>Đăng xuất</button>
      </nav></header>;
  }

  return <header className="site-header">{brand}<nav aria-label="Điều hướng khách hàng">
      <Link href="/">Thực đơn</Link>
      {role === "customer" ? <>
        <Link href="/orders">Đơn của tôi</Link>
        <button className="nav-button" type="button" onClick={logout}>Đăng xuất</button>
      </> : <Link href="/login">Đăng nhập</Link>}
      <CartLink />
    </nav></header>;
}
