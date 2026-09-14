import express from "express";

import {
  addAddressController,
  addWishlistItemController,
  changePasswordController,
  deleteAddressController,
  getAddressesController,
  getWishlistController,
  removeWishlistItemController,
  setDefaultAddressController,
  updateAddressController,
} from "../controllers/accountController.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Everything here is about the caller's own account, so `protect` is the whole
// authorisation story — there is no id in any path that could point at someone
// else. That is also why this is separate from /api/users, which is the admin
// surface for managing other people.
router.use(protect);

router.get("/addresses", getAddressesController);
router.post("/addresses", addAddressController);
router.patch("/addresses/:addressId", updateAddressController);
router.delete("/addresses/:addressId", deleteAddressController);
router.patch("/addresses/:addressId/default", setDefaultAddressController);

router.get("/wishlist", getWishlistController);
router.post("/wishlist", addWishlistItemController);
router.delete("/wishlist/:productId", removeWishlistItemController);

router.patch("/password", changePasswordController);

export default router;
