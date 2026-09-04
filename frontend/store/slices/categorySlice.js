import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { getErrorMessage } from "@/lib/api";

// GET /categories is public and only ever returns active categories.
export const fetchCategories = createAsyncThunk(
  "categories/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/categories");
      return data.categories;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
  {
    // Skip only while a request is already in flight. React StrictMode mounts
    // effects twice in dev, and the home page and /categories can both mount a
    // grid — this collapses those into one request without blocking a later
    // deliberate refetch.
    condition: (_, { getState }) =>
      getState().categories.listStatus !== "loading",
  }
);

// Admin-only: returns inactive categories too, so they can be brought back.
// Kept separate from `items` so the public grid never shows a hidden category.
export const fetchAdminCategories = createAsyncThunk(
  "categories/fetchAdmin",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/categories/all");
      return data.categories;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
  {
    condition: (_, { getState }) =>
      getState().categories.adminStatus !== "loading",
  }
);

export const fetchCategoryById = createAsyncThunk(
  "categories/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/categories/${id}`);
      return data.category;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
  {
    condition: (_, { getState }) =>
      getState().categories.currentStatus !== "loading",
  }
);

export const createCategory = createAsyncThunk(
  "categories/create",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/categories", formData);
      return data.category;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updateCategory = createAsyncThunk(
  "categories/update",
  async ({ id, changes }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/categories/${id}`, changes);
      return data.category;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// This is a soft delete — the backend flips status to "inactive", which also
// removes it from every public list.
export const deleteCategory = createAsyncThunk(
  "categories/delete",
  async (id, { rejectWithValue }) => {
    try {
      // The API returns the record with status flipped to "inactive" — keep it
      // so the admin list can still show (and reactivate) it.
      const { data } = await api.delete(`/categories/${id}`);
      return data.category;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const initialState = {
  // Public list — active categories only.
  items: [],
  listStatus: "idle", // idle | loading | succeeded | failed
  listError: null,

  // Admin list — includes inactive categories.
  adminItems: [],
  adminStatus: "idle",
  adminError: null,

  saving: false,
  saveError: null,
  deletingId: null,

  // Detail page
  current: null,
  currentStatus: "idle",
  currentError: null,
};

const replaceInAdminList = (state, category) => {
  const index = state.adminItems.findIndex(
    (item) => item._id === category._id
  );
  if (index !== -1) state.adminItems[index] = category;
};

const categorySlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    clearSaveError: (state) => {
      state.saveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // List
      .addCase(fetchCategories.pending, (state) => {
        state.listStatus = "loading";
        state.listError = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.listStatus = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.listStatus = "failed";
        state.listError = action.payload;
      })

      // Admin list
      .addCase(fetchAdminCategories.pending, (state) => {
        state.adminStatus = "loading";
        state.adminError = null;
      })
      .addCase(fetchAdminCategories.fulfilled, (state, action) => {
        state.adminStatus = "succeeded";
        state.adminItems = action.payload;
      })
      .addCase(fetchAdminCategories.rejected, (state, action) => {
        state.adminStatus = "failed";
        state.adminError = action.payload;
      })

      // Single category
      .addCase(fetchCategoryById.pending, (state) => {
        state.currentStatus = "loading";
        state.currentError = null;
        state.current = null;
      })
      .addCase(fetchCategoryById.fulfilled, (state, action) => {
        state.currentStatus = "succeeded";
        state.current = action.payload;
      })
      .addCase(fetchCategoryById.rejected, (state, action) => {
        state.currentStatus = "failed";
        state.currentError = action.payload;
      })

      // Create
      .addCase(createCategory.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.saving = false;
        // Newest first, matching the backend's sort order.
        state.adminItems.unshift(action.payload);
        // Force the public grid to refetch next time it mounts.
        state.listStatus = "idle";
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.saving = false;
        state.saveError = action.payload;
      })

      // Update
      .addCase(updateCategory.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.saving = false;
        replaceInAdminList(state, action.payload);
        state.listStatus = "idle";
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.saving = false;
        state.saveError = action.payload;
      })

      // Delete
      .addCase(deleteCategory.pending, (state, action) => {
        state.deletingId = action.meta.arg;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.deletingId = null;
        // Stays in the admin list, now marked inactive, so it can be restored.
        replaceInAdminList(state, action.payload);
        state.listStatus = "idle";
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.deletingId = null;
        state.saveError = action.payload;
      });
  },
});

export const { clearSaveError } = categorySlice.actions;

export default categorySlice.reducer;
