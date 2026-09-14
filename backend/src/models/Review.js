import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // The order the review is vouched for by. Storing it means "verified
    // purchase" is a fact on the row rather than a join every time a product
    // page is drawn — and it is what stops a second review per purchase.
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// One review per person per product. A buyer who orders the same thing twice
// edits what they already wrote rather than stacking a second opinion on top —
// otherwise the average is just a count of how often someone reordered.
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

// The product page reads newest-first for one product; this is the index that
// serves it.
reviewSchema.index({ productId: 1, createdAt: -1 });

const Review = mongoose.model("Review", reviewSchema);

export default Review;
