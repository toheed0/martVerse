import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, {
  getErrorMessage,
  requestRefresh,
  setAccessToken,
} from "@/lib/api";

export const register = createAsyncThunk(
  "auth/register",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/auth/register", formData);
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/auth/login", credentials);
      setAccessToken(data.accessToken);

      // /auth/login only returns { id, name, email, role }, while /auth/me
      // returns the full record. Always read the user from /auth/me so
      // state.auth.user has one shape no matter how you signed in.
      const me = await api.get("/auth/me");
      return me.data.user;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Asks for a reset link. The reply is the same whether or not the address is
// known, so there is nothing here worth branching on — the message is shown
// verbatim either way.
export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      return data.message;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Finishes a reset with the token out of the emailed link. Every session is
// invalidated server-side by this, including one open in this very browser, so
// the in-memory access token has to go with them.
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/auth/reset-password", {
        token,
        password,
      });

      setAccessToken(null);

      return data.message;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Runs once on app start. The access token is only in memory, so after a
// reload we swap the refresh cookie for a new one and re-fetch the user.
export const restoreSession = createAsyncThunk(
  "auth/restoreSession",
  async (_, { rejectWithValue }) => {
    try {
      await requestRefresh();
      const { data } = await api.get("/auth/me");
      return data.user;
    } catch {
      return rejectWithValue(null); // no valid session, stay logged out
    }
  },
  {
    // The backend rotates the refresh token on every call, so two calls firing
    // together would race and invalidate each other. React StrictMode runs
    // effects twice in dev, so this guard is what keeps it to one request.
    condition: (_, { getState }) => {
      const { auth } = getState();
      return !auth.restoring && !auth.bootstrapped;
    },
  }
);

export const logout = createAsyncThunk("auth/logout", async () => {
  try {
    await api.post("/auth/logout");
  } finally {
    setAccessToken(null);
  }
});

const initialState = {
  user: null,
  isAuthenticated: false,
  // false until restoreSession has finished, so the navbar does not flash
  // "Sign in" for a user who is actually logged in.
  bootstrapped: false,
  restoring: false,
  loading: false,
  error: null,
  successMessage: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthFeedback: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Forgot / reset password. Both are public and neither signs anyone in,
      // so they only ever touch the feedback fields.
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload;

        // The server just invalidated every session. Anyone who happened to be
        // signed in here is signed out too, rather than left holding a token
        // the next request would reject.
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Restore session on refresh
      .addCase(restoreSession.pending, (state) => {
        state.restoring = true;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.restoring = false;
        state.bootstrapped = true;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.restoring = false;
        state.bootstrapped = true;
      })

      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearAuthFeedback } = authSlice.actions;

export default authSlice.reducer;
