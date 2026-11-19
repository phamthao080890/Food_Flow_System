"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, API_URL } from "@/lib/api";
import type { Food } from "@/lib/types";

type Named = { _id: string; name: string };
type Restaurant = Named & { location: string; address: string; phone: string };
type ImportResource = "foods" | "restaurants" | "categories";

const importLabels: Record<ImportResource, string> = {
  foods: "món ăn",
  restaurants: "nhà hàng",
  categories: "danh mục"
};

export default function MenuManagement() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [categories, setCategories] = useState<Named[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [message, setMessage] = useState("");

  const reload = () => Promise.all([
    api<Food[]>("/catalog/foods"),
    api<Named[]>("/catalog/categories"),
    api<Restaurant[]>("/catalog/restaurants")
  ]).then(([foodData, categoryData, restaurantData]) => {
    setFoods(foodData);
    setCategories(categoryData);
    setRestaurants(restaurantData);
  }).catch((error: Error) => setMessage(error.message));

  useEffect(() => { void reload(); }, []);

  async function createRestaurant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      await api("/catalog/restaurants", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      form.reset();
      setMessage("Đã thêm nhà hàng");
      void reload();
    } catch (error) { setMessage((error as Error).message); }
  }

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      await api("/catalog/categories", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      form.reset();
      setMessage("Đã thêm danh mục");
      void reload();
    } catch (error) { setMessage((error as Error).message); }
  }

  async function createFood(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    try {
      await api("/catalog/foods", { method: "POST", body: JSON.stringify({ ...data, price: Number(data.price), toppings: [] }) });
      form.reset();
      setMessage("Đã thêm món");
      void reload();
    } catch (error) { setMessage((error as Error).message); }
  }

  async function importCsv(event: FormEvent<HTMLFormElement>, resource: ImportResource) {
    event.preventDefault();
    const form = event.currentTarget;
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/import/${resource}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: new FormData(form)
      });
      const result = await response.json();
      if (!response.ok) {
        const details = Array.isArray(result.errors)
          ? result.errors.slice(0, 3).map((item: { row: number }) => `dòng ${item.row}`).join(", ")
          : "";
        throw new Error(`${result.message}${details ? ` (${details})` : ""}`);
      }
      form.reset();
      setMessage(`Đã nhập ${result.inserted} ${importLabels[resource]}`);
      void reload();
    } catch (error) { setMessage((error as Error).message); }
  }

  async function remove(id: string) {
    try {
      await api(`/catalog/foods/${id}`, { method: "DELETE" });
      setMessage("Đã xóa món");
      void reload();
    } catch (error) { setMessage((error as Error).message); }
  }

  return <div className="container">
    <div className="eyebrow">Menu Management</div>
    <h1>Nhà hàng và thực đơn</h1>
    <p className="muted">Khu vực dành cho nhân viên. Tài khoản phải có vai trò staff hoặc admin.</p>
    {message && <p className={message.startsWith("Đã") ? "success" : "error"}>{message}</p>}

    <div className="grid">
      <section className="panel">
        <h2>Thêm nhà hàng</h2>
        <form className="form" onSubmit={createRestaurant}>
          <input className="input" name="name" placeholder="Tên nhà hàng" required />
          <input className="input" name="address" placeholder="Địa chỉ" required />
          <input className="input" name="location" placeholder="Khu vực" required />
          <input className="input" name="phone" placeholder="Số điện thoại" required />
          <button className="button green">Lưu nhà hàng</button>
        </form>
      </section>
      <section className="panel">
        <h2>Thêm danh mục</h2>
        <form className="form" onSubmit={createCategory}>
          <input className="input" name="name" placeholder="Tên danh mục" required />
          <input className="input" name="description" placeholder="Mô tả" />
          <button className="button green">Lưu danh mục</button>
        </form>
      </section>
      <section className="panel">
        <h2>Thêm món</h2>
        <form className="form" onSubmit={createFood}>
          <input className="input" name="name" placeholder="Tên món" required />
          <input className="input" name="price" type="number" min="0" placeholder="Giá" required />
          <input className="input" name="description" placeholder="Mô tả" />
          <select className="select" name="categoryId" required><option value="">Danh mục</option>{categories.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select>
          <select className="select" name="restaurantId" required><option value="">Nhà hàng</option>{restaurants.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select>
          <button className="button">Thêm món</button>
        </form>
      </section>
    </div>

    <section className="import-section">
      <div className="section-title"><div><div className="eyebrow">CSV Import</div><h2>Nhập dữ liệu hàng loạt</h2></div><p className="muted">Tải file mẫu, điền dữ liệu bên dưới dòng tiêu đề và chọn “CSV UTF-8” khi lưu từ Excel. Hệ thống cũng hỗ trợ Windows-1258 và UTF-16.</p></div>
      <div className="grid">
        <ImportCard title="Nhà hàng" columns="name, address, location, phone, openingHours, image" template="/samples/restaurants-import-template.csv" onSubmit={(event) => importCsv(event, "restaurants")} />
        <ImportCard title="Danh mục" columns="name, description, image" template="/samples/categories-import-template.csv" onSubmit={(event) => importCsv(event, "categories")} />
        <ImportCard title="Món ăn" columns="name, description, price, category, restaurant, image" template="/samples/foods-import-template.csv" note="Tên danh mục và nhà hàng phải tồn tại trước." onSubmit={(event) => importCsv(event, "foods")} />
      </div>
    </section>

    <section><h2>Danh sách món ({foods.length})</h2><div className="stack">{foods.map((food) => <article className="panel row" key={food._id}><div><strong>{food.name}</strong><div className="muted">{food.restaurantId.name} · {food.categoryId.name} · {food.price.toLocaleString("vi-VN")} đ</div></div><button className="button secondary" onClick={() => remove(food._id)}>Xóa</button></article>)}</div></section>
  </div>;
}

function ImportCard({ title, columns, template, note, onSubmit }: { title: string; columns: string; template: string; note?: string; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <article className="panel import-card">
    <div className="row"><h3>{title}</h3><a className="template-link" href={template} download>Tải CSV mẫu</a></div>
    <p className="csv-columns">{columns}</p>
    {note && <p className="muted import-note">{note}</p>}
    <form className="form" onSubmit={onSubmit}>
      <input className="input" type="file" name="file" accept=".csv,text/csv" required />
      <button className="button green">Kiểm tra và nhập</button>
    </form>
  </article>;
}
