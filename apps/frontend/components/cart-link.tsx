"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cartItemCount, useCart } from "@/lib/cart";

export function CartLink() {
  const items = useCart((state) => state.items);
  const [mounted, setMounted] = useState(false);
  const count = cartItemCount(items);

  useEffect(() => setMounted(true), []);

  return <Link href="/cart" className="cart-link" aria-label={mounted && count > 0 ? `Giỏ hàng, ${count} món` : "Giỏ hàng"}>
    <span>Giỏ hàng</span>
    {mounted && count > 0 && <span className="cart-badge" aria-hidden="true">{count > 99 ? "99+" : count}</span>}
  </Link>;
}
