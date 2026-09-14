import crypto from "crypto";

import {
  addAddress,
  addToWishlist,
  changePassword,
  listAddresses,
  listWishlist,
  removeAddress,
  removeFromWishlist,
  setDefaultAddress,
  updateAddress,
} from "../services/accountService.js";

import { generateAccessToken, generateRefreshToken } from "../utils/token.js";

// Same shape authController uses, so the cookie it sets here can be overwritten
// and cleared by login/refresh/logout later.
const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/api/auth",
};

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

// Every handler below does the same thing with a service error, so the shape of
// that is settled once here.
const handle = (run, buildResponse) => async (req, res) => {
  try {
    const result = await run(req, res);

    // Some handlers answer for themselves (the password one sets a cookie).
    if (res.headersSent) return;

    return res.status(200).json({ success: true, ...buildResponse(result) });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};

// ---- Addresses ------------------------------------------------------------

export const getAddressesController = handle(
  (req) => listAddresses(req.user._id),
  (addresses) => ({ addresses })
);

export const addAddressController = handle(
  (req) => addAddress(req.user._id, req.body),
  (address) => ({ message: "Address saved", address })
);

export const updateAddressController = handle(
  (req) => updateAddress(req.user._id, req.params.addressId, req.body),
  (address) => ({ message: "Address updated", address })
);

export const deleteAddressController = handle(
  (req) => removeAddress(req.user._id, req.params.addressId),
  (addresses) => ({ message: "Address removed", addresses })
);

export const setDefaultAddressController = handle(
  (req) => setDefaultAddress(req.user._id, req.params.addressId),
  (addresses) => ({ message: "Default address updated", addresses })
);

// ---- Wishlist -------------------------------------------------------------

export const getWishlistController = handle(
  (req) => listWishlist(req.user._id),
  (wishlist) => ({ wishlist })
);

export const addWishlistItemController = handle(
  (req) => addToWishlist(req.user._id, req.body.productId),
  (wishlist) => ({ message: "Saved to your wishlist", wishlist })
);

export const removeWishlistItemController = handle(
  (req) => removeFromWishlist(req.user._id, req.params.productId),
  (wishlist) => ({ message: "Removed from your wishlist", wishlist })
);

// ---- Password -------------------------------------------------------------

export const changePasswordController = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await changePassword(req.user._id, {
      currentPassword,
      newPassword,
    });

    // The service cleared the one refresh slot, so every session is now dead —
    // including this browser's. Minting a new pair keeps the person who just
    // proved they know the password signed in, and leaves everyone else out.
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshTokenHash = hashToken(refreshToken);
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      ...refreshCookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message:
        "Password changed. Any other device that was signed in has been signed out.",
      accessToken,
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};
