import { configureStore } from "@reduxjs/toolkit";
import accountReducer from "./slices/accountSlice";
import authReducer from "./slices/authSlice";
import cartReducer from "./slices/cartSlice";
import categoryReducer from "./slices/categorySlice";
import orderReducer from "./slices/orderSlice";
import productReducer from "./slices/productSlice";
import reviewReducer from "./slices/reviewSlice";
import userReducer from "./slices/userSlice";

export const store = configureStore({
  reducer: {
    account: accountReducer,
    auth: authReducer,
    cart: cartReducer,
    categories: categoryReducer,
    orders: orderReducer,
    products: productReducer,
    reviews: reviewReducer,
    users: userReducer,
  },
});
