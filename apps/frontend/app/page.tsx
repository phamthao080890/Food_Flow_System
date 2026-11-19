"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useCart } from "@/lib/cart";
import type { Food, RecommendedFood } from "@/lib/types";

type Category = { _id: string; name: string };

function FoodCard({ food, reason, onAdd }: { food: Food; reason?: string; onAdd: (food: Food) => void }) {
  return <article className="card">
    <div className="food-image">{food.image ? <img src={food.image} alt={food.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🍜"}</div>
    <div className="card-body">
      <div className="meta">{food.categoryId.name} · {food.restaurantId.name}</div>
      <h3>{food.name}</h3>
      {reason && <p className="ai-reason"><span aria-hidden="true">✦</span> {reason}</p>}
      <p className="muted">{food.description}</p>
      <div className="row"><span className="price">{food.price.toLocaleString("vi-VN")} đ</span><button className="button" onClick={() => onAdd(food)}>Thêm món</button></div>
    </div>
  </article>;
}

export default function Home() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedFood[]>([]);
  const [recommendationError, setRecommendationError] = useState("");
  const [hasAccount, setHasAccount] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const add = useCart((state) => state.add);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setHasAccount(Boolean(token));
    Promise.all([
      api<Food[]>("/catalog/foods"),
      api<Category[]>("/catalog/categories")
    ]).then(([foodData, categoryData]) => {
      setFoods(foodData);
      setCategories(categoryData);
    }).catch((error: Error) => setMessage(error.message));

    if (token) {
      api<RecommendedFood[]>("/recommendations?limit=6")
        .then(setRecommendations)
        .catch((error: Error) => {
          setRecommendationError(error.message);
          if (/authentication|token|jwt/i.test(error.message)) {
            localStorage.removeItem("token");
            setHasAccount(false);
          }
        });
    }
  }, []);

  const visible = useMemo(() => foods.filter((food) =>
    (!search || food.name.toLowerCase().includes(search.toLowerCase())) &&
    (!category || food.categoryId._id === category) &&
    (!location || food.restaurantId.location.toLowerCase().includes(location.toLowerCase()))
  ), [foods, search, category, location]);

  const addFood = (food: Food) => {
    try {
      add(food);
      setMessage("Đã thêm vào giỏ hàng");
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  return <div className="container">
    <section className="hero"><div><div className="eyebrow">Đặt món theo cách nhẹ nhàng hơn</div><h1>Món ngon đang chờ bạn.</h1></div><p>Khám phá thực đơn, đặt món trong vài phút và theo dõi từng bước chuẩn bị theo thời gian thực.</p></section>
    <section className="recommendations" aria-labelledby="recommendation-title">
      <div className="section-heading"><div><span className="ai-badge">AI cá nhân hóa</span><h2 id="recommendation-title">Gợi ý cho bạn</h2></div><p>Mô hình kết hợp món, danh mục, nhà hàng, độ mới của đơn và xu hướng toàn hệ thống.</p></div>
      {hasAccount && recommendations.length > 0
        ? <div className="grid recommendation-grid">{recommendations.map((food) => <FoodCard key={food._id} food={food} reason={food.recommendation.reason} onAdd={addFood} />)}</div>
        : <div className="recommendation-empty">{hasAccount
          ? recommendationError ? `Không thể tải gợi ý lúc này: ${recommendationError}` : "Hệ thống đang cần thêm dữ liệu món để tạo gợi ý."
          : <>Đăng nhập và đặt món để AI học sở thích của bạn. <a href="/login">Đăng nhập ngay</a>.</>}</div>}
    </section>
    <section className="filters"><input className="input" placeholder="Tìm món ăn..." value={search} onChange={(event) => setSearch(event.target.value)} /><select className="select" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Tất cả danh mục</option>{categories.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select><input className="input" placeholder="Khu vực" value={location} onChange={(event) => setLocation(event.target.value)} /></section>
    {message && <p className={message.startsWith("Đã") ? "success" : "error"}>{message}</p>}
    <section className="grid">{visible.map((food) => <FoodCard key={food._id} food={food} onAdd={addFood} />)}</section>
    {!message && visible.length === 0 && <div className="panel">Chưa có món phù hợp. Nhân viên có thể thêm thực đơn qua API hoặc CSV.</div>}
  </div>;
}
