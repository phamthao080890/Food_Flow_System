"use client";
import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
function ResetForm(){const params=useSearchParams();const [message,setMessage]=useState("");async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const form=new FormData(e.currentTarget);try{const result=await api<{message:string}>("/auth/reset-password",{method:"POST",body:JSON.stringify({token:params.get("token"),password:form.get("password")})});setMessage(result.message)}catch(error){setMessage((error as Error).message)}}return <div className="container"><section className="panel" style={{maxWidth:560,margin:"20px auto"}}><h1>Đặt lại mật khẩu</h1><form className="form" onSubmit={submit}><input className="input" name="password" type="password" minLength={8} required placeholder="Mật khẩu mới"/><button className="button">Cập nhật mật khẩu</button></form>{message&&<p className="success">{message}</p>}</section></div>}
export default function Reset(){return <Suspense fallback={<div className="container">Đang tải...</div>}><ResetForm/></Suspense>}
