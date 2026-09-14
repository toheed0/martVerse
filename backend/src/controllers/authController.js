import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  requestPasswordReset,
  resetPassword as resetUserPassword,
} from "../services/authService.js";

import { sendPasswordResetEmail } from "../services/emailService.js";

// Refresh token cookie options are shared by login / refresh / logout so the
// cookie can actually be overwritten and cleared later.
const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/api/auth",
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const user = await registerUser({
      name,
      email,
      password,
      role,
    });

    return res.status(201).json({
      success: true,
      message:
        user.role === "vendor"
          ? "Vendor registration submitted for approval"
          : "Buyer registered successfully",
      user,
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await loginUser({
      email,
      password,
    });

    res.cookie("refreshToken", result.refreshToken, {
      ...refreshCookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error) {
    return res.status(error.statusCode || 401).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};

export const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    const result = await refreshAccessToken(refreshToken);

    res.cookie("refreshToken", result.refreshToken, {
      ...refreshCookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
      accessToken: result.accessToken,
    });
  } catch (error) {
    // The stored token is no longer usable, so drop the stale cookie too.
    res.clearCookie("refreshToken", refreshCookieOptions);

    return res.status(error.statusCode || 401).json({
      success: false,
      message: error.message,
    });
  }
};

export const logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  // Always clear the cookie, even if the DB cleanup below fails.
  res.clearCookie("refreshToken", refreshCookieOptions);

  try {
    await logoutUser(refreshToken);

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

// One answer for every address, known or not. Anything that varies here — the
// wording, the status code, even how long it takes — turns this endpoint into a
// way of asking "does this person shop at MartVerse?" and getting a straight
// answer.
const RESET_REQUESTED_MESSAGE =
  "If that email address has an account, a reset link is on its way.";

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const reset = await requestPasswordReset(email);

    if (reset) {
      try {
        await sendPasswordResetEmail({
          to: reset.email,
          name: reset.name,
          token: reset.token,
          expiresInMinutes: reset.expiresInMinutes,
        });
      } catch (error) {
        // The token is already stored, so the only thing lost is the delivery.
        // Logged rather than surfaced: telling the caller that sending failed
        // would confirm the address exists, which is what this avoids.
        console.error(`Failed to send the reset email to ${reset.email}`, error);
      }
    }

    return res.status(200).json({
      success: true,
      message: RESET_REQUESTED_MESSAGE,
    });
  } catch (error) {
    // Only a malformed request reaches here — an unknown address is not an
    // error, it is the answer above.
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    await resetUserPassword({ token, password });

    // Every session was just invalidated, this browser's included, so the
    // stale cookie has to go with them rather than sit there failing later.
    res.clearCookie("refreshToken", refreshCookieOptions);

    return res.status(200).json({
      success: true,
      message: "Your password has been changed. Sign in with your new one.",
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};
