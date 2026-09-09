// Loaded first so every module below sees process.env already populated.
import "dotenv/config";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import authRouter from "./routers/authRouter.js";
import categoryRoutes from "./routers/categoryRoutes.js";
import productRoutes from "./routers/productRoutes.js";
import userRoutes from "./routers/userRoutes.js";
import cartRoutes from "./routers/cartRoutes.js";

const requiredEnv = ["MONGO_URI", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length) {
  console.error(`Missing env variables: ${missingEnv.join(", ")}`);
  process.exit(1);
}

connectDB();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello World! backend is running.");
});

app.use("/api/auth", authRouter);

app.use("/api/categories", categoryRoutes);

app.use("/api/products", productRoutes);

app.use("/api/users", userRoutes);

app.use("/api/cart", cartRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Something went wrong",
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
