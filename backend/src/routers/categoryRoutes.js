import express from "express";
import {
  createCategoryController,
  deleteCategoryController,
  getAllCategoriesController,
  getAllCategoriesAdminController,
  getCategoryByIdController,
  updateCategoryController,
} from "../controllers/categoryController.js";
import { protect } from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";
import { uploadCategoryImage } from "../middleware/upload.middleware.js";

const router = express.Router();

// uploadCategoryImage runs last on purpose — no point buffering a 5MB file
// from someone who turns out not to be an admin.
router.post(
  "/",
  protect,
  requireRole("admin"),
  uploadCategoryImage,
  createCategoryController
);

router.get(
  "/",
  getAllCategoriesController
);

// Must stay ABOVE "/:id" — otherwise Express matches that route first with
// id = "all" and Mongoose throws a CastError.
router.get(
  "/all",
  protect,
  requireRole("admin"),
  getAllCategoriesAdminController
);

router.get(
  "/:id",
  getCategoryByIdController
);

router.patch(
  "/:id",
  protect,
  requireRole("admin"),
  uploadCategoryImage,
  updateCategoryController
);

router.delete(
  "/:id",
  protect,
  requireRole("admin"),
  deleteCategoryController
);

export default router;
