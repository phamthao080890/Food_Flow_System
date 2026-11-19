"use client";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { api } from "@/lib/api";
import type { Order } from "@/lib/types";

export default function OrdersPage(){const [orders,setOrders]=useState<Order[]>([]);const [error,setError]=useState("");useEffect(()=>{api<Order[]>("/orders/mine").then(setOrders).catch(err=>setError(err.message));const token=localStorage.getItem("token");if(!token)return;const socket=io(process.env.NEXT_PUBLIC_SOCKET_URL??"http://localhost:4000",{auth:{token}});socket.on("ORDER_STATUS_UPDATED",(updated:Order)=>setOrders(current=>current.map(order=>order._id===updated._id?updated:order)));return()=>{socket.disconnect()}},[]);return <div className="container"><div className="eyebrow">Cập nhật thời gian thực</div><h1>Đơn của tôi</h1>{error&&<p className="error">{error}</p>}<div className="stack">{orders.map(order=><article className="panel order" key={order._id}><div className="row"><strong>Đơn #{order._id.slice(-6).toUpperCase()}</strong><span className="status">{order.status}</span></div><p>{order.items.map(item=>`${item.quantity}× ${item.name}`).join(", ")}</p><p className="muted">Giao đến {order.shippingAddress}</p><div className="total">{order.totalAmount.toLocaleString("vi-VN")} đ</div></article>)}{!error&&!orders.length&&<div className="panel">Bạn chưa có đơn hàng.</div>}</div></div>}

