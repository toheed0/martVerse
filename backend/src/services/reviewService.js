import mongoose from "mongoose";

import Review from "../models/Review.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

// Reviewing something you have not received is how a storefront fills up with
// opinions from people who never bought anything. Only these two statuses mean
// the goods actually arrived.
const REVIEWABLE_ORDER_STATUSES = ["delivered", "shipped"];

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Recomputed from the collection rather than nudged up and down. An increment
// drifts the moment anything goes wrong halfway — a delete that half-applied, a
// rating edited twice — and a wrong average is worse than a slow one.
const refreshProductRating = async (productId) => {
  const [summary] = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(String(productId)) } },
    {
      $group: {
        _id: "$productId",
        average: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  await Product.updateOne(
    { _id: productId },
    {
      // One decimal is all the stars can show, and storing more only invites
      // 4.33333 to leak into a tooltip somewhere.
      ratingAverage: summary ? Math.round(summary.average * 10) / 10 : 0,
      ratingCount: summary?.count ?? 0,
    }
  );
};

// The order that entitles this person to review this product: delivered or
// shipped, theirs, and containing the product. Newest first so a repeat buyer's
// review is attached to their most recent purchase.
const findEntitlingOrder = async (userId, productId) => {
  return Order.findOne({
    userId,
    status: { $in: REVIEWABLE_ORDER_STATUSES },
    "items.productId": productId,
  })
    .sort({ createdAt: -1 })
    .select("_id");
};

export const createReview = async (userId, productId, { rating, comment }) => {
  const numericRating = Number(rating);

  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    throw createError("Give a rating between 1 and 5 stars", 400);
  }

  const product = await Product.findById(productId).select("_id");

  if (!product) throw createError("Product not found", 404);

  const order = await findEntitlingOrder(userId, productId);

  if (!order) {
    throw createError(
      "You can review this once an order containing it has been delivered",
      403
    );
  }

  const payload = {
    rating: numericRating,
    comment: comment?.trim() || "",
    orderId: order._id,
  };

  let review;

  try {
    // Upsert on the unique (productId, userId) pair, so posting again edits the
    // existing opinion instead of colliding with it. This is also what makes a
    // retried request harmless.
    review = await Review.findOneAndUpdate(
      { productId, userId },
      { $set: payload, $setOnInsert: { productId, userId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    // Two reviews racing for the same empty slot: one inserts, the other trips
    // the unique index. Retrying finds the row the winner just wrote.
    if (error.code === 11000) {
      review = await Review.findOneAndUpdate(
        { productId, userId },
        { $set: payload },
        { new: true }
      );
    } else {
      throw error;
    }
  }

  await refreshProductRating(productId);

  return review.populate("userId", "name");
};

export const deleteReview = async (reviewId, actor) => {
  // An admin moderates anyone's review; everyone else reaches only their own.
  const filter =
    actor.role === "admin"
      ? { _id: reviewId }
      : { _id: reviewId, userId: actor._id };

  const review = await Review.findOneAndDelete(filter);

  if (!review) {
    throw createError("Review not found, or it is not yours to remove", 404);
  }

  await refreshProductRating(review.productId);

  return review;
};

export const getProductReviews = async (productId, { page = 1, limit = 10 } = {}) => {
  const skip = (page - 1) * limit;

  const [reviews, totalReviews, breakdown] = await Promise.all([
    Review.find({ productId })
      .populate("userId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Review.countDocuments({ productId }),

    // How many of each star, for the bar chart beside the average. One grouped
    // pass rather than five counts.
    Review.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(String(productId)) } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
    ]),
  ]);

  // Every star gets a key even at zero, so the UI can render five bars without
  // filling in the gaps itself.
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of breakdown) counts[row._id] = row.count;

  return {
    reviews,
    breakdown: counts,
    pagination: {
      page,
      limit,
      totalReviews,
      totalPages: Math.ceil(totalReviews / limit),
    },
  };
};

// What the product page needs to decide which of three things to show: the
// write form, the buyer's existing review, or nothing at all.
export const getReviewEligibility = async (userId, productId) => {
  const [order, existing] = await Promise.all([
    findEntitlingOrder(userId, productId),
    Review.findOne({ productId, userId }),
  ]);

  return {
    canReview: Boolean(order),
    review: existing,
  };
};
