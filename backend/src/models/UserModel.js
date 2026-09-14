import mongoose from "mongoose";

// The same five fields an order's shippingAddress carries, plus a label to tell
// two of them apart in a list. Kept as a subdocument rather than its own
// collection: an address belongs to exactly one person, is never queried on its
// own, and is always wanted at the same time as the user.
const addressSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      trim: true,
      default: "",
    },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    postalCode: { type: String, trim: true, default: "" },

    // Exactly one of these is true at a time — the service enforces that, since
    // a schema cannot express "only one sibling may be set".
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

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

    addresses: {
      type: [addressSchema],
      default: [],
    },

    // Product ids only. The products themselves move — price, stock, even
    // whether they are still listed — so the list holds references and reads
    // them fresh, unlike an order, which must freeze what was bought.
    wishlist: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
      ],
      default: [],
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