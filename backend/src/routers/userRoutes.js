import express from "express";
import {
  getUsersController,
  updateUserStatusController,
} from "../controllers/userController.js";

import { protect } from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";

const router = express.Router();

// Whole router is admin-only — nothing here is safe to expose publicly.
router.get(
  "/",
  protect,
  requireRole("admin"),
  getUsersController
);

router.patch(
  "/:id/status",
  protect,
  requireRole("admin"),
  updateUserStatusController
);

export default router;
