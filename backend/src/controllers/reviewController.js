import {
  createReview,
  deleteReview,
  getProductReviews,
  getReviewEligibility,
} from "../services/reviewService.js";

export const createReviewController = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const review = await createReview(req.user._id, req.params.productId, {
      rating,
      comment,
    });

    return res.status(201).json({
      success: true,
      message: "Thanks — your review is live",
      review,
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProductReviewsController = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);

    const result = await getProductReviews(req.params.productId, {
      page,
      limit,
    });

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Answers "should this buyer be shown a review form?" — separate from the list
// because the list is public and this is about one signed-in person.
export const getReviewEligibilityController = async (req, res) => {
  try {
    const result = await getReviewEligibility(
      req.user._id,
      req.params.productId
    );

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteReviewController = async (req, res) => {
  try {
    await deleteReview(req.params.reviewId, req.user);

    return res.status(200).json({
      success: true,
      message: "Review removed",
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};
