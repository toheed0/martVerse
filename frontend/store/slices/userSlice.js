import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { getErrorMessage } from "@/lib/api";

// Admin-only. Axios drops undefined params, so an empty filter lists everyone.
export const fetchUsers = createAsyncThunk(
  "users/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/users", { params });
      return data.users;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updateUserStatus = createAsyncThunk(
  "users/updateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/users/${id}/status`, { status });
      return data.user;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const initialState = {
  items: [],
  status: "idle", // idle | loading | succeeded | failed
  error: null,

  updatingId: null,
  actionError: null,
};

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearActionError: (state) => {
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      .addCase(updateUserStatus.pending, (state, action) => {
        state.updatingId = action.meta.arg.id;
        state.actionError = null;
      })
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        state.updatingId = null;

        const index = state.items.findIndex(
          (item) => item._id === action.payload._id
        );
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(updateUserStatus.rejected, (state, action) => {
        state.updatingId = null;
        state.actionError = action.payload;
      });
  },
});

export const { clearActionError } = userSlice.actions;

export default userSlice.reducer;
