import { Schema, model } from "mongoose";

const options = { timestamps: true };

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
  avatar: { type: String, default: "" },
  resetPasswordToken: { type: String, select: false },
  resetPasswordExpires: { type: Date, select: false },
  role: { type: String, enum: ["customer", "staff", "admin"], default: "customer" }
}, options);

const restaurantSchema = new Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true },
  location: { type: String, required: true, index: true },
  phone: { type: String, required: true },
  openingHours: { type: String, default: "08:00-22:00" },
  image: { type: String, default: "" },
  isActive: { type: Boolean, default: true }
}, options);

const categorySchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: "" },
  image: { type: String, default: "" },
  isActive: { type: Boolean, default: true }
}, options);

const toppingSchema = new Schema({ name: { type: String, required: true }, price: { type: Number, min: 0, required: true } }, { _id: false });
const foodSchema = new Schema({
  name: { type: String, required: true, trim: true, index: true },
  description: { type: String, default: "" },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, default: "" },
  categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
  restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
  isAvailable: { type: Boolean, default: true },
  toppings: { type: [toppingSchema], default: [] }
}, options);
foodSchema.index({ name: "text", description: "text" });

const orderItemSchema = new Schema({
  foodId: { type: Schema.Types.ObjectId, ref: "Food", required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  selectedToppings: { type: [toppingSchema], default: [] }
}, { _id: false });

const orderSchema = new Schema({
  customerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
  items: { type: [orderItemSchema], required: true },
  totalAmount: { type: Number, required: true, min: 0 },
  shippingAddress: { type: String, required: true },
  phone: { type: String, required: true },
  note: { type: String, default: "" },
  paymentMethod: { type: String, enum: ["COD"], default: "COD" },
  status: { type: String, enum: ["Pending", "Confirmed", "Preparing", "Delivering", "Completed", "Cancelled"], default: "Pending", index: true }
}, options);

export const User = model("User", userSchema);
export const Restaurant = model("Restaurant", restaurantSchema);
export const Category = model("Category", categorySchema);
export const Food = model("Food", foodSchema);
export const Order = model("Order", orderSchema);
