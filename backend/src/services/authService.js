import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/token.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

// Lets controllers map a service failure to the right HTTP status.
const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const registerUser = async ({ name, email, password, role }) => {
  if (!name || !email || !password) {
    throw createError("All fields are required", 400);
  }

  if (!EMAIL_REGEX.test(email)) {
    throw createError("Invalid email address", 400);
  }

  // Must run on the raw password: the schema only ever sees the bcrypt hash.
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw createError(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      400
    );
  }

  if (!["buyer", "vendor"].includes(role)) {
    throw createError("Invalid registration role", 400);
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw createError("User already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  let user;

  try {
    user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      status: role === "vendor" ? "pending" : "active",
    });
  } catch (error) {
    // Two concurrent registrations can both pass the check above; the unique
    // index is what actually decides the winner.
    if (error.code === 11000) {
      throw createError("User already exists", 409);
    }

    throw error;
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  };
};

export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    throw createError("Email and password are required", 400);
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw createError("Invalid email or password", 401);
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    throw createError("Invalid email or password", 401);
  }

  if (user.status === "pending") {
    throw createError("Your account is pending approval", 403);
  }

  if (user.status === "rejected") {
    throw createError("Your account has been rejected", 403);
  }

  if (user.status === "blocked") {
    throw createError("Your account has been blocked", 403);
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshTokenHash = hashToken(refreshToken);

  await user.save();

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
};

export const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw createError("Refresh token is required", 401);
  }

  let decoded;

  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw createError("Invalid or expired refresh token", 401);
  }

  const user = await User.findById(decoded.userId);

  if (!user) {
    throw createError("User not found", 401);
  }

  if (user.status !== "active") {
    throw createError("User account is not active", 403);
  }

  const refreshTokenHash = hashToken(refreshToken);

  const storedHash = user.refreshTokenHash || "";

  // timingSafeEqual throws on unequal lengths, so compare that first.
  const isTokenKnown =
    storedHash.length === refreshTokenHash.length &&
    crypto.timingSafeEqual(
      Buffer.from(refreshTokenHash, "hex"),
      Buffer.from(storedHash, "hex")
    );

  if (!isTokenKnown) {
    // A signed-but-unknown token means it was rotated away or stolen.
    user.refreshTokenHash = null;
    await user.save();

    throw createError("Invalid refresh token", 401);
  }

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  user.refreshTokenHash = hashToken(newRefreshToken);

  await user.save();

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const logoutUser = async (refreshToken) => {
  if (!refreshToken) {
    return;
  }

  await User.findOneAndUpdate(
    { refreshTokenHash: hashToken(refreshToken) },
    { $set: { refreshTokenHash: null } }
  );
};

// How long a reset link stays usable. Long enough to walk to another device and
// find the mail, short enough that a link left sitting in an inbox is not a
// standing key to the account.
const RESET_TOKEN_TTL_MINUTES = 30;

// Starts a reset. Deliberately says nothing about whether the address is known:
// the controller answers identically either way, because an endpoint that
// distinguishes them is a free tool for working out who banks here.
export const requestPasswordReset = async (email) => {
  if (!email || !EMAIL_REGEX.test(email)) {
    throw createError("A valid email address is required", 400);
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  // No such account. Nothing to do, and nothing to report.
  if (!user) return null;

  // 32 bytes of CSPRNG output. Long enough that guessing is not a strategy,
  // and hex so it survives a query string untouched.
  const token = crypto.randomBytes(32).toString("hex");

  // Only the digest is stored. Issuing a new link also invalidates whatever
  // came before it, since there is one slot and this overwrites it.
  user.passwordResetTokenHash = hashToken(token);
  user.passwordResetExpiresAt = new Date(
    Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000
  );

  await user.save();

  return {
    email: user.email,
    name: user.name,
    token,
    expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
  };
};

// Finishes a reset. The token is the only credential here — it has to prove
// both who the user is and that they still hold the mailbox.
export const resetPassword = async ({ token, password }) => {
  if (!token) {
    throw createError("Reset token is required", 400);
  }

  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw createError(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      400
    );
  }

  // Expiry is part of the query, not a check after it. A token that timed out
  // simply matches nothing, so there is no window between reading and deciding.
  const user = await User.findOne({
    passwordResetTokenHash: hashToken(token),
    passwordResetExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    // Used, expired, or never real — all three look the same from outside, and
    // should: distinguishing them tells an attacker which guesses were close.
    throw createError("This reset link is invalid or has expired", 400);
  }

  user.password = await bcrypt.hash(password, 10);

  // One use only. Clearing the slot is what stops the same link being replayed
  // out of a browser history or a forwarded email.
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;

  // The whole point of a reset is often that someone else got in. Dropping the
  // refresh token hash ends every session that is already open, so a thief
  // holding a live one is signed out rather than left there.
  user.refreshTokenHash = null;

  await user.save();

  return {
    id: user._id,
    name: user.name,
    email: user.email,
  };
};
