import express from "express";
import { register, login, getMe, refresh, logout, } from "../controllers/authController.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.get("/me", protect, getMe);

router.post("/refresh",refresh);

router.post("/logout", logout);

export default router;
