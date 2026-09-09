import express from "express";
import { addToCartController, clearCartController, getCartController, removeCartItemController, updateCartItemController } from "../controllers/cartController.js";
import {protect} from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";

const router = express.Router();

router.post(
  "/",
  protect,
  requireRole("buyer"),
  addToCartController
);

router.get(
  "/",
  protect,
  requireRole("buyer"),
  getCartController
);

router.patch(
  "/",
  protect,
  requireRole("buyer"),
  updateCartItemController
);

router.delete(
  "/",
  protect,
  requireRole("buyer"),
  removeCartItemController
);

router.delete(
  "/clear",
  protect,
  requireRole("buyer"),
  clearCartController
);
export default router;