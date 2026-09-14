import mongoose from "mongoose";

const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      // The unique index is on the lowercased form, so two people cannot sign
      // up the same address in different cases and get two copies of every
      // mail.
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Kept rather than deleted on unsubscribe: a removed row would let the
    // address be re-added by anyone typing it in, which is how people end up
    // receiving mail they already opted out of.
    status: {
      type: String,
      enum: ["subscribed", "unsubscribed"],
      default: "subscribed",
    },
  },
  {
    timestamps: true,
  }
);

const Subscriber = mongoose.model("Subscriber", subscriberSchema);

export default Subscriber;
