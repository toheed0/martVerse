import express from "express";

import {
  cancelOrderController,
  confirmOrderPaymentController,
  createOrderController,
  getAdminOrdersController,
  getMyOrdersController,
  getOrderByIdController,
  getVendorOrdersController,
  updateOrderStatusController,
} from "../controllers/orderController.js";

import { protect } from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";

const router = express.Router();

router.post(
  "/",
  protect,
  requireRole("buyer"),
  createOrderController
);

router.get(
  "/",
  protect,
  requireRole("buyer"),
  getMyOrdersController
);

// Must stay ABOVE "/:id" — otherwise Express matches that route first with
// id = "admin" and Mongoose throws a CastError.
router.get(
  "/admin",
  protect,
  requireRole("admin"),
  getAdminOrdersController
);

// Same ordering rule as "/admin". A vendor sees only the lines that are theirs
// — the service rebuilds each order around them rather than filtering in the
// query, because a projection can only return the FIRST matching item and would
// silently drop the rest.
router.get(
  "/vendor",
  protect,
  requireRole("vendor"),
  getVendorOrdersController
);

// Buyers read their own orders, admins read anyone's. The service narrows the
// query by role, so a buyer still cannot reach someone else's order.
router.get(
  "/:id",
  protect,
  requireRole("buyer", "admin"),
  getOrderByIdController
);

// Cancelling hands the reserved stock back, so it runs through one service that
// both roles share rather than a second admin-only copy of the same logic.
router.patch(
  "/:id/cancel",
  protect,
  requireRole("buyer", "admin"),
  cancelOrderController
);

// Buyer only: the last leg of a card checkout. It takes no body — the server
// asks Stripe what really happened — so replaying it proves nothing.
router.patch(
  "/:id/pay",
  protect,
  requireRole("buyer"),
  confirmOrderPaymentController
);

// Moving an order forward is fulfilment, not shopping — admin only. Cancelling
// is not reachable from here; it has its own route above because it is the only
// transition that changes stock.
router.patch(
  "/:id/status",
  protect,
  requireRole("admin"),
  updateOrderStatusController
);

export default router;
