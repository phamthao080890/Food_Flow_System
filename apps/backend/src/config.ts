import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1).default("mongodb://127.0.0.1:27017/foodflow"),
  JWT_SECRET: z.string().min(16).default("development-secret-change-me"),
  CLIENT_URL: z.string().url().default("http://localhost:3000"),
  SMTP_HOST: z.string().default(""),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
  SMTP_FROM: z.string().default("FoodFlow <no-reply@example.com>")
});

export const config = schema.parse(process.env);
