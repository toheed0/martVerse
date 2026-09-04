"use client";

import { useEffect } from "react";
import { Provider, useDispatch } from "react-redux";
import { store } from "./store";
import { restoreSession } from "./slices/authSlice";

function SessionLoader({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  return children;
}

export default function Providers({ children }) {
  return (
    <Provider store={store}>
      <SessionLoader>{children}</SessionLoader>
    </Provider>
  );
}
