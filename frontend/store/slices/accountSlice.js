import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { getErrorMessage, setAccessToken } from "@/lib/api";
import { logout } from "./authSlice";

// Everything under /api/account is about the caller's own record, so none of
// these carry a user id — the token is the subject.

export const fetchAddresses = createAsyncThunk(
  "account/fetchAddresses",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/account/addresses");
      return data.addresses;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const saveAddress = createAsyncThunk(
  "account/saveAddress",
  async ({ id, values }, { rejectWithValue }) => {
    try {
      if (id) {
        await api.patch(`/account/addresses/${id}`, values);
      } else {
        await api.post("/account/addresses", values);
      }

      // Adding or promoting one can demote another, so the list is re-read
      // rather than patched — the server is what decides which is default.
      const { data } = await api.get("/account/addresses");
      return data.addresses;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deleteAddress = createAsyncThunk(
  "account/deleteAddress",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.delete(`/account/addresses/${id}`);
      return data.addresses;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const makeAddressDefault = createAsyncThunk(
  "account/makeAddressDefault",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/account/addresses/${id}/default`);
      return data.addresses;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchWishlist = createAsyncThunk(
  "account/fetchWishlist",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/account/wishlist");
      return data.wishlist;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const addToWishlist = createAsyncThunk(
  "account/addToWishlist",
  async (productId, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/account/wishlist", { productId });
      return data.wishlist;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const removeFromWishlist = createAsyncThunk(
  "account/removeFromWishlist",
  async (productId, { rejectWithValue }) => {
    try {
      const { data } = await api.delete(`/account/wishlist/${productId}`);
      return data.wishlist;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Changing a password invalidates every session server-side, so the reply
// carries a new access token to keep THIS browser signed in. Dropping it would
// sign the person out of the page they are standing on.
export const changePassword = createAsyncThunk(
  "account/changePassword",
  async (values, { rejectWithValue }) => {
    try {
      const { data } = await api.patch("/account/password", values);
      setAccessToken(data.accessToken);
      return data.message;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const initialState = {
  addresses: [],
  addressStatus: "idle",
  addressError: null,
  savingAddress: false,
  addressActionError: null,

  wishlist: [],
  wishlistStatus: "idle",
  wishlistError: null,
  // Only the row being changed shows a spinner, not the whole grid.
  wishlistPendingId: null,

  passwordSaving: false,
  passwordError: null,
  passwordMessage: null,
};

// Every address write answers with the whole list, so they all land here.
const applyAddresses = (state, action) => {
  state.savingAddress = false;
  state.addresses = action.payload;
};

const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    clearAccountFeedback: (state) => {
      state.addressActionError = null;
      state.passwordError = null;
      state.passwordMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAddresses.pending, (state) => {
        state.addressStatus = "loading";
        state.addressError = null;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.addressStatus = "succeeded";
        state.addresses = action.payload;
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.addressStatus = "failed";
        state.addressError = action.payload;
      })

      .addCase(saveAddress.pending, (state) => {
        state.savingAddress = true;
        state.addressActionError = null;
      })
      .addCase(saveAddress.fulfilled, applyAddresses)
      .addCase(saveAddress.rejected, (state, action) => {
        state.savingAddress = false;
        state.addressActionError = action.payload;
      })

      .addCase(deleteAddress.fulfilled, applyAddresses)
      .addCase(deleteAddress.rejected, (state, action) => {
        state.addressActionError = action.payload;
      })

      .addCase(makeAddressDefault.fulfilled, applyAddresses)
      .addCase(makeAddressDefault.rejected, (state, action) => {
        state.addressActionError = action.payload;
      })

      .addCase(fetchWishlist.pending, (state) => {
        state.wishlistStatus = "loading";
        state.wishlistError = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.wishlistStatus = "succeeded";
        state.wishlist = action.payload;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.wishlistStatus = "failed";
        state.wishlistError = action.payload;
      })

      .addCase(addToWishlist.pending, (state, action) => {
        state.wishlistPendingId = action.meta.arg;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.wishlistPendingId = null;
        state.wishlist = action.payload;
        // A heart can be tapped from a product page before the list was ever
        // read, and the reply is the whole list either way.
        state.wishlistStatus = "succeeded";
      })
      .addCase(addToWishlist.rejected, (state) => {
        state.wishlistPendingId = null;
      })

      .addCase(removeFromWishlist.pending, (state, action) => {
        state.wishlistPendingId = action.meta.arg;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.wishlistPendingId = null;
        state.wishlist = action.payload;
        state.wishlistStatus = "succeeded";
      })
      .addCase(removeFromWishlist.rejected, (state) => {
        state.wishlistPendingId = null;
      })

      .addCase(changePassword.pending, (state) => {
        state.passwordSaving = true;
        state.passwordError = null;
        state.passwordMessage = null;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.passwordSaving = false;
        state.passwordMessage = action.payload;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.passwordSaving = false;
        state.passwordError = action.payload;
      })

      // Addresses and saved items are per-account, so they must not survive a
      // sign-out into the next person to use this browser.
      .addCase(logout.fulfilled, () => initialState);
  },
});

export const selectIsWishlisted = (productId) => (state) =>
  state.account.wishlist.some((item) => item._id === productId);

export const { clearAccountFeedback } = accountSlice.actions;

export default accountSlice.reducer;
