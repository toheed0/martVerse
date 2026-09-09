"use client";

import { useEffect } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store } from "./store";
import { restoreSession } from "./slices/authSlice";
import { fetchCart } from "./slices/cartSlice";

function SessionLoader({ children }) {
  const dispatch = useDispatch();
  const { user, isAuthenticated, bootstrapped } = useSelector(
    (state) => state.auth
  );
  const cartStatus = useSelector((state) => state.cart.status);

  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  // The bag count sits in the navbar on every page, so the cart is loaded as
  // soon as the session is known — but only for buyers, since every /cart
  // endpoint answers 403 for anyone else.
  useEffect(() => {
    if (
      bootstrapped &&
      isAuthenticated &&
      user?.role === "buyer" &&
      cartStatus === "idle"
    ) {
      dispatch(fetchCart());
    }
  }, [bootstrapped, isAuthenticated, user?.role, cartStatus, dispatch]);

  return children;
}

export default function Providers({ children }) {
  return (
    <Provider store={store}>
      <SessionLoader>{children}</SessionLoader>
    </Provider>
  );
}
