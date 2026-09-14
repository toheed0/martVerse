import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["buyer", "vendor", "admin"],
      default: "buyer",
    },

    status: {
      type: String,
      enum: ["pending", "active", "rejected", "blocked"],
      default: "active",
    },
    refreshTokenHash: {
  type: String,
  default: null,
 },

    // Only the sha256 of the reset token is kept. A leaked database then hands
    // an attacker nothing usable — the raw token exists solely in the email,
    // and nowhere on this side of the wire.
    passwordResetTokenHash: {
      type: String,
      default: null,
    },

    passwordResetExpiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Reset links are looked up by their hash alone, so this is the only index that
// path can use. Sparse because the field is null for everyone not mid-reset,
// which is nearly everyone.
userSchema.index({ passwordResetTokenHash: 1 }, { sparse: true });

const User = mongoose.model("User", userSchema);

export default User;