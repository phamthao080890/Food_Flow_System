import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-navigation";
import { RoleRouteGuard } from "@/components/role-route-guard";
import "./globals.css";

export const metadata: Metadata = { title: "FoodFlow", description: "Đặt món nhanh, theo dõi thời gian thực" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>
    <SiteHeader />
    <RoleRouteGuard><main>{children}</main></RoleRouteGuard>
    <footer>FoodFlow · Hệ thống đặt món và quản lý nhà hàng thời gian thực</footer>
  </body></html>;
}
