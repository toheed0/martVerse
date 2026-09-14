"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import {
  clearReviews,
  deleteReview,
  fetchReviewEligibility,
  fetchReviews,
  submitReview,
} from "@/store/slices/reviewSlice";
import { Stars, StarInput } from "./Stars";
import Alert from "@/components/ui/Alert";
import { formatDate } from "@/lib/format";

const VALUES = [5, 4, 3, 2, 1];

const fieldClass =
  "w-full rounded-xl border border-line bg-surface px-4 py-3 text-[0.95rem] text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-pine";

export default function ProductReviews({ product }) {
  const dispatch = useDispatch();

  const { items, breakdown, pagination, status, canReview, myReview, saving, saveError } =
    useSelector((state) => state.reviews);
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState(false);

  const productId = product?._id;
  const isBuyer = isAuthenticated && user?.role === "buyer";

  useEffect(() => {
    if (!productId) return;

    // The page is reused for every product, so last one's reviews have to go
    // before this one's arrive.
    dispatch(clearReviews());
    dispatch(fetchReviews(productId));
  }, [productId, dispatch]);

  useEffect(() => {
    // Only a signed-in buyer can be entitled; for anyone else the endpoint
    // would answer 403 and the slice would just record "no form".
    if (productId && isBuyer) dispatch(fetchReviewEligibility(productId));
  }, [productId, isBuyer, dispatch]);

  // Opening the editor starts from what they already wrote, not a blank slate.
  const startEditing = () => {
    setRating(myReview?.rating ?? 0);
    setComment(myReview?.comment ?? "");
    setEditing(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!rating) return;

    const result = await dispatch(
      submitReview({ productId, rating, comment })
    );

    if (!result.error) {
      setEditing(false);
      setRating(0);
      setComment("");
    }
  };

  const total = pagination.totalReviews;
  const average = product?.ratingAverage ?? 0;

  const formOpen = editing || (canReview && !myReview);

  return (
    <section className="border-t border-line pt-12">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
        Reviews
      </h2>

      {/* Summary */}
      <div className="mt-6 grid gap-8 rounded-2xl border border-line bg-surface p-6 sm:p-8 lg:grid-cols-[auto_minmax(0,1fr)]">
        <div className="text-center lg:text-left">
          <p className="font-display text-5xl font-semibold text-ink">
            {total ? average.toFixed(1) : "—"}
          </p>
          <div className="mt-2 flex justify-center lg:justify-start">
            <Stars value={average} className="h-5 w-5" />
          </div>
          <p className="mt-2 text-sm text-muted">
            {total === 0
              ? "No reviews yet"
              : `${total} ${total === 1 ? "review" : "reviews"}`}
          </p>
        </div>

        {/* The bar chart only means anything once something is in it. */}
        {total > 0 ? (
          <div className="space-y-1.5">
            {VALUES.map((star) => {
              const count = breakdown[star] ?? 0;
              const percent = total ? (count / total) * 100 : 0;

              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="w-10 shrink-0 text-xs text-muted">
                    {star} star
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-sand">
                    <span
                      className="block h-full rounded-full bg-brass"
                      style={{ width: `${percent}%` }}
                    />
                  </span>
                  <span className="w-6 shrink-0 text-right text-xs text-muted">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* What this visitor can do about it */}
      <div className="mt-6">
        {formOpen ? (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-line bg-surface p-6 sm:p-8"
          >
            <h3 className="font-display text-lg font-semibold text-ink">
              {myReview ? "Update your review" : "Write a review"}
            </h3>

            <div className="mt-5">
              <StarInput
                value={rating}
                onChange={setRating}
                disabled={saving}
              />
            </div>

            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={2000}
              placeholder="What stood out — good or bad?"
              className={`${fieldClass} mt-5 resize-y leading-relaxed`}
            />

            <div className="mt-4">
              <Alert type="error">{saveError}</Alert>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving || !rating}
                className="h-12 rounded-full bg-pine px-7 text-sm font-semibold text-canvas transition-colors hover:bg-pine-soft disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Posting..." : myReview ? "Save changes" : "Post review"}
              </button>

              {editing ? (
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="h-12 rounded-full px-6 text-sm font-semibold text-muted transition-colors hover:bg-ink/5 hover:text-ink"
                >
                  Cancel
                </button>
              ) : null}
            </div>

            {!rating ? (
              <p className="mt-3 text-xs text-muted">
                Pick a star rating to post.
              </p>
            ) : null}
          </form>
        ) : myReview ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-pine/20 bg-pine/5 px-6 py-4">
            <p className="text-sm text-ink">
              You reviewed this {formatDate(myReview.createdAt)}.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={startEditing}
                className="h-10 rounded-full border border-ink/20 px-5 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-ink/5"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() =>
                  dispatch(deleteReview({ reviewId: myReview._id, productId }))
                }
                className="h-10 rounded-full px-5 text-sm font-semibold text-clay transition-colors hover:bg-clay/10"
              >
                Withdraw
              </button>
            </div>
          </div>
        ) : isBuyer ? (
          // Signed in, but has not received this product. Saying why beats a
          // form that rejects them after they have typed a paragraph.
          <p className="rounded-2xl border border-dashed border-line px-6 py-5 text-sm leading-relaxed text-muted">
            Reviews come from people who bought the item — yours unlocks once an
            order containing it has been delivered.
          </p>
        ) : !isAuthenticated ? (
          <p className="rounded-2xl border border-dashed border-line px-6 py-5 text-sm leading-relaxed text-muted">
            <Link
              href="/login"
              className="font-semibold text-ink underline underline-offset-4 hover:text-pine"
            >
              Sign in
            </Link>{" "}
            to review something you have bought.
          </p>
        ) : null}
      </div>

      {/* The reviews themselves */}
      <div className="mt-8">
        {status === "loading" ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-sand" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="py-6 text-sm text-muted">
            Nobody has written about this one yet.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((review) => {
              const mine = review.userId?._id === user?._id;

              return (
                <li key={review._id} className="py-6 first:pt-0">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sand font-display text-sm font-semibold text-pine">
                        {(review.userId?.name || "?").trim()[0]?.toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {review.userId?.name || "A shopper"}
                          {mine ? (
                            <span className="ml-2 text-xs font-normal text-muted">
                              (you)
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-muted">
                          {formatDate(review.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Stars value={review.rating} />

                      {/* Every review here is tied to a delivered order — the
                          server will not record one otherwise. */}
                      <span className="rounded-full border border-pine/25 bg-pine/10 px-2.5 py-0.5 text-[0.6rem] font-semibold tracking-[0.1em] uppercase text-pine">
                        Verified
                      </span>
                    </div>
                  </div>

                  {review.comment ? (
                    <p className="mt-3 leading-relaxed text-ink">
                      {review.comment}
                    </p>
                  ) : null}

                  {user?.role === "admin" && !mine ? (
                    <button
                      type="button"
                      onClick={() =>
                        dispatch(
                          deleteReview({ reviewId: review._id, productId })
                        )
                      }
                      className="mt-3 text-xs font-semibold text-clay hover:underline"
                    >
                      Remove this review
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
