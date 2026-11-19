import { Router } from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { z } from "zod";
import { auth, staff } from "../middleware.js";
import { Category, Food, Restaurant } from "../models.js";
import { cleanCsvText, decodeCsv } from "../services/csv.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });
const normalize = (value: string) => cleanCsvText(value).toLocaleLowerCase("vi");

function parseCsv(buffer: Buffer) {
  return parse(decodeCsv(buffer), { bom: true, columns: true, skip_empty_lines: true, trim: true }) as unknown[];
}

function validateRows<T>(raw: unknown[], schema: z.ZodType<T>) {
  if (!raw.length) return { errors: [{ row: 2, errors: { file: ["CSV must contain at least one data row"] } }], rows: [] as T[] };
  const parsed = raw.map((row, index) => ({ index: index + 2, result: schema.safeParse(row) }));
  const errors = parsed
    .filter((item) => !item.result.success)
    .map((item) => ({ row: item.index, errors: item.result.error?.flatten().fieldErrors }));
  return { errors, rows: parsed.filter((item) => item.result.success).map((item) => item.result.data as T) };
}

function duplicateNames(names: string[]) {
  return names.filter((name, index) => names.findIndex((candidate) => normalize(candidate) === normalize(name)) !== index);
}

const restaurantRow = z.object({
  name: z.string().min(2),
  address: z.string().min(3),
  location: z.string().min(2),
  phone: z.string().min(6),
  openingHours: z.string().default(""),
  image: z.string().default("")
});

const categoryRow = z.object({
  name: z.string().min(2),
  description: z.string().default(""),
  image: z.string().default("")
});

const foodRow = z.object({
  name: z.string().min(2),
  description: z.string().default(""),
  price: z.coerce.number().nonnegative(),
  category: z.string().default(""),
  restaurant: z.string().default(""),
  categoryId: z.string().default(""),
  restaurantId: z.string().default(""),
  image: z.string().default("")
}).superRefine((row, context) => {
  if (!row.category && !row.categoryId) context.addIssue({ code: "custom", path: ["category"], message: "Category name or categoryId is required" });
  if (!row.restaurant && !row.restaurantId) context.addIssue({ code: "custom", path: ["restaurant"], message: "Restaurant name or restaurantId is required" });
});

router.post("/restaurants", auth, staff, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "CSV file is required" });
  const validated = validateRows(parseCsv(req.file.buffer), restaurantRow);
  if (validated.errors.length) return res.status(422).json({ message: "CSV validation failed", errors: validated.errors });
  const duplicates = duplicateNames(validated.rows.map((row) => row.name));
  const existing = await Restaurant.find().select("name").lean();
  const existingNames = new Set(existing.map((item) => normalize(item.name)));
  const alreadyExists = validated.rows.filter((row) => existingNames.has(normalize(row.name))).map((row) => row.name);
  if (duplicates.length || alreadyExists.length) return res.status(422).json({ message: "Restaurant names must be unique", duplicateNames: [...new Set([...duplicates, ...alreadyExists])] });
  const rows = validated.rows.map((row) => ({
    ...row,
    name: cleanCsvText(row.name),
    address: cleanCsvText(row.address),
    location: cleanCsvText(row.location),
    openingHours: cleanCsvText(row.openingHours || "08:00-22:00"),
    isActive: true
  }));
  const inserted = await Restaurant.insertMany(rows, { ordered: true });
  res.status(201).json({ inserted: inserted.length });
});

router.post("/categories", auth, staff, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "CSV file is required" });
  const validated = validateRows(parseCsv(req.file.buffer), categoryRow);
  if (validated.errors.length) return res.status(422).json({ message: "CSV validation failed", errors: validated.errors });
  const duplicates = duplicateNames(validated.rows.map((row) => row.name));
  const existing = await Category.find().select("name").lean();
  const existingNames = new Set(existing.map((item) => normalize(item.name)));
  const alreadyExists = validated.rows.filter((row) => existingNames.has(normalize(row.name))).map((row) => row.name);
  if (duplicates.length || alreadyExists.length) return res.status(422).json({ message: "Category names must be unique", duplicateNames: [...new Set([...duplicates, ...alreadyExists])] });
  const inserted = await Category.insertMany(validated.rows.map((row) => ({ ...row, name: cleanCsvText(row.name), description: cleanCsvText(row.description ?? ""), isActive: true })), { ordered: true });
  res.status(201).json({ inserted: inserted.length });
});

router.post("/foods", auth, staff, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "CSV file is required" });
  const validated = validateRows(parseCsv(req.file.buffer), foodRow);
  if (validated.errors.length) return res.status(422).json({ message: "CSV validation failed", errors: validated.errors });

  const [categories, restaurants] = await Promise.all([
    Category.find({ isActive: true }).select("_id name").lean(),
    Restaurant.find({ isActive: true }).select("_id name").lean()
  ]);
  const categoryById = new Map(categories.map((item) => [String(item._id), item]));
  const categoryByName = new Map(categories.map((item) => [normalize(item.name), item]));
  const restaurantById = new Map(restaurants.map((item) => [String(item._id), item]));
  const restaurantByName = new Map(restaurants.map((item) => [normalize(item.name), item]));
  const resolved = validated.rows.map((row, index) => ({
    row: index + 2,
    input: row,
    category: row.categoryId ? categoryById.get(row.categoryId) : categoryByName.get(normalize(row.category ?? "")),
    restaurant: row.restaurantId ? restaurantById.get(row.restaurantId) : restaurantByName.get(normalize(row.restaurant ?? ""))
  }));
  const referenceErrors = resolved.flatMap((item) => {
    const errors: Record<string, string[]> = {};
    if (!item.category) errors.category = [`Không tìm thấy danh mục: ${item.input.category || item.input.categoryId}`];
    if (!item.restaurant) errors.restaurant = [`Không tìm thấy nhà hàng: ${item.input.restaurant || item.input.restaurantId}`];
    return Object.keys(errors).length ? [{ row: item.row, errors }] : [];
  });
  if (referenceErrors.length) return res.status(422).json({ message: "CSV contains unknown categories or restaurants", errors: referenceErrors });

  const rows = resolved.map(({ input, category, restaurant }) => ({
    name: cleanCsvText(input.name),
    description: cleanCsvText(input.description ?? ""),
    price: input.price,
    categoryId: category!._id,
    restaurantId: restaurant!._id,
    image: input.image,
    isAvailable: true
  }));
  const duplicateRows = rows
    .filter((row, index) => rows.findIndex((candidate) => normalize(candidate.name) === normalize(row.name) && String(candidate.restaurantId) === String(row.restaurantId)) !== index)
    .map((row) => row.name);
  if (duplicateRows.length) return res.status(422).json({ message: "Duplicate rows in CSV", duplicateNames: duplicateRows });

  const inserted = await Food.insertMany(rows, { ordered: true });
  res.status(201).json({ inserted: inserted.length });
});

export default router;
