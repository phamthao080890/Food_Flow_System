import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";
import { config } from "./config.js";

export function auth(req: Request, res: Response, next: NextFunction) {
  const value = req.headers.authorization;
  if (!value?.startsWith("Bearer ")) return res.status(401).json({ message: "Authentication required" });
  try {
    req.user = jwt.verify(value.slice(7), config.JWT_SECRET) as NonNullable<Request["user"]>;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function staff(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !["staff", "admin"].includes(req.user.role)) return res.status(403).json({ message: "Staff permission required" });
  next();
}

export function customer(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "customer") return res.status(403).json({ message: "Customer permission required" });
  next();
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) return res.status(400).json({ message: "Invalid request data", errors: error.flatten().fieldErrors });
  console.error(error);
  const message = error instanceof Error ? error.message : "Unexpected server error";
  res.status(500).json({ message });
}
