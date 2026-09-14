import express from "express";
import {
  createProductController,
  deleteProductController,
  getAdminProductsController,
  getAllProductsController,
  getMyProductsController,
  getProductByIdController,
  updateProductController,
  uploadProductImagesController,
} from "../controllers/productController.js";

import { protect } from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";
import { uploadProductImages } from "../middleware/upload.middleware.js";

const router = express.Router();

router.post(
  "/",
  protect,
  requireRole("vendor"),
  createProductController
);

// The parser runs last on purpose — no point buffering 25MB of photos from
// someone who turns out not to be a vendor. Admins are here too so they can
// fix a listing without handing the vendor's account back and forth.
router.post(
  "/images",
  protect,
  requireRole("vendor", "admin"),
  uploadProductImages,
  uploadProductImagesController
);

router.get(
  "/",
  getAllProductsController
);

// Must stay ABOVE "/:id" — otherwise Express matches that route first with
// id = "mine" and Mongoose throws a CastError.
router.get(
  "/mine",
  protect,
  requireRole("vendor"),
  getMyProductsController
);

// Same ordering rule as "/mine". Every vendor's shelf, inactive rows included.
router.get(
  "/admin",
  protect,
  requireRole("admin"),
  getAdminProductsController
);

router.get(
  "/:id",
  getProductByIdController
);

// Vendors edit their own products; admins moderate anyone's. The service
// narrows the query by role, so a vendor still can't reach another shelf.
router.patch(
  "/:id",
  protect,
  requireRole("vendor", "admin"),
  updateProductController
);

router.delete(
  "/:id",
  protect,
  requireRole("vendor", "admin"),
  deleteProductController
);

export default router;
