import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routers/authRouter.js";
import categoryRoutes from "./routers/categoryRoutes.js";
import productRoutes from "./routers/productRoutes.js";
import userRoutes from "./routers/userRoutes.js";
import cartRoutes from "./routers/cartRoutes.js";
import orderRoutes from "./routers/orderRoutes.js";
import webhookRoutes from "./routers/webhookRoutes.js";
import newsletterRoutes from "./routers/newsletterRoutes.js";
import accountRoutes from "./routers/accountRoutes.js";
import reviewRoutes from "./routers/reviewRoutes.js";

// The Express app on its own — wired up but not listening. server.js owns the
// environment, the database connection and the port; keeping those out of here
// means the app can also be imported by tests without opening a socket.
const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
// MUST stay above express.json(). Stripe signs the raw bytes of its request,
// and express.json() parses them and throws the original away — after which no
// signature can ever be verified again. The router brings its own express.raw()
// so the body reaches the handler exactly as it was sent.
app.use("/api/webhooks", webhookRoutes);

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

app.use("/api/orders", orderRoutes);

app.use("/api/newsletter", newsletterRoutes);

app.use("/api/account", accountRoutes);

app.use("/api/reviews", reviewRoutes);

// Anything that reached this far matched no route.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Four arguments is what marks this as Express' error handler, so `next` stays
// even though it is unused.
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Something went wrong",
  });
});

export default app;
