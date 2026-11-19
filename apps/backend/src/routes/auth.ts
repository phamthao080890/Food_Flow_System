import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import nodemailer from "nodemailer";
import { z } from "zod";
import { config } from "../config.js";
import { auth } from "../middleware.js";
import { User } from "../models.js";

const router = Router();
const registerSchema = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(8) });
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

function tokenFor(user: { _id: unknown; role: string }) {
  return jwt.sign({ id: String(user._id), role: user.role }, config.JWT_SECRET, { expiresIn: "7d" });
}

router.post("/register", async (req, res) => {
  const input = registerSchema.parse(req.body);
  if (await User.exists({ email: input.email })) return res.status(409).json({ message: "Email already exists" });
  const user = await User.create({ ...input, role: "customer", password: await bcrypt.hash(input.password, 12) });
  res.status(201).json({ token: tokenFor(user), user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.post("/login", async (req, res) => {
  const input = loginSchema.parse(req.body);
  const user = await User.findOne({ email: input.email }).select("+password");
  if (!user || !(await bcrypt.compare(input.password, user.password))) return res.status(401).json({ message: "Email or password is incorrect" });
  res.json({ token: tokenFor(user), user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.post("/forgot-password", async (req, res) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);
  const user = await User.findOne({ email });
  if (!user) return res.json({ message: "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi." });
  const resetToken = crypto.randomBytes(32).toString("hex");
  user.set({ resetPasswordToken: crypto.createHash("sha256").update(resetToken).digest("hex"), resetPasswordExpires: new Date(Date.now() + 30 * 60 * 1000) });
  await user.save();
  const resetUrl = `${config.CLIENT_URL}/reset-password?token=${resetToken}`;
  if (config.SMTP_HOST) {
    const transport = nodemailer.createTransport({ host: config.SMTP_HOST, port: config.SMTP_PORT, secure: config.SMTP_PORT === 465, auth: { user: config.SMTP_USER, pass: config.SMTP_PASS } });
    await transport.sendMail({ from: config.SMTP_FROM, to: user.email, subject: "Đặt lại mật khẩu FoodFlow", text: `Liên kết có hiệu lực 30 phút: ${resetUrl}` });
  }
  res.json({ message: "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi.", ...(config.NODE_ENV === "development" && !config.SMTP_HOST ? { resetUrl } : {}) });
});

router.post("/reset-password", async (req, res) => {
  const input = z.object({ token: z.string().min(32), password: z.string().min(8) }).parse(req.body);
  const hash = crypto.createHash("sha256").update(input.token).digest("hex");
  const user = await User.findOne({ resetPasswordToken: hash, resetPasswordExpires: { $gt: new Date() } }).select("+resetPasswordToken +resetPasswordExpires +password");
  if (!user) return res.status(400).json({ message: "Liên kết không hợp lệ hoặc đã hết hạn" });
  user.password = await bcrypt.hash(input.password, 12);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  res.json({ message: "Mật khẩu đã được cập nhật" });
});

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user!.id);
  res.json(user);
});

router.patch("/me", auth, async (req, res) => {
  const allowed = z.object({ name: z.string().min(2).optional(), phone: z.string().optional(), address: z.string().optional(), avatar: z.string().url().or(z.literal("")).optional() }).parse(req.body);
  const user = await User.findByIdAndUpdate(req.user!.id, allowed, { new: true, runValidators: true });
  res.json(user);
});

export default router;
