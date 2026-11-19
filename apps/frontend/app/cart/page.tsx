"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { itemTotal, useCart } from "@/lib/cart";
import type { Order } from "@/lib/types";

type CheckoutDraft = { address: string; phone: string; note: string };

const emptyDraft: CheckoutDraft = { address: "", phone: "", note: "" };
const draftKey = "foodflow-checkout-draft";

export default function CartPage() {
  const router = useRouter();
  const { items, setQuantity, remove, clear } = useCart();
  const [draft, setDraft] = useState<CheckoutDraft>(emptyDraft);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const total = items.reduce((sum, item) => sum + itemTotal(item), 0);

  useEffect(() => {
    setIsAuthenticated(Boolean(localStorage.getItem("token")));
    const saved = sessionStorage.getItem(draftKey);
    if (!saved) return;
    try {
      setDraft(JSON.parse(saved) as CheckoutDraft);
    } catch {
      sessionStorage.removeItem(draftKey);
    }
  }, []);

  const updateDraft = (field: keyof CheckoutDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const requireLogin = () => {
    sessionStorage.setItem(draftKey, JSON.stringify(draft));
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.push("/login?next=/cart&reason=checkout");
  };

  async function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    sessionStorage.setItem(draftKey, JSON.stringify(draft));

    if (!localStorage.getItem("token")) {
      requireLogin();
      return;
    }

    try {
      await api<Order>("/orders", {
        method: "POST",
        body: JSON.stringify({
          restaurantId: items[0]?.restaurantId._id,
          items: items.map((item) => ({ foodId: item._id, quantity: item.quantity, selectedToppings: item.selectedToppings })),
          shippingAddress: draft.address,
          phone: draft.phone,
          note: draft.note
        })
      });
      sessionStorage.removeItem(draftKey);
      clear();
      router.push("/orders");
    } catch (caught) {
      const message = (caught as Error).message;
      if (/authentication|invalid or expired token|jwt/i.test(message)) {
        requireLogin();
        return;
      }
      setError(message);
    }
  }

  return <div className="container">
    <div className="eyebrow">Giỏ hàng</div>
    <h1>Xác nhận đơn</h1>
    {error && <p className="error">{error}</p>}
    <div className="stack">
      {items.map((item) => <div className="panel row" key={item._id}>
        <div><strong>{item.name}</strong><div className="muted">{itemTotal(item).toLocaleString("vi-VN")} đ</div></div>
        <div className="row">
          <input className="input" style={{ width: 80 }} type="number" min={1} value={item.quantity} onChange={(event) => setQuantity(item._id, Number(event.target.value))} />
          <button className="button secondary" onClick={() => remove(item._id)}>Xóa</button>
        </div>
      </div>)}
    </div>
    {items.length ? <div className="panel">
      <p className="total">Tổng cộng {total.toLocaleString("vi-VN")} đ</p>
      {isAuthenticated ? <form className="form" onSubmit={checkout}>
        <label>Địa chỉ giao hàng<input name="address" className="input" required minLength={5} value={draft.address} onChange={(event) => updateDraft("address", event.target.value)} /></label>
        <label>Số điện thoại<input name="phone" className="input" required minLength={6} value={draft.phone} onChange={(event) => updateDraft("phone", event.target.value)} /></label>
        <label>Ghi chú<textarea name="note" className="input" rows={3} value={draft.note} onChange={(event) => updateDraft("note", event.target.value)} /></label>
        <button className="button green">Đặt hàng COD</button>
      </form> : <div className="form">
        <p className="muted checkout-note">Giỏ hàng của bạn sẽ được giữ nguyên. Hãy đăng nhập hoặc đăng ký để nhập thông tin giao hàng và tiếp tục thanh toán.</p>
        <button className="button green" type="button" onClick={requireLogin}>Đăng nhập để tiếp tục</button>
      </div>}
    </div> : <div className="panel">Giỏ hàng đang trống.</div>}
  </div>;
}
