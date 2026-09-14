import express from "express";
import {
  register,
  login,
  getMe,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.get("/me", protect, getMe);

router.post("/refresh",refresh);

router.post("/logout", logout);

// Both public, and both have to be: a locked-out user has nothing to
// authenticate with. The emailed token is the credential on the second one.
router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);

export default router;
