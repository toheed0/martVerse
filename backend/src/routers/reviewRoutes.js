import express from "express";

import {
  createReviewController,
  deleteReviewController,
  getProductReviewsController,
  getReviewEligibilityController,
} from "../controllers/reviewController.js";

import { protect } from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";

const router = express.Router();

// Public: reviews are the reason a shopper trusts the page, so they have to be
// readable before anyone signs in.
router.get("/product/:productId", getProductReviewsController);

// Buyers only, and the service still checks they actually received the thing —
// the role alone is not the entitlement.
router.post(
  "/product/:productId",
  protect,
  requireRole("buyer"),
  createReviewController
);

router.get(
  "/product/:productId/me",
  protect,
  requireRole("buyer"),
  getReviewEligibilityController
);

// A buyer withdraws their own; an admin moderates anyone's. The service narrows
// the query by role, so a buyer cannot reach someone else's.
router.delete(
  "/:reviewId",
  protect,
  requireRole("buyer", "admin"),
  deleteReviewController
);

export default router;
