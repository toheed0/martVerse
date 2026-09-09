import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { getErrorMessage } from "@/lib/api";

// GET /products is public, paginated, and only ever returns active products.
// Axios drops undefined params, so callers can pass a sparse filter object.
export const fetchProducts = createAsyncThunk(
  "products/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/products", { params });
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Kept apart from the browse list so opening a category page doesn't clobber
// whatever filters the products page had loaded.
export const fetchCategoryProducts = createAsyncThunk(
  "products/fetchByCategory",
  async ({ categoryId, limit = 8 }, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/products", {
        params: { categoryId, limit },
      });
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// The home page strip. Kept apart from the browse list for the same reason as
// the category preview — four newest products must not overwrite whatever
// filters the products page had loaded.
export const fetchFeaturedProducts = createAsyncThunk(
  "products/fetchFeatured",
  async ({ limit = 4 } = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/products", { params: { limit } });
      return data.products;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchProductById = createAsyncThunk(
  "products/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/products/${id}`);
      return data.product;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Vendor-only: includes inactive products so they can be brought back.
export const fetchMyProducts = createAsyncThunk(
  "products/fetchMine",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/products/mine");
      return data.products;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
  {
    condition: (_, { getState }) => getState().products.mineStatus !== "loading",
  }
);

// Admin-only: every vendor's shelf, inactive rows included, paginated and
// filtered server-side because this list spans the whole catalogue.
export const fetchAdminProducts = createAsyncThunk(
  "products/fetchForAdmin",
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/products/admin", { params });
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const createProduct = createAsyncThunk(
  "products/create",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/products", payload);
      return data.product;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updateProduct = createAsyncThunk(
  "products/update",
  async ({ id, changes }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/products/${id}`, changes);
      return data.product;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Soft delete — the backend flips status to "inactive", which also removes it
// from every public list.
export const deleteProduct = createAsyncThunk(
  "products/delete",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.delete(`/products/${id}`);
      return data.product;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const initialState = {
  // Public, filtered list.
  items: [],
  pagination: { page: 1, limit: 12, totalProducts: 0, totalPages: 0 },
  listStatus: "idle", // idle | loading | succeeded | failed
  listError: null,
  // Filters change fast while typing, so responses can land out of order.
  // Only the newest request is allowed to write to state.
  listRequestId: null,

  // Preview strip on a category page.
  categoryItems: [],
  categoryTotal: 0,
  categoryStatus: "idle",
  categoryError: null,

  // Home page strip — the newest handful of products.
  featured: [],
  featuredStatus: "idle",
  featuredError: null,

  // Vendor's own shelf, inactive rows included.
  mine: [],
  mineStatus: "idle",
  mineError: null,

  // Admin moderation list across every vendor.
  admin: [],
  adminPagination: { page: 1, limit: 20, totalProducts: 0, totalPages: 0 },
  adminStatus: "idle",
  adminError: null,
  // Same out-of-order guard as the public list — admin filters change fast too.
  adminRequestId: null,

  saving: false,
  saveError: null,
  deletingId: null,

  // Detail page
  current: null,
  currentStatus: "idle",
  currentError: null,
};

// The update and delete responses come back without the populated category or
// vendor, so keep the row's existing ones rather than blanking those columns.
const patchRow = (list, product) => {
  const index = list.findIndex((item) => item._id === product._id);
  if (index === -1) return;

  list[index] = {
    ...product,
    categoryId: product.categoryId?.name
      ? product.categoryId
      : list[index].categoryId,
    vendorId: product.vendorId?.name
      ? product.vendorId
      : list[index].vendorId,
  };
};

// A save can land while either manager is open, so keep both lists in step.
const replaceProduct = (state, product) => {
  patchRow(state.mine, product);
  patchRow(state.admin, product);
};

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    clearSaveError: (state) => {
      state.saveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Public list
      .addCase(fetchProducts.pending, (state, action) => {
        state.listStatus = "loading";
        state.listError = null;
        state.listRequestId = action.meta.requestId;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        if (state.listRequestId !== action.meta.requestId) return;
        state.listStatus = "succeeded";
        state.items = action.payload.products;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        if (state.listRequestId !== action.meta.requestId) return;
        state.listStatus = "failed";
        state.listError = action.payload;
      })

      // Category preview
      .addCase(fetchCategoryProducts.pending, (state) => {
        state.categoryStatus = "loading";
        state.categoryError = null;
      })
      .addCase(fetchCategoryProducts.fulfilled, (state, action) => {
        state.categoryStatus = "succeeded";
        state.categoryItems = action.payload.products;
        state.categoryTotal = action.payload.pagination?.totalProducts ?? 0;
      })
      .addCase(fetchCategoryProducts.rejected, (state, action) => {
        state.categoryStatus = "failed";
        state.categoryError = action.payload;
      })

      // Home page strip
      .addCase(fetchFeaturedProducts.pending, (state) => {
        state.featuredStatus = "loading";
        state.featuredError = null;
      })
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.featuredStatus = "succeeded";
        state.featured = action.payload;
      })
      .addCase(fetchFeaturedProducts.rejected, (state, action) => {
        state.featuredStatus = "failed";
        state.featuredError = action.payload;
      })

      // Vendor list
      .addCase(fetchMyProducts.pending, (state) => {
        state.mineStatus = "loading";
        state.mineError = null;
      })
      .addCase(fetchMyProducts.fulfilled, (state, action) => {
        state.mineStatus = "succeeded";
        state.mine = action.payload;
      })
      .addCase(fetchMyProducts.rejected, (state, action) => {
        state.mineStatus = "failed";
        state.mineError = action.payload;
      })

      // Admin list
      .addCase(fetchAdminProducts.pending, (state, action) => {
        state.adminStatus = "loading";
        state.adminError = null;
        state.adminRequestId = action.meta.requestId;
      })
      .addCase(fetchAdminProducts.fulfilled, (state, action) => {
        if (state.adminRequestId !== action.meta.requestId) return;
        state.adminStatus = "succeeded";
        state.admin = action.payload.products;
        state.adminPagination = action.payload.pagination;
      })
      .addCase(fetchAdminProducts.rejected, (state, action) => {
        if (state.adminRequestId !== action.meta.requestId) return;
        state.adminStatus = "failed";
        state.adminError = action.payload;
      })

      // Single product
      .addCase(fetchProductById.pending, (state) => {
        state.currentStatus = "loading";
        state.currentError = null;
        state.current = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.currentStatus = "succeeded";
        state.current = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.currentStatus = "failed";
        state.currentError = action.payload;
      })

      // Create
      .addCase(createProduct.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.saving = false;
        state.mine.unshift(action.payload);
        // Force the public grid and the home strip to refetch next mount.
        state.listStatus = "idle";
        state.featuredStatus = "idle";
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.saving = false;
        state.saveError = action.payload;
      })

      // Update
      .addCase(updateProduct.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.saving = false;
        replaceProduct(state, action.payload);
        state.listStatus = "idle";
        state.featuredStatus = "idle";
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.saving = false;
        state.saveError = action.payload;
      })

      // Delete
      .addCase(deleteProduct.pending, (state, action) => {
        state.deletingId = action.meta.arg;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.deletingId = null;
        // Stays in both lists, now inactive, so it can be restored.
        replaceProduct(state, action.payload);
        state.listStatus = "idle";
        state.featuredStatus = "idle";
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.deletingId = null;
        state.saveError = action.payload;
      });
  },
});

export const { clearSaveError } = productSlice.actions;

export default productSlice.reducer;
