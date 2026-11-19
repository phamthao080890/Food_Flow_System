import express from "express";
import cors from "cors";
import helmet from "helmet";
import type { Server } from "socket.io";
import { config } from "./config.js";
import { errorHandler } from "./middleware.js";
import authRoutes from "./routes/auth.js";
import catalogRoutes from "./routes/catalog.js";
import importRoutes from "./routes/import.js";
import { orderRoutes } from "./routes/orders.js";
import recommendationRoutes from "./routes/recommendations.js";

export function createApp(io: Server) {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: config.CLIENT_URL, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "foodflow-api" }));
  app.use("/api/auth", authRoutes);
  app.use("/api/catalog", catalogRoutes);
  app.use("/api/orders", orderRoutes(io));
  app.use("/api/recommendations", recommendationRoutes);
  app.use("/api/import", importRoutes);
  app.use((_req, res) => res.status(404).json({ message: "Route not found" }));
  app.use(errorHandler);
  return app;
}
