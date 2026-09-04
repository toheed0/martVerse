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
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;