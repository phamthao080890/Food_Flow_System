import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "./config.js";
import { Category, Food, Restaurant, User } from "./models.js";

await mongoose.connect(config.MONGODB_URI);

const seedUsers = [
  { name: "FoodFlow User", email: "user@gmail.com", password: "123456", role: "customer" },
  { name: "FoodFlow Staff", email: "admin@foodflow.com", password: "admin", role: "staff" }
] as const;
for (const seedUser of seedUsers) {
  const { password, ...profile } = seedUser;
  await User.findOneAndUpdate(
    { email: profile.email },
    { ...profile, password: await bcrypt.hash(password, 12) },
    { upsert: true, new: true, runValidators: true }
  );
}

const seedCategories = [
  { name: "Món chính", description: "Các món cơm và món ăn no", id: "6a9cd87a4d94810ad20df930" },
  { name: "Món nước", description: "Phở, bún và các món có nước dùng", id: "6a9cd87a4d94810ad20df92f" },
  { name: "Đồ uống", description: "Thức uống giải khát dùng cùng bữa ăn", id: "6a9cd87a4d94810ad20df92e" },
  { name: "Ăn vặt", description: "Món nhẹ và món dùng chung", id: "6a9cd87a4d94810ad20df935" },
  { name: "Món chay", description: "Món ăn chế biến hoàn toàn từ thực vật", id: "6a9cd87a4d94810ad20df936" }
] as const;
const categories = await Promise.all(seedCategories.map(({ name, description, id }) => Category.findOneAndUpdate(
  { name },
  { $set: { name, description, isActive: true }, $setOnInsert: { _id: new mongoose.Types.ObjectId(id) } },
  { upsert: true, new: true, runValidators: true }
)));
const categoryByName = new Map(categories.map((category) => [category.name, category]));

type SeedFood = {
  name: string;
  description: string;
  price: number;
  category: string;
  toppings?: Array<{ name: string; price: number }>;
};

const seedRestaurants: Array<{
  id: string;
  name: string;
  address: string;
  location: string;
  phone: string;
  openingHours: string;
  foods: SeedFood[];
}> = [
  {
    id: "6a9cd87a4d94810ad20df92a",
    name: "Bếp Việt FoodFlow",
    address: "12 Nguyễn Huệ, Phường Sài Gòn, TP.HCM",
    location: "Quận 1",
    phone: "0900000000",
    openingHours: "08:00-22:00",
    foods: [
      { name: "Cơm gà nướng", description: "Gà nướng sả, cơm thơm và rau củ theo ngày", price: 59000, category: "Món chính", toppings: [{ name: "Trứng ốp la", price: 10000 }, { name: "Cơm thêm", price: 8000 }] },
      { name: "Bún bò Huế", description: "Nước dùng đậm vị, thịt bò, chả và rau sống", price: 65000, category: "Món nước", toppings: [{ name: "Chả thêm", price: 15000 }, { name: "Thịt bò thêm", price: 20000 }] },
      { name: "Cơm tấm sườn nướng", description: "Sườn cốt lết nướng, bì, đồ chua và mỡ hành", price: 68000, category: "Món chính", toppings: [{ name: "Chả trứng", price: 15000 }] },
      { name: "Gỏi cuốn tôm thịt", description: "Ba cuốn gỏi tươi dùng với tương đậu phộng", price: 42000, category: "Ăn vặt", toppings: [{ name: "Thêm 1 cuốn", price: 14000 }] },
      { name: "Trà đào cam sả", description: "Trà đào thanh mát cùng cam vàng và sả", price: 32000, category: "Đồ uống", toppings: [{ name: "Đào thêm", price: 8000 }] }
    ]
  },
  {
    id: "6a9cd87a4d94810ad20df931",
    name: "Phố Phở 24/7",
    address: "88 Võ Văn Tần, Phường Xuân Hòa, TP.HCM",
    location: "Quận 3",
    phone: "0900000001",
    openingHours: "06:00-23:30",
    foods: [
      { name: "Phở bò tái", description: "Bánh phở mềm, bò tái và nước dùng ninh 12 giờ", price: 72000, category: "Món nước", toppings: [{ name: "Bò tái thêm", price: 25000 }, { name: "Trứng chần", price: 12000 }] },
      { name: "Phở bò đặc biệt", description: "Tái, nạm, gầu, gân và bò viên đầy đặn", price: 89000, category: "Món nước", toppings: [{ name: "Quẩy", price: 10000 }] },
      { name: "Phở gà ta", description: "Gà ta xé, hành lá và nước dùng gà trong vị", price: 68000, category: "Món nước", toppings: [{ name: "Đùi gà thêm", price: 28000 }] },
      { name: "Bò kho bánh mì", description: "Bò hầm mềm cùng cà rốt và bánh mì nóng", price: 75000, category: "Món chính", toppings: [{ name: "Bánh mì thêm", price: 7000 }] },
      { name: "Nước sâm thảo mộc", description: "Nước sâm nhà nấu, vị ngọt nhẹ", price: 22000, category: "Đồ uống" }
    ]
  },
  {
    id: "6a9cd87a4d94810ad20df932",
    name: "Cơm Tấm Sài Gòn",
    address: "125 Xô Viết Nghệ Tĩnh, Phường Thạnh Mỹ Tây, TP.HCM",
    location: "Bình Thạnh",
    phone: "0900000002",
    openingHours: "07:00-21:30",
    foods: [
      { name: "Cơm tấm sườn bì chả", description: "Sườn nướng than, bì heo, chả trứng và nước mắm", price: 79000, category: "Món chính", toppings: [{ name: "Trứng ốp la", price: 10000 }] },
      { name: "Cơm tấm sườn trứng", description: "Sườn nướng mật ong và trứng ốp la lòng đào", price: 69000, category: "Món chính", toppings: [{ name: "Sườn thêm", price: 35000 }] },
      { name: "Cơm tấm gà nướng", description: "Đùi gà nướng ngũ vị, mỡ hành và đồ chua", price: 65000, category: "Món chính", toppings: [{ name: "Chả trứng", price: 15000 }] },
      { name: "Canh chua cá", description: "Canh chua cá nấu thơm, cà chua và bạc hà", price: 35000, category: "Món nước", toppings: [{ name: "Cá thêm", price: 18000 }] },
      { name: "Trà tắc mật ong", description: "Trà tắc pha mật ong, ít ngọt", price: 26000, category: "Đồ uống", toppings: [{ name: "Trân châu trắng", price: 7000 }] }
    ]
  },
  {
    id: "6a9cd87a4d94810ad20df933",
    name: "Green Bowl Chay",
    address: "42 Nguyễn Thị Thập, Phường Tân Hưng, TP.HCM",
    location: "Quận 7",
    phone: "0900000003",
    openingHours: "09:00-21:00",
    foods: [
      { name: "Cơm gạo lứt ngũ sắc", description: "Gạo lứt, đậu hũ, nấm, rau củ và sốt mè rang", price: 62000, category: "Món chay", toppings: [{ name: "Đậu hũ thêm", price: 12000 }] },
      { name: "Bún Huế chay", description: "Nước dùng rau củ, nấm, đậu hũ và chả chay", price: 58000, category: "Món chay", toppings: [{ name: "Chả chay thêm", price: 12000 }] },
      { name: "Nấm kho tiêu xanh", description: "Nấm đùi gà kho tiêu xanh dùng cùng cơm trắng", price: 65000, category: "Món chay", toppings: [{ name: "Cơm gạo lứt", price: 10000 }] },
      { name: "Gỏi ngó sen chay", description: "Ngó sen, rau củ, đậu phộng và nước trộn chua ngọt", price: 52000, category: "Ăn vặt" },
      { name: "Sữa hạt điều", description: "Sữa hạt điều rang, không chất bảo quản", price: 35000, category: "Đồ uống", toppings: [{ name: "Ít đường", price: 0 }] }
    ]
  },
  {
    id: "6a9cd87a4d94810ad20df934",
    name: "Ăn Vặt Nhà Mình",
    address: "77 Phan Xích Long, Phường Cầu Kiệu, TP.HCM",
    location: "Phú Nhuận",
    phone: "0900000004",
    openingHours: "14:00-23:00",
    foods: [
      { name: "Bánh tráng trộn", description: "Bánh tráng, xoài, rau răm, trứng cút và sốt đặc biệt", price: 35000, category: "Ăn vặt", toppings: [{ name: "Khô bò thêm", price: 10000 }, { name: "Trứng cút thêm", price: 6000 }] },
      { name: "Cá viên chiên thập cẩm", description: "Cá viên, bò viên, xúc xích và đậu bắp chiên", price: 49000, category: "Ăn vặt", toppings: [{ name: "Phô mai que", price: 12000 }] },
      { name: "Khoai tây lắc phô mai", description: "Khoai chiên giòn lắc bột phô mai", price: 39000, category: "Ăn vặt", toppings: [{ name: "Sốt mayonnaise", price: 5000 }] },
      { name: "Sữa chua nếp cẩm", description: "Sữa chua dẻo, nếp cẩm và nước cốt dừa", price: 32000, category: "Ăn vặt", toppings: [{ name: "Dừa khô", price: 5000 }] },
      { name: "Trà tắc xí muội", description: "Trà tắc chua ngọt cùng xí muội", price: 25000, category: "Đồ uống", toppings: [{ name: "Thạch trái cây", price: 7000 }] }
    ]
  }
];

let foodCount = 0;
for (const seedRestaurant of seedRestaurants) {
  const { id, foods, ...profile } = seedRestaurant;
  const restaurant = await Restaurant.findOneAndUpdate(
    { name: profile.name },
    { $set: { ...profile, isActive: true }, $setOnInsert: { _id: new mongoose.Types.ObjectId(id) } },
    { upsert: true, new: true, runValidators: true }
  );
  for (const seedFood of foods) {
    const { category, toppings = [], ...food } = seedFood;
    const categoryDocument = categoryByName.get(category);
    if (!categoryDocument) throw new Error(`Seed category not found: ${category}`);
    await Food.findOneAndUpdate(
      { name: food.name, restaurantId: restaurant._id },
      { $set: { ...food, categoryId: categoryDocument._id, restaurantId: restaurant._id, toppings, isAvailable: true } },
      { upsert: true, new: true, runValidators: true }
    );
    foodCount += 1;
  }
}

console.log(`Seed data is ready (${seedUsers.length} users, ${seedRestaurants.length} restaurants, ${seedCategories.length} categories, ${foodCount} foods)`);
await mongoose.disconnect();
