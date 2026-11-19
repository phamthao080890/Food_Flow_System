import http from "node:http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { createApp } from "./app.js";
import { config } from "./config.js";

const httpServer = http.createServer();
const io = new Server({ cors: { origin: config.CLIENT_URL, credentials: true } });
const app = createApp(io);
httpServer.on("request", app);
// Attach Socket.IO after Express so Engine.IO can route its own requests and
// delegate every other HTTP request to the existing Express listener once.
io.attach(httpServer);

io.use((socket, next) => {
  try {
    socket.data.user = jwt.verify(String(socket.handshake.auth.token ?? ""), config.JWT_SECRET);
    next();
  } catch { next(new Error("Authentication required")); }
});
io.on("connection", (socket) => {
  const user = socket.data.user as { id: string; role: string };
  socket.join(`user:${user.id}`);
  socket.on("join:order", (orderId: string) => socket.join(`order:${orderId}`));
  socket.on("join:restaurant", (restaurantId: string) => {
    if (["staff", "admin"].includes(user.role)) socket.join(`restaurant:${restaurantId}`);
  });
});

await mongoose.connect(config.MONGODB_URI);
httpServer.listen(config.PORT, () => console.log(`FoodFlow API listening on ${config.PORT}`));
