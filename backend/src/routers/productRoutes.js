import express from "express";
import {
  createProductController,
  deleteProductController,
  getAllProductsController,
  getProductByIdController,
  updateProductController,
} from "../controllers/productController.js";

import { protect } from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";

const router = express.Router();

router.post(
  "/",
  protect,
  requireRole("vendor"),
  createProductController
);

router.get(
  "/",
  getAllProductsController
);

router.get(
  "/:id",
  getProductByIdController
);

router.patch(
  "/:id",
  protect,
  requireRole("vendor"),
  updateProductController
);

router.delete(
  "/:id",
  protect,
  requireRole("vendor"),
  deleteProductController
);

export default router;