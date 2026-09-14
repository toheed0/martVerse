import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { getErrorMessage } from "@/lib/api";
import { logout } from "./authSlice";

// Public — the reviews are half the reason a shopper trusts the page, so they
// load whether or not anyone is signed in.
export const fetchReviews = createAsyncThunk(
  "reviews/fetchForProduct",
  async (productId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/reviews/product/${productId}`);
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Answers "should this person see a write form?". Only meaningful for a
// signed-in buyer, so the product page calls it conditionally.
export const fetchReviewEligibility = createAsyncThunk(
  "reviews/fetchEligibility",
  async (productId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/reviews/product/${productId}/me`);
      return { canReview: data.canReview, review: data.review };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const submitReview = createAsyncThunk(
  "reviews/submit",
  async ({ productId, rating, comment }, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await api.post(`/reviews/product/${productId}`, {
        rating,
        comment,
      });

      // The server recomputes the product average on every write, so the list
      // and the breakdown are re-read rather than guessed at here.
      dispatch(fetchReviews(productId));

      return data.review;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deleteReview = createAsyncThunk(
  "reviews/delete",
  async ({ reviewId, productId }, { rejectWithValue, dispatch }) => {
    try {
      await api.delete(`/reviews/${reviewId}`);
      dispatch(fetchReviews(productId));
      return reviewId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const initialState = {
  items: [],
  breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  pagination: { page: 1, limit: 10, totalReviews: 0, totalPages: 0 },
  status: "idle",
  error: null,

  // What this signed-in buyer may do here, and what they already said.
  canReview: false,
  myReview: null,

  saving: false,
  saveError: null,
};

const reviewSlice = createSlice({
  name: "reviews",
  initialState,
  reducers: {
    // The product page is reused for every product, so the previous one's
    // reviews have to be dropped on the way in or they flash on the new page.
    clearReviews: () => initialState,
    clearReviewError: (state) => {
      state.saveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviews.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload.reviews;
        state.breakdown = action.payload.breakdown;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      .addCase(fetchReviewEligibility.fulfilled, (state, action) => {
        state.canReview = action.payload.canReview;
        state.myReview = action.payload.review;
      })
      .addCase(fetchReviewEligibility.rejected, (state) => {
        // A vendor or an admin gets a 403 here, which is not a failure worth
        // showing anyone — it just means no form.
        state.canReview = false;
        state.myReview = null;
      })

      .addCase(submitReview.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })
      .addCase(submitReview.fulfilled, (state, action) => {
        state.saving = false;
        state.myReview = action.payload;
      })
      .addCase(submitReview.rejected, (state, action) => {
        state.saving = false;
        state.saveError = action.payload;
      })

      .addCase(deleteReview.fulfilled, (state) => {
        // Withdrawn, so the form comes back — they are still entitled to write
        // another one.
        state.myReview = null;
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.saveError = action.payload;
      })

      // Whether someone may review is a fact about them, not the product.
      .addCase(logout.fulfilled, (state) => {
        state.canReview = false;
        state.myReview = null;
      });
  },
});

export const { clearReviews, clearReviewError } = reviewSlice.actions;

export default reviewSlice.reducer;
