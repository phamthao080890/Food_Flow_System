"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { safeReturnPath } from "@/lib/navigation";

const demoAccounts = [
  { role: "Customer", email: "user@gmail.com", password: "123456" },
  { role: "Staff", email: "admin@foodflow.com", password: "admin" }
] as const;

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [checkoutLogin, setCheckoutLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    setCheckoutLogin(new URLSearchParams(window.location.search).get("reason") === "checkout");
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await api<{ token: string; user: { role: string } }>(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({ name: form.get("name"), email: form.get("email"), password: form.get("password"), role: "customer" })
      });
      localStorage.setItem("token", result.token);
      localStorage.setItem("role", result.user.role);
      const fallback = result.user.role === "customer" ? "/" : "/staff";
      const next = result.user.role === "customer" ? safeReturnPath(new URLSearchParams(window.location.search).get("next"), fallback) : fallback;
      router.push(next);
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  return <div className="container">
    <div className="panel" style={{ maxWidth: 560, margin: "20px auto" }}>
      <div className="eyebrow">Tài khoản FoodFlow</div>
      <h1>{mode === "login" ? "Chào mừng trở lại" : "Tạo tài khoản"}</h1>
      {checkoutLogin && <p className="checkout-login-note">Giỏ hàng của bạn đã được giữ lại. Hãy đăng nhập hoặc đăng ký để tiếp tục thanh toán.</p>}
      {mode === "login" && <section className="demo-accounts" aria-labelledby="demo-accounts-title">
        <div className="demo-heading"><strong id="demo-accounts-title">Tài khoản kiểm thử</strong><span>Chỉ dùng cho môi trường demo</span></div>
        <div className="demo-account-list">{demoAccounts.map((account) => <article className="demo-account" key={account.role}>
          <div><span className="status">{account.role}</span><p><strong>Email</strong> <code>{account.email}</code></p><p><strong>Mật khẩu</strong> <code>{account.password}</code></p></div>
          <button className="button secondary demo-fill" type="button" onClick={() => { setEmail(account.email); setPassword(account.password); setError(""); }}>Điền vào form</button>
        </article>)}</div>
      </section>}
      {error && <p className="error">{error}</p>}
      <form className="form" onSubmit={submit}>
        {mode === "register" && <label>Họ tên<input className="input" name="name" minLength={2} required /></label>}
        <label>Email<input className="input" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label>Mật khẩu<input className="input" name="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={mode === "login" ? 1 : 8} required /></label>
        <button className="button" type="submit">{mode === "login" ? "Đăng nhập" : "Đăng ký"}</button>
      </form>
      <p><button className="button secondary" onClick={() => { setMode(mode === "login" ? "register" : "login"); setPassword(""); setError(""); }}>{mode === "login" ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}</button></p>
      {mode === "login" && <p><Link href="/forgot-password">Quên mật khẩu?</Link></p>}
    </div>
  </div>;
}
